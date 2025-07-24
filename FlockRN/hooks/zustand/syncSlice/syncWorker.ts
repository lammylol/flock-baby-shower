// syncWorker.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useSyncStore } from '@/hooks/zustand/syncSlice/syncStore';
import { getApp } from 'firebase/app';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';

const functions = getFunctions(getApp());

// Firebase functions
const submitPrayerWithPoints = httpsCallable(
  functions,
  'submitPrayerWithPoints',
);
const submitPrayerPointWithLink = httpsCallable(
  functions,
  'submitPrayerPointWithLink',
);
const updatePrayerPointTopicLinks = httpsCallable(
  functions,
  'updatePrayerPointTopicLinks',
);
const deleteEntity = httpsCallable(functions, 'deleteEntity');

function getCallable(functionName: string) {
  switch (functionName) {
    case 'submitPrayerWithPoints':
      return submitPrayerWithPoints;
    case 'submitPrayerPointWithLink':
      return submitPrayerPointWithLink;
    case 'updatePrayerPointTopicLinks':
      return updatePrayerPointTopicLinks;
    case 'deleteEntity':
      return deleteEntity;
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

// Local actions that don't need Firebase
const localActions = ['endSession'];

function isLocalAction(actionType: string): boolean {
  return localActions.includes(actionType);
}

export async function syncPendingActions() {
  const { pendingActions, removeAction, setIsSyncing, isSyncing } =
    useSyncStore.getState();

  if (isSyncing || pendingActions.length === 0) return;

  console.log(
    '🔄 Starting sync process with',
    pendingActions.length,
    'pending actions',
  );
  setIsSyncing(true);

  for (const action of pendingActions) {
    try {
      console.log('📤 Syncing action:', {
        id: action.id,
        type: action.type,
        payload: action.payload,
      });

      if (isLocalAction(action.type)) {
        // Handle local actions
        console.log('🔧 Processing local action:', action.type);

        if (action.type === 'endSession') {
          console.log('📊 Ending session via sync worker');
          sentryAnalytics.endSession();
        }

        console.log('✅ Local action processed successfully:', {
          id: action.id,
          type: action.type,
        });
      } else {
        // Handle Firebase functions
        const fn = getCallable(action.type);
        console.log('🔧 Calling Firebase function:', action.type);

        const result = await fn(action.payload);
        console.log('✅ Action synced successfully:', {
          id: action.id,
          type: action.type,
          result: result.data,
        });
      }

      removeAction(action.id);
    } catch (err: unknown) {
      const error = err as {
        code?: string;
        message?: string;
        details?: unknown;
      };
      console.error('❌ Error syncing action:', {
        id: action.id,
        type: action.type,
        payload: action.payload,
        error: err,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
      });

      // Log additional context for not-found errors
      if (error?.code === 'functions/not-found') {
        console.error('🔍 NOT-FOUND ERROR DETAILS:', {
          functionName: action.type,
          payload: JSON.stringify(action.payload, null, 2),
          availableFunctions: [
            'submitPrayerWithPoints',
            'submitPrayerPointWithLink',
            'updatePrayerPointTopicLinks',
            'deleteEntity',
            'analyzePrayerContent',
            'getVectorEmbeddings',
            'findSimilarPrayers',
            'findSimilarPrayersBatch',
            'updateAggregatedEmbeddingForTopicCallable',
            'onPrayerPointWrite',
          ],
        });
      }

      // Optionally: break or continue depending on retry logic
    }
  }

  console.log('🏁 Sync process completed');
  setIsSyncing(false);
}

// Utility function for debugging sync state
export function logSyncState() {
  const { pendingActions, isSyncing } = useSyncStore.getState();
  console.log('📊 Current sync state:', {
    isSyncing,
    pendingActionsCount: pendingActions.length,
    pendingActions: pendingActions.map((action) => ({
      id: action.id,
      type: action.type,
      payload: action.payload,
    })),
  });
}

// Utility function to manually trigger sync for debugging
export async function debugSync() {
  console.log('🔍 Debug sync triggered');
  logSyncState();
  await syncPendingActions();
  logSyncState();
}

// Utility function to clear all pending actions
export function clearAllPendingActions() {
  const { clearAllActions } = useSyncStore.getState();
  console.log('🧹 Clearing all pending actions');
  clearAllActions();
  logSyncState();
}

// Utility function to clear actions by type
export function clearActionsByType(type: string) {
  const { clearActionsByType } = useSyncStore.getState();
  console.log('🧹 Clearing actions by type:', type);
  clearActionsByType(type);
  logSyncState();
}

// Utility function to fix and redo pending actions with correct function names
export function fixAndRedoPendingActions() {
  const { pendingActions, clearAllActions, addPendingAction } =
    useSyncStore.getState();

  console.log('🔧 Fixing and redoing pending actions...');

  // Clear all current actions
  clearAllActions();

  // Re-add actions with correct function names and payloads
  pendingActions.forEach((action) => {
    let fixedAction = { ...action };

    // Fix function names and payloads
    if (action.type === 'deletePrayerPoint') {
      fixedAction = {
        id: action.id,
        type: 'deleteEntity',
        payload: { entityType: 'prayerPoint', entityId: action.payload },
      };
      console.log('🔧 Fixed deletePrayerPoint -> deleteEntity:', fixedAction);
    } else if (action.type === 'submitPrayerPoint') {
      fixedAction = {
        id: action.id,
        type: 'submitPrayerPointWithLink',
        payload: action.payload,
      };
      console.log(
        '🔧 Fixed submitPrayerPoint -> submitPrayerPointWithLink:',
        fixedAction,
      );
    }

    addPendingAction(fixedAction);
  });

  console.log('✅ Fixed and re-added pending actions');
  logSyncState();
}
