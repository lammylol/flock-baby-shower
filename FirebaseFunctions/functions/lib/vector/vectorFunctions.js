// import OpenAI from "openai";
import { db, functions } from '../firebase/firebaseConfig.js';
import { cosineSimilarity } from '../utils/upload/embeddingUtils.js';
import { updateAggregatedEmbeddingAndMetadataForTopic } from '../utils/upload/firestoreUtils.js';
const MAX_EMBEDDING_LENGTH = 1536; // Set embedding limit based on openAI vector limit.
const MAX_TOP_K = 10; // Set max limit for returned searches.
export const findSimilarPrayers = functions.https.onCall(async (request) => {
    const { sourcePrayerId, queryEmbedding, topK, userId } = request.data;
    // mandatory: queryEmbedding, topK, userId
    // optional: sourcePrayerID
    // Check if the function is called by an authenticated user
    if (!request.auth) {
        console.error('Unauthenticated request');
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    console.log('Received request data:', { queryEmbeddingLength: queryEmbedding?.length, topK, userId });
    // Validate the input
    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        console.error('Invalid query embedding');
        throw new functions.https.HttpsError('invalid-argument', 'Invalid query embedding.');
    }
    // Limit the size of the query embedding
    if (queryEmbedding.length > MAX_EMBEDDING_LENGTH) {
        console.error(`Query embedding exceeds maximum length of ${MAX_EMBEDDING_LENGTH}`);
        throw new functions.https.HttpsError('invalid-argument', `Query embedding exceeds maximum length of ${MAX_EMBEDDING_LENGTH}.`);
    }
    // Limit the maximum number of results
    const effectiveTopK = Math.min(topK || 5, MAX_TOP_K);
    try {
        // Query prayer points. Prayer points have a prayerType.
        const querySnapshotPP = await db.collection('prayerPoints')
            .where('contextAsEmbeddings', '!=', null)
            .where('authorId', '==', userId)
            .select('contextAsEmbeddings', 'title', 'prayerType', 'entityType', 'createdAt')
            .get();
        const prayerPoints = querySnapshotPP.docs.map((doc) => ({
            id: doc.id,
            entityType: 'prayerPoint',
            ...doc.data(),
        }));
        // Query prayer topics. Prayer Topics do not have a prayerType.
        const querySnapshotPT = await db.collection('prayerTopics')
            .where('contextAsEmbeddings', '!=', null)
            .where('authorId', '==', userId)
            .select('contextAsEmbeddings', 'title', 'entityType', 'createdAt')
            .get();
        const prayerTopics = querySnapshotPT.docs.map((doc) => ({
            id: doc.id,
            entityType: 'prayerTopic',
            ...doc.data(),
        }));
        //Temporary for #prayForFlock.
        // Query prayer topics. Prayer Topics do not have a prayerType.
        const prayForFlockDoc = await db.collection('prayerTopics')
            .where('id', '==', 'hwuewVSP8ej8YSCeD1Ne')
            .get();
        const prayForFlock = prayForFlockDoc.docs.map((doc) => ({
            id: doc.id,
            entityType: 'prayerTopic',
            ...doc.data(),
        }));
        let prayerPointsAndTopics = [...prayerPoints, ...prayerTopics, ...prayForFlock];
        // Only filter if sourcePrayerId is provided. On new prayer creation, this will be null.
        // After prayer is created, this is to prevent the prayer from being compared to itself.
        if (sourcePrayerId) {
            prayerPointsAndTopics = prayerPointsAndTopics.filter((prayer) => prayer.id !== sourcePrayerId);
        }
        if (prayerPointsAndTopics.length === 0) {
            console.log('No prayer points or topics found');
            return { result: [] };
        }
        else {
            console.log(`Found ${prayerPoints?.length || 0} prayer points and ${prayerTopics?.length || 0} prayer topics`);
        }
        const results = prayerPointsAndTopics
            .map((prayer) => ({
            id: prayer.id,
            createdAt: prayer.createdAt,
            title: prayer.title,
            prayerType: prayer.prayerType || undefined,
            entityType: prayer.entityType,
            similarity: cosineSimilarity(queryEmbedding, prayer.contextAsEmbeddings),
        }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, effectiveTopK);
        console.log(`Found ${results.length} similar prayers`);
        return { result: results };
    }
    catch (error) {
        console.error('Error processing request:', error.message);
        throw new functions.https.HttpsError('internal', error.message || 'Failure: the process failed on the server.');
    }
});
// pass in batch
export const findSimilarPrayersBatch = functions.https.onCall(async (request) => {
    const { queryPrayerPoints, topK, userId } = request.data;
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    if (!Array.isArray(queryPrayerPoints) || queryPrayerPoints.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid queryPrayerPoints.');
    }
    const effectiveTopK = Math.min(topK || 5, MAX_TOP_K);
    try {
        // Fetch potential matches: user’s prayerPoints and prayerTopics
        const [ppSnap, ptSnap, prayForFlock] = await Promise.all([
            db.collection('prayerPoints')
                .where('contextAsEmbeddings', '!=', null)
                .where('authorId', '==', userId)
                .select('contextAsEmbeddings', 'title', 'prayerType', 'entityType', 'createdAt')
                .get(),
            db.collection('prayerTopics')
                .where('contextAsEmbeddings', '!=', null)
                .where('authorId', '==', userId)
                .select('contextAsEmbeddings', 'title', 'entityType', 'createdAt')
                .get(),
            // temporary for Flock Prayer
            db.collection('prayerTopics')
                .where('id', '==', 'hwuewVSP8ej8YSCeD1Ne') // #PrayForFlock
                .get(),
        ]);
        let dataPool = [
            ...ppSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                entityType: 'prayerPoint',
            })),
            ...ptSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                entityType: 'prayerTopic',
            })),
            // temporary for Flock Prayer
            ...prayForFlock.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                entityType: 'prayerTopic',
            }))
        ];
        const results = queryPrayerPoints.map((point, index) => {
            const { id: queryId, embedding } = point;
            if (!Array.isArray(embedding) ||
                embedding.length === 0 ||
                embedding.length > MAX_EMBEDDING_LENGTH) {
                throw new functions.https.HttpsError('invalid-argument', `Embedding at index ${index} is invalid.`);
            }
            const matches = dataPool
                .filter((item) => item.id !== queryId) // prevent self-comparison
                .map((item) => ({
                id: item.id,
                createdAt: item.createdAt,
                title: item.title,
                prayerType: item.prayerType || undefined,
                entityType: item.entityType,
                similarity: cosineSimilarity(embedding, item.contextAsEmbeddings),
            }))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, effectiveTopK);
            return {
                queryPrayerPointId: queryId,
                matches,
            };
        });
        return { result: results };
    }
    catch (error) {
        console.error('Batch similarity error:', error.message);
        throw new functions.https.HttpsError('internal', error.message || 'Internal error.');
    }
});
export const updateAggregatedEmbeddingForTopicCallable = functions.https.onCall(async (request) => {
    const { topicId } = request.data;
    if (!topicId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing topicId');
    await db.runTransaction(async (transaction) => {
        await updateAggregatedEmbeddingAndMetadataForTopic(topicId, transaction);
    });
    return { status: 'completed' };
});
export const onPrayerPointWrite = functions.https.onCall(async (request) => {
    const { pointId } = request.data;
    if (!pointId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing pointId');
    await db.runTransaction(async (transaction) => {
        const docRef = db.collection('prayerPoints').doc(pointId);
        const docSnap = await docRef.get();
        if (!docSnap.exists)
            throw new Error(`Prayer point ${pointId} not found`);
        const after = docSnap.data();
        const topicIds = new Set((after?.linkedTopics || []).map((t) => t.id));
        await Promise.all(Array.from(topicIds).map((topicId) => updateAggregatedEmbeddingAndMetadataForTopic(topicId, transaction)));
    });
    return { status: 'completed' };
});
export default {
    findSimilarPrayers,
    findSimilarPrayersBatch,
    updateAggregatedEmbeddingForTopicCallable,
    onPrayerPointWrite,
};
