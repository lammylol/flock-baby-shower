import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PendingAction {
  id: string;
  type: string;
  payload: unknown;
}

interface SyncState {
  pendingActions: PendingAction[];
  isSyncing: boolean;
  addPendingAction: (action: PendingAction) => void;
  removeAction: (id: string) => void;
  setIsSyncing: (value: boolean) => void;
  clearAllActions: () => void;
  clearActionsByType: (type: string) => void;
  endSession: () => void;
}

const asyncStorageAdapter: PersistStorage<SyncState> = {
  getItem: async (key: string) => {
    try {
      // Check if AsyncStorage is available
      if (!AsyncStorage) {
        console.warn('AsyncStorage is not available');
        return null;
      }
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('AsyncStorage getItem failed:', error);
      return null;
    }
  },
  setItem: async (key: string, value: StorageValue<SyncState>) => {
    try {
      // Check if AsyncStorage is available
      if (!AsyncStorage) {
        console.warn('AsyncStorage is not available');
        return;
      }
      return await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('AsyncStorage setItem failed:', error);
      // Don't throw the error, just log it
    }
  },
  removeItem: async (key: string) => {
    try {
      // Check if AsyncStorage is available
      if (!AsyncStorage) {
        console.warn('AsyncStorage is not available');
        return;
      }
      return await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage removeItem failed:', error);
      // Don't throw the error, just log it
    }
  },
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pendingActions: [],
      isSyncing: false,
      addPendingAction: (action) => {
        console.log('📝 Adding pending action to sync store:', {
          id: action.id,
          type: action.type,
          payload: action.payload,
          currentPendingCount: get().pendingActions.length,
        });
        set((state) => ({
          pendingActions: [...state.pendingActions, action],
        }));
      },
      removeAction: (id) => {
        console.log('🗑️ Removing action from sync store:', {
          id,
          currentPendingCount: get().pendingActions.length,
        });
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== id),
        }));
      },
      setIsSyncing: (value) => {
        console.log('🔄 Setting sync state:', { isSyncing: value });
        set({ isSyncing: value });
      },
      clearAllActions: () => {
        console.log('🧹 Clearing all pending actions');
        set({ pendingActions: [] });
      },
      clearActionsByType: (type: string) => {
        console.log('🧹 Clearing actions by type:', type);
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.type !== type),
        }));
      },
      endSession: () => {
        console.log('📊 Adding session end action to sync store');
        const sessionId = `session_end_${Date.now()}`;
        set((state) => ({
          pendingActions: [
            ...state.pendingActions,
            {
              id: sessionId,
              type: 'endSession',
              payload: { timestamp: Date.now() },
            },
          ],
        }));
      },
    }),
    {
      name: 'sync-storage',
      storage: asyncStorageAdapter,
      onRehydrateStorage: () => (state) => {
        console.log('Sync store rehydrated:', state ? 'success' : 'failed');
        if (state) {
          console.log('📊 Rehydrated sync store state:', {
            pendingActionsCount: state.pendingActions.length,
            isSyncing: state.isSyncing,
            pendingActionTypes: state.pendingActions.map((a) => a.type),
          });
        }
      },
      skipHydration: false,
      version: 1,
    },
  ),
);
