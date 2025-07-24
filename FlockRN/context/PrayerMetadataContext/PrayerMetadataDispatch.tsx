import { Alert } from 'react-native';
import { auth } from '@/firebase/firebaseConfig';
import { prayerService } from '@/services/prayer/prayerService';

import {
  Prayer,
  PrayerPoint,
  LinkedPrayerPointPair,
  SimilarPrayersPair,
} from '@shared/types/firebaseTypes';
import { EditMode } from '@/types/ComponentProps';
import { EntityType } from '@/types/PrayerSubtypes';
import { User } from 'firebase/auth';
import { PrayerMetadataAction } from './PrayerMetadataReducer';
import { prayerPointService } from '@/services/prayer/prayerPointService';
import { blankId } from '@/types/blankStateModels';

export interface PrayerMetadataDispatch {
  handlePrayerUpdate: (data: Partial<Prayer>) => void;
  handlePrayerPointUpdate: (id: string, data: Partial<PrayerPoint>) => void;
  setEditMode: (mode: EditMode) => void;
  setAllPrayerPoints: (pp: PrayerPoint[]) => void;
  removePrayerPointLocally: (id: string) => void;
  toggleLinkedPrayerPair: (
    newPair: LinkedPrayerPointPair,
    existingLinkedPairs: LinkedPrayerPointPair[],
  ) => void;
  setAllSimilarPrayers: (data: SimilarPrayersPair[]) => void;
  loadPrayer: (id: string) => Promise<Prayer | null>;
  deletePrayer: (
    prayer: Prayer,
    onSuccess: () => void,
    onFailure?: () => void,
  ) => Promise<void>;
  getPrayerPointsById: (ids: string[]) => Promise<void>;
}

export const prayerMetadataDispatch = (
  dispatch: React.Dispatch<PrayerMetadataAction>,
  user: User,
  userPrayers: Prayer[],
  userPrayerPoints: PrayerPoint[],
): PrayerMetadataDispatch => {
  const handlePrayerUpdate = (data: Partial<Prayer>) => {
    dispatch({
      type: 'UPDATE_PRAYER',
      payload: data,
    });
  };

  const handlePrayerPointUpdate = (id: string, data: Partial<PrayerPoint>) => {
    dispatch({
      type: 'UPDATE_PRAYER_POINT',
      payload: {
        id,
        data: { ...data },
      },
    });
  };

  const removePrayerPointLocally = (id: string) => {
    dispatch({
      type: 'REMOVE_PRAYER_POINT_LOCALLY',
      payload: {
        id,
      },
    });
  };

  const loadPrayer = async (id: string): Promise<Prayer | null> => {
    const contextPrayer = userPrayers.find((p) => p.id === id);
    if (contextPrayer) {
      dispatch({ type: 'SET_PRAYER', payload: { ...contextPrayer } });
      return contextPrayer;
    }
    try {
      const fetchedPrayer = await prayerService.getPrayer(id);
      if (fetchedPrayer) {
        dispatch({ type: 'SET_PRAYER', payload: { ...fetchedPrayer } });
        return fetchedPrayer;
      }
    } catch (error) {
      console.error('Error fetching prayer:', error);
      return null;
    }
    return null;
  };

  const getPrayerPointsById = async (ids: string[]) => {
    // If all ids are found in context, return them. Otherwise, fetch missing ones.
    const foundPrayerPoints = ids
      .map((id) => userPrayerPoints.find((p) => p.id === id))
      .filter((p) => p !== undefined) as PrayerPoint[];

    const missingIds = ids.filter(
      (id) => !userPrayerPoints.some((p) => p.id === id),
    );

    let fetchedPrayerPoints: PrayerPoint[] = [];
    if (missingIds.length > 0) {
      fetchedPrayerPoints =
        await prayerPointService.getPrayerPointsByPrayerId(missingIds);
    }

    const allPrayerPoints = [...foundPrayerPoints, ...fetchedPrayerPoints];

    dispatch({ type: 'SET_PRAYER_POINTS', payload: allPrayerPoints });
  };

  const deletePrayer = async (
    prayer: Prayer,
    onSuccess: () => void,
    onFailure?: () => void,
  ) => {
    const userId = auth.currentUser?.uid;
    if (!prayer.id || !userId) {
      Alert.alert('Error', 'Cannot delete prayer');
      onFailure?.();
      return;
    }

    try {
      await prayerService.deletePrayer(prayer, userId);
      onSuccess();
    } catch (error) {
      console.error('Error deleting prayer:', error);
      Alert.alert('Error', 'Failed to delete prayer. Please try again.');
      onFailure?.();
    }
  };

  const toggleLinkedPrayerPair = (
    newPair: LinkedPrayerPointPair,
    existingLinkedPairs: LinkedPrayerPointPair[],
  ) => {
    const exists = existingLinkedPairs.some(
      (p) =>
        p.originPrayer?.id === newPair.originPrayer?.id &&
        p.prayerPoint.id === newPair.prayerPoint.id &&
        p.topicTitle === newPair.topicTitle,
    );

    let topicId: string;
    if (newPair.originPrayer?.entityType == EntityType.PrayerPoint) {
      topicId = blankId(EntityType.PrayerTopic);
    } else {
      topicId = newPair.originPrayer?.id ?? blankId(EntityType.PrayerTopic);
    }

    if (exists) {
      dispatch({
        type: 'REMOVE_TOPIC_LINK',
        payload: {
          topicId: topicId,
          prayerPoint: newPair.prayerPoint,
        },
      });
    } else {
      dispatch({
        type: 'ADD_TOPIC_LINK',
        payload: {
          topicId: topicId,
          title: newPair.topicTitle ?? newPair.originPrayer?.title ?? 'unknown',
          prayerPoint: newPair.prayerPoint,
        },
      });
    }
  };

  const setAllSimilarPrayers = (data: SimilarPrayersPair[]) => {
    dispatch({ type: 'SET_SIMILAR_PRAYERS', payload: data });
  };

  const setAllPrayerPoints = (data: PrayerPoint[]) => {
    dispatch({ type: 'SET_PRAYER_POINTS', payload: data });
  };

  const setEditMode = (mode: EditMode) => {
    dispatch({ type: 'SET_EDIT_MODE', payload: mode });
  };

  return {
    setAllPrayerPoints,
    toggleLinkedPrayerPair,
    setEditMode,
    loadPrayer,
    deletePrayer,
    handlePrayerUpdate,
    handlePrayerPointUpdate,
    setAllSimilarPrayers,
    removePrayerPointLocally,
    getPrayerPointsById,
  };
};
