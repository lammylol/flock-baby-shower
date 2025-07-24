// hooks/prayerScreens/usePrayerLinking.ts
import {
  LinkedPrayerEntity,
  PrayerPoint,
  LinkedPrayerPointPair,
} from '@shared/types/firebaseTypes';
import { PrayerContextType } from '@/types/ComponentProps';
import {
  useDynamicPrayerDispatch,
  useDynamicPrayerState,
} from '@/context/useDynamicPrayerContext';
import { User } from 'firebase/auth';
import { NavigationUtils } from '@/utils/navigation';

export function usePrayerLinking(
  prayerPointEditMode: PrayerContextType,
  user: User,
) {
  const { toggleLinkedPrayerPair } =
    useDynamicPrayerDispatch(prayerPointEditMode);
  const { linkedPrayerPairs } = useDynamicPrayerState(
    prayerPointEditMode,
    user,
  );

  // This function is passed to the PrayerPointLinking component
  // and is called when the user selects a prayer point or topic to link to.
  // It updates the selected prayer and the prayer topic DTO.
  const handlePrayerLinkingOnChange = (
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
    prayerPointEditMode: PrayerContextType,
    title?: string,
  ) => {
    const linkedPrayerPair = {
      prayerPoint: prayerPoint,
      originPrayer: selectedPrayer,
      topicTitle: title ?? selectedPrayer?.title,
    } as LinkedPrayerPointPair;
    toggleLinkedPrayerPair(linkedPrayerPair, linkedPrayerPairs);

    if (prayerPointEditMode === PrayerContextType.EDITFROMPRAYER) {
      NavigationUtils.back();
    }
  };

  return {
    handlePrayerLinkingOnChange,
  };
}
