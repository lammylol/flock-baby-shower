import {
  AnyPrayerEntity,
  LinkedPrayerEntity,
  Prayer,
  PrayerPoint,
  PrayerTopic,
} from '@shared/types/firebaseTypes';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';

interface PrayerCollectionContextType {
  userPrayers: Prayer[];
  userPrayerPoints: PrayerPoint[];
  userPrayerTopics: PrayerTopic[];
  userPPandTopicsWithContextEmbeddings: LinkedPrayerEntity[];
  filteredUserPrayers: Prayer[];
  filteredUserPrayerPoints: PrayerPoint[];
  filteredUserPrayerTopics: PrayerTopic[];
  loadAll: () => void;
  loadPrayers: () => void;
  loadPrayerPoints: () => void;
  loadPrayerTopics: () => void;
  searchPrayers: (text: string) => void;
  updateCollection: (updatedPrayer: AnyPrayerEntity, type: string) => void;
  removeFromCollection: (id: string, type: string) => void;
}

// Hook that provides the same interface as before
export const usePrayerCollection = (): PrayerCollectionContextType => {
  // Use the store-based hook directly
  return usePrayerCollectionWithAuth();
};
