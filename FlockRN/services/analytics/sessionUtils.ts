import { sentryAnalytics } from './sentryAnalytics';
import { useSyncStore } from '@/hooks/zustand/syncSlice/syncStore';
import { syncPendingActions } from '@/hooks/zustand/syncSlice/syncWorker';

/**
 * Utility function to end session via sync store
 * This prevents crashes when components unmount before analytics can complete
 */
export function endSessionViaSync() {
  if (sentryAnalytics.isSessionActive()) {
    console.log('📊 Ending session via sync store');
    const endSession = useSyncStore.getState().endSession;
    endSession();

    // Immediately process the session end action
    setTimeout(() => {
      syncPendingActions();
    }, 100);
  }
}

/**
 * Utility function to end session directly (use only when you know the component won't unmount)
 */
export function endSessionDirect() {
  if (sentryAnalytics.isSessionActive()) {
    console.log('📊 Ending session directly');
    sentryAnalytics.endSession();
  }
}
