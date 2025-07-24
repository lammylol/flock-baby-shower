import { Timestamp } from 'firebase-admin/firestore';
import { convertToFirestoreTimestamp } from '../upload/firestoreUtils.js'; // adjust if needed
// @ts-expect-error: Shared types may not be available in local dev environment
import type { PrayerPoint } from '../../shared/types/firebaseTypes.js';

export function normalizePrayerPoint(raw: any, now = Timestamp.now()): PrayerPoint {
    return {
        id: raw.id,
        title: raw.title,
        prayerType: raw.prayerType,
        content: raw.content,
        recipients: raw.recipients,
        authorId: raw.authorId,
        authorName: raw.authorName,
        linkedTopics: raw.linkedTopics ?? [],
        createdAt: convertToFirestoreTimestamp(raw.createdAt ?? now) as Timestamp,
        updatedAt: convertToFirestoreTimestamp(raw.updatedAt ?? now) as Timestamp,
    };
}   