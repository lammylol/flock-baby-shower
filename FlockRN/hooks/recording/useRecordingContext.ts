import { RecordingContext } from '@/context/RecordingContext';
import { useContext } from 'react';

/**
 * Hook to access the recording context
 * Must be used within a RecordingProvider
 */
const useRecordingContext = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error(
      'useRecordingContext must be used within a RecordingProvider',
    );
  }

  return context;
};

export default useRecordingContext;
