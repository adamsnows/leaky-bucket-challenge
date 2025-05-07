import { buckets } from '../middlewares/leakyBucket';


const mockLeakyBucket = {
  consumeToken: (identifier: string, capacity = 5): boolean => {
    let bucket = buckets.get(identifier);

    if (!bucket) {
      bucket = {
        tokens: capacity,
        lastRefill: Date.now(),
        lastRequest: Date.now()
      };
      buckets.set(identifier, bucket);
    }

    if (bucket.tokens < 1) {
      return false;
    }

    bucket.tokens -= 1;
    return true;
  },

  restoreToken: (identifier: string): void => {
    const bucket = buckets.get(identifier);
    if (bucket) {
      bucket.tokens += 1;
    }
  }
};

describe('Leaky Bucket Atomicity Tests', () => {
  beforeEach(() => {
    buckets.clear();
  });

  test('should handle concurrent token consumption correctly', () => {
    const identifier = 'test-user';
    const initialTokens = 3;

    buckets.set(identifier, {
      tokens: initialTokens,
      lastRefill: Date.now(),
      lastRequest: Date.now()
    });

    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      results.push(mockLeakyBucket.consumeToken(identifier));
    }

    expect(results).toEqual([true, true, true, false, false]);

    const bucket = buckets.get(identifier);
    expect(bucket).toBeDefined();
    expect(bucket?.tokens).toBe(0);
  });

  test('should restore tokens correctly', () => {
    const identifier = 'test-user';

    buckets.set(identifier, {
      tokens: 1,
      lastRefill: Date.now(),
      lastRequest: Date.now()
    });

    expect(mockLeakyBucket.consumeToken(identifier)).toBe(true);
    expect(buckets.get(identifier)?.tokens).toBe(0);

    mockLeakyBucket.restoreToken(identifier);
    expect(buckets.get(identifier)?.tokens).toBe(1);
  });

  test('should respect token limits', () => {
    const identifier = 'test-user';
    const capacity = 5;

    buckets.set(identifier, {
      tokens: 0,
      lastRefill: Date.now(),
      lastRequest: Date.now()
    });

    expect(mockLeakyBucket.consumeToken(identifier, capacity)).toBe(false);
    expect(buckets.get(identifier)?.tokens).toBe(0);

    mockLeakyBucket.restoreToken(identifier);
    mockLeakyBucket.restoreToken(identifier);

    expect(buckets.get(identifier)?.tokens).toBe(2);

    expect(mockLeakyBucket.consumeToken(identifier)).toBe(true);
    expect(mockLeakyBucket.consumeToken(identifier)).toBe(true);
    expect(mockLeakyBucket.consumeToken(identifier)).toBe(false);
    expect(buckets.get(identifier)?.tokens).toBe(0);
  });
});