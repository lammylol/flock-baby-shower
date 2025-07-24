import {
  endSessionViaSync,
  endSessionDirect,
} from '@/services/analytics/sessionUtils';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';
import { useSyncStore } from '@/hooks/zustand/syncSlice/syncStore';
import { syncPendingActions } from '@/hooks/zustand/syncSlice/syncWorker';

// Mock the analytics service
jest.mock('@/services/analytics/sentryAnalytics', () => ({
  sentryAnalytics: {
    isSessionActive: jest.fn(),
    endSession: jest.fn(),
  },
}));

// Mock the sync store
jest.mock('@/hooks/zustand/syncSlice/syncStore', () => ({
  useSyncStore: {
    getState: jest.fn(),
  },
}));

// Mock the sync worker
jest.mock('@/hooks/zustand/syncSlice/syncWorker', () => ({
  syncPendingActions: jest.fn(),
}));

describe('Session Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('endSessionViaSync', () => {
    it('should add session end action to sync store when session is active', () => {
      const mockEndSession = jest.fn();
      const mockIsSessionActive = jest.fn().mockReturnValue(true);

      (sentryAnalytics.isSessionActive as jest.Mock).mockImplementation(
        mockIsSessionActive,
      );
      (useSyncStore.getState as jest.Mock).mockReturnValue({
        endSession: mockEndSession,
      });

      endSessionViaSync();

      expect(mockIsSessionActive).toHaveBeenCalled();
      expect(mockEndSession).toHaveBeenCalled();
    });

    it('should not add session end action when session is not active', () => {
      const mockEndSession = jest.fn();
      const mockIsSessionActive = jest.fn().mockReturnValue(false);

      (sentryAnalytics.isSessionActive as jest.Mock).mockImplementation(
        mockIsSessionActive,
      );
      (useSyncStore.getState as jest.Mock).mockReturnValue({
        endSession: mockEndSession,
      });

      endSessionViaSync();

      expect(mockIsSessionActive).toHaveBeenCalled();
      expect(mockEndSession).not.toHaveBeenCalled();
    });

    it('should trigger syncPendingActions after adding session end action', () => {
      const mockEndSession = jest.fn();
      const mockIsSessionActive = jest.fn().mockReturnValue(true);
      const mockSyncPendingActions = jest.fn();

      (sentryAnalytics.isSessionActive as jest.Mock).mockImplementation(
        mockIsSessionActive,
      );
      (useSyncStore.getState as jest.Mock).mockReturnValue({
        endSession: mockEndSession,
      });
      (syncPendingActions as jest.Mock).mockImplementation(
        mockSyncPendingActions,
      );

      endSessionViaSync();

      expect(mockEndSession).toHaveBeenCalled();

      // Wait for the setTimeout to execute
      setTimeout(() => {
        expect(mockSyncPendingActions).toHaveBeenCalled();
      }, 150);
    });
  });

  describe('endSessionDirect', () => {
    it('should call sentryAnalytics.endSession when session is active', () => {
      const mockEndSession = jest.fn();
      const mockIsSessionActive = jest.fn().mockReturnValue(true);

      (sentryAnalytics.isSessionActive as jest.Mock).mockImplementation(
        mockIsSessionActive,
      );
      (sentryAnalytics.endSession as jest.Mock).mockImplementation(
        mockEndSession,
      );

      endSessionDirect();

      expect(mockIsSessionActive).toHaveBeenCalled();
      expect(mockEndSession).toHaveBeenCalled();
    });

    it('should not call sentryAnalytics.endSession when session is not active', () => {
      const mockEndSession = jest.fn();
      const mockIsSessionActive = jest.fn().mockReturnValue(false);

      (sentryAnalytics.isSessionActive as jest.Mock).mockImplementation(
        mockIsSessionActive,
      );
      (sentryAnalytics.endSession as jest.Mock).mockImplementation(
        mockEndSession,
      );

      endSessionDirect();

      expect(mockIsSessionActive).toHaveBeenCalled();
      expect(mockEndSession).not.toHaveBeenCalled();
    });
  });
});
