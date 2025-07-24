// This file is used to dynamically extract the prayer state and dispatch based on the context type.
// Prayer Entity can be sourced from either PrayerMetadata -> Prayer Points -> individual prayer point,
// or via edit screen from prayer point view, or create a new prayer point.
import {
  usePrayerMetadataDispatch,
  usePrayerMetadataState,
} from '@/context/PrayerMetadataContext/PrayerMetadataContext';

import {
  usePrayerPointDispatch,
  usePrayerPointState,
} from '@/context/PrayerPointContext/PrayerPointContext';
import { PrayerContextType } from '@/types/ComponentProps';
import { PrayerMetadataState } from './PrayerMetadataContext/PrayerMetadataReducer';
import { PrayerPointState } from './PrayerPointContext/PrayerPointReducer';
import { PrayerMetadataDispatch } from './PrayerMetadataContext/PrayerMetadataDispatch';
import { PrayerPointDispatch } from './PrayerPointContext/PrayerPointDispatch';
import { PrayerPoint } from '@shared/types/firebaseTypes';
import { User } from 'firebase/auth';

export function useDynamicPrayerState(
  contextType: PrayerContextType,
  user: User,
  id?: string,
) {
  const prayerMetadataState = usePrayerMetadataState();
  const prayerPointState = usePrayerPointState();

  const state =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? prayerMetadataState
      : prayerPointState;

  // Dynamically extract common actions
  const prayerPoint =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? ((state as PrayerMetadataState).prayerPoints.find(
          (p) => p.id === id,
        ) as PrayerPoint)
      : ((state as PrayerPointState).prayerPoint as PrayerPoint);

  // Dynamically extract common actions
  const linkedPrayerPairs =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? (state as PrayerMetadataState).linkedPrayerPairs.filter(
          (p) => p.prayerPoint.id === id,
        )
      : (state as PrayerPointState).linkedPrayerPairs.filter(
          (p) => p.prayerPoint.id === prayerPoint?.id,
        );

  const similarPrayerPairs =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? (state as PrayerMetadataState).similarPrayerPairs.filter(
          (p) => p.prayerPoint.id === id,
        )
      : (state as PrayerPointState).similarPrayers.filter(
          (p) => p.prayerPoint.id === prayerPoint?.id,
        );

  return {
    state,
    prayerPoint,
    linkedPrayerPairs,
    similarPrayerPairs,
  };
}

export function useDynamicPrayerDispatch(contextType: PrayerContextType) {
  const prayerMetadataDispatch = usePrayerMetadataDispatch();
  const prayerPointDispatch = usePrayerPointDispatch();

  const dispatch =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? prayerMetadataDispatch
      : prayerPointDispatch;

  // Dynamically extract common actions
  const load = (id: string) =>
    contextType === PrayerContextType.EDITFROMPRAYER
      ? (dispatch as PrayerMetadataDispatch).loadPrayer(id)
      : (dispatch as PrayerPointDispatch).loadPrayerPoint(id);
  const handlePrayerUpdate =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? (dispatch as PrayerMetadataDispatch).handlePrayerUpdate
      : (dispatch as PrayerPointDispatch).handlePrayerPointUpdate;
  const handlePrayerPointUpdate =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? (dispatch as PrayerMetadataDispatch).handlePrayerPointUpdate
      : (dispatch as PrayerPointDispatch).handlePrayerPointUpdate;
  const reset =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? (dispatch as PrayerMetadataDispatch).reset
      : (dispatch as PrayerPointDispatch).reset;
  const toggleLinkedPrayerPair =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? (dispatch as PrayerMetadataDispatch).toggleLinkedPrayerPair
      : (dispatch as PrayerPointDispatch).toggleLinkedPrayerPair;
  const handleBatchSimilarPrayers =
    contextType === PrayerContextType.EDITFROMPRAYER
      ? (dispatch as PrayerMetadataDispatch).setAllSimilarPrayers
      : (dispatch as PrayerPointDispatch).setAllSimilarPrayers;
  const removePrayerPointLocally = (dispatch as PrayerMetadataDispatch)
    .removePrayerPointLocally; // only applicable to prayerMetadataDispatch

  return {
    dispatch,
    load,
    handlePrayerUpdate,
    handlePrayerPointUpdate,
    reset,
    toggleLinkedPrayerPair,
    handleBatchSimilarPrayers,
    removePrayerPointLocally,
  };
}
