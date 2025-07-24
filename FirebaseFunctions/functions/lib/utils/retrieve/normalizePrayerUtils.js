import { Timestamp } from 'firebase-admin/firestore';
import { convertToFirestoreTimestamp } from '../upload/firestoreUtils.js'; // adjust if needed
export function normalizePrayerPoint(raw, now = Timestamp.now()) {
    return {
        id: raw.id,
        title: raw.title,
        prayerType: raw.prayerType,
        content: raw.content,
        recipients: raw.recipients,
        authorId: raw.authorId,
        authorName: raw.authorName,
        linkedTopics: raw.linkedTopics ?? [],
        createdAt: convertToFirestoreTimestamp(raw.createdAt ?? now),
        updatedAt: convertToFirestoreTimestamp(raw.updatedAt ?? now),
    };
}
