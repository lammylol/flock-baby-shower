import { prayerPointService } from '@/services/prayer/prayerPointService';
import {
  Prayer,
  PrayerPoint,
  LinkedPrayerPointPair,
  SimilarPrayersPair,
} from '@shared/types/firebaseTypes';
import { EntityType } from '@/types/PrayerSubtypes';
import { blankId, blankPrayerPoint } from '@/types/blankStateModels';
import { PrayerPointAction } from './PrayerPointReducer';
import { User } from 'firebase/auth';

export interface PrayerPointDispatch {
  // ==== LOCAL STATE ===
  handlePrayerPointUpdate: (id: string, data: Partial<Prayer>) => void;
  reset: () => void;
  // prayers
  setPrayerPoint: (p: PrayerPoint) => void;
  // prayer points
  loadPrayerPoint: (id: string) => Promise<void>;
  setAllPrayerPoints: (pp: PrayerPoint[]) => void;
  setBlankPrayerPoint: (id: string) => void;
  setAllLinkedPrayerPairs: (data: LinkedPrayerPointPair[]) => void;
  toggleLinkedPrayerPair: (
    newPair: LinkedPrayerPointPair,
    existingLinkedPairs: LinkedPrayerPointPair[],
  ) => void;
  setAllSimilarPrayers: (data: SimilarPrayersPair[]) => void;
  addSimilarPrayersPair: (data: SimilarPrayersPair) => void;
  updateSimilarPrayersPair: (data: SimilarPrayersPair) => void;
  setIsAlreadyLoaded: (isLoaded: boolean) => void;
  getPrayerPointById: (id: string) => PrayerPoint;
}

export const prayerPointDispatch = (
  dispatch: React.Dispatch<PrayerPointAction>,
  user: User,
  userPrayerPoints: PrayerPoint[],
): PrayerPointDispatch => {
  // Handle prayer updates
  const setPrayerPoint = (p: PrayerPoint) => {
    dispatch({
      type: 'SET_PRAYER_POINT',
      payload: { ...p, entityType: EntityType.PrayerPoint },
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

  // Load a prayer point, either from the local context or Firebase
  const loadPrayerPoint = async (id: string) => {
    const contextPrayerPoint = userPrayerPoints.find((p) => p.id === id);
    if (contextPrayerPoint) {
      dispatch({
        type: 'UPDATE_PRAYER_POINT',
        payload: { id, data: { ...contextPrayerPoint } },
      });
      return;
    }
    try {
      const fetchedPrayerPoint = await prayerPointService.getPrayerPoint(id);
      if (fetchedPrayerPoint) {
        dispatch({
          type: 'UPDATE_PRAYER_POINT',
          payload: { id, data: { ...fetchedPrayerPoint } },
        });
      }
    } catch (error) {
      console.error('Error fetching prayer point:', error);
    }
  };

  // Set all prayer points at once
  const setAllPrayerPoints = (pp: PrayerPoint[]) => {
    dispatch({
      type: 'SET_PRAYER_POINTS',
      payload: pp,
    });
  };

  // Set a blank prayer point for creating new points
  const setBlankPrayerPoint = (id: string) => {
    dispatch({
      type: 'ADD_BLANK_PRAYER_POINT',
      payload: { user, id },
    });
  };

  // Set all linked prayer pairs
  const setAllLinkedPrayerPairs = (data: LinkedPrayerPointPair[]) => {
    dispatch({
      type: 'SET_LINKED_PAIRS',
      payload: data,
    });
  };

  const toggleLinkedPrayerPair = (
    newPair: LinkedPrayerPointPair,
    existingLinkedPairs: LinkedPrayerPointPair[],
  ) => {
    // Check if the prayer point already exists in the linked pairs
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
      console.log('Removing linked prayer pair:', newPair);
      dispatch({ type: 'REMOVE_LINKED_PAIR', payload: newPair });
      dispatch({
        type: 'REMOVE_TOPIC_LINK',
        payload: {
          topicId: topicId,
          title: newPair.topicTitle ?? newPair.originPrayer?.title ?? 'unknown',
        },
      });
    } else {
      console.log('Adding linked prayer pair:', newPair);
      dispatch({
        type: 'ADD_LINKED_PAIR',
        payload: {
          ...newPair,
          topicId: topicId, // useful for removing topics later.
        },
      });
      console.log('Adding topic link:', {
        topicId: topicId,
        title: newPair.topicTitle ?? newPair.originPrayer?.title ?? 'unknown',
      });
      dispatch({
        type: 'ADD_TOPIC_LINK',
        payload: {
          topicId: topicId,
          title: newPair.topicTitle ?? newPair.originPrayer?.title ?? 'unknown',
        },
      });
    }
  };

  // Set similar prayers for a prayer point
  const setAllSimilarPrayers = (data: SimilarPrayersPair[]) => {
    dispatch({
      type: 'SET_SIMILAR_PRAYERS',
      payload: data,
    });
  };

  const addSimilarPrayersPair = (data: SimilarPrayersPair) => {
    dispatch({
      type: 'ADD_SIMILAR_PRAYERS',
      payload: data,
    });
  };

  const updateSimilarPrayersPair = (data: SimilarPrayersPair) => {
    dispatch({
      type: 'UPDATE_SIMILAR_PRAYERS',
      payload: data,
    });
  };

  // Set loading state for prayer point
  const setIsAlreadyLoaded = (isLoaded: boolean) => {
    dispatch({
      type: 'SET_IS_ALREADY_LOADED',
      payload: isLoaded,
    });
  };

  const reset = () => {
    dispatch({ type: 'RESET', payload: user });
  };

  // Fetch prayer point by ID (already present in local state)
  const getPrayerPointById = (id: string): PrayerPoint => {
    return (
      userPrayerPoints.find((p) => p.id === id) || blankPrayerPoint(user, id)
    );
  };

  return {
    handlePrayerPointUpdate,
    reset,
    setPrayerPoint,
    loadPrayerPoint,
    setAllPrayerPoints,
    setBlankPrayerPoint,
    setAllLinkedPrayerPairs,
    toggleLinkedPrayerPair,
    setAllSimilarPrayers,
    addSimilarPrayersPair,
    updateSimilarPrayersPair,
    setIsAlreadyLoaded,
    getPrayerPointById,
  };
};
