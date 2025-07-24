import { db } from "../../firebase/firebaseConfig.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { averageVectors } from "./embeddingUtils.js";
export function stripLocalFields(entity) {
    const { isNew, ...rest } = entity;
    return rest;
}
// Add updatedAt: serverTimestamp() to a Firestore document in a transaction.
export function setFirestoreUpdatedAt(transaction, snap) {
    transaction.update(snap.ref, {
        updatedAt: Timestamp.now(),
    });
}
export async function fetchTopicAndLinkedPoints(topicId) {
    const topicRef = db.collection("prayerTopics").doc(topicId);
    const prayerPointsQuery = db
        .collection("prayerPoints")
        .where("linkedTopics", "array-contains", topicId)
        .orderBy("createdAt", "desc")
        .limit(30);
    const [topicSnap, prayerPointsSnap] = await Promise.all([
        topicRef.get(),
        prayerPointsQuery.get(),
    ]);
    if (!topicSnap.exists)
        return { topicData: null, prayerPoints: [] };
    return {
        topicData: topicSnap.data(),
        prayerPoints: prayerPointsSnap.docs.map((doc) => doc.data()),
    };
}
/**
 * Extracts all embeddings from a topic and its linked prayerPoints.
 */
export function extractAllEmbeddings(topicData, prayerPoints) {
    const allEmbeddings = [];
    const topicEmbeddings = topicData?.contextAsEmbeddings ?? [];
    if (Array.isArray(topicEmbeddings) && topicEmbeddings.length > 0) {
        allEmbeddings.push(topicEmbeddings);
    }
    if (prayerPoints.length > 0) {
        prayerPoints.forEach((point) => {
            const emb = point.contextAsEmbeddings;
            if (Array.isArray(emb) && emb.length > 0) {
                allEmbeddings.push(emb);
            }
        });
    }
    return allEmbeddings;
}
/**
 * Extracts all distinct prayerTypes from linked prayerPoints.
 */
export function extractDistinctPrayerTypes(prayerPoints) {
    const types = new Set();
    for (const point of prayerPoints) {
        if (point.prayerType) {
            types.add(point.prayerType.toLowerCase());
        }
    }
    return Array.from(types);
}
/**
 * Aggregates embeddings and distinct prayerTypes for a topic.
 */
export async function aggregateTopicMetadata(topicId) {
    const { topicData, prayerPoints } = await fetchTopicAndLinkedPoints(topicId);
    if (!topicData)
        return { avg: null, distinctPrayerTypes: [], journeyLinks: [] };
    const embeddings = extractAllEmbeddings(topicData, prayerPoints);
    const distinctPrayerTypes = extractDistinctPrayerTypes(prayerPoints);
    if (embeddings.length === 0) {
        console.log(`No embeddings found for topic ${topicId}`);
        return { avg: null, distinctPrayerTypes };
    }
    return {
        avg: averageVectors(embeddings),
        distinctPrayerTypes,
    };
}
/**
 * Updates a topic with its aggregated embeddings and distinct prayer types.
 */
export async function updateAggregatedEmbeddingAndMetadataForTopic(topicId, transaction) {
    const { avg, distinctPrayerTypes } = await aggregateTopicMetadata(topicId);
    const topicRef = db.collection('prayerTopics').doc(topicId);
    const topicSnap = await topicRef.get();
    const updateData = avg
        ? {
            aggregatedEmbedding: avg,
            prayerTypes: distinctPrayerTypes,
        }
        : {
            aggregatedEmbedding: FieldValue.delete(),
            prayerTypes: FieldValue.delete(),
        };
    transaction.update(topicSnap.ref, updateData);
    return { topicId };
}
// takes both strings or objects.
export async function enqueueReplaceArrayFieldUpdates({ transaction, snap, fieldMap, }) {
    const updateData = {};
    if (!fieldMap || Object.keys(fieldMap).length === 0) {
        return updateData;
    }
    for (const [field, newValues] of Object.entries(fieldMap)) {
        if (field === 'updatedAt')
            continue;
        const safeValues = Array.isArray(newValues) ? newValues : [];
        // Get the current array from the document
        const existingArray = Array.isArray(snap.get(field)) ? snap.get(field) : [];
        // Determine if the field should store raw strings or full objects
        const isObjectField = safeValues.some((v) => typeof v === 'object' && v !== null && Object.keys(v).length > 1);
        if (isObjectField) {
            // For object fields, merge with existing and deduplicate by ID
            const existingIds = new Set(existingArray
                .filter((item) => typeof item === 'object' && item !== null && 'id' in item)
                .map((item) => item.id));
            // Add new objects that don't already exist
            const newObjects = safeValues.filter((v) => typeof v === 'object' && v !== null && !existingIds.has(v.id));
            if (newObjects.length > 0) {
                updateData[field] = FieldValue.arrayUnion(...newObjects);
            }
        }
        else {
            // For string/ID fields, normalize to strings and merge with existing
            const normalized = safeValues.map((v) => (typeof v === 'string' ? v : v?.id)).filter(Boolean);
            // Create a set of existing string values
            const existingStrings = new Set(existingArray.filter((item) => typeof item === 'string'));
            // Add new strings that don't already exist
            const newStrings = normalized.filter((v) => !existingStrings.has(v));
            if (newStrings.length > 0) {
                updateData[field] = FieldValue.arrayUnion(...newStrings);
            }
        }
    }
    updateData['updatedAt'] = Timestamp.now();
    transaction.update(snap.ref, updateData);
    return updateData;
}
export async function enqueueRemoveArrayFieldUpdates({ transaction, snap, fieldMap, }) {
    const updateData = {};
    if (!fieldMap || Object.keys(fieldMap).length === 0) {
        return updateData;
    }
    for (const [field, removeValues] of Object.entries(fieldMap)) {
        if (field === 'updatedAt')
            continue;
        const safeValues = Array.isArray(removeValues) ? removeValues : [];
        // Normalize: Extract ids from both raw strings and objects
        const removeIds = safeValues.map((v) => (typeof v === 'string' ? v : v?.id)).filter(Boolean);
        const idSet = new Set(removeIds);
        const existingArray = Array.isArray(snap.get(field)) ? snap.get(field) : [];
        if (existingArray.length === 0)
            continue;
        const filtered = existingArray.filter((item) => {
            if (typeof item === 'string') {
                return !idSet.has(item); // remove if it's a string match
            }
            else if (item && typeof item === 'object' && 'id' in item) {
                return !idSet.has(item.id); // remove if its id matches
            }
            return true; // keep anything else
        });
        updateData[field] = FieldValue.arrayRemove(...filtered);
    }
    updateData['updatedAt'] = Timestamp.now();
    transaction.update(snap.ref, updateData);
    return updateData;
}
// Utility to remove undefined fields from the DTO.
// Especially fields like contextAsEmbeddings, which will cause all search to fail if an empty array is sent to firebase.
export const removeUndefinedFields = (obj) => {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
};
// Utility to remove empty arrays from the DTO. Only used for updates, since deleteField() is not supported in create.
export const removeEmptyArrays = (obj) => {
    return Object.fromEntries(Object.entries(obj)
        .map(([key, value]) => {
        if (Array.isArray(value) && value.length === 0) {
            return [key, FieldValue.delete()];
        }
        if (value !== undefined) {
            return [key, value];
        }
        // If value is undefined, filter it out by returning undefined
        return [key, undefined];
    })
        .filter(Boolean));
};
// Utility to remove undefined fields and empty arrays from the DTO.
// Used for updates to firestore. Not used for create.
export const cleanFirestoreUpdate = (obj) => {
    const noLocalFields = stripLocalFields(obj);
    const noUndefined = removeUndefinedFields(noLocalFields);
    const noEmptyArrays = removeEmptyArrays(noUndefined);
    return noEmptyArrays;
};
// Convert serialized timestamp (from client) to proper Firestore Timestamp
export function convertToFirestoreTimestamp(timestamp) {
    if (!timestamp) {
        return Timestamp.now();
    }
    // If it's already a proper Timestamp
    if (timestamp instanceof Timestamp) {
        return timestamp;
    }
    // If it's a serialized timestamp object from client
    if (typeof timestamp === 'object' && '_seconds' in timestamp && '_nanoseconds' in timestamp) {
        return new Timestamp(timestamp._seconds, timestamp._nanoseconds);
    }
    // If it's a plain object with seconds/nanoseconds (different format)
    if (typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
        return new Timestamp(timestamp.seconds, timestamp.nanoseconds);
    }
    // If it's a Date object
    if (timestamp instanceof Date) {
        return Timestamp.fromDate(timestamp);
    }
    // If it's a number (milliseconds)
    if (typeof timestamp === 'number') {
        return Timestamp.fromMillis(timestamp);
    }
    // Fallback to current time
    console.warn('Unable to convert timestamp, using current time:', timestamp);
    return Timestamp.now();
}
