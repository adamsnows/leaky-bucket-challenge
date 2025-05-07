import { Context, Next } from "koa";
import { config } from "../config/environment";
// Importar mutex para garantir atomicidade
import { Mutex } from 'async-mutex';

// Mapa de mutexes para cada identificador de bucket
const mutexMap = new Map<string, Mutex>();

interface BucketState {
  tokens: number;
  lastRefill: number;
  lastRequest: number;
}

interface GraphQLError {
  extensions?: {
    tokenStatus?: {
      available: number;
      maximum: number;
      remaining: number;
    };
  };
}

interface GraphQLResponse {
  errors?: GraphQLError[];
}

export const buckets = new Map<string, BucketState>();

// Função para obter um mutex para um identificador específico
const getMutex = (identifier: string): Mutex => {
  let mutex = mutexMap.get(identifier);
  if (!mutex) {
    mutex = new Mutex();
    mutexMap.set(identifier, mutex);
  }
  return mutex;
};

const calculateTokensToAdd = (lastRefill: number, now: number): number => {
  const millisecondsInHour = 60 * 60 * 1000;
  const hoursElapsed = Math.floor((now - lastRefill) / millisecondsInHour);
  return hoursElapsed;
};

const formatTimeInMinutes = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} segundos`;
  }
  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  }

  return `${minutes} ${
    minutes === 1 ? "minuto" : "minutos"
  } e ${remainingSeconds} segundos`;
};

const getCurrentTokens = (
  bucket: BucketState,
  capacity: number,
  now: number
): number => {
  const tokensToAdd = calculateTokensToAdd(bucket.lastRefill, now);

  if (tokensToAdd > 0) {
    const millisecondsInHour = 60 * 60 * 1000;
    const hoursToAdd = tokensToAdd;
    bucket.lastRefill += hoursToAdd * millisecondsInHour;

    bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
  }

  return bucket.tokens;
};

export const leakyBucketMiddleware = (options: {
  capacity?: number;
  identifierKey?: (ctx: Context) => string;
}) => {
  const capacity = config.bucketCapacity;
  const identifierKey = options.identifierKey || ((ctx: Context) => ctx.ip);

  return async (ctx: Context, next: Next) => {
    const identifier = identifierKey(ctx);
    const now = Date.now();

    ctx.state.rateLimit = {
      identifier,
      capacity,
    };

    const requestBody = (ctx.request.body as { query?: string }) || {};
    const isTokenStatusQuery =
      typeof requestBody.query === "string" &&
      requestBody.query.includes("tokenStatus");

    if (isTokenStatusQuery) {
      await next();
      return;
    }

    // Obter o mutex para este identificador
    const mutex = getMutex(identifier);

    // Adquirir o lock antes de qualquer operação no bucket
    // Isso garante que apenas uma requisição manipule o bucket de cada vez
    return await mutex.runExclusive(async () => {
      let bucket = buckets.get(identifier);
      if (!bucket) {
        bucket = {
          tokens: capacity,
          lastRefill: now,
          lastRequest: now,
        };
        buckets.set(identifier, bucket);
      } else {
        getCurrentTokens(bucket, capacity, now);
        bucket.lastRequest = now;
      }

      if (bucket.tokens < 1) {
        const millisecondsUntilNextToken =
          60 * 60 * 1000 - ((now - bucket.lastRefill) % (60 * 60 * 1000));
        const secondsUntilNextToken = Math.ceil(
          millisecondsUntilNextToken / 1000
        );

        ctx.set("X-RateLimit-Limit", capacity.toString());
        ctx.set("X-RateLimit-Remaining", "0");
        ctx.set("X-RateLimit-Reset", secondsUntilNextToken.toString());

        const isGraphQLRequest =
          requestBody &&
          typeof requestBody === "object" &&
          "query" in requestBody;

        if (isGraphQLRequest) {
          ctx.body = {
            data: null,
            errors: [
              {
                message: `Limite de requisições excedido. Por favor, tente novamente em ${formatTimeInMinutes(
                  secondsUntilNextToken
                )}.`,
                extensions: {
                  code: "RATE_LIMIT_EXCEEDED",
                  retryAfter: secondsUntilNextToken,
                  retryAfterFormatted: formatTimeInMinutes(secondsUntilNextToken),
                  availableTokens: 0,
                  maxTokens: capacity,
                  tokenStatus: {
                    available: 0,
                    maximum: capacity,
                    remaining: 0,
                  },
                },
              },
            ],
          };
        } else {
          ctx.body = {
            success: false,
            message: `Limite de requisições excedido. Por favor, tente novamente em ${formatTimeInMinutes(
              secondsUntilNextToken
            )}.`,
            retryAfter: secondsUntilNextToken,
            retryAfterFormatted: formatTimeInMinutes(secondsUntilNextToken),
            tokenStatus: {
              available: 0,
              maximum: capacity,
              remaining: 0,
            },
          };
        }

        console.log(
          `[LeakyBucket] Rate limit exceeded for requests. Retry after ${formatTimeInMinutes(
            secondsUntilNextToken
          )}.`
        );
        return;
      }

      // Decrementar token atomicamente dentro do lock
      bucket.tokens -= 1;
      const currentTokens = bucket.tokens;

      ctx.set("X-RateLimit-Limit", capacity.toString());
      ctx.set("X-RateLimit-Remaining", currentTokens.toString());

      let tokenRestored = false;

      try {
        await next();
        await new Promise((resolve) => setTimeout(resolve, 0));

        let responseBody = ctx.body;
        if (typeof responseBody === "string") {
          try {
            if (
              responseBody.trim().startsWith("<!DOCTYPE") ||
              responseBody.trim().startsWith("<html")
            ) {
              console.log("[LeakyBucket] Response is HTML, skipping JSON parsing");

              // Restaurar o token atomicamente dentro do mesmo lock
              await mutex.runExclusive(() => {
                const bucket = buckets.get(identifier);
                if (bucket) {
                  bucket.tokens += 1;
                  tokenRestored = true;
                  console.log(
                    `[LeakyBucket] Request successful, token restored. Available: ${bucket.tokens}/${capacity}`
                  );
                }
              });
              return;
            }

            responseBody = JSON.parse(responseBody);
          } catch (e) {
            console.error(
              `[LeakyBucket] Failed to parse response body: ${(e as Error).message}`
            );

            // Restaurar o token atomicamente dentro do mesmo lock
            await mutex.runExclusive(() => {
              const bucket = buckets.get(identifier);
              if (bucket) {
                bucket.tokens += 1;
                tokenRestored = true;
                console.log(
                  `[LeakyBucket] Request error, token restored. Remaining: ${bucket.tokens}/${capacity}`
                );
              }
            });
            return;
          }
        }

        if (!responseBody || typeof responseBody !== "object") {
          await mutex.runExclusive(() => {
            const bucket = buckets.get(identifier);
            if (bucket) {
              bucket.tokens += 1;
              tokenRestored = true;
              console.log(
                `[LeakyBucket] Non-object response, token restored. Available: ${bucket.tokens}/${capacity}`
              );
            }
          });
          return;
        }

        const graphQLResponse = responseBody as GraphQLResponse;

        const hasGraphQLErrors =
          graphQLResponse &&
          typeof graphQLResponse === "object" &&
          "errors" in graphQLResponse;

        if (hasGraphQLErrors) {
          if (graphQLResponse.errors && Array.isArray(graphQLResponse.errors)) {
            let currentTokenValue = 0;
            await mutex.runExclusive(() => {
              const bucket = buckets.get(identifier);
              if (bucket) {
                currentTokenValue = bucket.tokens;
              }
            });

            graphQLResponse.errors.forEach((error: GraphQLError) => {
              if (!error.extensions) {
                error.extensions = {};
              }

              error.extensions.tokenStatus = {
                available: currentTokenValue,
                maximum: capacity,
                remaining: currentTokenValue,
              };
            });

            ctx.body = graphQLResponse;
          }

          console.log(
            `[LeakyBucket] Request failed (GraphQL errors found), token consumed. Remaining: ${currentTokens}/${capacity}`
          );
        } else {
          await mutex.runExclusive(() => {
            const bucket = buckets.get(identifier);
            if (bucket) {
              bucket.tokens += 1;
              tokenRestored = true;
              console.log(
                `[LeakyBucket] Request successful, token restored. Available: ${bucket.tokens}/${capacity}`
              );
            }
          });
        }
      } catch (error) {
        console.log(
          `[LeakyBucket] Request error, token consumed. Remaining: ${currentTokens}/${capacity}`
        );
        throw error;
      }
    });
  };
};

export const getTokenStatus = (
  identifier: string,
  capacity: number = config.bucketCapacity
): { availableTokens: number; maxTokens: number } => {
  const now = Date.now();
  const mutex = getMutex(identifier);

  // Usa o mesmo mecanismo de lock para atomicidade
  return mutex.runExclusive(() => {
    const bucket = buckets.get(identifier);

    if (!bucket) {
      return {
        availableTokens: capacity,
        maxTokens: capacity,
      };
    }

    const availableTokens = getCurrentTokens(bucket, capacity, now);

    return {
      availableTokens,
      maxTokens: capacity,
    };
  });
};

export default leakyBucketMiddleware;
