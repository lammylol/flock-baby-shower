import { db } from '@/firebase/firebaseConfig';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import {
  CreatePrayerPointDTO,
  PrayerPoint,
  UpdatePrayerPointDTO,
} from '@shared/types/firebaseTypes';
import { EntityType } from '@/types/PrayerSubtypes';
import { User } from 'firebase/auth';
import {
  addDoc,
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
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  cleanFirestoreUpdate,
  removeUndefinedFields,
} from '@/utils/update/firebaseUtils';
import {
  isValidCreatePrayerPointDTO,
  isValidUpdatePrayerPointDTO,
} from '@/types/typeGuards';
import { DocumentConverter } from '../../utils/retrieval/docConverters';

export interface IPrayerPointsService {
  createPrayerPoint(data: CreatePrayerPointDTO): Promise<PrayerPoint>;
  updatePrayerPoint(
    prayerPointId: string,
    data: UpdatePrayerPointDTO,
  ): Promise<PrayerPoint>;
  deletePrayerPoint(
    prayerPointId: string,
    authorId: string,
  ): Promise<PrayerPoint>;
  getPrayerPoints(params: {
    user: User;
    prayerId?: string;
    prayerPointIds?: string[];
  }): Promise<PrayerPoint[] | null>;
  getUserPrayerPoints(userId: string): Promise<PrayerPoint[]>;
  getPrayerPointById(prayerPointId: string): Promise<PrayerPoint | null>;
}

interface FirestoreWrapper {
  doc: typeof doc;
  addDoc: typeof addDoc;
  updateDoc: typeof updateDoc;
  deleteDoc: typeof deleteDoc;
  setDoc: typeof setDoc;
  getTimestamp: () => Timestamp;
}

class PrayerPointsService implements IPrayerPointsService {
  private firestoreWrapper: FirestoreWrapper;
  private prayerPointsCollection: CollectionReference;

  constructor(
    db: Firestore,
    firestoreWrapper: FirestoreWrapper = {
      doc,
      addDoc,
      updateDoc,
      deleteDoc,
      setDoc,
      getTimestamp: () => Timestamp.now(),
    },
  ) {
    this.firestoreWrapper = firestoreWrapper;
    this.prayerPointsCollection = collection(
      db,
      FirestoreCollections.PRAYERPOINTS,
    );
  }

  async createPrayerPoint(data: CreatePrayerPointDTO): Promise<PrayerPoint> {
    try {
      const now = this.firestoreWrapper.getTimestamp();

      const dataToSave = {
        ...removeUndefinedFields(data),
        createdAt: now,
        updatedAt: now,
        entityType: EntityType.PrayerPoint,
      };

      if (!data || !isValidCreatePrayerPointDTO(dataToSave)) {
        console.error('Invalid data in prayer point');
        throw new Error('Missing data in prayer point');
      }

      const docRef = await this.firestoreWrapper.addDoc(
        this.prayerPointsCollection,
        dataToSave,
      );

      await this.firestoreWrapper.updateDoc(docRef, { id: docRef.id });

      if (data.privacy === 'public') {
        const feedPrayerRef = this.firestoreWrapper.doc(
          db,
          FirestoreCollections.FEED,
          data.authorId,
          FirestoreCollections.PRAYERPOINTS,
          docRef.id,
        );
        await this.firestoreWrapper.setDoc(feedPrayerRef, {
          id: docRef.id,
          addedAt: now,
        });
      }

      const returnedPrayerPoint = {
        ...dataToSave,
        id: docRef.id,
      };

      return returnedPrayerPoint as PrayerPoint;
    } catch (error) {
      console.error('Error creating prayer:', error);
      throw error;
    }
  }

  /**
   * Fetches prayer points for a user, optionally filtered by prayerId and/or a list of prayerPointIds.
   *
   * @param user - The user whose prayer points to fetch.
   * @param prayerId - (Optional) If provided, only prayer points linked to this prayerId will be returned.
   * @param prayerPointIds - (Optional) If provided, only prayer points whose IDs are in this array will be returned.
   * @returns A Promise resolving to an array of PrayerPoint objects, or null if none found.
   */
  async getPrayerPoints(params: {
    user: User;
    prayerId?: string;
    prayerPointIds?: string[];
  }): Promise<PrayerPoint[] | null> {
    try {
      const { user, prayerId, prayerPointIds } = params;
      // Query for public OR user's own prayer points
      const queryConstraints = [];

      if (prayerId) {
        queryConstraints.push(where('prayerId', '==', prayerId));
      }

      if (prayerPointIds) {
        queryConstraints.push(where('id', 'in', prayerPointIds));
      }

      // Fetch only public prayer points or the user's own prayer points
      // Firestore does not support OR queries directly, so we need to fetch both and merge if needed.
      // For now, fetch only the user's own prayer points).
      queryConstraints.push(where('authorId', '==', user.uid));

      queryConstraints.push(orderBy('createdAt', 'desc'));

      const q = query(this.prayerPointsCollection, ...queryConstraints);

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return null;

      return querySnapshot.docs.map(
        (doc) => this.convertDocToPrayerPoint(doc) as PrayerPoint,
      );
    } catch (error) {
      console.error('Error getting prayer points:', error);
      throw error;
    }
  }

  async getPrayerPoint(prayerPointId: string): Promise<PrayerPoint | null> {
    try {
      const docRef = doc(this.prayerPointsCollection, prayerPointId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return this.convertDocToPrayerPoint(docSnap);
    } catch (error) {
      console.error('Error getting prayer points:', error);
      throw error;
    }
  }

  async getUserPrayerPoints(userId: string): Promise<PrayerPoint[]> {
    try {
      // Query for public OR user's own prayer points
      const q = query(
        this.prayerPointsCollection,
        // where('privacy', '==', 'public'), // Fetch only public prayer points
        where('authorId', '==', userId), // OR fetch the user's own prayer points
        orderBy('createdAt', 'desc'),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return [];

      return querySnapshot.docs.map(
        (doc) => this.convertDocToPrayerPoint(doc) as PrayerPoint,
      );
    } catch (error) {
      console.error('Error getting prayer points:', error);
      throw error;
    }
  }

  // Helper method to get a single prayer point by ID
  async getPrayerPointById(prayerPointId: string): Promise<PrayerPoint | null> {
    try {
      const docRef = doc(this.prayerPointsCollection, prayerPointId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return this.convertDocToPrayerPoint(docSnap);
    } catch (error) {
      console.error('Error getting prayer point:', error);
      throw error;
    }
  }

  async getPrayerPointsByPrayerId(prayerIds: string[]): Promise<PrayerPoint[]> {
    if (prayerIds.length === 0) return [];
    const q = query(
      this.prayerPointsCollection,
      where('prayerId', 'in', prayerIds),
      orderBy('createdAt', 'desc'),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => this.convertDocToPrayerPoint(doc) as PrayerPoint,
    );
  }

  async updatePrayerPoint(
    prayerPointId: string,
    data: UpdatePrayerPointDTO,
  ): Promise<PrayerPoint> {
    try {
      if (!prayerPointId) {
        throw new Error('No prayerId provided for update');
      }
      const prayerPointRef = doc(this.prayerPointsCollection, prayerPointId);
      // We should reconsider this if needed. Sounds like an excessive read.
      // Get the current prayer point to check for privacy changes
      const currentPrayerPoint = await this.getPrayerPoint(prayerPointId);
      if (!currentPrayerPoint) {
        throw new Error('Prayer point not found');
      }
      // Clean the currentPrayerPoint object to remove any Firestore-specific fields or undefined values
      const cleanedCurrentPrayerPoint =
        cleanFirestoreUpdate(currentPrayerPoint);

      // Prepare the updated prayer point object
      const dataToSave = {
        ...cleanedCurrentPrayerPoint,
        ...cleanFirestoreUpdate(data),
        updatedAt: Timestamp.now(),
      };

      if (!isValidUpdatePrayerPointDTO(dataToSave)) {
        console.error('Invalid data in prayer point');
        throw new Error('Missing data in prayer point');
      }

      // Update the prayer point in Firestore
      await updateDoc(prayerPointRef, {
        ...dataToSave,
      });

      // Handle privacy changes if applicable (from public to private or vice versa)
      if (
        data.privacy !== undefined &&
        data.privacy !== currentPrayerPoint.privacy
      ) {
        const feedRef = doc(
          db,
          FirestoreCollections.FEED,
          currentPrayerPoint.authorId,
          FirestoreCollections.PRAYERPOINTS,
          prayerPointId,
        );

        if (data.privacy === 'public') {
          // Add to feed if making public
          await setDoc(feedRef, {
            id: prayerPointId,
            addedAt: Timestamp.now(),
          });
        } else if (currentPrayerPoint.privacy === 'public') {
          // Remove from feed if making private (and it was previously public)
          await this.firestoreWrapper.deleteDoc(feedRef);
        }
      }

      // Return the updated prayer point object without refetching
      return dataToSave as PrayerPoint;
    } catch (error) {
      console.error('Error updating prayer point:', error);
      throw error;
    }
  }

  async deletePrayerPoint(
    prayerPointId: string,
    authorId: string,
  ): Promise<PrayerPoint> {
    try {
      // Excessive read - need to refactor and reconsider this.
      // First get the prayer point to check if it exists
      const prayerPoint = await this.getPrayerPoint(prayerPointId);
      if (!prayerPoint) {
        throw new Error('Prayer point not found');
      }

      // Check if the user is the author (this is also enforced by Firebase rules)
      if (prayerPoint.authorId !== authorId) {
        throw new Error('Unauthorized to delete this prayer point');
      }

      // Delete the prayer point document
      await deleteDoc(doc(this.prayerPointsCollection, prayerPointId));

      // Remove from author's feed if it was public
      if (prayerPoint.privacy === 'public') {
        await deleteDoc(
          doc(
            db,
            FirestoreCollections.FEED,
            authorId,
            FirestoreCollections.PRAYERPOINTS,
            prayerPointId,
          ),
        );
      }
      return prayerPoint;
    } catch (error) {
      console.error('Error deleting prayer point:', error);
      throw error;
    }
  }

  private convertDocToPrayerPoint(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): PrayerPoint {
    return DocumentConverter.convertDocToPrayerPoint(docSnap);
  }
}

export const prayerPointService = new PrayerPointsService(db);
