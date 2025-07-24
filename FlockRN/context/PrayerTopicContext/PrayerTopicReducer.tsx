import { db } from '@/firebase/firebaseConfig';
import { blankPrayerTopic } from '@/types/blankStateModels';
import { EditMode } from '@/types/ComponentProps';
import { PrayerTopic } from '@shared/types/firebaseTypes';
import { doc, collection } from 'firebase/firestore';
import { User } from 'firebase/auth';

// types/PrayerTopicReducer.ts
type PrayerTopicAction =
  | { type: 'SET_PRAYER_TOPIC'; payload: PrayerTopic }
  | {
      type: 'UPDATE_PRAYER_TOPIC';
      payload: { id: string; data: Partial<PrayerTopic> };
    }
  | { type: 'ADD_BLANK_PRAYER_TOPIC'; payload: string }
  | { type: 'SET_EDIT_MODE'; payload: EditMode }
  | { type: 'RESET'; payload: User }
  | { type: 'SET_IS_ALREADY_LOADED'; payload: boolean };

interface PrayerTopicState {
  prayerTopic: PrayerTopic;
  editMode: EditMode;
  isAlreadyLoaded: boolean;
}

// Lazy initialization to avoid creating Firestore references unnecessarily
const createInitialPrayerTopic = (user: User, id?: string) => {
  const topicId = id || doc(collection(db, 'prayerTopics')).id;
  return blankPrayerTopic(user, topicId);
};

const initialPrayerTopicState = (user: User): PrayerTopicState => ({
  prayerTopic: createInitialPrayerTopic(user),
  editMode: EditMode.EDIT,
  isAlreadyLoaded: false,
});

function prayerTopicReducer(
  state: PrayerTopicState,
  action: PrayerTopicAction,
): PrayerTopicState {
  switch (action.type) {
    case 'SET_PRAYER_TOPIC':
      return { ...state, prayerTopic: action.payload };
    case 'UPDATE_PRAYER_TOPIC': {
      return {
        ...state,
        prayerTopic: {
          ...state.prayerTopic,
          ...action.payload.data,
        },
      };
    }
    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };
    case 'RESET':
      return initialPrayerTopicState(action.payload);
    case 'SET_IS_ALREADY_LOADED':
      return { ...state, isAlreadyLoaded: action.payload };
    default:
      return state;
  }
}

export {
  prayerTopicReducer,
  initialPrayerTopicState,
  createInitialPrayerTopic,
  PrayerTopicAction,
  PrayerTopicState,
};
