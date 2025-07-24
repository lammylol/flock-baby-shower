import { useCallback, useEffect } from 'react';
import OpenAiService from '@/services/ai/openAIService';
import { auth } from '@/firebase/firebaseConfig';
import {
  PartialLinkedPrayerEntity,
  SimilarPrayersPair,
} from '@shared/types/firebaseTypes';
import { PrayerContextType } from '@/types/ComponentProps';
import { Timestamp } from 'firebase/firestore';
import { getDateString } from '@/utils/dateUtils';
import {
  useDynamicPrayerDispatch,
  useDynamicPrayerState,
} from '@/context/useDynamicPrayerContext';
import { similarPrayersService } from '@/services/prayer/similarPrayersService';

export function useSimilarPrayers(
  prayerPointEditMode: PrayerContextType,
  id?: string,
) {
  const openAiService = OpenAiService.getInstance();
  const user = auth.currentUser;
  const { handlePrayerPointUpdate, handleBatchSimilarPrayers } =
    useDynamicPrayerDispatch(prayerPointEditMode);
  const { prayerPoint, similarPrayerPairs } = useDynamicPrayerState(
    prayerPointEditMode,
    id,
  );

  const similarPrayers = similarPrayerPairs
    .filter((pair) => pair.prayerPoint.id === prayerPoint.id)
    .map((pair) => pair.similarPrayer);

  // Debounced function
  const debouncedFindSimilarPrayers = useCallback(async () => {
    if (!user?.uid) return;

    const dateStr = prayerPoint.createdAt
      ? getDateString(prayerPoint.createdAt)
      : getDateString(Timestamp.now());

    const contextAsStrings =
      `${dateStr}, ${prayerPoint.title}, ${prayerPoint.content}`.trim();

    const contextAsEmbeddings = prayerPoint.contextAsEmbeddings as
      | number[]
      | undefined;

    // If embeddings already exist and context matches, just run similarPrayers
    if (
      contextAsEmbeddings?.length &&
      prayerPoint.contextAsStrings === contextAsStrings
    ) {
      try {
        if (similarPrayers.length > 0) return; // prevents duplicate calls.
        const similar = await similarPrayersService.findRelatedPrayers(
          contextAsEmbeddings,
          user.uid,
          prayerPoint.id,
        );
        handleBatchSimilarPrayers(
          similar.map(
            (prayer) =>
              ({
                prayerPoint: prayerPoint,
                similarPrayer: prayer,
                similarity: prayer.similarity,
              }) as SimilarPrayersPair,
          ),
        );
      } catch (error) {
        console.error('Error finding similar prayers:', error);
      }
      return;
    }

    // If embeddings missing or context changed, generate new
    try {
      const newEmbedding =
        await openAiService.getVectorEmbeddings(contextAsStrings);

      handlePrayerPointUpdate(id ?? prayerPoint.id, {
        contextAsEmbeddings: newEmbedding,
        contextAsStrings: contextAsStrings,
      });

      const similarPrayers = (await similarPrayersService.findRelatedPrayers(
        newEmbedding,
        user.uid,
        prayerPoint.id,
      )) as PartialLinkedPrayerEntity[];

      handleBatchSimilarPrayers(
        similarPrayers.map(
          (prayer) =>
            ({
              prayerPoint: prayerPoint,
              similarPrayer: prayer,
              similarity: prayer.similarity,
            }) as SimilarPrayersPair,
        ),
      );
    } catch (error) {
      console.error(
        'Error updating embeddings and finding similar prayers:',
        error,
      );
    }
  }, [
    handleBatchSimilarPrayers,
    handlePrayerPointUpdate,
    id,
    openAiService,
    prayerPoint,
    similarPrayers.length,
    user?.uid,
  ]);

  useEffect(() => {
    if (!prayerPoint) return;
    // Create stable references to the properties we need to check to prevent infinite loops
    const hasTitleOrContent =
      prayerPoint.title?.trim() || prayerPoint.content?.trim();
    const hasLinkedTopics = Boolean(
      (prayerPoint.linkedTopics as string[])?.length > 0,
    );
    // const hasSimilarPrayers = Boolean(similarPrayerPairs.length);

    // don't search if prayer point is already linked to a topic.
    if (!hasLinkedTopics) {
      const debounceTimeout = setTimeout(() => {
        if (hasTitleOrContent) {
          debouncedFindSimilarPrayers();
        }
      }, 300); // Debounce delay

      // Cleanup timeout on component unmount or dependency change
      return () => clearTimeout(debounceTimeout);
    }
  }, [debouncedFindSimilarPrayers, prayerPoint, similarPrayerPairs]);

  return { setIsAlreadyLoaded: () => {} };
}
