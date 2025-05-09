import { getTokenStatus } from '../middlewares/leakyBucket';
import { config } from '../config/environment';

describe('GraphQL TokenStatus', () => {
    test('should return correct token status', async () => {
        const result = await getTokenStatus('test-user', config.bucketCapacity);

        expect(result).toHaveProperty('availableTokens');
        expect(result).toHaveProperty('maxTokens');
        expect(result.maxTokens).toBe(config.bucketCapacity);
    });
});