import { Context, Next } from "koa";
import { BUCKET_CAPACITY, LEAK_RATE } from "../config/environment";

interface BucketState {
  tokens: number;
  lastRefill: number;
  lastRequest: number;
}

export const buckets = new Map<string, BucketState>();

const calculateTokensToAdd = (lastRefill: number, now: number): number => {
  const millisecondsInHour = 60 * 60 * 1000;
  const hoursElapsed = Math.floor((now - lastRefill) / millisecondsInHour);
  return hoursElapsed;
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
  const capacity = options.capacity || BUCKET_CAPACITY;
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

      ctx.status = 429;
      ctx.set("X-RateLimit-Limit", capacity.toString());
      ctx.set("X-RateLimit-Remaining", "0");
      ctx.set("X-RateLimit-Reset", secondsUntilNextToken.toString());
      ctx.body = {
        success: false,
        message: "Rate limit exceeded",
        retryAfter: secondsUntilNextToken,
      };
      return;
    }

    bucket.tokens -= 1;
    const originalTokens = bucket.tokens;

    ctx.set("X-RateLimit-Limit", capacity.toString());
    ctx.set("X-RateLimit-Remaining", bucket.tokens.toString());

    try {
      await next();

      if (ctx.status >= 200 && ctx.status < 300) {
        bucket.tokens += 1;
        console.log(
          `[LeakyBucket] Request successful, token restored. Available: ${bucket.tokens}/${capacity}`
        );
      } else {
        console.log(
          `[LeakyBucket] Request failed (${ctx.status}), token consumed. Remaining: ${bucket.tokens}/${capacity}`
        );
      }
    } catch (error) {
      console.log(
        `[LeakyBucket] Request error, token consumed. Remaining: ${bucket.tokens}/${capacity}`
      );
      throw error;
    }
  };
};

export const getTokenStatus = (
  identifier: string,
  capacity: number = BUCKET_CAPACITY
): { availableTokens: number; maxTokens: number } => {
  const now = Date.now();
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
};

export default leakyBucketMiddleware;
