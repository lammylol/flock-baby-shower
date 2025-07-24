import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineSecret } from 'firebase-functions/params';
import process from 'process';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load the .env from FlockRN
const env = dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (env.error) {
    throw new Error('Failed to load .env file');
}
// Detect if we're in test mode (NODE_ENV=test or passed manually)
export const isTest = process.env.NODE_ENV === 'test';
// Get secret from Firebase
export const openAISecret = defineSecret('OPENAI_API_KEY');
export function getApiKey() {
    if (isTest) {
        const key = process.env.TEST_OPENAI_KEY;
        if (!key)
            throw new Error('Missing TEST_OPENAI_KEY in test environment');
        return key;
    }
    return openAISecret;
}
export const config = {
    testUid: env.parsed?.TEST_UID_KEY || '',
};
