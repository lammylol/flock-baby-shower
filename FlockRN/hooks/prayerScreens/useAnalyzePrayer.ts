import { useCallback, useEffect, useState, useRef } from 'react';
import { PrayerPoint } from '@shared/types/firebaseTypes';
import OpenAiService from '@/services/ai/openAIService';
import { auth } from '@/firebase/firebaseConfig';
import { usePrayerMetadataDispatch } from '@/context/PrayerMetadataContext/PrayerMetadataContext';
import useRecordingContext from '@/hooks/recording/useRecordingContext';
import { From, FromProps } from '@/types/ComponentProps';
import { similarPrayersService } from '@/services/prayer/similarPrayersService';
import { blankId } from '@/types/blankStateModels';
import { EntityType } from '@/types/PrayerSubtypes';
import { localUpdateArrayFieldAddRemove } from '@/utils/update/docUpdates/arrayUtils';

export function useAnalyzePrayer({ userOptInAI }: { userOptInAI: boolean }) {
  const [content, setContent] = useState<string | null>(null);
  const [hasTranscribed, setHasTranscribed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const openAiService = OpenAiService.getInstance();
  const user = auth.currentUser;
  const { setAllSimilarPrayers, setAllPrayerPoints } =
    usePrayerMetadataDispatch();
  const { transcription, isTranscribing } = useRecordingContext();
  const [processingTranscription, setProcessingTranscription] = useState(false);
  const hasTranscribedRef = useRef(hasTranscribed);
  const contentRef = useRef(content);

  const processTranscription = useCallback(() => {
    const finish = () => setProcessingTranscription(false);
    setProcessingTranscription(true);

    if (!transcription) {
      return finish(); // still recording nothing yet
    }
    if (isTranscribing) {
      return finish(); // still recording, wait
    }
    if (hasTranscribed) {
      return finish(); // already processed
    }

    // we're done recording and have text:
    setContent(transcription);
    contentRef.current = transcription;
    setHasTranscribed(true);
    hasTranscribedRef.current = true;
    finish();
  }, [hasTranscribed, isTranscribing, transcription]);

  useEffect(() => {
    processTranscription();
  }, [transcription, isTranscribing, processTranscription]);

  // this function is used to fetch similar prayer points and link them to the topic.
  // it returns an array of objects containing the closest prayer point first, and then the rest are stored
  // in a separate array for use for manual searching.
  const getAndSetSimilarPrayerPoints = useCallback(
    async (prayerPoints: PrayerPoint[]): Promise<PrayerPoint[]> => {
      try {
        const similarPrayerPairs =
          await similarPrayersService.fetchSimilarPrayerPointsBatch(
            prayerPoints,
            user!.uid,
          );
        setAllSimilarPrayers(similarPrayerPairs);
        return prayerPoints.map((point) => {
          const match = similarPrayerPairs.find(
            (pair) => pair?.prayerPoint?.id === point.id,
          );
          return {
            ...point,
            ...(match?.prayerPoint ?? {}),
          };
        });
      } catch (error) {
        console.error('Error fetching similar prayer points:', error);
        return prayerPoints.map((point) => ({
          ...point,
        }));
      }
    },
    [setAllSimilarPrayers, user],
  );

  const analyzeContent = useCallback(
    async (
      mergedContent: string,
      handlePrayerUpdate: (update: { content: string }) => void,
      from?: FromProps,
    ) => {
      try {
        handlePrayerUpdate({
          content: mergedContent,
        });
        setIsAnalyzing(true);
        console.log('analyzing content:', mergedContent);

        const analysis = await openAiService.analyzePrayerContent(
          mergedContent,
          !!transcription,
          userOptInAI,
          from?.from === From.PRAYER_TOPIC ? 1 : 7, // maxPrayerPoints
        );

        console.log('AI analysis result:', analysis);
        handlePrayerUpdate({
          content: analysis.cleanedTranscription || mergedContent,
        });

        if (analysis.prayerPoints.length > 0) {
          const prayerPointsWithId = analysis.prayerPoints.map((point) => ({
            ...point,
            id: blankId(EntityType.PrayerPoint),
            tags: [point.prayerType],
            privacy: 'private',
            isNew: true,
          })) as PrayerPoint[];

          await getAndSetSimilarPrayerPoints(prayerPointsWithId);

          const updateLinkedTopics =
            localUpdateArrayFieldAddRemove('linkedTopics');

          // update the linked topics for each prayer point
          if (from?.from === From.PRAYER_TOPIC) {
            prayerPointsWithId.forEach((point) => {
              point.linkedTopics = updateLinkedTopics(
                point.linkedTopics ?? [],
                [from.fromId],
              );
            });
          }

          setAllPrayerPoints(prayerPointsWithId);
        }
      } catch (error) {
        console.error('Error using AI fill:', error);
        return [];
      } finally {
        setIsAnalyzing(false);
        setHasAnalyzed(true);
      }
    },
    [
      openAiService,
      transcription,
      userOptInAI,
      setAllPrayerPoints,
      getAndSetSimilarPrayerPoints,
    ],
  );

  const analyzeFromTranscription = useCallback(
    async (
      handlePrayerUpdate: (update: { content: string }) => void,
      from?: FromProps,
    ) => {
      if (!hasTranscribedRef.current || !contentRef.current) {
        // Trigger transcription if needed
        processTranscription();

        const pollInterval = 300; // ms
        const timeout = 50000; // ms
        let waited = 0;

        while (!hasTranscribedRef.current || !contentRef.current) {
          console.log('🔍 Polling...', {
            waited,
            hasTranscribed: hasTranscribedRef.current,
            content: contentRef.current ? 'has content' : 'no content',
          });
          await new Promise((res) => setTimeout(res, pollInterval));
          waited += pollInterval;

          if (waited >= timeout) {
            console.warn('Transcription not available after waiting.');
            return;
          }
        }
      }

      await analyzeContent(contentRef.current, handlePrayerUpdate, from);
    },
    [processTranscription, analyzeContent],
  );

  const analyzeFromPrayerPoint = useCallback(
    async (content: string) => {
      if (!content) return;
      try {
        setIsAnalyzing(true);

        const analysis = await openAiService.analyzePrayerContent(
          content,
          !!transcription,
          userOptInAI,
        );

        console.log('AI analysis result:', analysis);

        return analysis;
      } catch (error) {
        console.error('Error using AI fill:', error);
        return [];
      } finally {
        setIsAnalyzing(false);
        setHasAnalyzed(true);
      }
    },
    [openAiService, userOptInAI, transcription],
  );

  const resetAnalysis = useCallback(() => {
    setContent(null);
    setHasTranscribed(false);
    setIsAnalyzing(false);
    setHasAnalyzed(false);
    setProcessingTranscription(false);
  }, []);

  return {
    isAnalyzing,
    hasAnalyzed,
    analyzeContent,
    processingTranscription,
    analyzeFromTranscription,
    getAndSetSimilarPrayerPoints,
    transcription,
    analyzeFromPrayerPoint,
    isTranscribing,
    resetAnalysis,
  };
}
