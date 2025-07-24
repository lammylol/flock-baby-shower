// reactQuery/prayerMutations.ts
// This file contains the mutations for the prayer data.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/firebase/firebaseConfig';
import { doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';

// Types
import {
  Prayer,
  PrayerPoint,
  PrayerPointInTopicJourneyDTO,
  PrayerTopic,
} from '@shared/types/firebaseTypes';
import { useSyncStore } from '@/hooks/zustand/syncSlice/syncStore';
import { usePrayerStore } from '@/hooks/zustand/prayerSlice/prayerStore';
import { User } from 'firebase/auth';
import { submitOperationsService } from '@/services/prayer/submitOperationsService';
import {
  getRemovedTopicIds,
  localUpdateArrayFieldAddRemove,
} from '@/utils/update/docUpdates/arrayUtils';
import { callFirebaseFunction } from '@/utils/update/firebaseUtils';
import { uploadFile } from '@/services/recording/firebaseStorageService';
import * as FileSystem from 'expo-file-system';

// COMPLEX OPERATIONS
export const useCreatePrayerWithPoints = () => {
  const queryClient = useQueryClient();
  const addPendingAction = useSyncStore((s) => s.addPendingAction);
  const { updateCollection, removeFromCollection } = usePrayerStore();

  const applyLocalUpdates = (
    prayer: Prayer | undefined,
    prayerPoints: PrayerPoint[] = [],
    removedIds: string[] = [],
  ) => {
    if (prayer) {
      updateCollection(prayer, 'prayer');
    }
    prayerPoints.forEach((point) => {
      updateCollection(point, 'prayerPoint');
    });
    removedIds.forEach((id) => {
      removeFromCollection(id, 'prayerPoint');
    });
  };

  return useMutation({
    mutationFn: async (data: {
      user: User;
      prayer: Prayer;
      prayerPoints?: PrayerPoint[];
      removedPrayerPointIds?: string[];
    }) => {
      return await submitOperationsService.submitPrayerWithPoints({
        ...data,
        shouldPersist: true,
      });
    },

    onMutate: async (data) => {
      const result = await submitOperationsService.submitPrayerWithPoints({
        ...data,
        shouldPersist: false,
      });

      console.log('🔊 submitPrayerWithPoints result:', result);

      applyLocalUpdates(
        result?.localPrayer,
        result?.returnedPrayerPoints ?? [],
        data.removedPrayerPointIds ?? [],
      );

      queryClient.invalidateQueries({ queryKey: ['prayers'] });

      return result;
    },

    onSuccess: (result, data) => {
      applyLocalUpdates(
        result?.localPrayer,
        result?.returnedPrayerPoints ?? [],
        data.removedPrayerPointIds ?? [],
      );

      queryClient.invalidateQueries({ queryKey: ['prayers'] });
    },

    onError: (err, variables) => {
      console.error('submitPrayerWithPoints failed:', err);
      addPendingAction({
        id: variables.prayer.id,
        type: 'submitPrayerWithPoints',
        payload: variables,
      });
    },
  });
};

export const useUpdatePrayerTopic = () => {
  const queryClient = useQueryClient();
  const addPendingAction = useSyncStore((s) => s.addPendingAction);
  const { updatePrayerPoint, updateTopic, topics } = usePrayerStore();

  const applyLocalUpdates = (
    point: PrayerPoint,
    addTopicIds: string[],
    removedTopicIds: string[] = [],
  ) => {
    // Update the prayer point
    updatePrayerPoint(point.id, {
      linkedTopics: addTopicIds,
      updatedAt: point.updatedAt,
    });

    const journeyEntry = {
      id: point.id,
      createdAt: point.updatedAt,
      entityType: 'prayerPoint',
    };

    // Update each topic's journey - ADD new prayer points
    addTopicIds.forEach((topicId) => {
      const topic = topics.find((t) => t.id === topicId);
      if (topic) {
        const updateJourney = localUpdateArrayFieldAddRemove('journey');
        const existingJourney = Array.isArray(topic.journey)
          ? topic.journey
          : [];
        const newJourney = updateJourney(
          { journey: existingJourney },
          [journeyEntry],
          [],
        );
        updateTopic(topicId, {
          journey: newJourney,
          updatedAt: new Date(),
        });
      }
    });

    // Update each topic's journey - REMOVE prayer points
    removedTopicIds.forEach((topicId) => {
      const topic = topics.find((t) => t.id === topicId);
      if (topic) {
        const updateJourney = localUpdateArrayFieldAddRemove('journey');
        const existingJourney = Array.isArray(topic.journey)
          ? topic.journey
          : [];
        const newJourney = updateJourney(
          { journey: existingJourney },
          [],
          [{ id: point.id }], // Remove by ID as object
        );
        updateTopic(topicId, {
          journey: newJourney,
          updatedAt: new Date(),
        });
      }
    });
  };

  return useMutation({
    mutationFn: async (data: {
      point: PrayerPoint;
      addTopicIds: string[];
      removeTopicIds: string[];
    }) => {
      const result = (await submitOperationsService.updatePrayerPointTopicLinks(
        {
          ...data,
          shouldPersist: true,
        },
      )) as {
        success: boolean;
        pointId: string;
        addedTopicIds: string[];
        removedTopicIds: string[];
        updatedPoint: PrayerPoint;
        journeyEntries: PrayerPointInTopicJourneyDTO[];
      };

      return result;
    },
    onSuccess: (result) => {
      if (result.updatedPoint) {
        applyLocalUpdates(
          result.updatedPoint,
          result.addedTopicIds,
          result.removedTopicIds,
        );
      }
      queryClient.invalidateQueries({ queryKey: ['prayerTopics'] });
    },
    onMutate: async (data: { point: PrayerPoint; addTopicIds: string[] }) => {
      const { point, addTopicIds } = data;
      const removeTopicIds = getRemovedTopicIds(
        Array.isArray(point.linkedTopics) ? point.linkedTopics : [],
        addTopicIds,
      ) as string[];
      const now = Timestamp.now();
      const localPoint = {
        ...point,
        updatedAt: now,
        createdAt: point.createdAt || now,
      };

      applyLocalUpdates(localPoint, addTopicIds, removeTopicIds);

      return { localPoint };
    },
    onError: (err, variables) => {
      console.error('updatePrayerPointTopicLinks failed:', err);
      addPendingAction({
        id: variables.point.id,
        type: 'updatePrayerPointTopicLinks',
        payload: variables,
      });
    },
  });
};

// SIMPLE OPERATIONS
export const useUpdatePrayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prayer: Prayer) => {
      const ref = doc(db, 'prayers', prayer.id);
      await setDoc(ref, prayer, { merge: true });
      return prayer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
    },
  });
};

export const useDeletePrayer = () => {
  return useMutation({
    mutationFn: async (prayerId: string) => {
      const ref = doc(db, 'prayers', prayerId);
      await deleteDoc(ref);
      return prayerId;
    },
  });
};

// === PRAYER POINTS ===
export const useCreatePrayerPoint = () => {
  const queryClient = useQueryClient();
  const { addPrayerPoint } = usePrayerStore();
  const addPendingAction = useSyncStore((s) => s.addPendingAction);

  const applyLocalUpdates = (point: PrayerPoint) => {
    addPrayerPoint({
      ...point,
      linkedTopics: point.linkedTopics,
      updatedAt: point.updatedAt,
    });
  };

  return useMutation({
    mutationFn: async (data: { point: PrayerPoint }) => {
      const result = (await callFirebaseFunction('submitPrayerPointWithLink', {
        point: data.point,
      })) as {
        success: boolean;
        updatedPoint: PrayerPoint;
      };

      return result;
    },
    onSuccess: (result) => {
      applyLocalUpdates(result.updatedPoint);
      queryClient.invalidateQueries({ queryKey: ['prayerPoints'] });
    },
    onMutate: async (data) => {
      const now = Timestamp.now();
      const localPoint = {
        ...data.point,
        updatedAt: now,
        createdAt: data.point.createdAt || now,
      };
      applyLocalUpdates(localPoint);
    },
    onError: (err, variables) => {
      console.error('submitPrayerPoint failed:', err);
      addPendingAction({
        id: variables.point.id,
        type: 'submitPrayerPointWithLink',
        payload: variables,
      });
    },
  });
};

export const useUpdatePrayerPoint = () => {
  const queryClient = useQueryClient();
  const { updatePrayerPoint } = usePrayerStore();
  const addPendingAction = useSyncStore((s) => s.addPendingAction);
  const applyLocalUpdates = (point: PrayerPoint) => {
    updatePrayerPoint(point.id, {
      linkedTopics: point.linkedTopics,
      updatedAt: point.updatedAt,
    });
  };

  return useMutation({
    mutationFn: async (data: { point: PrayerPoint }) => {
      const result = (await callFirebaseFunction('submitPrayerPointWithLink', {
        point: data.point,
      })) as PrayerPoint;

      return result;
    },
    onSuccess: (result) => {
      applyLocalUpdates(result);
      queryClient.invalidateQueries({ queryKey: ['prayerPoints'] });
    },
    onMutate: async (data) => {
      applyLocalUpdates(data.point);
    },
    onError: (err, variables) => {
      console.error('submitPrayerPoint failed:', err);
      addPendingAction({
        id: variables.point.id,
        type: 'submitPrayerPointWithLink',
        payload: variables,
      });
    },
  });
};

export const useDeletePrayerPoint = () => {
  const queryClient = useQueryClient();
  const { removePrayerPoint } = usePrayerStore();
  const addPendingAction = useSyncStore((s) => s.addPendingAction);

  const applyLocalUpdates = (pointId: string) => {
    removePrayerPoint(pointId);
  };

  return useMutation({
    mutationFn: async (pointId: string) => {
      await callFirebaseFunction('deletePrayerPoint', { pointId });
      return pointId;
    },
    onSuccess: (pointId) => {
      applyLocalUpdates(pointId);
      queryClient.invalidateQueries({ queryKey: ['prayerPoints'] });
    },
    onMutate: async (pointId) => {
      applyLocalUpdates(pointId);
    },
    onError: (err, variables) => {
      console.error('deletePrayerPoint failed:', err);
      addPendingAction({
        id: variables,
        type: 'deleteEntity',
        payload: { entityType: 'prayerPoint', entityId: variables },
      });
    },
  });
};

// === PRAYER TOPICS ===
export const useCreatePrayerTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (topic: PrayerTopic) => {
      const ref = doc(db, 'prayerTopics', topic.id);
      await setDoc(ref, topic, { merge: true });
      return topic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerTopics'] });
    },
  });
};

export const useDeletePrayerTopic = () => {
  return useMutation({
    mutationFn: async (topicId: string) => {
      const ref = doc(db, 'prayerTopics', topicId);
      await deleteDoc(ref);
      return topicId;
    },
  });
};

// === PRAYER AUDIO ===
export const useUploadPrayerAudio = () => {
  const addPendingAction = useSyncStore((s) => s.addPendingAction);

  return useMutation({
    mutationFn: async (data: {
      prayer: Prayer;
      user: User;
      filePath: string;
    }) => {
      const { prayer, user, filePath } = data;
      const fileName = prayer.audioLocalPath?.split('/').pop();
      // Use the audioRemotePath if available, otherwise construct the path
      const storagePath =
        prayer.audioRemotePath || `users/${user.uid}/prayers/${fileName}`;
      const audioUrl = await uploadFile(filePath, storagePath);
      return audioUrl;
    },
    onSuccess: (result) => {
      console.log('Uploaded prayer audio result:', result);
    },
    onError: (err, data) => {
      const fileName = data.prayer.audioLocalPath?.split('/').pop();
      if (!fileName) {
        throw new Error('File name is required to upload audio');
      }
      const newFilePath = FileSystem.documentDirectory + fileName;
      // this is mandatory to reassign the filePath to the newFilePath if the upload fails and session is restarted.

      addPendingAction({
        id: data.prayer.id,
        type: 'uploadPrayerAudio',
        payload: {
          ...data,
          filePath: newFilePath, // ✅ reassign if necessary
        },
      });
      console.error('Upload prayer audio error:', err);
    },
  });
};

export const useDeletePrayerAudio = () => {
  const addPendingAction = useSyncStore((s) => s.addPendingAction);

  return useMutation({
    mutationFn: async (prayerId: string) => {
      const ref = doc(db, 'prayers', prayerId);
      await deleteDoc(ref);
      return prayerId;
    },
    onSuccess: (result) => {
      console.log('Deleted prayer audio result:', result);
    },
    onError: (err, prayerId) => {
      addPendingAction({
        id: prayerId,
        type: 'deletePrayerAudio',
        payload: prayerId,
      });
      console.error('Delete prayer audio error:', err);
    },
  });
};
