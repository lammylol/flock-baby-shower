// ramon jiang
// 1/29/25
// service for handling prayer CRUD operations with Firebase

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  QueryDocumentSnapshot,
  DocumentData,
  CollectionReference,
  Firestore,
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import {
  Prayer,
  PrayerPoint,
  CreatePrayerDTO,
  UpdatePrayerDTO,
} from '@shared/types/firebaseTypes';
import { EntityType } from '@/types/PrayerSubtypes';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import {
  cleanFirestoreUpdate,
  removeUndefinedFields,
} from '@/utils/update/firebaseUtils';
import { callFirebaseFunction } from '@/utils/update/firebaseUtils';
import { DocumentConverter } from '../../utils/retrieval/docConverters';
import * as FileSystem from 'expo-file-system';
import storageService from '../recording/firebaseStorageService';

export interface IPrayerService {
  createPrayerWithPoints(
    data: CreatePrayerDTO,
    prayerPoints: PrayerPoint[],
  ): Promise<Prayer>;
  getPrayer(prayerId: string): Promise<Prayer | null>;
  getUserPrayers(userId: string): Promise<Prayer[]>;
  updatePrayer(prayerId: string, data: UpdatePrayerDTO): Promise<void>;
  deletePrayer(prayer: Prayer, authorId: string): Promise<void>;
}
class PrayerService implements IPrayerService {
  private prayersCollection: CollectionReference<DocumentData>;
  constructor(db: Firestore) {
    // Initialize the prayers collection reference
    this.prayersCollection = collection(db, FirestoreCollections.PRAYERS);
  }

  // ===== Prayer CRUD operations =====
  async createPrayerWithPoints(
    prayerDTO: CreatePrayerDTO,
    prayerPoints: PrayerPoint[],
  ): Promise<Prayer> {
    try {
      const prayer = {
        ...removeUndefinedFields(prayerDTO),
        entityType: EntityType.Prayer,
      };

      const prayerPointsWithEntityType = prayerPoints.map((point) => {
        return {
          ...removeUndefinedFields(point),
          entityType: EntityType.PrayerPoint as EntityType,
        };
      });

      const result = await callFirebaseFunction('submitPrayerWithPoints', {
        prayer,
        prayerPoints: prayerPointsWithEntityType,
        removedPrayerPointIds: [],
      });

      const { updatedPrayer } = result as {
        updatedPrayer: Prayer;
      };

      if (!updatedPrayer) {
        throw new Error('Failed to create prayer');
      }

      // // If prayer is public, add to author's feed
      // if (prayer.privacy === 'public') {
      //   const feedPrayerRef = doc(
      //     db,
      //     FirestoreCollections.FEED,
      //     prayer.authorId,
      //     FirestoreCollections.PRAYERS,
      //     docRef.id,
      //   );
      //   await setDoc(feedPrayerRef, {
      //     prayerId: docRef.id,
      //     addedAt: now,
      //   });
      // }

      return updatedPrayer;
    } catch (error) {
      console.error('Error creating prayer:', error);
      throw error;
    }
  }

  async getPrayer(prayerId: string): Promise<Prayer | null> {
    try {
      const docRef = doc(this.prayersCollection, prayerId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return this.convertDocToPrayer(docSnap);
    } catch (error) {
      console.error('Error getting prayer:', error);
      throw error;
    }
  }

  async getUserPrayers(userId: string): Promise<Prayer[]> {
    try {
      const q = query(
        this.prayersCollection,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) => this.convertDocToPrayer(doc) as Prayer,
      );
    } catch (error) {
      console.error('Error getting user prayers:', error);
      throw error;
    }
  }

  async updatePrayer(prayerId: string, data: UpdatePrayerDTO): Promise<void> {
    try {
      const now = Timestamp.now();
      const prayerRef = doc(this.prayersCollection, prayerId);

      const dataToSave = {
        ...cleanFirestoreUpdate(data),
        updatedAt: now,
      };

      await updateDoc(prayerRef, dataToSave);

      // Update feed entry if prayer visibility changes
      if (data.privacy !== undefined) {
        const prayer = await this.getPrayer(prayerId);
        if (prayer) {
          const feedRef = doc(
            db,
            FirestoreCollections.FEED,
            prayer.authorId,
            FirestoreCollections.PRAYERS,
            prayerId,
          );

          if (data.privacy === 'public') {
            // Add to feed if making public
            await setDoc(feedRef, {
              prayerId: prayerId,
              addedAt: now,
            });
          } else {
            // Remove from feed if making private
            await deleteDoc(feedRef);
          }
        }
      }
    } catch (error) {
      console.error('Error updating prayer:', error);
      throw error;
    }
  }

  async deletePrayer(prayer: Prayer, authorId: string): Promise<void> {
    try {
      // Delete an audio file after a user deletes the prayer
      if (prayer.audioLocalPath) {
        await FileSystem.deleteAsync(
          FileSystem.documentDirectory + prayer.audioLocalPath,
          {
            idempotent: true,
          },
        );
      }
      // Delete the audio file from firebase storage
      if (prayer.audioRemotePath) {
        const exists = await storageService.checkIfFileExists(
          prayer.audioRemotePath,
        );
        console.log('exists', exists);
        if (exists) {
          await storageService.deleteFile(prayer.audioRemotePath);
        }
      }

      console.log('deleting prayer', prayer.id);
      // Delete the prayer document
      await deleteDoc(doc(this.prayersCollection, prayer.id));

      // Remove from author's feed if it exists
      await deleteDoc(
        doc(
          db,
          FirestoreCollections.FEED,
          authorId,
          FirestoreCollections.PRAYERS,
          prayer.id,
        ),
      );
    } catch (error) {
      console.error('Error deleting prayer:', error);
      throw error;
    }
  }

  async checkIfDocumentExists(
    collectionName: CollectionReference,
    documentId: string,
  ): Promise<boolean> {
    try {
      const docRef = doc(collectionName, documentId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking document existence:', error);
      throw error;
    }
  }

  private convertDocToPrayer(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): Prayer {
    return DocumentConverter.convertDocToPrayer(docSnap);
  }
}

export const prayerService = new PrayerService(db);
