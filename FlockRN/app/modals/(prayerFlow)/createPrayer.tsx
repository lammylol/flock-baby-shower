import { useEffect, useMemo, useCallback, useRef } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { Prayer, UpdatePrayerDTO } from '@shared/types/firebaseTypes';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import useUserContext from '@/hooks/useUserContext';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import AudioFile from '@/components/Prayer/PrayerViews/AudioFile/AudioFile';
import { EntityType } from '@/types/PrayerSubtypes';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EditMode, From } from '@/types/ComponentProps';
import useFormState from '@/hooks/useFormState';
import { useAnalyzePrayer } from '@/hooks/prayerScreens/useAnalyzePrayer';
import Button from '@/components/Button';
import { DeleteTrashCan } from '@/components/ui/deleteTrashCan';
import { useSubmitPrayerWithPoints } from '@/hooks/reactQuery/submitMutations';
import { useAuthenticatedUser } from '@/hooks/useAuthContext';
import { NavigationUtils } from '@/utils/navigation';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { usePrayerWithAudio } from '@/hooks/usePrayerWithAudio';
import { useUploadPrayerAudio } from '@/hooks/reactQuery/prayerMutations';
import { resolveAudioUri } from '@/utils/recording/getAudioPaths';
import { ThemedView } from '@/components/ThemedView';
import WhoPrayedSection from '@/components/Prayer/PrayerViews/WhoPrayed';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';
import { useSessionEndOnUnmount } from '@/hooks/useSessionTracking';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';

export default function PrayerMetadataScreen() {
  useSessionEndOnUnmount();
  const { userOptInFlags } = useUserContext();
  const params = useLocalSearchParams() as {
    content?: string;
    editMode?: EditMode;
    hasTranscription?: string;
    from?: From;
    fromId?: string;
  };

  const processedParams = useMemo(() => {
    return {
      content: params.content ?? '',
      editMode: (params.editMode as EditMode) ?? EditMode.CREATE,
      hasTranscription: params.hasTranscription === 'true',
    };
  }, [params.content, params.editMode, params.hasTranscription]);

  // Memoize the from object separately to prevent unnecessary re-renders
  const from = useMemo(
    () => ({
      from: params.from ?? From.PRAYER,
      fromId: params.fromId ?? '',
    }),
    [params.from, params.fromId],
  );

  // Determine if we're in edit mode
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const { content, editMode, hasTranscription } = processedParams;
  const user = useAuthenticatedUser();

  // Combined hook for prayer metadata and audio recording
  const {
    prayer,
    prayerPoints,
    recordingUri,
    transcription,
    isTranscribing,
    handlePrayerUpdate,
    loadPrayer,
    updatePrayerWithAudioPaths,
    deletePrayer,
    getPrayerPointsById,
    hasAudio,
  } = usePrayerWithAudio(hasTranscription);

  const {
    formState,
    isDeleting,
    isDataLoading,
    setIsDataLoading,
    setIsSubmissionLoading,
    setIsDeleting,
    setPrivacy,
  } = useFormState({
    editMode: editMode,
  });

  const {
    isAnalyzing,
    analyzeContent,
    analyzeFromTranscription,
    resetAnalysis,
    processingTranscription,
  } = useAnalyzePrayer({
    userOptInAI: userOptInFlags.optInAI,
  });

  const handleClose = useCallback(() => {
    // Reset the analysis state when closing
    resetAnalysis();
    hasTriggeredAnalysis.current = false;
    analysisComplete.current = false;
    sentryAnalytics.trackUserInteraction(
      'close_button_clicked',
      'PrayerMetadataScreen',
      'handleClose',
    );
    NavigationUtils.resetAndNavigate('/(tabs)/(prayerJournal)');
  }, [resetAnalysis]);

  console.log('prayer created at', prayer?.createdAt);

  useEffect(() => {
    // this guard guarantees no infinite loop.
    if (
      !formState.isEditMode ||
      !from.fromId ||
      !prayer ||
      prayer.id === from.fromId
    )
      return;

    const setup = async () => {
      setIsDataLoading(true);
      const loadedPrayer = await loadPrayer(from.fromId);
      if (loadedPrayer === null) {
        Alert.alert('Error', 'Prayer not found');
        router.push('/(tabs)/(prayerJournal)');
        return;
      } else {
        const loadedPrayerPoints = loadedPrayer.prayerPoints ?? [];
        if (editMode === EditMode.EDIT) {
          await getPrayerPointsById(loadedPrayerPoints.map((p) => p.id));
        }
      }
      setIsDataLoading(false);
    };

    setup();
  }, [
    formState.isEditMode,
    from.fromId,
    loadPrayer,
    prayer,
    setIsDataLoading,
    getPrayerPointsById,
    editMode,
  ]);

  // Use a ref to track if we've already triggered analysis to prevent infinite loops
  const hasTriggeredAnalysis = useRef(false);
  const analysisComplete = useRef(false);
  const audioUriSet = useRef(false);

  useEffect(() => {
    if (
      recordingUri &&
      hasTranscription &&
      !formState.isEditMode &&
      !audioUriSet.current
    ) {
      updatePrayerWithAudioPaths(user, recordingUri, EditMode.CREATE);
      audioUriSet.current = true;
    }
  }, [
    recordingUri,
    hasTranscription,
    formState.isEditMode,
    user,
    updatePrayerWithAudioPaths,
  ]);

  useEffect(() => {
    const checkAndAnalyze = async () => {
      console.log('🔍 checkAndAnalyze called');

      // Don't analyze in edit mode
      if (formState.isEditMode) {
        console.log('🔍 Edit mode, skipping analysis');
        return;
      }

      // Don't analyze if already triggered
      if (hasTriggeredAnalysis.current) {
        console.log('🔍 Analysis already triggered, skipping');
        return;
      }

      // Don't analyze if no content
      if (!content && !hasTranscription) {
        console.log('🔍 No content to analyze, skipping');
        return;
      }

      console.log('🔍 Starting analysis...');
      hasTriggeredAnalysis.current = true;

      try {
        if (hasTranscription) {
          // If transcription is available, use it
          console.log('🔍 Starting analysis from transcription...');
          await analyzeFromTranscription(handlePrayerUpdate, from);
        } else if (content) {
          // If content is available, use it
          await analyzeContent(content, handlePrayerUpdate);
        }

        console.log('🔍 Analysis completed successfully');
      } catch (error) {
        console.error('🔍 Analysis failed:', error);
        // Reset trigger on error so user can retry
        hasTriggeredAnalysis.current = false;
      } finally {
        analysisComplete.current = true;
      }
    };

    checkAndAnalyze();
  }, [
    content,
    hasTranscription,
    formState.isEditMode,
    from,
    handlePrayerUpdate,
    analyzeContent,
    analyzeFromTranscription,
  ]);

  const submitPrayerWithPoints = useSubmitPrayerWithPoints();
  const isMutationPending = submitPrayerWithPoints.isSubmitting;
  const uploadPrayerAudio = useUploadPrayerAudio();
  const isRecordingMutationPending = uploadPrayerAudio.isPending;

  // Memoize the audio file key to prevent unnecessary re-mounting
  const audioFileKey = useMemo(() => {
    const prayerId = prayer?.id || 'new';
    const audioPath = prayer?.audioLocalPath || recordingUri;
    return `audio-${prayerId}-${audioPath}`;
  }, [prayer?.id, prayer?.audioLocalPath, recordingUri]);

  const localAudioUri = useMemo(() => {
    console.log('🔊 CreatePrayer localAudioUri:');
    if (!hasAudio) return '';
    const localAudioUri = resolveAudioUri(
      prayer?.audioLocalPath,
      recordingUri || '',
    );
    return localAudioUri;
  }, [hasAudio, prayer?.audioLocalPath, recordingUri]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a prayer');
      return;
    }

    if (!prayer) {
      Alert.alert('Error', 'Prayer data is missing. Please try again.');
      return;
    }

    setPrivacy('private'); // temporary set function to bypass lint for now.
    setIsSubmissionLoading(true);

    try {
      if (formState.isEditMode) {
        submitPrayerWithPoints.submit(user, prayer as Prayer, prayerPoints, []);
        console.log('calling with prayer as ', prayer as Prayer);
        Alert.alert('Success', 'Prayer updated successfully');
        sentryAnalytics.trackPhase2Complete();
        sentryAnalytics.trackUserInteraction(
          'prayer_updated',
          'PrayerMetadataScreen',
          'handleSubmit',
        );
        handleClose();
        NavigationUtils.toPrayerJournal();
        return;
      }

      submitPrayerWithPoints
        .submit(user, prayer as Prayer, prayerPoints, [])
        .then((result) => {
          if (!result.success) {
            Alert.alert('Success', 'Prayer created successfully');
          }
          sentryAnalytics.trackPhase2Complete();
          sentryAnalytics.trackUserInteraction(
            'prayer_created',
            'PrayerMetadataScreen',
            'handleSubmit',
            {
              hasAudio,
              prayerPointsCount: prayerPoints.length,
            },
          );
        })
        .catch((err) => {
          console.error('Unexpected error:', err);
          Alert.alert('Error', 'Failed to create prayer. Please try again.');
        });

      if (editMode === EditMode.CREATE && hasAudio) {
        uploadPrayerAudio.mutate({
          prayer,
          user,
          filePath: recordingUri!,
        });
      }

      if (from.from === From.PRAYER_TOPIC) {
        NavigationUtils.resetAndNavigate('/(tabs)/(prayers)/prayerTopicView', {
          id: from.fromId,
        });
      } else {
        NavigationUtils.resetAndNavigate('/(tabs)/(prayerJournal)');
      }
    } catch (error) {
      console.error(
        `Error ${formState.isEditMode ? 'updating' : 'creating'} prayer:`,
        error,
      );
      Alert.alert(
        'Error',
        `Failed to ${formState.isEditMode ? 'update' : 'create'} prayer. Please try again.`,
      );
    } finally {
      setIsSubmissionLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Prayer',
      'Are you sure you want to delete this prayer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            await deletePrayer(
              prayer as Prayer,
              () => {
                Alert.alert('Success', 'Prayer deleted successfully');
                handleClose();
              },
              () => {
                // Optional failure callback
              },
            );
            setIsDeleting(false);
          },
        },
      ],
    );
  };

  // Show loading screen when processing transcription or analyzing content
  const showLoadingScreen =
    isTranscribing ||
    processingTranscription ||
    isAnalyzing ||
    (!analysisComplete.current && editMode === EditMode.CREATE);

  if (showLoadingScreen) {
    return (
      <LoadingScreen
        isTranscribing={isTranscribing}
        processingTranscription={processingTranscription}
        isAnalyzing={isAnalyzing}
      />
    );
  }

  return (
    <ThemedKeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.scrollContent}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ThemedScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="automatic"
      >
        <ThemedText type="default" style={styles.headerText}>
          Here's what you prayed:
        </ThemedText>

        {/* Audio File Component - Show when there's a recording */}
        {hasAudio && (
          <AudioFile
            key={audioFileKey}
            localAudioUri={localAudioUri}
            remoteAudioUri={prayer?.audioRemotePath}
            transcription={prayer?.content ?? transcription}
            editMode={editMode}
            onTranscriptEdit={(transcript) => {
              handlePrayerUpdate({ content: transcript });
            }}
          />
        )}

        {!isDataLoading &&
          prayerPoints &&
          prayerPoints.length > 0 &&
          prayer && (
            <PrayerPointSection
              prayerPoints={prayerPoints}
              isPrayerCardsEditable={true}
              editMode={EditMode.EDIT}
              from={{ from: From.PRAYER, fromId: prayer.id }}
            />
          )}

        <ThemedView style={styles.upperContainer}>
          {!hasAudio && (
            <PrayerContent
              editMode={formState.isEditMode ? EditMode.EDIT : EditMode.CREATE}
              backgroundColor={colorScheme}
              entityType={EntityType.Prayer}
              prayer={prayer ?? undefined}
              onChange={(updatedPrayer) => {
                handlePrayerUpdate(updatedPrayer as UpdatePrayerDTO);
              }}
            />
          )}
          <WhoPrayedSection
            whoPrayed={prayer?.whoPrayed ?? []}
            editMode={formState.isEditMode ? EditMode.EDIT : EditMode.CREATE}
            onChange={(whoPrayed) => {
              handlePrayerUpdate({ whoPrayed: whoPrayed });
            }}
          />
        </ThemedView>

        <Button
          size="l"
          textProps={{
            fontSize: 18,
            fontWeight: '600',
          }}
          onPress={handleSubmit}
          disabled={isMutationPending || isRecordingMutationPending}
          label={
            isMutationPending || isRecordingMutationPending
              ? formState.isEditMode
                ? 'Updating...'
                : 'Creating...'
              : formState.isEditMode
                ? 'Update'
                : 'Save'
          }
        />

        {formState.isEditMode && (
          <DeleteTrashCan
            onPress={handleDelete}
            disabled={isDeleting}
            alignSelf="flex-end"
          />
        )}
      </ThemedScrollView>
    </ThemedKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    gap: 15,
    padding: 16,
    paddingBottom: 24,
  },
  upperContainer: {
    flexGrow: 1,
    gap: 20,
  },
});
