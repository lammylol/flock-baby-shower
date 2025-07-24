import { FirestoreCollections } from '@/schema/firebaseCollections';
import {
  CreatePrayerTopicDTO,
  PrayerPoint,
  PrayerTopic,
  UpdatePrayerTopicDTO,
} from '@shared/types/firebaseTypes';
import { EntityType } from '@/types/PrayerSubtypes';
import {
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  Firestore,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryDocumentSnapshot,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestoreSafety } from './firestoreSafety';
import { db } from '@/firebase/firebaseConfig';
import {
  isValidCreateTopicDTO,
  isValidUpdateTopicDTO,
} from '@/types/typeGuards';
import {
  cleanFirestoreUpdate,
  removeUndefinedFields,
} from '@/utils/update/firebaseUtils';
import { prayerLinkingService } from '@/services/prayer/prayerLinkingService';
import { submitOperationsService } from './submitOperationsService';
import { DocumentConverter } from '../../utils/retrieval/docConverters';

export interface IPrayerTopicService {
  createPrayerTopic(
    data: CreatePrayerTopicDTO,
    aiOptIn: boolean,
  ): Promise<PrayerTopic>;
  updatePrayerTopic(
    prayerTopicId: string,
    data: Partial<UpdatePrayerTopicDTO>,
  ): Promise<PrayerTopic>;
  deletePrayerTopic(prayerTopic: PrayerTopic, authorId: string): Promise<void>;
  getUserPrayerTopics(userId: string): Promise<PrayerTopic[]>;
  getPrayerTopic(id: string): Promise<PrayerTopic | null>;
  updatePrayerTopicWithJourneyAndPrayerTypes(
    prayerTopicId: string,
    prayerPoint: PrayerPoint,
  ): Promise<PrayerTopic>;
}

// ==== Prayer Topic CRUD ====
// Sharing is not supported for prayer topics yet.
class PrayerTopicService implements IPrayerTopicService {
  private prayerTopicsCollection: CollectionReference;
  constructor(db: Firestore) {
    this.prayerTopicsCollection = collection(
      db,
      FirestoreCollections.PRAYERTOPICS,
    );
  }

  async createPrayerTopic(
    data: CreatePrayerTopicDTO,
    aiOptIn: boolean,
  ): Promise<PrayerTopic> {
    try {
      const now = Timestamp.now();

      const newDocRef = doc(this.prayerTopicsCollection);

      const dataToSave = {
        ...removeUndefinedFields(data), // Utility to remove undefined fields from the DTO.
        // Especially fields like contextAsEmbeddings, which will cause all search to fail if an empty array is sent to firebase.
        id: newDocRef.id,
        createdAt: now,
        updatedAt: now,
        entityType: EntityType.PrayerTopic,
      };

      if (!data || !isValidCreateTopicDTO(dataToSave, aiOptIn)) {
        console.error('Invalid data in prayer topic');
        throw new Error('Missing data in prayer topic');
      }

      await setDoc(newDocRef, dataToSave);
      // Return the full topic object without fetching again
      const updatedData = {
        ...dataToSave,
        id: newDocRef.id,
      };
      return updatedData as PrayerTopic;
    } catch (error) {
      console.error('Error creating prayer topic:', error);
      throw error;
    }
  }

  //added for PrayerPoint CRUD
  async updatePrayerTopic(
    prayerTopicId: string,
    data: Partial<UpdatePrayerTopicDTO>,
  ): Promise<PrayerTopic> {
    try {
      const now = Timestamp.now();
      const prayerTopicRef = doc(this.prayerTopicsCollection, prayerTopicId);

      // Check if the prayer topic exists
      const exists = await firestoreSafety.checkIfDocumentExists(
        this.prayerTopicsCollection,
        prayerTopicId,
      );
      if (!exists) {
        throw new Error('Prayer topic not found');
      }

      const dataToSave = {
        ...cleanFirestoreUpdate(data),
        updatedAt: now,
      };

      if (!prayerTopicId || !dataToSave || !isValidUpdateTopicDTO(dataToSave)) {
        throw new Error('Missing data for updating prayer topic');
      }

      await updateDoc(prayerTopicRef, dataToSave);

      return dataToSave as PrayerTopic;
    } catch (error) {
      console.error('Error updating prayer topic:', error);
      throw error;
    }
  }

  async updateBatchPrayerTopics(
    prayerTopics: PrayerTopic[],
    generateEmbeddings: boolean,
  ): Promise<PrayerTopic[]> {
    try {
      const updatedTopics = await Promise.all(
        prayerTopics.map(async (topic) => {
          const updatedTopic = await this.updatePrayerTopic(topic.id, topic);
          if (generateEmbeddings) {
            await submitOperationsService.updateAggregatedEmbeddingForTopic(
              topic.id,
            );
          }
          return updatedTopic;
        }),
      );
      return updatedTopics;
    } catch (error) {
      console.error('Error updating prayer topic:', error);
      throw error;
    }
  }

  // this requires a runTransaction to update the journey. This is to handle multiple prayer points being
  // added to the same topic at the same time where the journey is updated.
  async updatePrayerTopicWithJourneyAndPrayerTypes(
    prayerTopicId: string,
    prayerPoint: PrayerPoint,
  ): Promise<PrayerTopic> {
    try {
      const topicRef = doc(this.prayerTopicsCollection, prayerTopicId);
      const updatedTopic = await runTransaction(db, async (transaction) => {
        const topicSnap = await transaction.get(topicRef);

        if (!topicSnap.exists()) {
          throw new Error('Topic does not exist');
        }

        const topicData = topicSnap.data() as PrayerTopic;

        // get distinct prayer types
        const prayerTypes = prayerLinkingService.getDistinctPrayerTypes(
          prayerPoint,
          topicData,
        );

        // Safe journey update inside the transaction
        // Ensure topicData.journey is an array of strings (ids), not a FieldValue
        let updatedJourney = prayerLinkingService.getJourney(
          prayerPoint,
          topicData,
        );

        const updatedTopicData = {
          journey: updatedJourney,
          prayerTypes: prayerTypes,
        };

        const dataToSave = {
          ...topicData,
          ...cleanFirestoreUpdate(updatedTopicData),
          updatedAt: Timestamp.now(),
        };

        transaction.update(topicRef, {
          ...dataToSave,
        });

        return {
          ...topicData,
          journey: updatedJourney,
          prayerTypes: prayerTypes,
        };
      });

      return updatedTopic as PrayerTopic;
    } catch (error) {
      console.error('Error updating prayer topic:', error);
      throw error;
    }
  }

  async deletePrayerTopic(
    prayerTopic: PrayerTopic,
    authorId: string,
  ): Promise<void> {
    try {
      // Check if the prayer topic exists
      const exists = await firestoreSafety.checkIfDocumentExists(
        this.prayerTopicsCollection,
        prayerTopic.id,
      );
      if (!exists) {
        throw new Error('Prayer topic not found');
      }
      // Check if the user is the author (this is also enforced by Firebase rules)
      if (prayerTopic.authorId !== authorId) {
        throw new Error('Unauthorized to delete this prayer topic');
      }

      // Delete the prayer topic document
      await deleteDoc(doc(this.prayerTopicsCollection, prayerTopic.id));

      // Placeholder to remove from author's feed later.
    } catch (error) {
      console.error('Error deleting prayer topic:', error);
      throw error;
    }
  }

  async getUserPrayerTopics(userId: string): Promise<PrayerTopic[]> {
    try {
      const q = query(
        this.prayerTopicsCollection,
        where('authorId', '==', userId),
        orderBy('updatedAt', 'desc'),
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return [];
      return querySnapshot.docs.map(
        (doc) => this.convertDocToPrayerTopic(doc) as PrayerTopic,
      );
    } catch (error) {
      console.error('Error getting user prayer topics:', error);
      throw error;
    }
  }

  async getPrayerTopic(id: string): Promise<PrayerTopic | null> {
    try {
      const docRef = doc(this.prayerTopicsCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return this.convertDocToPrayerTopic(docSnap);
    } catch (error) {
      console.error('Error getting prayer topic:', error);
      throw error;
    }
  }

  private convertDocToPrayerTopic(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): PrayerTopic {
    return DocumentConverter.convertDocToPrayerTopic(docSnap);
  }
}

export const prayerTopicService = new PrayerTopicService(db);
