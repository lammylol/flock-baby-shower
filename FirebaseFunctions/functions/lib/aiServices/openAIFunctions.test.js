import fft from 'firebase-functions-test';
import * as myFunctions from './openAIFunctions';
import { config } from '../config';
import { describe, afterAll, it, expect } from "@jest/globals";
import { testContent } from './testContent';
const testUid = config.testUid || '';
const fftInstance = fft();
describe('OpenAI Cloud Functions', () => {
    afterAll(() => {
        fftInstance.cleanup();
    });
    describe('analyzePrayerContent', () => {
        it('should return valid fields when given prayer content', async () => {
            const testFunction = fftInstance.wrap(myFunctions.analyzePrayerContent);
            const request = {
                data: {
                    content: testContent,
                    hasTranscription: true,
                },
                auth: {
                    uid: testUid,
                    token: { email: 'test@example.com' },
                },
            };
            const response = await testFunction(request);
            console.log('response:', response);
            expect(response.title).toBeDefined();
            expect(typeof response.title).toBe('string');
            expect(Array.isArray(response.tags)).toBe(true);
            expect(response.tags.length).toBeGreaterThanOrEqual(0);
            expect(typeof response.cleanedTranscription).toBe('string');
            expect(Array.isArray(response.prayerPoints)).toBe(true);
            const firstPoint = response.prayerPoints?.[0];
            if (firstPoint) {
                expect(firstPoint.title).toBeDefined();
                expect(firstPoint.prayerType).toBeDefined();
                expect(firstPoint.content).toBeDefined();
            }
        }, 30000);
    });
    describe('getVectorEmbeddings', () => {
        it('should return an embedding array for valid input', async () => {
            const testFunction = fftInstance.wrap(myFunctions.getVectorEmbeddings);
            const request = {
                data: {
                    input: 'Lord, I pray for...',
                },
                auth: {
                    uid: testUid,
                    token: { email: 'test@example.com' },
                },
            };
            const response = await testFunction(request);
            expect(Array.isArray(response.embedding)).toBe(true);
            expect(response.embedding.length).toBeGreaterThan(0);
        }, 15000);
    });
    describe('Error handling', () => {
        const analyzeFunction = fftInstance.wrap(myFunctions.analyzePrayerContent);
        const embeddingsFunction = fftInstance.wrap(myFunctions.getVectorEmbeddings);
        it('should reject when content is empty', async () => {
            await expect(analyzeFunction({ data: { content: '' }, auth: { uid: testUid, token: { email: 'test@example.com' } } })).rejects.toThrow();
        }, 10000);
        it('should reject when request is unauthenticated', async () => {
            await expect(analyzeFunction({ data: { content: 'Test prayer' } })).rejects.toThrow();
        }, 10000);
        it('should reject when input is empty', async () => {
            await expect(embeddingsFunction({ data: { input: '' }, auth: { uid: testUid, token: { email: 'test@example.com' } } })).rejects.toThrow();
        }, 10000);
    });
});
