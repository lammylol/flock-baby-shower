// This file provides a context for recording prayers using the unified recording hook.
// It wraps the useRecording hook to provide global state access.

import { createContext, ReactNode } from 'react';
import useRecording, {
  RecordingData,
  RecordingActions,
} from '@/hooks/recording/useRecording';

export type RecordingContextType = RecordingData & RecordingActions;

// Create context that allows components to access recording state and functions.
export const RecordingContext = createContext<RecordingContextType | null>(
  null,
);

export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const recordingHook = useRecording();

  return (
    <RecordingContext.Provider value={recordingHook}>
      {children}
    </RecordingContext.Provider>
  );
};
