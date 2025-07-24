import { PrayerTopic } from '@shared/types/firebaseTypes';
import { EntityType } from '@/types/PrayerSubtypes';
import { blankPrayerTopic } from '@/types/blankStateModels';
import { PrayerTopicAction } from './PrayerTopicReducer';
import { User } from 'firebase/auth';

export interface PrayerTopicDispatch {
  // ==== LOCAL STATE ===
  handlePrayerTopicUpdate: (id: string, data: Partial<PrayerTopic>) => void;
  reset: () => void;
  // prayer topics
  setPrayerTopic: (p: PrayerTopic) => void;
  loadPrayerTopic: (id: string) => Promise<void>;
  setBlankPrayerTopic: (id: string) => void;
  setIsAlreadyLoaded: (isLoaded: boolean) => void;
  getPrayerTopicById: (id: string) => PrayerTopic;
}

export const prayerTopicDispatch = (
  dispatch: React.Dispatch<PrayerTopicAction>,
  user: User,
  userPrayerTopics: PrayerTopic[],
): PrayerTopicDispatch => {
  if (!user) {
    throw new Error('User must be authenticated to use PrayerTopicDispatch');
  }

  // Set a prayer topic directly
  const setPrayerTopic = (p: PrayerTopic) => {
    dispatch({
      type: 'SET_PRAYER_TOPIC',
      payload: { ...p, entityType: EntityType.PrayerTopic },
    });
  };

  // Update a prayer topic by id
  const handlePrayerTopicUpdate = (id: string, data: Partial<PrayerTopic>) => {
    dispatch({
      type: 'UPDATE_PRAYER_TOPIC',
      payload: { id, data },
    });
  };

  // Reset state
  const reset = () => {
    dispatch({ type: 'RESET', payload: user });
  };

  // Load a prayer topic by id (from collection)
  const loadPrayerTopic = async (id: string) => {
    const topic = userPrayerTopics.find((t) => t.id === id);
    if (topic) {
      setPrayerTopic(topic);
      dispatch({ type: 'SET_IS_ALREADY_LOADED', payload: true });
    } else {
      // fallback: blank
      setBlankPrayerTopic(id);
      dispatch({ type: 'SET_IS_ALREADY_LOADED', payload: false });
    }
  };

  // Set a blank prayer topic with a given id
  const setBlankPrayerTopic = (id: string) => {
    if (!user) {
      throw new Error('User must be authenticated to set a blank prayer topic');
    }
    dispatch({
      type: 'SET_PRAYER_TOPIC',
      payload: blankPrayerTopic(user, id),
    });
  };

  // Set isAlreadyLoaded flag
  const setIsAlreadyLoaded = (isLoaded: boolean) => {
    dispatch({ type: 'SET_IS_ALREADY_LOADED', payload: isLoaded });
  };

  // Get a prayer topic by id from collection
  const getPrayerTopicById = (id: string): PrayerTopic => {
    return (
      userPrayerTopics.find((t) => t.id === id) ?? blankPrayerTopic(user, id)
    );
  };

  return {
    handlePrayerTopicUpdate,
    reset,
    setPrayerTopic,
    loadPrayerTopic,
    setBlankPrayerTopic,
    setIsAlreadyLoaded,
    getPrayerTopicById,
  };
};
