// usePrayerStore.ts
import { create } from 'zustand';
import {
  devtools,
  persist,
  PersistStorage,
  StorageValue,
} from 'zustand/middleware';
import {
  Prayer,
  PrayerPoint,
  PrayerTopic,
  AnyPrayerEntity,
  LinkedPrayerEntity,
  PrayerPointInTopicJourneyDTO,
} from '@shared/types/firebaseTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { blankId } from '@/types/blankStateModels';
import { EntityType } from '@/types/PrayerSubtypes';
import { prayerService } from '@/services/prayer/prayerService';
import { prayerPointService } from '@/services/prayer/prayerPointService';
import { prayerTopicService } from '@/services/prayer/prayerTopicService';
import { useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import useAuthContext from '@/hooks/useAuthContext';
import { sortPrayersByDate } from '@/utils/dateUtils';

const asyncStorageAdapter: PersistStorage<PrayerStoreState> = {
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
  setItem: async (key: string, value: StorageValue<PrayerStoreState>) => {
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

export interface PrayerStoreState {
  // Main data
  prayers: Prayer[];
  prayerPoints: PrayerPoint[];
  topics: PrayerTopic[];
  selectedTopicId?: string;

  // Filtered data for search
  filteredPrayers: Prayer[];
  filteredPrayerPoints: PrayerPoint[];
  filteredPrayerTopics: PrayerTopic[];

  // Computed properties
  userPPandTopicsWithContextEmbeddings: LinkedPrayerEntity[];

  // Actions
  addPrayer: (prayer: Prayer, options?: { isNew?: boolean }) => void;
  updatePrayer: (prayer: Prayer) => void;
  removePrayer: (id: string) => void;
  addPrayerPoint: (
    point: Partial<PrayerPoint>,
    options?: { isNew?: boolean },
  ) => void;
  updatePrayerPoint: (id: string, updates: Partial<PrayerPoint>) => void;
  removePrayerPoint: (id: string) => void;
  setTopics: (topics: PrayerTopic[], options?: { isNew?: boolean }) => void;
  addTopic: (topic: PrayerTopic, options?: { isNew?: boolean }) => void;
  updateTopic: (id: string, updates: Partial<PrayerTopic>) => void;
  setSelectedTopicId: (id: string) => void;
  getRemovedTopicIds: (pointId: string, newTopics: string[]) => string[];

  // Loading functions
  loadAll: (userId: string) => Promise<void>;
  loadPrayers: (userId: string) => Promise<void>;
  loadPrayerPoints: (userId: string) => Promise<void>;
  loadPrayerTopics: (userId: string) => Promise<void>;
  getPrayerTopicAndPoints: (id: string) => Promise<{
    topic: PrayerTopic | null;
    points: PrayerPoint[];
  } | null>;
  refreshPrayerTopicAndPoints: (id: string, user: User) => Promise<void>;
  getPrayerPoints: (ids: string[]) => Promise<PrayerPoint[]>;

  // Search functionality
  searchPrayers: (text: string) => void;

  // Collection management
  updateCollection: (updatedPrayer: AnyPrayerEntity, type: string) => void;
  removeFromCollection: (id: string, type: string) => void;

  // Reset
  resetStore: () => void;
}

export const usePrayerStore = create<PrayerStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        prayers: [],
        prayerPoints: [],
        topics: [],
        selectedTopicId: undefined,
        filteredPrayers: [],
        filteredPrayerPoints: [],
        filteredPrayerTopics: [],
        userPPandTopicsWithContextEmbeddings: [],

        // Loading functions
        loadAll: async (userId: string) => {
          try {
            console.log('Loading all data');
            const [prayers, prayerPoints, prayerTopics] = await Promise.all([
              prayerService.getUserPrayers(userId),
              prayerPointService.getUserPrayerPoints(userId),
              prayerTopicService.getUserPrayerTopics(userId),
            ]);

            const sortedPrayers = sortPrayersByDate(prayers);
            const sortedPrayerPoints = sortPrayersByDate(
              prayerPoints,
            ) as PrayerPoint[];

            set({
              prayers: sortedPrayers,
              prayerPoints: sortedPrayerPoints,
              topics: prayerTopics,
              filteredPrayers: sortedPrayers,
              filteredPrayerPoints: sortedPrayerPoints,
              filteredPrayerTopics: prayerTopics,
            });
          } catch (error) {
            console.error('Error loading all data:', error);
          }
        },

        loadPrayers: async (userId: string) => {
          try {
            const prayers = await prayerService.getUserPrayers(userId);
            const sortedPrayers = sortPrayersByDate(prayers);
            set({ prayers: sortedPrayers, filteredPrayers: sortedPrayers });
          } catch (error) {
            console.error('Error loading prayers:', error);
          }
        },

        loadPrayerPoints: async (userId: string) => {
          try {
            console.log('Loading prayer points');
            const prayerPoints =
              await prayerPointService.getUserPrayerPoints(userId);
            const sortedPrayerPoints = sortPrayersByDate(
              prayerPoints,
            ) as PrayerPoint[];
            set({
              prayerPoints: sortedPrayerPoints,
              filteredPrayerPoints: sortedPrayerPoints,
            });
          } catch (error) {
            console.error('Error loading prayer points:', error);
          }
        },

        loadPrayerTopics: async (userId: string) => {
          try {
            const prayerTopics =
              await prayerTopicService.getUserPrayerTopics(userId);
            set({ topics: prayerTopics, filteredPrayerTopics: prayerTopics });
          } catch (error) {
            console.error('Error loading prayer topics:', error);
          }
        },

        getPrayerPoints: async (ids: string[]): Promise<PrayerPoint[]> => {
          const store = get();

          // Safety check for ids parameter
          if (!Array.isArray(ids) || ids.length === 0) {
            return [];
          }

          const results = await Promise.all(
            ids.map(async (id) => {
              let point = store.prayerPoints.find((p) => p.id === id);

              if (!point) {
                try {
                  const fetchedPoint =
                    await prayerPointService.getPrayerPointById(id);
                  if (fetchedPoint) {
                    store.updateCollection(fetchedPoint, 'prayerPoint');
                    point = fetchedPoint;
                  }
                } catch (error) {
                  console.error(
                    `Error fetching prayer point with id ${id}:`,
                    error,
                  );
                  return null;
                }
              }

              return point ?? null;
            }),
          );

          // Filter out nulls
          return results.filter((p): p is PrayerPoint => p !== null);
        },

        getPrayerTopicAndPoints: async (id: string) => {
          const topic =
            get().topics.find((t) => t.id === id) ||
            (await prayerTopicService.getPrayerTopic(id));

          if (topic) {
            get().updateCollection(topic, 'prayerTopic');
          }

          const journeyIds =
            topic?.journey?.map(
              (journey: PrayerPointInTopicJourneyDTO) => journey.id,
            ) ?? [];

          const points = journeyIds.length
            ? await get().getPrayerPoints(journeyIds)
            : [];

          return { topic, points };
        },

        refreshPrayerTopicAndPoints: async (id: string, user: User) => {
          const { updateCollection } = get();

          const fetchedPrayer = await prayerTopicService.getPrayerTopic(id);
          if (fetchedPrayer) {
            updateCollection(fetchedPrayer, 'prayerTopic');
          }

          // Add null check for journey property
          const journeyIds =
            fetchedPrayer?.journey?.map(
              (journey: PrayerPointInTopicJourneyDTO) => journey.id,
            ) || [];

          const fetchedPoints = await prayerPointService.getPrayerPoints({
            user: user,
            prayerPointIds: journeyIds,
          });
          if (fetchedPoints) {
            fetchedPoints.forEach((point) => {
              updateCollection(point, 'prayerPoint');
            });
          }
        },

        // Search functionality
        searchPrayers: (text: string) => {
          const searchText = text.trim().toLowerCase();
          const { prayers, prayerPoints, topics } = get();

          set({
            filteredPrayers: prayers.filter((prayer) =>
              prayer.content?.toLowerCase().includes(searchText),
            ),
            filteredPrayerPoints: prayerPoints.filter((prayerPoint) =>
              prayerPoint.title?.toLowerCase().includes(searchText),
            ),
            filteredPrayerTopics: topics.filter((prayerTopic) =>
              prayerTopic.title?.toLowerCase().includes(searchText),
            ),
          });
        },

        // Collection management
        updateCollection: (updatedPrayer: AnyPrayerEntity, type: string) => {
          const state = get();

          if (type === 'prayerPoint') {
            const updatedPrayerPoint = updatedPrayer as PrayerPoint;
            const newPrayerPoints = state.prayerPoints.map((p) =>
              p.id === updatedPrayerPoint.id ? updatedPrayerPoint : p,
            );
            if (!newPrayerPoints.find((p) => p.id === updatedPrayerPoint.id)) {
              newPrayerPoints.push(updatedPrayerPoint);
            }
            // Sort prayer points by date, similar to prayers
            const sortedPrayerPoints = sortPrayersByDate(
              newPrayerPoints,
            ) as PrayerPoint[];
            set({
              prayerPoints: sortedPrayerPoints,
              filteredPrayerPoints: sortedPrayerPoints,
            });
          } else if (type === 'prayerTopic') {
            const updatedPrayerTopic = updatedPrayer as PrayerTopic;
            const newPrayerTopics = state.topics.map((t) =>
              t.id === updatedPrayerTopic.id ? updatedPrayerTopic : t,
            );
            if (!newPrayerTopics.find((t) => t.id === updatedPrayerTopic.id)) {
              newPrayerTopics.push(updatedPrayerTopic);
            }
            set({
              topics: newPrayerTopics,
              filteredPrayerTopics: newPrayerTopics,
            });
          } else {
            const updatedPrayerEntity = updatedPrayer as Prayer;
            const newPrayers = state.prayers.map((p) =>
              p.id === updatedPrayerEntity.id ? updatedPrayerEntity : p,
            );
            if (!newPrayers.find((p) => p.id === updatedPrayerEntity.id)) {
              newPrayers.push(updatedPrayerEntity);
            }
            const sortedPrayers = sortPrayersByDate(newPrayers);
            set({
              prayers: sortedPrayers,
              filteredPrayers: sortedPrayers,
            });
          }
        },

        removeFromCollection: (id: string, type: string) => {
          const state = get();

          if (type === 'prayerPoint') {
            const newPrayerPoints = state.prayerPoints.filter(
              (point) => point.id !== id,
            );
            set({
              prayerPoints: newPrayerPoints,
              filteredPrayerPoints: newPrayerPoints,
            });
          } else if (type === 'prayerTopic') {
            const newPrayerTopics = state.topics.filter(
              (topic) => topic.id !== id,
            );
            set({
              topics: newPrayerTopics,
              filteredPrayerTopics: newPrayerTopics,
            });
          } else {
            const newPrayers = state.prayers.filter(
              (prayer) => prayer.id !== id,
            );
            set({
              prayers: newPrayers,
              filteredPrayers: newPrayers,
            });
          }
        },

        // Original actions (keeping for backward compatibility)
        addPrayer: (prayer, { isNew = false } = {}) => {
          console.log('addPrayer called:', { prayer, isNew });
          set((state) => {
            const newPrayers = sortPrayersByDate([
              ...state.prayers,
              { ...prayer, isNew },
            ]);
            const newFilteredPrayers = sortPrayersByDate([
              ...state.filteredPrayers,
              { ...prayer, isNew },
            ]);

            const newState = {
              prayers: newPrayers,
              filteredPrayers: newFilteredPrayers,
            };
            console.log('addPrayer: new state', {
              prayersCount: newState.prayers.length,
              filteredPrayersCount: newState.filteredPrayers.length,
            });
            return newState;
          });
        },

        updatePrayer: (prayer) =>
          set((state) => ({
            prayers: state.prayers.map((p) =>
              p.id === prayer.id ? { ...p, ...prayer } : p,
            ),
            filteredPrayers: state.filteredPrayers.map((p) =>
              p.id === prayer.id ? { ...p, ...prayer } : p,
            ),
          })),

        removePrayer: (id) =>
          set((state) => ({
            prayers: state.prayers.filter((p) => p.id !== id),
            filteredPrayers: state.filteredPrayers.filter((p) => p.id !== id),
          })),

        addPrayerPoint: (point, { isNew = false } = {}) => {
          const newPoint = {
            id: point.id ?? blankId(EntityType.PrayerPoint),
            ...point,
            isNew,
          } as PrayerPoint;

          set((state) => {
            const upsert = (points: PrayerPoint[]) => {
              const index = points.findIndex((p) => p.id === newPoint.id);
              const updated = [...points];
              if (index >= 0) {
                updated[index] = { ...updated[index], ...newPoint };
              } else {
                updated.push(newPoint);
              }
              return sortPrayersByDate(updated) as PrayerPoint[];
            };

            return {
              prayerPoints: upsert(state.prayerPoints),
              filteredPrayerPoints: upsert(state.filteredPrayerPoints),
            };
          });
        },

        updatePrayerPoint: (id, updates) =>
          set((state) => ({
            prayerPoints: state.prayerPoints.map((p) =>
              p.id === id ? { ...p, ...updates } : p,
            ),
            filteredPrayerPoints: state.filteredPrayerPoints.map((p) =>
              p.id === id ? { ...p, ...updates } : p,
            ),
          })),

        removePrayerPoint: (id) =>
          set((state) => ({
            prayerPoints: state.prayerPoints.filter((p) => p.id !== id),
            filteredPrayerPoints: state.filteredPrayerPoints.filter(
              (p) => p.id !== id,
            ),
          })),

        setTopics: (topics, { isNew = false } = {}) => {
          // Safety check for topics parameter
          if (!Array.isArray(topics)) {
            console.warn('setTopics: topics parameter is not an array', topics);
            return;
          }

          set({
            topics: topics.map((t) => ({ ...t, isNew })),
            filteredPrayerTopics: topics.map((t) => ({ ...t, isNew })),
          });
        },

        addTopic: (topic, { isNew = false } = {}) =>
          set((state) => ({
            topics: [...state.topics, { ...topic, isNew }],
            filteredPrayerTopics: [
              ...state.filteredPrayerTopics,
              { ...topic, isNew },
            ],
          })),

        updateTopic: (id, updates) =>
          set((state) => ({
            topics: state.topics.map((t) =>
              t.id === id ? { ...t, ...updates } : t,
            ),
            filteredPrayerTopics: state.filteredPrayerTopics.map((t) =>
              t.id === id ? { ...t, ...updates } : t,
            ),
          })),

        setSelectedTopicId: (id) => set({ selectedTopicId: id }),

        getRemovedTopicIds: (pointId, newTopics) => {
          const existing = get().prayerPoints.find((p) => p.id === pointId);
          const oldTopicIds = (existing?.linkedTopics ?? []).map(
            (t: string) => t,
          );

          // Safety check for newTopics parameter
          if (!Array.isArray(newTopics)) {
            console.warn(
              'getRemovedTopicIds: newTopics parameter is not an array',
              newTopics,
            );
            return oldTopicIds;
          }

          const newTopicIds = newTopics.map((t: string) => t);
          return oldTopicIds.filter((id: string) => !newTopicIds.includes(id));
        },

        resetStore: () =>
          set({
            prayers: [],
            prayerPoints: [],
            topics: [],
            selectedTopicId: undefined,
            filteredPrayers: [],
            filteredPrayerPoints: [],
            filteredPrayerTopics: [],
            userPPandTopicsWithContextEmbeddings: [],
          }),
      }),
      {
        name: 'prayer-store',
        storage: asyncStorageAdapter,
        onRehydrateStorage: () => (state) => {
          console.log('Store rehydrated:', state ? 'success' : 'failed');
        },
        skipHydration: false,
        version: 1,
      },
    ),
  ),
);

// Enhanced compatibility hook that integrates with auth context
export const usePrayerCollectionWithAuth = () => {
  // Use specific selectors to ensure proper subscription
  const prayers = usePrayerStore((state) => state.prayers);
  const prayerPoints = usePrayerStore((state) => state.prayerPoints);
  const topics = usePrayerStore((state) => state.topics);
  const filteredPrayers = usePrayerStore((state) => state.filteredPrayers);
  const filteredPrayerPoints = usePrayerStore(
    (state) => state.filteredPrayerPoints,
  );
  const filteredPrayerTopics = usePrayerStore(
    (state) => state.filteredPrayerTopics,
  );

  // Get store methods - use useCallback to make them stable
  const { user } = useAuthContext();

  // Extract store methods using useCallback to make them stable
  const storeLoadAll = useCallback((userId: string) => {
    usePrayerStore.getState().loadAll(userId);
  }, []);

  const storeLoadPrayers = useCallback((userId: string) => {
    usePrayerStore.getState().loadPrayers(userId);
  }, []);

  const storeLoadPrayerPoints = useCallback((userId: string) => {
    usePrayerStore.getState().loadPrayerPoints(userId);
  }, []);

  const storeLoadPrayerTopics = useCallback((userId: string) => {
    usePrayerStore.getState().loadPrayerTopics(userId);
  }, []);

  const storeSearchPrayers = useCallback((text: string) => {
    usePrayerStore.getState().searchPrayers(text);
  }, []);

  const storeUpdateCollection = useCallback(
    (updatedPrayer: AnyPrayerEntity, type: string) => {
      usePrayerStore.getState().updateCollection(updatedPrayer, type);
    },
    [],
  );

  const storeRemoveFromCollection = useCallback((id: string, type: string) => {
    usePrayerStore.getState().removeFromCollection(id, type);
  }, []);

  const storeGetPrayerTopicAndPoints = useCallback((id: string) => {
    return usePrayerStore.getState().getPrayerTopicAndPoints(id);
  }, []);

  const storeRefreshPrayerTopicAndPoints = useCallback(
    (id: string, user: User) => {
      usePrayerStore.getState().refreshPrayerTopicAndPoints(id, user);
    },
    [],
  );

  // Memoize the loading functions to make them stable
  const loadAll = useCallback(() => {
    if (user?.uid) {
      storeLoadAll(user.uid);
    }
  }, [storeLoadAll, user?.uid]);

  const loadPrayers = useCallback(() => {
    if (user?.uid) {
      storeLoadPrayers(user.uid);
    }
  }, [storeLoadPrayers, user?.uid]);

  const loadPrayerPoints = useCallback(() => {
    if (user?.uid) {
      storeLoadPrayerPoints(user.uid);
    }
  }, [storeLoadPrayerPoints, user?.uid]);

  const loadPrayerTopics = useCallback(() => {
    if (user?.uid) {
      storeLoadPrayerTopics(user.uid);
    }
  }, [storeLoadPrayerTopics, user?.uid]);

  const getPrayerTopicAndPoints = useCallback(
    (id: string) => {
      return storeGetPrayerTopicAndPoints(id);
    },
    [storeGetPrayerTopicAndPoints],
  );

  const refreshPrayerTopicAndPoints = useCallback(
    (id: string) => {
      if (user) {
        storeRefreshPrayerTopicAndPoints(id, user);
      }
    },
    [storeRefreshPrayerTopicAndPoints, user],
  );
  // Memoize the search and collection management functions
  const searchPrayers = useCallback(
    (text: string) => {
      storeSearchPrayers(text);
    },
    [storeSearchPrayers],
  );

  const updateCollection = useCallback(
    (updatedPrayer: AnyPrayerEntity, type: string) => {
      storeUpdateCollection(updatedPrayer, type);
    },
    [storeUpdateCollection],
  );

  const removeFromCollection = useCallback(
    (id: string, type: string) => {
      storeRemoveFromCollection(id, type);
    },
    [storeRemoveFromCollection],
  );

  // Memoize the return value to prevent infinite re-renders
  return useMemo(() => {
    // Compute userPPandTopicsWithContextEmbeddings directly to avoid circular dependency
    const pointsWithEmbeddings = prayerPoints.filter(
      (pp) =>
        Array.isArray(pp.contextAsEmbeddings) &&
        pp.contextAsEmbeddings.length > 0,
    );
    const topicsWithEmbeddings = topics.filter(
      (pt) =>
        Array.isArray(pt.contextAsEmbeddings) &&
        pt.contextAsEmbeddings.length > 0,
    );
    const userPPandTopicsWithContextEmbeddings = [
      ...pointsWithEmbeddings,
      ...topicsWithEmbeddings,
    ];

    return {
      // Data
      userPrayers: prayers,
      userPrayerPoints: prayerPoints,
      userPrayerTopics: topics,
      filteredUserPrayers: filteredPrayers,
      filteredUserPrayerPoints: filteredPrayerPoints,
      filteredUserPrayerTopics: filteredPrayerTopics,
      userPPandTopicsWithContextEmbeddings,

      // Loading functions with auth integration
      loadAll,
      loadPrayers,
      loadPrayerPoints,
      loadPrayerTopics,
      getPrayerTopicAndPoints,
      refreshPrayerTopicAndPoints,
      // Search and collection management
      searchPrayers,
      updateCollection,
      removeFromCollection,
    };
  }, [
    prayers,
    prayerPoints,
    topics,
    filteredPrayers,
    filteredPrayerPoints,
    filteredPrayerTopics,
    loadAll,
    loadPrayers,
    loadPrayerPoints,
    loadPrayerTopics,
    getPrayerTopicAndPoints,
    refreshPrayerTopicAndPoints,
    searchPrayers,
    updateCollection,
    removeFromCollection,
  ]);
};
