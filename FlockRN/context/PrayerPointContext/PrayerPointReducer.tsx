import { db } from '@/firebase/firebaseConfig';
import { blankPrayerPoint } from '@/types/blankStateModels';
import { EditMode } from '@/types/ComponentProps';
import {
  PrayerPoint,
  LinkedPrayerPointPair,
  SimilarPrayersPair,
} from '@shared/types/firebaseTypes';
import { collection, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';

// types/PrayerPointReducer.ts
type PrayerPointAction =
  | { type: 'SET_PRAYER_POINT'; payload: PrayerPoint }
  | {
      type: 'UPDATE_PRAYER_POINT';
      payload: { id: string; data: Partial<PrayerPoint> };
    }
  | { type: 'ADD_BLANK_PRAYER_POINT'; payload: { user: User; id: string } }
  | { type: 'SET_PRAYER_POINTS'; payload: PrayerPoint[] }
  | { type: 'SET_LINKED_PAIRS'; payload: LinkedPrayerPointPair[] }
  | { type: 'ADD_LINKED_PAIR'; payload: LinkedPrayerPointPair }
  | { type: 'REMOVE_LINKED_PAIR'; payload: LinkedPrayerPointPair }
  | { type: 'SET_SIMILAR_PRAYERS'; payload: SimilarPrayersPair[] }
  | { type: 'ADD_SIMILAR_PRAYERS'; payload: SimilarPrayersPair }
  | { type: 'UPDATE_SIMILAR_PRAYERS'; payload: SimilarPrayersPair }
  | { type: 'SET_EDIT_MODE'; payload: EditMode }
  | { type: 'RESET'; payload: User }
  | {
      type: 'ADD_TOPIC_LINK';
      payload: { topicId: string; title: string };
    }
  | {
      type: 'REMOVE_TOPIC_LINK';
      payload: { topicId: string; title: string };
    }
  | { type: 'SET_IS_ALREADY_LOADED'; payload: boolean };

interface PrayerPointState {
  prayerPoint: PrayerPoint;
  linkedPrayerPairs: LinkedPrayerPointPair[];
  editMode: EditMode;
  similarPrayers: SimilarPrayersPair[];
  isAlreadyLoaded: boolean;
}

const initialPrayerPointState = (user: User): PrayerPointState => ({
  prayerPoint: blankPrayerPoint(user, doc(collection(db, 'prayerPoints')).id),
  linkedPrayerPairs: [],
  editMode: EditMode.EDIT,
  similarPrayers: [],
  isAlreadyLoaded: false,
});

function prayerPointReducer(
  state: PrayerPointState,
  action: PrayerPointAction,
): PrayerPointState {
  switch (action.type) {
    case 'SET_PRAYER_POINT':
      return { ...state, prayerPoint: action.payload };
    case 'UPDATE_PRAYER_POINT': {
      return {
        ...state,
        prayerPoint: {
          ...state.prayerPoint,
          ...action.payload.data,
        },
      };
    }
    case 'SET_LINKED_PAIRS':
      return { ...state, linkedPrayerPairs: action.payload };
    case 'ADD_LINKED_PAIR':
      const newPair = action.payload;
      return {
        ...state,
        linkedPrayerPairs: [
          ...state.linkedPrayerPairs.filter(
            (pair) =>
              !(
                pair.originPrayer?.id === newPair.originPrayer?.id &&
                pair.prayerPoint.id === newPair.prayerPoint.id &&
                pair.topicTitle === newPair.topicTitle
              ),
          ),
          newPair,
        ],
      };

    case 'REMOVE_LINKED_PAIR':
      const pairToRemove = action.payload;
      return {
        ...state,
        linkedPrayerPairs: state.linkedPrayerPairs.filter(
          (pair) =>
            !(
              pair.originPrayer?.id === pairToRemove.originPrayer?.id &&
              pair.prayerPoint.id === pairToRemove.prayerPoint.id &&
              pair.topicTitle === pairToRemove.topicTitle
            ),
        ),
      };
    case 'ADD_TOPIC_LINK': {
      const { topicId } = action.payload;

      const existingTopics = (state.prayerPoint.linkedTopics ?? []) as string[];
      const alreadyLinked = existingTopics.some((t) => t === topicId);

      const updatedLinkedTopics = alreadyLinked
        ? existingTopics
        : [...existingTopics, topicId];

      return {
        ...state,
        prayerPoint: {
          ...state.prayerPoint,
          linkedTopics: updatedLinkedTopics,
        },
      };
    }

    case 'REMOVE_TOPIC_LINK': {
      const { topicId } = action.payload;
      const existingTopics = (state.prayerPoint.linkedTopics ?? []) as string[];

      const updatedLinkedTopics = existingTopics.filter((t) => t !== topicId);

      return {
        ...state,
        prayerPoint: {
          ...state.prayerPoint,
          linkedTopics: updatedLinkedTopics,
        },
      };
    }
    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };
    case 'RESET':
      return initialPrayerPointState(action.payload);
    case 'SET_IS_ALREADY_LOADED':
      return { ...state, isAlreadyLoaded: action.payload };
    case 'SET_SIMILAR_PRAYERS':
      return { ...state, similarPrayers: action.payload };
    case 'ADD_SIMILAR_PRAYERS':
      return {
        ...state,
        similarPrayers: [
          ...state.similarPrayers.filter(
            (pair) =>
              !(
                pair.prayerPoint.id === action.payload.prayerPoint.id &&
                pair.similarPrayer.id === action.payload.similarPrayer.id
              ),
          ),
          action.payload,
        ],
      };
    case 'UPDATE_SIMILAR_PRAYERS':
      return {
        ...state,
        similarPrayers: state.similarPrayers.map((pair) => {
          if (
            pair.prayerPoint.id === action.payload.prayerPoint.id &&
            pair.similarPrayer.id === action.payload.similarPrayer.id
          ) {
            return {
              ...pair,
              ...action.payload,
            };
          }
          return pair;
        }),
      };
    default:
      return state;
  }
}

export {
  prayerPointReducer,
  initialPrayerPointState,
  PrayerPointAction,
  PrayerPointState,
};
