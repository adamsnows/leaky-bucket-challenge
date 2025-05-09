// @ts-nocheck
import { buckets, leakyBucketMiddleware } from '../middlewares/leakyBucket';
import { config } from '../config/environment';

const createMockContext = (overrides = {}) => {
  return {
    ip: '127.0.0.1',
    state: {},
    request: {
      body: {}
    },
    response: {
      headers: {}
    },
    set: jest.fn(),
    body: {},
    ...overrides
  };
};

jest.mock('async-mutex', () => {
  return {
    Mutex: class MockMutex {
      acquire() {
        return Promise.resolve(() => {});
      }
      release() {}
      runExclusive(fn) {
        return Promise.resolve(fn());
      }
    }
  };
});

describe('LeakyBucket Middleware', () => {
  beforeEach(() => {
    buckets.clear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('deve permitir requisições para tokenStatus sem verificar tokens', async () => {
    const middleware = leakyBucketMiddleware({});
    const ctx = createMockContext({
      request: {
        body: {
          query: 'query { tokenStatus { availableTokens maxTokens } }'
        }
      }
    });
    const next = jest.fn();

    await middleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(ctx.state.rateLimit).toBeDefined();
    expect(ctx.state.rateLimit.identifier).toBe(ctx.ip);
  });

  test('deve criar um bucket para um novo usuário', async () => {
    jest.spyOn(console, 'log').mockRestore();
    jest.spyOn(console, 'error').mockRestore();

    const middleware = leakyBucketMiddleware({});
    const ctx = createMockContext();
    const next = jest.fn();

    expect(buckets.get(ctx.ip)).toBeUndefined();

    await middleware(ctx, next);

    const bucket = buckets.get(ctx.ip);
    console.log('Bucket após middleware:', JSON.stringify(bucket, null, 2));

    expect(bucket).toBeDefined();


    expect(bucket.tokens).toBe(config.bucketCapacity);
    expect(next).toHaveBeenCalled();
  });

  test('deve recusar requisições quando tokens esgotados (GraphQL)', async () => {
    const middleware = leakyBucketMiddleware({});
    const ctx = createMockContext({
      request: {
        body: {
          query: 'query { someData }'
        }
      }
    });
    const next = jest.fn();

    buckets.set(ctx.ip, {
      tokens: 0,
      lastRefill: Date.now(),
      lastRequest: Date.now()
    });

    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.body).toBeDefined();
    // @ts-ignore
    expect(ctx.body.errors).toBeDefined();
    // @ts-ignore
    expect(ctx.body.errors[0].message).toContain('Limite de requisições excedido');
    // @ts-ignore
    expect(ctx.body.errors[0].extensions.tokenStatus).toBeDefined();
  });

  test('deve recusar requisições quando tokens esgotados (REST)', async () => {
    const middleware = leakyBucketMiddleware({});
    const ctx = createMockContext();
    const next = jest.fn();

    // Configurar bucket sem tokens
    buckets.set(ctx.ip, {
      tokens: 0,
      lastRefill: Date.now(),
      lastRequest: Date.now()
    });

    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.body).toBeDefined();
    // @ts-ignore
    expect(ctx.body.success).toBe(false);
    // @ts-ignore
    expect(ctx.body.message).toContain('Limite de requisições excedido');
    // @ts-ignore
    expect(ctx.body.tokenStatus).toBeDefined();
  });

  test('deve permitir usar uma função personalizada para o identificador', async () => {
    const customIdentifier = 'custom-user-id';
    const identifierFn = jest.fn().mockReturnValue(customIdentifier);
    const middleware = leakyBucketMiddleware({
      identifierKey: identifierFn
    });

    const ctx = createMockContext();
    const next = jest.fn();

    await middleware(ctx, next);

    expect(identifierFn).toHaveBeenCalledWith(ctx);
    expect(ctx.state.rateLimit.identifier).toBe(customIdentifier);

    const bucket = buckets.get(customIdentifier);
    expect(bucket).toBeDefined();
  });

  test('deve incluir os cabeçalhos X-RateLimit corretos', async () => {
    const middleware = leakyBucketMiddleware({});
    const ctx = createMockContext();
    const next = jest.fn();

    await middleware(ctx, next);

    expect(ctx.set).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(String));
    expect(ctx.set).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
  });

  test('deve restaurar o token para respostas bem-sucedidas', async () => {
    const middleware = leakyBucketMiddleware({});
    const ctx = createMockContext();
    const next = jest.fn().mockImplementation(() => {
      // @ts-ignore
      ctx.body = { success: true, data: 'dummy data' };
      return Promise.resolve();
    });

    const initialTokens = 5;
    buckets.set(ctx.ip, {
      tokens: initialTokens,
      lastRefill: Date.now(),
      lastRequest: Date.now()
    });

    await middleware(ctx, next);

    const bucket = buckets.get(ctx.ip);
    expect(bucket.tokens).toBe(initialTokens);
  });
});
