import { EditMode, FromProps } from '@/types/ComponentProps';
import { RelativePathString, router } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';

/**
 * Standardized navigation utility to prevent path conflicts
 * Always use these functions instead of direct router calls
 */

export const NavigationUtils = {
  // TABS -----
  toPrayers: () => {
    try {
      sentryAnalytics.trackFunctionExecution('NavigationUtils.toPrayers');
      router.push({
        pathname: '/(tabs)/(prayers)',
      });
    } catch (error) {
      console.error('Navigation error in toPrayers:', error);
      Sentry.captureException(error, {
        tags: { navigation: 'toPrayers' },
      });
    }
  },

  toCreatePrayerModal: (from?: FromProps) => {
    sentryAnalytics.trackFunctionExecution(
      'NavigationUtils.toCreatePrayerModal',
      { from },
    );
    router.push({
      pathname: '/modals/(prayerFlow)/prayerCreateModal',
      params: { from: from?.from, fromId: from?.fromId },
    });
  },

  toPrayerJournal: () => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.toPrayerJournal');
    router.push({
      pathname: '/(tabs)/(prayerJournal)',
    });
  },

  toAccount: () => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.toAccount');
    router.push({
      pathname: '/(tabs)/account',
    });
  },

  // CREATE -----
  // Navigate to create prayer point
  toCreatePrayerPoint: (from?: FromProps) => {
    sentryAnalytics.trackFunctionExecution(
      'NavigationUtils.toCreatePrayerPoint',
      { from },
    );
    router.push({
      pathname: '/(tabs)/(prayers)/createAndEditPrayerPoint',
      params: { from: from?.from, fromId: from?.fromId, editMode: 'create' },
    });
  },

  toCreatePrayerPointFromContent: (from?: FromProps, editMode?: EditMode) => {
    sentryAnalytics.trackFunctionExecution(
      'NavigationUtils.toCreatePrayerPointFromContent',
      { from, editMode },
    );
    router.push({
      pathname: '/modals/(prayerFlow)/createPrayerPointFromContent',
      params: {
        from: from?.from,
        fromId: from?.fromId,
        editMode: editMode,
      },
    });
  },

  // Navigate to create prayer topic
  toCreatePrayerTopic: () => {
    sentryAnalytics.trackFunctionExecution(
      'NavigationUtils.toCreatePrayerTopic',
    );
    router.push({
      pathname: '/(tabs)/(prayers)/createPrayerTopic',
      params: { editMode: 'create' },
    });
  },

  // Navigate to voice recording
  toVoiceRecording: (from?: FromProps) => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.toVoiceRecording', {
      from,
    });
    router.push({
      pathname: '/modals/(prayerFlow)/voiceRecording',
      params: { from: from?.from, fromId: from?.fromId },
    });
  },

  // Navigate to write prayer
  toWritePrayer: (from?: FromProps) => {
    try {
      sentryAnalytics.trackFunctionExecution('NavigationUtils.toWritePrayer', {
        from,
      });
      router.push({
        pathname: '/modals/(prayerFlow)/writePrayer',
        params: { from: from?.from, fromId: from?.fromId },
      });
    } catch (error) {
      console.error('Navigation error in toWritePrayer:', error);
      Sentry.captureException(error, {
        tags: { navigation: 'toWritePrayer' },
        contexts: {
          navigation: {
            from: from?.from,
            fromId: from?.fromId,
          },
        },
      });
    }
  },

  // PRAYER VIEWS ----
  // Navigate to prayer point view
  toPrayerPoint: (id: string, from?: FromProps) => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.toPrayerPoint', {
      id,
      from,
    });
    router.push({
      pathname: '/(tabs)/(prayers)/prayerPointView',
      params: { id, from: from?.from, fromId: from?.fromId },
    });
  },

  // Navigate to prayer topic view
  toPrayerTopic: (id: string) => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.toPrayerTopic', {
      id,
    });
    router.push({
      pathname: '/(tabs)/(prayers)/prayerTopicView',
      params: { id },
    });
  },

  // Navigate to prayer view (journal)
  toPrayer: (id: string, from?: FromProps) => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.toPrayer', {
      id,
      from,
    });
    router.push({
      pathname: '/(tabs)/(prayerJournal)/prayerView',
      params: { id, from: from?.from },
    });
  },

  // EDIT PRAYER VIEWS ---

  toEditPrayer: (editMode?: EditMode, from?: FromProps) => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.toEditPrayer', {
      editMode,
      from,
    });
    router.push({
      pathname: '/(tabs)/(prayerJournal)/createAndEditPrayer',
      params: {
        editMode: editMode,
        from: from?.from,
        fromId: from?.fromId,
      },
    });
  },

  // Navigate to edit prayer point
  toEditPrayerPoint: (from?: FromProps) => {
    sentryAnalytics.trackFunctionExecution(
      'NavigationUtils.toEditPrayerPoint',
      { from },
    );
    router.push({
      pathname: '/(tabs)/(prayers)/createAndEditPrayerPoint',
      params: { from: from?.from, fromId: from?.fromId, editMode: 'edit' },
    });
  },

  // Navigate to edit prayer topic
  toEditPrayerTopic: (from?: FromProps) => {
    sentryAnalytics.trackFunctionExecution(
      'NavigationUtils.toEditPrayerTopic',
      { from },
    );
    router.push({
      pathname: '/(tabs)/(prayers)/editPrayerTopic',
      params: { from: from?.from, fromId: from?.fromId, editMode: 'edit' },
    });
  },

  // Navigate to create and edit prayer
  toCreatePrayer: (params: {
    content?: string;
    hasTranscription?: string;
    editMode?: string;
    from?: string;
    fromId?: string;
  }) => {
    try {
      sentryAnalytics.trackFunctionExecution('NavigationUtils.toCreatePrayer', {
        params,
      });
      router.push({
        pathname: '/modals/(prayerFlow)/createPrayer',
        params,
      });
    } catch (error) {
      console.error('Navigation error in toCreatePrayer:', error);
      Sentry.captureException(error, {
        tags: { navigation: 'toCreatePrayer' },
        contexts: {
          navigation: {
            params,
          },
        },
      });
    }
  },

  // REUSABLE

  // Go back
  back: () => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.back');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(prayers)');
    }
  },

  // Reset navigation state (useful for clearing route conflicts)
  reset: () => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.reset');
    // Clear any navigation state by going to a safe route
    router.replace('/(tabs)/(prayers)');
  },

  // Reset createPrayer navigation state specifically
  resetCreatePrayer: () => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.resetCreatePrayer');
    router.replace('/modals/(prayerFlow)/prayerCreateModal');
  },

  // Cleanup when leaving createPrayer group - ensures full reset
  leaveCreatePrayer: (targetPath?: RelativePathString) => {
    sentryAnalytics.trackFunctionExecution(
      'NavigationUtils.leaveCreatePrayer',
      { targetPath },
    );
    // First, clear the createPrayer navigation stack
    router.replace('/(tabs)/(prayers)');

    // Then navigate to the target if provided
    if (targetPath) {
      setTimeout(() => {
        router.push(targetPath);
      }, 100); // Small delay to ensure cleanup completes
    }
  },

  // Force reset createPrayer state and navigate to specific route
  resetAndNavigate: (
    pathname: string,
    params?: Record<string, string>,
    animation?: 'horizontal' | 'vertical' | 'default' | 'none',
  ) => {
    sentryAnalytics.trackFunctionExecution('NavigationUtils.resetAndNavigate', {
      pathname,
      params,
      animation,
    });
    const finalParams = {
      ...(params ?? {}),
      animation: animation ?? 'default',
    };

    router.replace({
      pathname: pathname as RelativePathString,
      params: finalParams,
    });
  },
};

export function navigateToFlowStep(
  stepName: keyof typeof NavigationUtils,
  args?: unknown[],
) {
  const fn = NavigationUtils[stepName];
  if (typeof fn !== 'function') {
    console.warn(`No such navigation function: ${stepName}`);
    return;
  }

  try {
    // @ts-expect-error -- accept arbitrary function args
    fn(...(args ?? []));
  } catch (err) {
    console.error(`Error navigating to ${stepName}:`, err);
  }
}
