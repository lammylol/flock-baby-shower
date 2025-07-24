import { describe, afterAll, it, expect } from '@jest/globals';
import fft from 'firebase-functions-test';
import vectorFunctions from './vectorFunctions';
import { config } from '../config';
import { averageVectors } from '../utils/upload/embeddingUtils';
const testUid = config.testUid || '';
const fftInstance = fft();
describe('vectorFunctions Firebase callable tests', () => {
    afterAll(() => {
        fftInstance.cleanup();
    });
    it('findSimilarPrayers returns response', async () => {
        const testFunction = fftInstance.wrap(vectorFunctions.findSimilarPrayers);
        const request = {
            data: {
                sourcePrayerId: '12345',
                queryEmbedding: [
                    -0.018328054, -0.05464863, -0.013648, -0.014328, -0.012328,
                    -0.015328, -0.016328, -0.017328, -0.018328, -0.019328
                ],
                topK: 10,
                userId: testUid
            },
            auth: { uid: testUid }
        };
        const response = await testFunction(request);
        expect(response).toBeDefined();
    });
    it('findSimilarPrayersBatch returns response', async () => {
        const testFunction = fftInstance.wrap(vectorFunctions.findSimilarPrayersBatch);
        const request = {
            data: {
                userId: testUid,
                queryPrayerPoints: [
                    {
                        id: 'point1',
                        embedding: [-0.018328054, -0.05464863, -0.013648, -0.014328, -0.012328, -0.015328, -0.016328, -0.017328, -0.018328, -0.019328],
                    },
                    {
                        id: 'point2',
                        embedding: [-0.012138054, -0.05412364, -0.012264, -0.014348, -0.042328, -0.115328, -0.516328, -0.117328, -0.818328, -1.019328],
                    }
                ],
                topK: 10,
            },
            auth: { uid: testUid },
        };
        const response = await testFunction(request);
        expect(response).toBeDefined();
    });
    it('onPrayerPointWrite processes without error', async () => {
        const testFunction = fftInstance.wrap(vectorFunctions.onPrayerPointWrite);
        const request = {
            data: { pointId: 'bQAWDrIHDbg3goGgZ4CQ' },
            auth: { uid: testUid },
        };
        const response = await testFunction(request);
        expect(response).toBeDefined();
    });
    it('updateAggregatedEmbeddingForTopicCallable processes correctly', async () => {
        const testFunction = fftInstance.wrap(vectorFunctions.updateAggregatedEmbeddingForTopicCallable);
        const request = {
            data: { topicId: 'CADlDkSfnbZKDmUf3xk6' },
        };
        const response = await testFunction(request);
        expect(response).toBeDefined();
    });
    it('averageVectors calculates correctly', async () => {
        const vectors = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ];
        const expected = [4, 5, 6];
        const result = await averageVectors(vectors);
        expect(result).toEqual(expected);
    });
});
