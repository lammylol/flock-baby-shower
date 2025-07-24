// services/prayerTopicCreationHandler.ts
import { db } from '@/firebase/firebaseConfig';
import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  deleteField,
  doc,
  Firestore,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import OpenAiService from '@/services/ai/openAIService';
import {
  PrayerPoint,
  PrayerPointInTopicJourneyDTO,
  CreatePrayerTopicDTO,
  LinkedPrayerEntity,
  PrayerTopic,
  UpdatePrayerPointDTO,
} from '@shared/types/firebaseTypes';
import {
  isPrayerTopic,
  isValidPrayerPointInJourneyDTO,
} from '@/types/typeGuards';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { User } from 'firebase/auth';
import { prayerPointService } from './prayerPointService';
import { prayerTopicService } from './prayerTopicService';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import { getDateString, normalizeDate } from '@/utils/dateUtils';
import { submitOperationsService } from './submitOperationsService';
import { From } from '@/types/ComponentProps';

export interface IPrayerLinkingService {
  getJourney(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerPointInTopicJourneyDTO[];
  getDistinctPrayerTypes(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerType[];
  updateExistingPrayerTopicAndAddLinkedTopicToPrayerPoint(
    originTopic: PrayerTopic,
    prayerPoint: PrayerPoint,
  ): Promise<PrayerPoint>;
  createNewTopicAndLinkTopicToBothPrayerPoints(
    originPrayerPoint: PrayerPoint,
    topicTitle: string,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
    aiOptIn: boolean,
    user: User,
  ): Promise<{
    updatedPrayerPoint: PrayerPoint;
    topic: PrayerTopic;
  }>;
  removePrayerPointEmbeddings(
    originPrayer: PrayerPoint,
  ): Promise<PrayerPoint | undefined>;
  setContextFromJourneyAndGetEmbeddings(
    topicContent: string,
    journey: PrayerPointInTopicJourneyDTO[],
  ): Promise<{
    contextAsEmbeddings: number[] | undefined;
    aggregatedEmbedding: number[] | undefined;
  }>;
  updatePrayerPointWithLinkedTopic(
    prayerPoint: PrayerPoint,
    topicToModify: string,
    isExistingPrayerPoint?: boolean,
  ): Promise<PrayerPoint>;
  getPrayerTopicDTO(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
    user: User,
    topicTitle?: string,
  ): Promise<CreatePrayerTopicDTO>;
  removeEmbeddingLocally(prayerPoint: PrayerPoint): PrayerPoint;
  removeEmbeddingFromFirebase(
    selectedPrayer: LinkedPrayerEntity,
  ): Promise<void>;
  handleLinkedPrayerTopicInPrayerPoint(
    prayerPoint: PrayerPoint,
    isExistingPrayerPoint?: boolean,
    topicToModify?: string,
    options?: { remove?: boolean },
  ): Promise<PrayerPoint>;
  CreateOrUpdateTopicAndUpdatePrayerPoints(
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    isNewPrayerPoint: boolean,
    aiOptIn: boolean,
    topicTitle?: string,
  ): Promise<{
    updatedPrayerPointWithTopic?: PrayerPoint;
    topicId?: string;
  }>;
}

interface FirestoreWrapper {
  doc: typeof doc;
  addDoc: typeof addDoc;
  updateDoc: typeof updateDoc;
  deleteDoc: typeof deleteDoc;
  setDoc: typeof setDoc;
  getTimestamp: () => Timestamp;
}

class PrayerLinkingService implements IPrayerLinkingService {
  private firestoreWrapper: FirestoreWrapper;
  private prayerPointsCollection: CollectionReference;
  private prayerTopicsCollection: CollectionReference;

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
    this.prayerTopicsCollection = collection(
      db,
      FirestoreCollections.PRAYERTOPICS,
    );
  }

  maxCharactersPerPrayerContext = 250; // or whatever your constant is
  openAiService = OpenAiService.getInstance();

  setContextFromJourneyAndGetEmbeddings = async (
    topicContent: string,
    journey: PrayerPointInTopicJourneyDTO[],
  ): Promise<{
    contextAsEmbeddings: number[] | undefined;
    aggregatedEmbedding: number[] | undefined;
  }> => {
    // This function takes a journey of prayer points and generates embeddings
    // for the most recent 5 prayer points, concatenating their titles and content
    // into a single string.

    const getCleanedText = (p: PrayerPointInTopicJourneyDTO): string => {
      const dateStr = p.createdAt
        ? getDateString(p.createdAt)
        : getDateString(Timestamp.now());
      const title = p.title?.trim();
      const trimmedContent = p.content
        ?.slice(0, this.maxCharactersPerPrayerContext)
        ?.trim();

      // Handle different cases for title and content
      if (title && trimmedContent) {
        return `${dateStr}, ${title}, ${trimmedContent}`;
      }
      if (title) {
        return `${dateStr}, ${title}`;
      }
      if (trimmedContent) {
        return `${dateStr}, ${trimmedContent}`;
      }
      return '';
    };

    // Get the most recent 5 prayer points and map them to cleaned text
    const recentPrayerPoints = journey.slice(0, 5);
    const contextAsStrings = `${topicContent.trim()}, ${recentPrayerPoints
      .map(getCleanedText)
      .filter(Boolean)
      .join(', ')}`.trim(); // Join them with a comma for separation

    try {
      const embeddings =
        await this.openAiService.getVectorEmbeddings(contextAsStrings);
      if (!embeddings || embeddings.length === 0) {
        console.error('Failed to generate embeddings');
        return {
          contextAsEmbeddings: undefined,
          aggregatedEmbedding: undefined,
        };
      }

      return {
        contextAsEmbeddings: embeddings, //topic context
        aggregatedEmbedding: embeddings, //same as topic context - will change later with points.
      };
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  };

  getJourney = (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
  ): PrayerPointInTopicJourneyDTO[] => {
    const toDTO = (
      p: PrayerPointInTopicJourneyDTO,
    ): PrayerPointInTopicJourneyDTO => ({
      id: p.id,
      prayerType: p.prayerType ?? 'request',
      title: p.title ?? '',
      content: p.content ?? '',
      createdAt: p.createdAt, // use timestamp for firestore for date.
      authorId: p.authorId ?? 'Unknown',
      authorName: p.authorName ?? 'Unknown',
      recipients: p.recipients || [
        {
          name: 'User',
          id: p.authorId ?? 'Unknown',
        },
      ],
    });

    const normalizeJourney = (): PrayerPointInTopicJourneyDTO[] => {
      if (isPrayerTopic(originPrayer) && Array.isArray(originPrayer.journey)) {
        return (originPrayer.journey as PrayerPointInTopicJourneyDTO[]).map(
          toDTO,
        );
      }
      if (originPrayer.entityType === EntityType.PrayerPoint) {
        return [toDTO(originPrayer as PrayerPointInTopicJourneyDTO)]; // only return the origin prayer point if it's a prayer point.
      }
      return [];
    };

    const prayerForJourney = toDTO(prayerPoint);
    if (!isValidPrayerPointInJourneyDTO(prayerForJourney)) {
      console.error('Invalid prayer point in journey DTO', prayerForJourney);
      return [];
    }

    const journey = [...normalizeJourney(), prayerForJourney];

    const deduped = Array.from(new Map(journey.map((j) => [j.id, j])).values());
    return deduped.sort(
      (a, b) =>
        normalizeDate(b.createdAt).getTime() -
        normalizeDate(a.createdAt).getTime(),
    );
  };

  getDistinctPrayerTypes = (
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerType[] => {
    const types = new Set<PrayerType>();

    if (
      isPrayerTopic(selectedPrayer) &&
      Array.isArray(selectedPrayer.prayerTypes)
    ) {
      selectedPrayer.prayerTypes.forEach((type) => types.add(type));
    }

    if (prayerPoint.prayerType) {
      types.add(prayerPoint.prayerType);
    }

    return Array.from(types);
  };

  removeEmbeddingLocally = (prayerPoint: PrayerPoint): PrayerPoint => {
    return {
      ...prayerPoint,
      contextAsStrings: undefined,
      contextAsEmbeddings: undefined,
    };
  };

  removeEmbeddingFromFirebase = async (prayer: LinkedPrayerEntity) => {
    if (!prayer.id) {
      console.error('Missing id for removing embedding');
      return;
    }
    await prayerPointService.updatePrayerPoint(prayer.id, {
      contextAsStrings: deleteField(),
      contextAsEmbeddings: deleteField(),
    });
  };

  // Remove embeddings from Firebase and locally
  removePrayerPointEmbeddings = async (originPrayer: PrayerPoint) => {
    if (originPrayer.entityType === EntityType.PrayerPoint) {
      await this.removeEmbeddingFromFirebase(originPrayer);
    }
    return this.removeEmbeddingLocally(originPrayer);
  };

  // This function updates the linked topics in a prayer point.
  handleLinkedPrayerTopicInPrayerPoint = async (
    prayerPoint: PrayerPoint,
    isExistingPrayerPoint?: boolean,
    topicToModify?: string,
    options?: { remove?: boolean },
  ): Promise<PrayerPoint> => {
    let existingTopics: string[] = [];
    existingTopics = !isExistingPrayerPoint
      ? []
      : Array.isArray(prayerPoint.linkedTopics)
        ? (prayerPoint.linkedTopics as string[])
        : [];

    // Removing a topic
    if (options?.remove) {
      if (!topicToModify?.id) {
        throw new Error('topicToModify.id is required when removing a topic');
      }

      const updatedTopics = existingTopics.filter(
        (t) => t.id !== topicToModify.id,
      );

      return {
        ...prayerPoint,
        linkedTopics: updatedTopics.length > 0 ? updatedTopics : undefined,
      };
    }

    // Adding a topic
    if (!topicToModify) {
      throw new Error('topicToModify is required when adding a topic');
    }

    const mergedLinkedTopics = Array.from(
      new Map(
        [...existingTopics, topicToModify].map((topic) => [topic.id, topic]),
      ).values(),
    );

    return await prayerPointService.updatePrayerPoint(prayerPoint.id, {
      linkedTopics: mergedLinkedTopics,
      contextAsEmbeddings: deleteField(), // once the topic is created, we need to remove the embedding.
      contextAsStrings: deleteField(),
    });
  };

  /**
   * Links a prayer point to a topic and updates it if it's an existing one.
   */
  async updatePrayerPointWithLinkedTopic(
    prayerPoint: PrayerPoint,
    updatedTopic: PrayerTopic,
    isExistingPrayerPoint: boolean = false,
  ): Promise<PrayerPoint> {
    const linkedTopic = updatedTopic.id;

    // Attach the linked topic locally to the prayer point
    let updatedPrayerPoint = await this.handleLinkedPrayerTopicInPrayerPoint(
      prayerPoint,
      isExistingPrayerPoint,
      linkedTopic,
    );

    updatedPrayerPoint = this.removeEmbeddingLocally(updatedPrayerPoint);

    // If it's an existing prayer point, persist the update to Firestore
    if (isExistingPrayerPoint) {
      await prayerPointService.updatePrayerPoint(
        prayerPoint.id,
        updatedPrayerPoint as UpdatePrayerPointDTO,
      );
    }

    return updatedPrayerPoint;
  }

  // This function handles all the logic for prayer topics when linking
  // either prayer point to prayer point or prayer point to an existing prayer topic.
  getPrayerTopicDTO = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    topicTitle?: string,
  ): Promise<CreatePrayerTopicDTO> => {
    if (!user.uid) throw new Error('User ID is not available');
    if (!topicTitle) {
      throw new Error('Topic title is required for prayer point');
    }

    const content = `Latest ${prayerPoint.prayerType.trim()}: ${prayerPoint.title!.trim()} `;

    const journey = this.getJourney(prayerPoint, originPrayer);

    const { contextAsEmbeddings, aggregatedEmbedding } =
      await this.setContextFromJourneyAndGetEmbeddings(content, journey);

    const createTopicData: CreatePrayerTopicDTO = {
      title: topicTitle,
      content: content,
      authorName: user.displayName || 'Unknown',
      authorId: user.uid,
      status: 'open',
      privacy: 'private',
      recipients: [
        {
          name: 'User',
          id: user.uid,
        },
      ], // topics won't use recipients, but may be helpful in the future to track.
      prayerTypes: this.getDistinctPrayerTypes(prayerPoint, originPrayer),
      contextAsEmbeddings: contextAsEmbeddings,
      aggregatedEmbedding: aggregatedEmbedding,
      journey: journey,
    };
    return createTopicData;
  };

  // Link to an existing prayer topic
  updateExistingPrayerTopicAndAddLinkedTopicToPrayerPoint = async (
    originTopic: PrayerTopic,
    prayerPoint: PrayerPoint,
  ): Promise<PrayerPoint> => {
    // update the existing prayer topic with the update dto.
    const { success, updatedPoint } =
      await submitOperationsService.submitPrayerPointWithLink(prayerPoint, {
        from: From.PRAYER_TOPIC,
        fromId: originTopic.id,
      });

    if (!success || !updatedPoint) {
      throw new Error('Failed to update prayer point with linked topic');
    }

    return updatedPoint;
  };

  createNewTopicAndLinkTopicToBothPrayerPoints = async (
    originPrayerPoint: PrayerPoint,
    topicTitle: string,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
    aiOptIn: boolean,
    user: User,
  ): Promise<{
    updatedPrayerPoint: PrayerPoint;
    topic: PrayerTopic;
  }> => {
    try {
      const updatedTopicDTO: CreatePrayerTopicDTO =
        await this.getPrayerTopicDTO(
          prayerPoint,
          originPrayerPoint,
          user,
          topicTitle,
        );
      if (!updatedTopicDTO) throw new Error('Failed to get topic DTO');

      // create new topic in firebase with the create topic DTO.
      const topic = await prayerTopicService.createPrayerTopic(
        updatedTopicDTO,
        aiOptIn as boolean,
      );

      // Update the origin prayer point with the linked topic.
      await this.updatePrayerPointWithLinkedTopic(
        originPrayerPoint,
        topic,
        true,
      );

      // Update the new prayer point with the linked topic.
      const prayerPointWithNewTopic =
        await this.updatePrayerPointWithLinkedTopic(
          prayerPoint,
          topic,
          !isNewPrayerPoint,
        );

      // remove the embedding from the new prayer point, but only once the topic is created.
      const updatedPrayerPoint = this.removeEmbeddingLocally(
        prayerPointWithNewTopic,
      );

      return { updatedPrayerPoint, topic };
    } catch (error) {
      console.error('Error creating new topic and linking:', error);
      throw error;
    }
  };

  CreateOrUpdateTopicAndUpdatePrayerPoints = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    isNewPrayerPoint: boolean,
    aiOptIn: boolean,
    topicTitle?: string,
  ): Promise<{
    updatedPrayerPointWithTopic: PrayerPoint;
    topicId?: string;
  }> => {
    // This function links the selected prayer point to the new prayer point or topic.
    // If the selected prayer point is a prayer topic:
    // 1) updates the context and embeddings for the prayer topic.
    // 2) deletes the embedding from the original prayer point.
    // 3) removes the embedding from the new prayer point.

    // If the selected prayer point is a prayer point:
    // 1) gets the context and embeddings for the new prayer topic.
    // 2) creates the prayer topic in Firebase.
    // 3) deletes the embedding from the original prayer point.
    // 4) removes the embedding from the new prayer point.

    try {
      // Get either update or create DTO for the intended topic.
      if (!originPrayer || !originPrayer.id)
        throw new Error('Invalid origin prayer');

      let updatedPrayerPointWithTopic: PrayerPoint;
      let topicId = '';

      if (originPrayer.entityType === EntityType.PrayerTopic) {
        // if the origin is an existing prayer topic, update the existing prayer topic
        // and add the linked topic to the prayer point.
        updatedPrayerPointWithTopic =
          await this.updateExistingPrayerTopicAndAddLinkedTopicToPrayerPoint(
            originPrayer as PrayerTopic,
            prayerPoint,
          );
        topicId = originPrayer.id;
      } else {
        // if the origin is a prayer point, create a new prayer topic and link the prayer point to the topic.
        const result = await this.createNewTopicAndLinkTopicToBothPrayerPoints(
          originPrayer as PrayerPoint,
          topicTitle as string,
          isNewPrayerPoint,
          prayerPoint,
          aiOptIn,
          user,
        );

        updatedPrayerPointWithTopic = result.updatedPrayerPoint;
        topicId = result.topic.id;
      }

      return { updatedPrayerPointWithTopic, topicId };
    } catch (err) {
      const errorMessage = `Error linking prayer point: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMessage, err);
      throw new Error(errorMessage);
    }
  };
}

export const prayerLinkingService = new PrayerLinkingService(db);
