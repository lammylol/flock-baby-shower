import {
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import {
  Prayer,
  PrayerPoint,
  PrayerTopic,
  Recipient,
} from '@shared/types/firebaseTypes';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';

// Helper function to convert Firestore timestamp objects to Timestamp instances
const convertTimestamp = (
  timestamp:
    | Timestamp
    | { seconds: number; nanoseconds: number }
    | { _seconds: number; _nanoseconds: number },
): Timestamp => {
  if (timestamp instanceof Timestamp) {
    return timestamp;
  }

  // Handle Firestore timestamp objects (from server)
  if (
    timestamp &&
    typeof timestamp === 'object' &&
    'seconds' in timestamp &&
    'nanoseconds' in timestamp
  ) {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds);
  }

  // Handle serialized timestamp objects (from client)
  if (
    timestamp &&
    typeof timestamp === 'object' &&
    '_seconds' in timestamp &&
    '_nanoseconds' in timestamp
  ) {
    return new Timestamp(timestamp._seconds, timestamp._nanoseconds);
  }

  // Fallback to current time if invalid
  console.warn('Invalid timestamp format, using current time:', timestamp);
  return Timestamp.now();
};

export class DocumentConverter {
  static convertDocToPrayer(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): Prayer {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data.authorId,
      authorName: data.authorName,
      content: data.content,
      privacy: data.privacy,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      prayerPoints: data.prayerPoints,
      entityType: data.entityType as EntityType,
      audioLocalPath: data.audioLocalPath,
      audioRemotePath: data.audioRemotePath,
      whoPrayed: data.whoPrayed,
    };
  }

  static convertDocToPrayerPoint(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): PrayerPoint {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data.authorId,
      authorName: data.authorName,
      title: data.title,
      content: data.content,
      privacy: data.privacy,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      prayerId: data.prayerId,
      tags: data.tags as PrayerType[],
      linkedTopics: data.linkedTopics as string[],
      prayerType: data.prayerType as PrayerType,
      recipients: data.recipients as Recipient[],
      contextAsEmbeddings: data.embedding,
      contextAsStrings: data.contextAsStrings,
      entityType: data.entityType as EntityType,
    };
  }

  static convertDocToPrayerTopic(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): PrayerTopic {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data.authorId,
      authorName: data.authorName,
      title: data.title,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      prayerTypes: data.prayerTypes as PrayerType[],
      status: data.status,
      privacy: data.privacy,
      recipients: data.recipients,
      journey: data.journey,
      aggregatedEmbedding: data.aggregatedEmbedding,
      contextAsEmbeddings: data.contextAsEmbeddings,
      entityType: data.entityType as EntityType,
      content: data.content,
    };
  }

  // Generic converter that can handle any of the three types
  static convertDocToEntity<T extends Prayer | PrayerPoint | PrayerTopic>(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
    entityType: 'prayer' | 'prayerPoint' | 'prayerTopic',
  ): T {
    switch (entityType) {
      case 'prayer':
        return this.convertDocToPrayer(docSnap) as T;
      case 'prayerPoint':
        return this.convertDocToPrayerPoint(docSnap) as T;
      case 'prayerTopic':
        return this.convertDocToPrayerTopic(docSnap) as T;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  // Batch converter for multiple documents
  static convertDocsToEntities<T extends Prayer | PrayerPoint | PrayerTopic>(
    docSnaps: QueryDocumentSnapshot<DocumentData, DocumentData>[],
    entityType: 'prayer' | 'prayerPoint' | 'prayerTopic',
  ): T[] {
    return docSnaps.map((doc) => this.convertDocToEntity<T>(doc, entityType));
  }
}
