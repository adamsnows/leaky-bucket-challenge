import { getTokenStatus } from '../middlewares/leakyBucket';
import { config } from '../config/environment';

describe('Resolvers', () => {
    test('should return correct token status', async () => {
        const result = await getTokenStatus('test-user', config.bucketCapacity);
        expect(result).toHaveProperty('availableTokens');
        expect(result).toHaveProperty('maxTokens');
        expect(typeof result.availableTokens).toBe('number');
        expect(typeof result.maxTokens).toBe('number');
    });
});