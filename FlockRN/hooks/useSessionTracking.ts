import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';
import { useSyncStore } from '@/hooks/zustand/syncSlice/syncStore';

/**
 * Hook to track session end when app goes to background
 */
export function useSessionTracking() {
  const endSession = useSyncStore((state) => state.endSession);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // End session when app goes to background
        if (sentryAnalytics.isSessionActive()) {
          endSession();
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, [endSession]);
}

/**
 * Hook to track session end when component unmounts
 */
export function useSessionEndOnUnmount() {
  const endSession = useSyncStore((state) => state.endSession);

  useEffect(() => {
    return () => {
      // End session when component unmounts (e.g., when leaving prayer flow)
      if (sentryAnalytics.isSessionActive()) {
        endSession();
      }
    };
  }, [endSession]);
}
