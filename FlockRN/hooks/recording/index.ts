// Main recording hook
export { default as useRecording } from './useRecording';
export type {
  RecordingState,
  RecordingData,
  RecordingActions,
  UseRecordingReturn,
} from './useRecording';

// Context-based recording hook
export { default as useRecordingContext } from './useRecordingContext';

// Direct hook (no context)
export { default as useRecordingHook } from './useRecordingHook';

// Services (for advanced usage)
export { useAudioService } from '@/services/recording/audioService';
export { useSpeechRecognitionService } from '@/services/recording/speechRecognitionService';
export { usePermissionsService } from '@/services/recording/permissionsService';
