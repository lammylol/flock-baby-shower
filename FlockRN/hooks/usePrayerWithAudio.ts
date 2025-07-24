// This hook is used to manage the prayer metadata and the audio recording state.
// It is used in the createPrayer screen.

import { useCallback } from 'react';
import {
  usePrayerMetadataState,
  usePrayerMetadataDispatch,
} from '@/context/PrayerMetadataContext/PrayerMetadataContext';
import useRecordingContext from '@/hooks/recording/useRecordingContext';
import { Prayer, PrayerPoint } from '@shared/types/firebaseTypes';
import { getAudioPaths } from '@/utils/recording/getAudioPaths';
import { User } from 'firebase/auth';
import { EditMode } from '@/types/ComponentProps';

export interface UsePrayerWithAudioReturn {
  // Prayer metadata state
  prayer: Prayer | null;
  prayerPoints: PrayerPoint[];

  // Recording state
  recordingUri: string | null;
  transcription: string;
  isTranscribing: boolean;

  // Combined actions
  handlePrayerUpdate: (updatedPrayer: Partial<Prayer>) => void;
  loadPrayer: (prayerId: string) => Promise<Prayer | null>;
  deletePrayer: (
    prayer: Prayer,
    onSuccess: () => void,
    onFailure?: () => void,
  ) => Promise<void>;
  getPrayerPointsById: (prayerPointIds: string[]) => Promise<void>;

  // Audio-specific actions
  updatePrayerWithAudioPaths: (
    user: User,
    uri: string,
    editMode: EditMode,
  ) => Promise<void>;
  hasAudio: boolean;
}

export function usePrayerWithAudio(
  hasRecording: boolean,
): UsePrayerWithAudioReturn {
  const { prayer, prayerPoints } = usePrayerMetadataState();
  const { handlePrayerUpdate, loadPrayer, deletePrayer, getPrayerPointsById } =
    usePrayerMetadataDispatch();

  const { recordingUri, transcription, isTranscribing } = useRecordingContext();

  // Audio management functions
  const updatePrayerWithAudioPaths = useCallback(
    async (user: User, uri: string, editMode: EditMode) => {
      try {
        console.log('usePrayerWithAudio loading prayer audio:', uri);
        const fileName = uri.split('/').pop() ?? 'unknown';

        const { remotePath, localPath } = getAudioPaths({
          userId: user.uid,
          fileName,
        });

        if (editMode === EditMode.CREATE) {
          handlePrayerUpdate({
            audioLocalPath: localPath,
            audioRemotePath: remotePath,
          });
        }
      } catch (error) {
        console.error('usePrayerWithAudio Error loading prayer audio:', error);
        throw error;
      }
    },
    [handlePrayerUpdate],
  );

  const hasAudio =
    Boolean(recordingUri && transcription && hasRecording) ||
    Boolean(prayer?.audioLocalPath || prayer?.audioRemotePath);

  return {
    // Prayer metadata state
    prayer,
    prayerPoints,

    // Recording state
    recordingUri,
    transcription,
    isTranscribing,

    // Combined actions
    handlePrayerUpdate,
    loadPrayer,
    deletePrayer,
    getPrayerPointsById,

    // Audio-specific actions
    updatePrayerWithAudioPaths,
    hasAudio,
  };
}
