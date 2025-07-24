import { Timestamp } from 'firebase-admin/firestore';
import { getDateString } from '../dateUtils.js';
export function cosineSimilarity(a, b) {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (magA * magB);
}
export function averageVectors(vectors) {
    if (!Array.isArray(vectors) || vectors.length === 0)
        return [];
    const dimension = vectors[0].length;
    const sum = new Array(dimension).fill(0);
    vectors.forEach(vec => {
        vec.forEach((val, i) => {
            sum[i] += val;
        });
    });
    return sum.map((val) => val / vectors.length);
}
export function getContextAsStrings(prayer) {
    const dateStr = prayer.createdAt
        ? getDateString(prayer.createdAt)
        : getDateString(Timestamp.now());
    return `${dateStr}, ${prayer.title}, ${prayer.content}`.trim();
}
