import {
  CreatePrayerPointDTO,
  CreatePrayerTopicDTO,
  FlatPrayerTopicDTO,
  LinkedPrayerEntity,
  Prayer,
  PrayerPoint,
  PrayerTopic,
  UpdatePrayerPointDTO,
  UpdatePrayerTopicDTO,
} from '@shared/types/firebaseTypes';
import OpenAiService from '@/services/ai/openAIService';
import { User } from 'firebase/auth';
import { prayerLinkingService } from './prayerLinkingService';
import { EntityType } from '@/types/PrayerSubtypes';
import { Alert } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { prayerPointService } from './prayerPointService';
import { sharedPrayerServices } from './sharedPrayerServices';
import { getDateString } from '@/utils/dateUtils';
import { prayerTopicService } from './prayerTopicService';
import { EditMode, FromProps } from '@/types/ComponentProps';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { callFirebaseFunction } from '@/utils/update/firebaseUtils';
import { removeUndefinedFields } from '@/utils/update/firebaseUtils';
import { localUpdateArrayFieldAddRemove } from '@/utils/update/docUpdates/arrayUtils';
import { blankId } from '@/types/blankStateModels';

export interface ISubmitOperationsService {
  submitPrayerPointWithLink: (
    point: PrayerPoint,
    from?: FromProps,
  ) => Promise<{ success: boolean; updatedPoint?: PrayerPoint }>;
  generateEmbeddingsAndCreatePrayerPoint: (
    data: PrayerPoint,
    user: User,
    aiOptIn: boolean,
  ) => Promise<PrayerPoint>;
  updatePrayerPointAndUpdateEmbeddings: (
    id: string,
    data: PrayerPoint,
  ) => Promise<PrayerPoint>;
  submitPrayerPointWithEmbeddingsAndLinking: ({
    formState,
    prayerPoint,
    originPrayer,
    prayerTopicDTO,
    user,
    aiOptIn,
    handlePrayerPointUpdate,
  }: {
    formState: { isEditMode: boolean };
    prayerPoint: PrayerPoint;
    originPrayer?: LinkedPrayerEntity | undefined;
    prayerTopicDTO?: FlatPrayerTopicDTO | undefined;
    user: User;
    aiOptIn: boolean;
    handlePrayerPointUpdate: (p: PrayerPoint) => void;
  }) => Promise<PrayerPoint>;
  submitPrayerTopic: (
    data: PrayerTopic,
    user: User,
    aiOptIn: boolean,
    editMode: EditMode,
  ) => Promise<PrayerTopic | undefined>;
}

class SubmitOperationsService implements ISubmitOperationsService {
  openAiService = OpenAiService.getInstance();

  /**
   * Submits a prayer point with linking functionality via Firebase function
   * @param point - The prayer point object to submit
   * @param from - Optional source information about where the submission originated
   * @returns Promise resolving to success status and updated prayer point if successful
   */
  async submitPrayerPointWithLink(
    point: PrayerPoint,
    from?: FromProps,
  ): Promise<{ success: boolean; updatedPoint?: PrayerPoint }> {
    try {
      const pointWithEntityType = {
        ...removeUndefinedFields(point),
        entityType: EntityType.PrayerPoint,
      };

      const result = await callFirebaseFunction('submitPrayerPointWithLink', {
        point: pointWithEntityType,
        from,
      });

      const { updatedPoint } = result as {
        updatedPoint: PrayerPoint;
      };

      if (!updatedPoint) {
        throw new Error('Failed to update prayer point');
      }

      return { success: true, updatedPoint };
    } catch (error) {
      console.error('submitPrayerPointWithLink failed:', error);
      return { success: false };
    }
  }

  /**
   * Generates embeddings for a prayer point and creates it in the database
   * @param data - The prayer point data to create
   * @param user - The authenticated user creating the prayer point
   * @param aiOptIn - Whether the user has opted in to AI features for embedding generation
   * @returns Promise resolving to the created prayer point with generated embeddings
   */
  generateEmbeddingsAndCreatePrayerPoint = async (
    data: PrayerPoint,
    user: User,
    aiOptIn: boolean,
  ): Promise<PrayerPoint> => {
    if (!user?.uid) throw new Error('User not authenticated');
    if (!data.title) throw new Error('Prayer point must have a title');

    let contextAsEmbeddings = data.contextAsEmbeddings as number[] | undefined;
    let contextAsStrings = data.contextAsStrings as string | undefined;

    // Only generate embeddings if not present AND user opted in AND not linked to topics
    const shouldGenerateEmbeddings =
      !contextAsEmbeddings && !data.linkedTopics && aiOptIn;

    if (shouldGenerateEmbeddings) {
      const dateStr = data.createdAt
        ? getDateString(data.createdAt)
        : getDateString(Timestamp.now());
      contextAsStrings = `${dateStr}, ${data.title}, ${data.content}`.trim();
      contextAsEmbeddings =
        await this.openAiService.getVectorEmbeddings(contextAsStrings);
    }

    // Final validation + fallback cleanup
    const contextFields =
      sharedPrayerServices.getContextFieldsIfEmbeddingsExist(
        contextAsEmbeddings,
        contextAsStrings,
        true,
      );

    const prayerPointData: CreatePrayerPointDTO = {
      title: data.title?.trim() ?? '',
      content: data.content.trim() ?? '',
      privacy: data.privacy ?? 'private',
      prayerType: data.prayerType ?? 'request',
      ...(data.prayerId !== undefined && {
        prayerId: data.prayerId,
      }),
      tags: data.tags,
      authorId: user.uid,
      authorName: user.displayName || 'unknown',
      recipients: data.recipients ?? [
        {
          name: 'User',
          id: user.uid,
        },
      ],
      contextAsEmbeddings: contextFields.contextAsEmbeddings,
      contextAsStrings: contextFields.contextAsStrings,
      linkedTopics: data.linkedTopics,
    };

    const createdPrayerPoint =
      await prayerPointService.createPrayerPoint(prayerPointData);

    return createdPrayerPoint;
  };

  /**
   * Updates an existing prayer point and regenerates embeddings if needed
   * @param id - The ID of the prayer point to update
   * @param data - The updated prayer point data
   * @returns Promise resolving to the updated prayer point
   */
  updatePrayerPointAndUpdateEmbeddings = async (
    id: string,
    data: PrayerPoint,
  ): Promise<PrayerPoint> => {
    if (!id) throw new Error('No prayer point ID provided');
    const { contextAsEmbeddings, contextAsStrings } =
      sharedPrayerServices.getContextFieldsIfEmbeddingsExist(
        data.contextAsEmbeddings as number[],
        data.contextAsStrings as string,
        false,
      );

    const updateData: UpdatePrayerPointDTO = {
      title: data.title?.trim() ?? '', // even if user doesn't enter title, it must be passed.
      content: data.content?.trim() ?? '', // even if user doesn't enter content, it must be passed.
      privacy: data.privacy ?? 'private',
      tags: data.tags,
      prayerType: data.prayerType,
      contextAsEmbeddings,
      contextAsStrings,
      linkedTopics: data.linkedTopics,
    };

    const updatedPrayerPoint = await prayerPointService.updatePrayerPoint(
      id,
      updateData,
    );

    return updatedPrayerPoint;
  };

  /**
   * Submits a prayer point with embeddings and linking functionality
   * @param formState - Object containing form state information like edit mode
   * @param prayerPoint - The prayer point to submit
   * @param originPrayer - Optional linked prayer entity that this point originates from
   * @param topicTitle - Optional title for the topic if linking to a prayer topic
   * @param user - The authenticated user submitting the prayer point
   * @param aiOptIn - Whether the user has opted in to AI features
   * @returns Promise resolving to the submitted prayer point
   */
  submitPrayerPointWithEmbeddingsAndLinking = async ({
    formState,
    prayerPoint,
    originPrayer,
    topicTitle,
    user,
    aiOptIn,
  }: {
    formState: { isEditMode: boolean };
    prayerPoint: PrayerPoint;
    originPrayer?: LinkedPrayerEntity | undefined;
    topicTitle?: string;
    user: User;
    aiOptIn: boolean;
  }): Promise<PrayerPoint> => {
    try {
      let updatedPrayerPoint: PrayerPoint = prayerPoint;

      // If the origin prayer is a prayer topic and a topic title is provided,
      // ensure the prayer point's linkedTopics includes the topic.
      if (originPrayer?.entityType === EntityType.PrayerTopic && topicTitle) {
        updatedPrayerPoint = this.ensurePrayerPointLinkedToTopic(
          prayerPoint,
          originPrayer as LinkedPrayerEntity,
          topicTitle as string,
        );
      }

      // create or update the user's prayer point. If the topic existed already, topic is added to prayer point.
      // If the topic did not exist, topic is not added to the prayer point yet. This is handled in the
      // CreateOrUpdateTopicAndUpdatePrayerPoints method.
      if (formState.isEditMode && prayerPoint.id) {
        updatedPrayerPoint = await this.updatePrayerPointAndUpdateEmbeddings(
          updatedPrayerPoint.id,
          updatedPrayerPoint,
        );
      } else {
        updatedPrayerPoint = (await this.generateEmbeddingsAndCreatePrayerPoint(
          updatedPrayerPoint,
          user,
          aiOptIn,
        )) as PrayerPoint;
      }

      // Handle linking prayer points. ----------------------------------------
      if (originPrayer && topicTitle) {
        const result =
          await prayerLinkingService.CreateOrUpdateTopicAndUpdatePrayerPoints(
            updatedPrayerPoint,
            originPrayer,
            user,
            !formState.isEditMode,
            aiOptIn,
            topicTitle,
          );
        updatedPrayerPoint = result.updatedPrayerPointWithTopic;
      }
      return updatedPrayerPoint;
    } catch (error) {
      console.error('Error submitting prayer point:', error);
      Alert.alert('Something went wrong', 'Please try again.');
      return prayerPoint;
    }
  };

  /**
   * Submits a prayer topic with optional embedding generation
   * @param data - The prayer topic data to submit
   * @param user - The authenticated user submitting the prayer topic
   * @param aiOptIn - Whether the user has opted in to AI features for embedding generation
   * @param editMode - Whether this is creating a new topic or editing an existing one
   * @returns Promise resolving to the submitted prayer topic or undefined if failed
   */
  submitPrayerTopic = async (
    data: PrayerTopic,
    user: User,
    aiOptIn: boolean,
    editMode: EditMode,
  ): Promise<PrayerTopic | undefined> => {
    try {
      if (!user?.uid) throw new Error('User not authenticated');
      if (!data.title) throw new Error('Prayer topic must have a title');

      const prayerTopicData: CreatePrayerTopicDTO = {
        title: data.title?.trim() ?? '',
        content: data.content.trim() ?? '',
        privacy: data.privacy ?? 'private',
        prayerTypes: data.prayerTypes,
        status: data.status,
        authorId: user.uid,
        authorName: user.displayName || 'unknown',
        recipients: data.recipients || [
          {
            name: 'User',
            id: user.uid,
          },
        ],
        contextAsEmbeddings: data.contextAsEmbeddings,
        aggregatedEmbedding: data.aggregatedEmbedding,
        journey: data.journey,
      };

      if (data.contextAsEmbeddings == null) {
        // if AI is opted in and embedding is not present, generate embedding.
        try {
          const dateStr = data.createdAt
            ? getDateString(data.createdAt)
            : getDateString(Timestamp.now());
          const contextAsStrings =
            `${dateStr}, ${data.title}, ${data.content}`.trim();
          // invalid embedding is handled in the service.
          const contextAsEmbeddings =
            await this.openAiService.getVectorEmbeddings(contextAsStrings);

          prayerTopicData.contextAsEmbeddings = contextAsEmbeddings;
          prayerTopicData.aggregatedEmbedding = contextAsEmbeddings;
        } catch (error) {
          console.error('Error generating embedding:', error);
        }
      }
      if (editMode === EditMode.EDIT) {
        await prayerTopicService.updatePrayerTopic(
          data.id,
          prayerTopicData as UpdatePrayerTopicDTO,
        );
        return data;
      }
      // create new prayer topic.
      const newPrayerTopicId = await prayerTopicService.createPrayerTopic(
        prayerTopicData,
        aiOptIn,
      );
      return newPrayerTopicId as unknown as PrayerTopic;
    } catch (error) {
      console.error('Error submitting prayer topic:', error);
      Alert.alert('Something went wrong', 'Please try again.');
      return undefined;
    }
  };

  /**
   * Ensures a prayer point is properly linked to a topic
   * @param prayerPoint - The prayer point to link
   * @param originPrayer - The linked prayer entity (topic) to link to
   * @param topicTitle - The title of the topic
   * @returns The prayer point with updated linkedTopics array
   */
  private ensurePrayerPointLinkedToTopic = (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    topicTitle: string,
  ): PrayerPoint => {
    const existingLinkedTopics = Array.isArray(prayerPoint.linkedTopics)
      ? prayerPoint.linkedTopics
      : [];

    const alreadyLinked = existingLinkedTopics.some(
      (topic) => topic.id === originPrayer.id,
    );

    if (!alreadyLinked) {
      return {
        ...prayerPoint,
        linkedTopics: [
          ...existingLinkedTopics,
          {
            id: originPrayer.id,
            title: topicTitle,
            entityType: EntityType.PrayerTopic,
          },
        ],
      };
    }
    return prayerPoint;
  };

  /**
   * Updates the aggregated embedding for a prayer topic via Firebase function
   * @param topicId - The ID of the topic to update the aggregated embedding for
   * @returns Promise resolving to the function call result
   */
  updateAggregatedEmbeddingForTopic = async (topicId: string) => {
    try {
      const functions = getFunctions(getApp());
      const updateAggregatedEmbeddingForTopicCallable = httpsCallable<{
        topicId: string;
      }>(functions, 'updateAggregatedEmbeddingForTopicCallable');

      console.log(
        'submitOperationsService: Updating aggregated embedding for topic:',
        topicId,
      );

      const result = await updateAggregatedEmbeddingForTopicCallable({
        topicId,
      });
      return result.data;
    } catch (err) {
      console.error('Error updating aggregated embedding for topic:', err);
      throw err;
    }
  };

  //// new methods ////

  /**
   * Submits a prayer with its associated prayer points
   * @param data - Object containing all necessary data for submission
   * @param data.user - The authenticated user submitting the prayer
   * @param data.prayer - The prayer object to submit
   * @param data.prayerPoints - Optional array of prayer points associated with the prayer
   * @param data.removedPrayerPointIds - Optional array of prayer point IDs that were removed
   * @param data.shouldPersist - Whether to persist the data to Firebase or keep it local only
   * @returns Promise resolving to prayer ID and returned prayer points with linked topics
   */
  submitPrayerWithPoints = async (data: {
    user: User;
    prayer: Prayer;
    prayerPoints?: PrayerPoint[];
    removedPrayerPointIds?: string[];
    shouldPersist: boolean;
  }) => {
    const { user, prayer, prayerPoints, removedPrayerPointIds, shouldPersist } =
      data;

    try {
      // Compose the prayer object with required fields and clean it in one step
      const prayerWithEntityType = {
        ...removeUndefinedFields(prayer),
        authorName: user.displayName ?? 'Unknown',
        authorId: user.uid,
        entityType: EntityType.Prayer,
      } as Prayer;

      // Compose and clean prayer points in a single map, avoid unnecessary type assertions
      const prayerPointsWithEntityType = prayerPoints?.map((point) => ({
        ...removeUndefinedFields(point),
        authorName: user.displayName ?? 'Unknown',
        authorId: user.uid,
        entityType: EntityType.PrayerPoint,
      })) as PrayerPoint[];

      if (shouldPersist) {
        // This returns the full result from the cloud function, not just a boolean or id.
        const result = (await callFirebaseFunction('submitPrayerWithPoints', {
          prayer: prayerWithEntityType,
          prayerPoints: prayerPointsWithEntityType,
          removedPrayerPointIds: removedPrayerPointIds,
        })) as {
          prayerId: string;
          prayerPoints: PrayerPoint[];
        };

        const { prayerId, prayerPoints: resultPrayerPoints } = result;

        const returnedPrayerPoints = resultPrayerPoints.filter(
          (point: PrayerPoint) => point.linkedTopics?.length > 0,
        );
        return { prayerId, returnedPrayerPoints };
      } else {
        // Local-only implementation that simulates the cloud function behavior
        const prayerId = prayerWithEntityType.id || blankId(EntityType.Prayer);
        const now = Timestamp.now();
        const isNew = prayerWithEntityType.isNew;

        const localPrayer: Prayer = {
          ...prayer,
          id: prayerId,
          updatedAt: now,
          ...(isNew && {
            authorId: user.uid,
            createdAt: now,
            authorName: user.displayName ?? 'Unknown',
          }),
          prayerPoints: prayerPointsWithEntityType,
        };

        // Create local prayer points with proper IDs and timestamps
        const localPrayerPoints: PrayerPoint[] = (
          prayerPointsWithEntityType || []
        ).map((point) => {
          const isNew = point.isNew;
          return {
            ...point,
            id: point.id || blankId(EntityType.PrayerPoint),
            prayerId: prayerId,
            createdAt: point.createdAt || now,
            ...(isNew && {
              authorId: user.uid,
              createdAt: now,
              authorName: user.displayName ?? 'Unknown',
            }),
            updatedAt: now,
            entityType: EntityType.PrayerPoint,
          } as PrayerPoint;
        });

        // Filter prayer points that have linked topics
        const returnedPrayerPoints = localPrayerPoints.filter(
          (point: PrayerPoint) => point.linkedTopics?.length > 0,
        );

        return {
          localPrayer,
          returnedPrayerPoints,
        };
      }
    } catch (err) {
      console.error('submitPrayerWithPoints failed:', err);
      // Optionally: Rethrow or return fallback
      throw err;
    }
  };

  /**
   * Updates the topic links for a prayer point
   * @param data - Object containing the update parameters
   * @param data.point - The prayer point to update topic links for
   * @param data.addTopicIds - Array of topic IDs to add to the prayer point
   * @param data.shouldPersist - Whether to persist changes to Firebase or keep local only
   * @returns Promise resolving to the update result with success status and updated data
   */
  updatePrayerPointTopicLinks = async (data: {
    point: PrayerPoint;
    addTopicIds: string[];
    removeTopicIds: string[];
    shouldPersist?: boolean;
  }) => {
    const { point, addTopicIds, removeTopicIds, shouldPersist } = data;

    try {
      if (shouldPersist) {
        return await callFirebaseFunction('updatePrayerPointTopicLinks', {
          point: point,
          addTopicIds: addTopicIds,
          removeTopicIds: removeTopicIds,
        });
      } else {
        // Local-only implementation that simulates the cloud function behavior
        const now = Timestamp.now();
        const updateLinkedTopics =
          localUpdateArrayFieldAddRemove('linkedTopics');

        const updatedLinkedTopics = updateLinkedTopics(
          point.linkedTopics,
          addTopicIds,
          removeTopicIds,
        );

        const updatedPoint = {
          ...point,
          linkedTopics: updatedLinkedTopics,
          updatedAt: now,
        };

        // Create journey entries for each topic that's being added
        const journeyEntries = addTopicIds.map(() => ({
          id: point.id,
          prayerType: point.prayerType,
          createdAt: point.createdAt || now,
        }));

        return {
          success: true,
          pointId: point.id,
          addedTopicIds: addTopicIds,
          removeTopicIds,
          updatedPoint,
          journeyEntries,
        };
      }
    } catch (err) {
      console.error('updatePrayerPointTopicLinks failed:', err);
      // Optionally: Rethrow or return fallback
      throw err;
    }
  };
}

export const submitOperationsService = new SubmitOperationsService();
