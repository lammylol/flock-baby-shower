import { sentryAnalytics } from './sentryAnalytics';
import { useSyncStore } from '@/hooks/zustand/syncSlice/syncStore';
import {
  syncPendingActions,
  logSyncState,
} from '@/hooks/zustand/syncSlice/syncWorker';

/**
 * Debug utility to test session ending functionality
 */
export function debugSessionEnding() {
  console.log('🔍 Debug Session Ending');

  // Check if session is active
  const isActive = sentryAnalytics.isSessionActive();
  console.log('📊 Session active:', isActive);

  if (isActive) {
    // Get current session info
    console.log(
      '📊 Current session info:',
      sentryAnalytics.getCurrentSession(),
    );

    // Test direct session ending
    console.log('📊 Testing direct session ending...');
    sentryAnalytics.endSession();

    // Check sync store state
    const syncState = useSyncStore.getState();
    console.log('📊 Sync store state:', {
      pendingActionsCount: syncState.pendingActions.length,
      isSyncing: syncState.isSyncing,
      pendingActions: syncState.pendingActions,
    });

    // Test sync store session ending
    console.log('📊 Testing sync store session ending...');
    syncState.endSession();

    // Process pending actions
    console.log('📊 Processing pending actions...');
    syncPendingActions();

    // Log final state
    setTimeout(() => {
      logSyncState();
    }, 200);
  } else {
    console.log('📊 No active session to end');
  }
}

/**
 * Debug utility to check Sentry configuration
 */
export function debugSentryConfig() {
  console.log('🔍 Debug Sentry Configuration');

  // Check if Sentry is available
  try {
    const Sentry = require('@sentry/react-native');
    console.log('✅ Sentry is available');

    // Test adding a breadcrumb
    Sentry.addBreadcrumb({
      category: 'debug',
      message: 'Debug test breadcrumb',
      level: 'info',
      data: { test: true, timestamp: Date.now() },
    });
    console.log('✅ Breadcrumb added successfully');

    // Test capturing a message
    Sentry.captureMessage('Debug test message', {
      level: 'info',
      tags: { debug: true },
    });
    console.log('✅ Message captured successfully');
  } catch (error) {
    console.error('❌ Sentry not available:', error);
  }
}

/**
 * Debug utility to test sync store functionality
 */
export function debugSyncStore() {
  console.log('🔍 Debug Sync Store');

  const syncState = useSyncStore.getState();
  console.log('📊 Current sync state:', {
    pendingActionsCount: syncState.pendingActions.length,
    isSyncing: syncState.isSyncing,
    pendingActions: syncState.pendingActions,
  });

  // Test adding a test action
  console.log('📊 Adding test action...');
  syncState.addPendingAction({
    id: 'test_action_' + Date.now(),
    type: 'endSession',
    payload: { test: true, timestamp: Date.now() },
  });

  // Process actions
  console.log('📊 Processing actions...');
  syncPendingActions();

  // Log final state
  setTimeout(() => {
    logSyncState();
  }, 200);
}

/**
 * Debug utility to test all analytics functionality
 */
export function debugAllAnalytics() {
  console.log('🔍 Debug All Analytics');

  // Test Sentry config
  debugSentryConfig();

  // Test session management
  console.log('📊 Testing session management...');
  sentryAnalytics.startNewSession();
  console.log('📊 Session started');

  // Test user interactions
  sentryAnalytics.trackUserInteraction(
    'test_click',
    'DebugComponent',
    'debugFunction',
    { test: true },
  );
  console.log('📊 User interaction tracked');

  // Test session ending
  debugSessionEnding();

  // Test sync store
  debugSyncStore();
}
