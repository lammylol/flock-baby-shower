import { useCallback, useEffect } from 'react';
import { usePrayerStore } from '@/hooks/zustand/prayerSlice/prayerStore';
import useAuthContext from '@/hooks/useAuthContext';
import { initializeAudioMode } from '@/utils/audioModeUtils';

/**
 * Component that initializes prayer data when the app starts
 * This replaces the need for the PrayerCollectionProvider
 */
export const DataInitializer = () => {
  const { user } = useAuthContext();
  const { loadAll } = usePrayerStore();

  const initializeData = useCallback(() => {
    if (user?.uid) {
      console.log('Initializing prayer data for user:', user.uid);
      loadAll(user.uid);
    }
  }, [user?.uid, loadAll]);

  const initializeApp = useCallback(async () => {
    try {
      // // Initialize audio mode first
      await initializeAudioMode();
      console.log('Audio mode initialized');

      // Then initialize prayer data
      initializeData();
    } catch (error) {
      console.error('Error during app initialization:', error);
    }
  }, [initializeData]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // This component doesn't render anything
  return null;
};
