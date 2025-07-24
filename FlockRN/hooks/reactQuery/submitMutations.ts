// FULL MUTATIONS

import { Prayer, PrayerPoint } from '@shared/types/firebaseTypes';
import { User } from 'firebase/auth';
import {
  useCreatePrayerPoint,
  useCreatePrayerWithPoints,
  useDeletePrayerPoint,
  useUpdatePrayerPoint,
  useUpdatePrayerTopic,
} from './prayerMutations';
import { getRemovedTopicIds } from '@/utils/update/docUpdates/arrayUtils';
import { endSessionViaSync } from '@/services/analytics/sessionUtils';

export const useSubmitPrayerWithPoints = () => {
  const createOrUpdatePrayer = useCreatePrayerWithPoints();
  const updateLinks = useUpdatePrayerTopic();

  const submit = async (
    user: User,
    prayer: Prayer,
    prayerPoints?: PrayerPoint[],
    removedPrayerPointIds?: string[],
  ): Promise<{
    success: boolean;
    prayerId?: string;
    prayerPoints?: PrayerPoint[];
  }> => {
    try {
      const { prayerId, returnedPrayerPoints } =
        await createOrUpdatePrayer.mutateAsync({
          user: user,
          prayer: prayer,
          prayerPoints: prayerPoints,
          removedPrayerPointIds: removedPrayerPointIds || [],
        });

      const removeTopicIds = getRemovedTopicIds(
        prayerPoints?.map((point) => point.id) || [],
        returnedPrayerPoints.map((point) => point.id) || [],
      );

      console.log('removeTopicIds', removeTopicIds);
      console.log('returnedPrayerPoints', returnedPrayerPoints);

      // updatedPrayer has the new prayer point id. prayerPointsWithEntityType has the linked topic.
      if (returnedPrayerPoints.length > 0) {
        await Promise.all(
          returnedPrayerPoints.map((point: PrayerPoint) =>
            updateLinks.mutateAsync({
              point: point as PrayerPoint,
              addTopicIds: point.linkedTopics as string[],
              removeTopicIds: removeTopicIds,
            }),
          ),
        );
      }

      if (!prayerId) throw new Error('Failed to create prayer');

      endSessionViaSync();

      return { success: true, prayerId, prayerPoints: returnedPrayerPoints };
    } catch (error) {
      console.error('submitPrayerWithPoints failed:', error);
      return { success: false };
    }
  };

  return {
    submit,
    isSubmitting: createOrUpdatePrayer.isPending || updateLinks.isPending,
    isSuccess: createOrUpdatePrayer.isSuccess,
    isError: createOrUpdatePrayer.isError,
    error: createOrUpdatePrayer.error,
  };
};

// === PRAYER POINTS ===
export const useSubmitPrayerPointAndLinkToTopics = () => {
  const updateLinks = useUpdatePrayerTopic();
  const createPoint = useCreatePrayerPoint();
  const updatePoint = useUpdatePrayerPoint();
  const deletePoint = useDeletePrayerPoint();

  const submitPoint = async (data: {
    point: PrayerPoint;
    action: 'create' | 'update' | 'delete';
  }) => {
    let result: PrayerPoint | undefined;
    if (data.action === 'create') {
      const createResult = (await createPoint.mutateAsync({
        point: data.point,
      })) as {
        success: boolean;
        updatedPoint: PrayerPoint;
      };
      result = createResult.updatedPoint;
    } else if (data.action === 'update') {
      result = await updatePoint.mutateAsync({
        point: data.point,
      });
    } else if (data.action === 'delete') {
      await deletePoint.mutateAsync(data.point.id);
      await updateLinks.mutateAsync({
        point: result as PrayerPoint,
        addTopicIds: [],
        removeTopicIds: data.point.linkedTopics as string[],
      });
    }

    if (result) {
      await updateLinks.mutateAsync({
        point: data.point as PrayerPoint,
        addTopicIds: data.point.linkedTopics as string[],
        removeTopicIds: [],
      });
    }

    return result;
  };

  return { submitPoint };
};
