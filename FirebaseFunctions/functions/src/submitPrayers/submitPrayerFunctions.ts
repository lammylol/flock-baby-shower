import * as functions from 'firebase-functions';
import {
    cleanFirestoreUpdate,
    updateAggregatedEmbeddingAndMetadataForTopic,
    enqueueRemoveArrayFieldUpdates,
    enqueueReplaceArrayFieldUpdates,
    convertToFirestoreTimestamp,
} from '../utils/upload/firestoreUtils.js';
import { Timestamp, Transaction, FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase/firebaseConfig.js';
import { getVectorEmbeddingFromOpenAI } from '../aiServices/openAIFunctions.js';
import { getContextAsStrings } from '../utils/upload/embeddingUtils.js';
// @ts-expect-error: Shared types may not be available in local dev environment
import type { PrayerPoint } from '../../shared/types/firebaseTypes.js';
import { normalizePrayerPoint } from '../utils/retrieve/normalizePrayerUtils.js';

export const submitPrayerWithPoints = functions.https.onCall(async (request) => {
    const { prayer, prayerPoints, removedPrayerPointIds } = request.data;
    if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');

    const uid = request.auth.uid;
    const prayerRef = prayer.id ? db.collection('prayers').doc(prayer.id) : db.collection('prayers').doc();
    const isNew = prayer.isNew;
    const prayerId = prayerRef.id;
    prayer.id = prayerId;

    const transaction = await db.runTransaction(async (tx: Transaction) => {
        // === READS ===
        const prayerSnap = await tx.get(prayerRef);
        const isNew = prayer.isNew;
        const isActuallyNew = !prayerSnap.exists;

        const pointSnaps: { point: PrayerPoint, snap: FirebaseFirestore.DocumentSnapshot }[] = [];
        for (const point of prayerPoints ?? []) {
            const pointRef = point.id
                ? db.collection('prayerPoints').doc(point.id)
                : db.collection('prayerPoints').doc();
            point.id = pointRef.id;

            const snap = await tx.get(pointRef);
            pointSnaps.push({ point, snap });
        }

        // === PRAYERWRITES ===
        const now = Timestamp.now();
        const prayerData = {
            ...prayer,
            id: prayerId,
            updatedAt: now,
            // For new prayers, always set createdAt
            ...(isNew && {
                authorId: uid,
                createdAt: isActuallyNew ? now : (convertToFirestoreTimestamp(prayer.createdAt) || now)
            }),
            // For existing prayers, preserve the original createdAt but ensure it's a proper timestamp
            ...(!isNew && prayer.createdAt && {
                createdAt: convertToFirestoreTimestamp(prayer.createdAt)
            }),
        };
        const cleanPrayerData = cleanFirestoreUpdate(prayerData);

        // By initializing fieldMap with prayerPoints as an empty array,
        // we ensure that enqueueReplaceArrayFieldUpdates always receives the field,
        // even if there are no prayer points to add. This prevents issues where
        // the array field might not be updated or cleared as intended in Firestore.
        const createdPrayerPoints: PrayerPoint[] = [];
        const fieldMap: Record<string, Array<any>> = {};

        tx.set(prayerSnap.ref, cleanPrayerData, { merge: true });

        // === PRAYERPOINT WRITES ===
        for (const { point, snap } of pointSnaps) {
            const isNew = point.isNew;
            const isActuallyNew = !snap.exists;

            let contextAsStrings = point.contextAsStrings ?? getContextAsStrings(point);
            let contextAsEmbeddings = point.contextAsEmbeddings ?? [];
            if (!point.contextAsEmbeddings) {
                contextAsEmbeddings = await getVectorEmbeddingFromOpenAI(contextAsStrings);
            }

            const pointData = {
                ...point,
                id: point.id,
                prayerId: prayerId,
                updatedAt: now,
                ...(isNew && { authorId: uid }),
                createdAt: isActuallyNew ? now : (convertToFirestoreTimestamp(point.createdAt) || now), // Set createdAt for truly new points
                contextAsEmbeddings,
                contextAsStrings,
            };

            const cleanPointData = cleanFirestoreUpdate(pointData);
            tx.set(snap.ref, cleanPointData, { merge: true });

            if (!fieldMap.prayerPoints) fieldMap.prayerPoints = [];
            fieldMap.prayerPoints.push({ id: point.id, entityType: 'prayerPoint', linkedTopics: point.linkedTopics ?? [] });
            createdPrayerPoints.push(normalizePrayerPoint(pointData));
        }

        // === UPDATE PRAYER ===
        enqueueReplaceArrayFieldUpdates({ transaction: tx, snap: prayerSnap, fieldMap });

        if (removedPrayerPointIds && removedPrayerPointIds.length > 0) {
            const removeMap = { prayerPoints: removedPrayerPointIds };
            enqueueRemoveArrayFieldUpdates({ transaction: tx, snap: prayerSnap, fieldMap: removeMap });
        }

        return {
            prayer,
            prayerPoints: createdPrayerPoints.filter((p) => !removedPrayerPointIds?.includes(p.id)),
        };
    });

    return {
        success: true,
        prayerId,
        prayerPoints: transaction.prayerPoints,
    };
});

export const submitPrayerPointWithLink = functions.https.onCall(async (request) => {
    const { point, from, removeFrom } = request.data;

    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!point?.id) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required prayer point ID');
    }

    try {
        const updatedPoint = await db.runTransaction(async (tx) => {
            const pointRef = point.id ? db.collection('prayerPoints').doc(point.id) : db.collection('prayerPoints').doc();
            point.id = pointRef.id;
            const uid = request.auth?.uid;

            // === READS ===
            const pointSnap = await tx.get(pointRef);

            // === WRITE ===
            const isNew = point.isNew;
            const now = Timestamp.now();

            // Check if the document already exists to determine if this is truly a new point
            const isActuallyNew = !pointSnap.exists;

            let contextAsStrings = point.contextAsStrings ?? getContextAsStrings(point);
            let contextAsEmbeddings = point.contextAsEmbeddings ?? [];
            if (!point.contextAsEmbeddings) {
                contextAsEmbeddings = await getVectorEmbeddingFromOpenAI(contextAsStrings);
            }

            const pointData = {
                ...point,
                id: point.id,
                updatedAt: now,
                ...(isNew && { authorId: uid }),
                createdAt: isActuallyNew
                    ? now
                    : (convertToFirestoreTimestamp(point.createdAt) || now),
                contextAsEmbeddings,
                contextAsStrings,
            };

            const cleanPointData = cleanFirestoreUpdate(pointData);
            tx.set(pointSnap.ref, cleanPointData, { merge: true });

            return normalizePrayerPoint(cleanPointData);
        });

        return { success: true, updatedPoint };
    } catch (error) {
        console.error('Error submitting prayer point with link:', error);
        throw new functions.https.HttpsError('internal', 'Unable to submit prayer point');
    }
});

export const updatePrayerPointTopicLinks = functions.https.onCall(async (request) => {
    const { point, addTopicIds, removeTopicIds } = request.data;
    functions.logger.info('request', request.data);
    const uid = request.auth?.uid;

    if (!uid || !point.id) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required data');
    }

    try {
        const result = await db.runTransaction(async (tx) => {
            const pointRef = db.collection('prayerPoints').doc(point.id);
            const pointSnap = await tx.get(pointRef);

            if (!pointSnap.exists) {
                throw new functions.https.HttpsError('not-found', 'Prayer point not found');
            }

            const addRefs = Array.isArray(addTopicIds) && addTopicIds.length > 0
                ? addTopicIds.map((id: string) =>
                    db.collection('prayerTopics').doc(id)
                )
                : [];
            const removeRefs = Array.isArray(removeTopicIds) && removeTopicIds.length > 0
                ? removeTopicIds.map((id: string) =>
                    db.collection('prayerTopics').doc(id)
                )
                : [];

            const topicRefs = [...addRefs, ...removeRefs];
            const topicSnaps = await Promise.all(topicRefs.map((ref) => tx.get(ref)));

            const topicMap = new Map<string, FirebaseFirestore.DocumentSnapshot>();
            topicRefs.forEach((ref, i) => {
                topicMap.set(ref.id, topicSnaps[i] as unknown as FirebaseFirestore.DocumentSnapshot);
            });

            // === ADD ===
            // === Update topics ===
            if (addTopicIds.length > 0) {
                await Promise.all(addTopicIds.map(async (topicId: string) => {
                    const topicSnap = topicMap.get(topicId);
                    if (!topicSnap?.exists) {
                        throw new functions.https.HttpsError('not-found', `Topic ${topicId} not found`);
                    }

                    await enqueueReplaceArrayFieldUpdates({
                        transaction: tx,
                        snap: topicSnap,
                        fieldMap: {
                            journey: [{ id: point.id, createdAt: convertToFirestoreTimestamp(point.createdAt), entityType: 'prayerPoint' }],
                        },
                    });
                }));

                // === Update point ===
                // To test if this uploaded to Firebase, you can add a log statement here
                // and also check the Firestore console for the updated document.
                await enqueueReplaceArrayFieldUpdates({
                    transaction: tx,
                    snap: pointSnap,
                    fieldMap: {
                        linkedTopics: addTopicIds,
                    },
                });
                console.log(`Updated prayer point ${point.id} with linkedTopics:`, addTopicIds);

            }

            // === REMOVE ===
            if (removeTopicIds.length > 0) {
                functions.logger.info('removeTopicIds', removeTopicIds);
                for (const topicId of removeTopicIds) {
                    const topicSnap = topicMap.get(topicId);
                    if (!topicSnap?.exists) continue;

                    await enqueueRemoveArrayFieldUpdates({
                        transaction: tx,
                        snap: topicSnap,
                        fieldMap: {
                            journey: [point.id],
                        },
                    });
                }

                // === Remove linked topics from prayer point
                await enqueueRemoveArrayFieldUpdates({
                    transaction: tx,
                    snap: pointSnap,
                    fieldMap: {
                        linkedTopics: removeTopicIds,
                    },
                });
            }

            const addedTopicIds = [...addTopicIds];

            return {
                point,
                addedTopicIds,
            };
        });
        // Update embeddings outside transaction
        await db.runTransaction(async (transaction) => {
            // Use Promise.all to ensure all updates are awaited
            await Promise.all(
                result.addedTopicIds.map((tid) =>
                    updateAggregatedEmbeddingAndMetadataForTopic(tid, transaction)
                )
            );
        });

        return {
            success: true,
            pointId: result.point.id,
            addedTopicIds: result.addedTopicIds,
            removedTopicIds: removeTopicIds || [],
            updatedPoint: result.point,
            journeyEntries: addTopicIds.map((topicId: string) => ({
                id: topicId,
                createdAt: convertToFirestoreTimestamp(point.createdAt),
                entityType: 'prayerPoint',
            })),
        };
    } catch (error) {
        console.error('Error updating prayer point links:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update links');
    }
});

export const deleteEntity = functions.https.onCall(async (request) => {
    const { entityType, entityId } = request.data;

    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
        const entityRef = entityType === 'prayer'
            ? db.collection('prayers').doc(entityId)
            : entityType === 'prayerPoint'
                ? db.collection('prayerPoints').doc(entityId)
                : entityType === 'prayerTopic'
                    ? db.collection('prayerTopics').doc(entityId)
                    : null;

        if (!entityRef) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid entity type');
        }

        await entityRef.delete();
        return { success: true, entityId };
    } catch (error) {
        console.error('Error deleting entity:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete entity');
    }
});