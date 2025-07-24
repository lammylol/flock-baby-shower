import { useState, useCallback } from 'react';
import { useSpeechRecognitionService } from '@/services/recording/speechRecognitionService';
import { usePermissionsService } from '@/services/recording/permissionsService';
import { RecordingUtils } from '@/utils/recording/recordingUtils';

export type RecordingState = 'none' | 'recording' | 'complete';

export interface RecordingData {
  recording: RecordingState;
  transcription: string;
  isTranscribing: boolean;
  permissionsGranted: boolean;
  timer: number;
  recordingUri: string | null;
}

export interface RecordingActions {
  handleRecordPrayer: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  resetRecording: () => void;
  setTimer: (seconds: number) => void;
}

export type UseRecordingReturn = RecordingData & RecordingActions;

/**
 * Main recording hook that orchestrates audio recording, speech recognition,
 * and permissions management.
 *
 * This hook provides a clean interface for recording prayers with automatic
 * transcription and permission handling.
 */
export function useRecording(): UseRecordingReturn {
  // Services
  const {
    transcription,
    setTranscription,
    isTranscribing,
    startRecognition,
    stopRecognition,
    abortRecognition,
    recordingUri,
    setRecordingUri,
  } = useSpeechRecognitionService();
  const { permissionsGranted, requestPermissions } = usePermissionsService();

  // Local state
  const [recording, setRecording] = useState<RecordingState>('none');
  const [timer, setTimer] = useState<number>(0);

  // Reset recording state
  const resetRecording = useCallback(async () => {
    try {
      if (isTranscribing) {
        abortRecognition();
      }
      if (recordingUri) {
        console.log('Deleting recording:', recordingUri);
        RecordingUtils.deleteRecording(
          RecordingUtils.getFileNameFromUri(recordingUri),
        );
        setRecordingUri(null);
      }
      setRecording('none');
      setTranscription('');
      setTimer(0);
    } catch (error) {
      console.error('Error during resetRecording:', error);
    }
  }, [
    isTranscribing,
    abortRecognition,
    setTranscription,
    recordingUri,
    setRecordingUri,
  ]);

  // Start recording (both audio and speech recognition)
  const startRecording = useCallback(async () => {
    try {
      // Start speech recognition
      startRecognition();
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [startRecognition]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      stopRecognition();
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }, [stopRecognition]);

  // Main recording handler
  const handleRecordPrayer = useCallback(async () => {
    try {
      const granted = await requestPermissions();

      if (!granted) {
        console.warn('Permissions not granted');
        return;
      }

      if (recording === 'none' || recording === 'complete') {
        setRecording('recording');
        try {
          await startRecording();
        } catch (e) {
          console.error('Failed to start recording:', e);
          setRecording('none');
        }
      } else {
        setRecording('complete');
        try {
          await stopRecording();
        } catch (e) {
          console.error('Failed to stop recording:', e);
        }
      }
    } catch (error) {
      console.error('Error during recording flow:', error);
    }
  }, [recording, requestPermissions, startRecording, stopRecording]);

  return {
    // State
    recording,
    transcription,
    isTranscribing,
    permissionsGranted,
    timer,
    recordingUri,
    // Actions
    handleRecordPrayer,
    requestPermissions,
    resetRecording,
    setTimer,
  };
}

export default useRecording;
