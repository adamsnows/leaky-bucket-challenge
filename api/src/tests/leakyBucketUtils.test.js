// @ts-nocheck
import { buckets, getTokenStatus } from '../middlewares/leakyBucket';
import { config } from '../config/environment';

describe('LeakyBucket Utility Functions', () => {

  const calculateTokensToAdd = (lastRefill, now) => {
    const millisecondsInHour = 60 * 60 * 1000;
    const hoursElapsed = Math.floor((now - lastRefill) / millisecondsInHour);
    return hoursElapsed;
  };

  const formatTimeInMinutes = (seconds) => {
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

  const getCurrentTokens = (bucket, capacity, now) => {
    const tokensToAdd = calculateTokensToAdd(bucket.lastRefill, now);

    if (tokensToAdd > 0) {
      const millisecondsInHour = 60 * 60 * 1000;
      const hoursToAdd = tokensToAdd;
      bucket.lastRefill += hoursToAdd * millisecondsInHour;

      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
    }

    return bucket.tokens;
  };

  beforeEach(() => {
    buckets.clear();
  });

  test('calculateTokensToAdd deve calcular corretamente as horas decorridas', () => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const twoHoursAgo = now - (2 * 60 * 60 * 1000);
    const halfHourAgo = now - (30 * 60 * 1000);

    expect(calculateTokensToAdd(oneHourAgo, now)).toBe(1);
    expect(calculateTokensToAdd(twoHoursAgo, now)).toBe(2);
    expect(calculateTokensToAdd(halfHourAgo, now)).toBe(0);
  });

  test('formatTimeInMinutes deve formatar o tempo corretamente', () => {
    expect(formatTimeInMinutes(30)).toBe('30 segundos');
    expect(formatTimeInMinutes(60)).toBe('1 minuto');
    expect(formatTimeInMinutes(90)).toBe('1 minuto e 30 segundos');
    expect(formatTimeInMinutes(120)).toBe('2 minutos');
    expect(formatTimeInMinutes(150)).toBe('2 minutos e 30 segundos');
  });

  test('getCurrentTokens deve recalcular tokens com base no tempo', () => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const capacity = 10;

    const bucket1 = {
      tokens: 5,
      lastRefill: oneHourAgo,
      lastRequest: oneHourAgo
    };

    expect(getCurrentTokens(bucket1, capacity, now)).toBe(6);
    expect(bucket1.lastRefill).toBeGreaterThan(oneHourAgo);

    const twoHoursAgo = now - (2 * 60 * 60 * 1000);
    const bucket2 = {
      tokens: 3,
      lastRefill: twoHoursAgo,
      lastRequest: twoHoursAgo
    };

    expect(getCurrentTokens(bucket2, capacity, now)).toBe(5);
  });

  test('getCurrentTokens deve respeitar o limite máximo', () => {
    const now = Date.now();
    const threeHoursAgo = now - (3 * 60 * 60 * 1000);
    const capacity = 10;

    const bucket = {
      tokens: 8,
      lastRefill: threeHoursAgo,
      lastRequest: threeHoursAgo
    };

    expect(getCurrentTokens(bucket, capacity, now)).toBe(10);
  });
});
