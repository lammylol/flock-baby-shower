import { blankPrayer } from '@/types/blankStateModels';
import { EditMode } from '@/types/ComponentProps';
import {
  Prayer,
  PrayerPoint,
  LinkedPrayerPointPair,
  SimilarPrayersPair,
} from '@shared/types/firebaseTypes';
import { User } from 'firebase/auth';

type PrayerMetadataAction =
  | { type: 'SET_PRAYER'; payload: Prayer }
  | { type: 'UPDATE_PRAYER'; payload: Partial<Prayer> }
  | { type: 'ADD_BLANK_PRAYER_POINT'; payload: { user: User; id: string } }
  | { type: 'SET_PRAYER_POINTS'; payload: PrayerPoint[] }
  | {
      type: 'UPDATE_PRAYER_POINT';
      payload: { id: string; data: Partial<PrayerPoint> };
    }
  | {
      type: 'REMOVE_PRAYER_POINT_LOCALLY';
      payload: { id: string };
    }
  | { type: 'SET_SIMILAR_PRAYERS'; payload: SimilarPrayersPair[] }
  | { type: 'SET_EDIT_MODE'; payload: EditMode }
  | { type: 'RESET'; payload: User }
  | {
      type: 'ADD_TOPIC_LINK';
      payload: { topicId: string; title: string; prayerPoint: PrayerPoint };
    }
  | {
      type: 'REMOVE_TOPIC_LINK';
      payload: { topicId: string; prayerPoint: PrayerPoint };
    };

interface PrayerMetadataState {
  prayer: Prayer;
  prayerPoints: PrayerPoint[];
  linkedPrayerPairs: LinkedPrayerPointPair[];
  similarPrayerPairs: SimilarPrayersPair[];
  editMode: EditMode;
  isAlreadyLoaded: boolean;
}

const initialState = (user: User): PrayerMetadataState => ({
  prayer: blankPrayer(user),
  prayerPoints: [],
  linkedPrayerPairs: [],
  similarPrayerPairs: [],
  editMode: EditMode.EDIT,
  isAlreadyLoaded: false,
});

function prayerMetadataReducer(
  state: PrayerMetadataState,
  action: PrayerMetadataAction,
): PrayerMetadataState {
  switch (action.type) {
    case 'SET_PRAYER':
      return { ...state, prayer: action.payload };
    case 'UPDATE_PRAYER':
      return {
        ...state,
        prayer: {
          ...state.prayer,
          ...action.payload,
          prayerPoints:
            action.payload.prayerPoints ?? state.prayer.prayerPoints,
        },
      };
    case 'SET_PRAYER_POINTS':
      return { ...state, prayerPoints: action.payload };

    case 'UPDATE_PRAYER_POINT': {
      return {
        ...state,
        prayerPoints: state.prayerPoints.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.data } : p,
        ),
      };
    }
    case 'REMOVE_PRAYER_POINT_LOCALLY': {
      const id = action.payload.id;

      return {
        ...state,
        prayerPoints: state.prayerPoints.filter((p) => p.id !== id),
        linkedPrayerPairs: state.linkedPrayerPairs.filter(
          (pair) => pair.prayerPoint.id !== id && pair.originPrayer?.id !== id,
        ),
        similarPrayerPairs: state.similarPrayerPairs.filter(
          (pair) => pair.prayerPoint.id !== id,
        ),
      };
    }

    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };
    case 'RESET':
      return initialState(action.payload);

    case 'ADD_TOPIC_LINK': {
      const { topicId, prayerPoint } = action.payload;

      return {
        ...state,
        prayerPoints: state.prayerPoints.map((point) => {
          if (point.id !== prayerPoint.id) return point;

          const existingTopics = (point.linkedTopics ?? []) as string[];
          const alreadyLinked = existingTopics.some((t) => t === topicId);

          const updatedLinkedTopics = alreadyLinked
            ? existingTopics
            : [...existingTopics, topicId];

          return {
            ...point,
            linkedTopics: updatedLinkedTopics,
          };
        }),
      };
    }

    case 'REMOVE_TOPIC_LINK': {
      const { topicId, prayerPoint } = action.payload;

      return {
        ...state,
        prayerPoints: state.prayerPoints.map((point) => {
          const existingTopics = (point.linkedTopics ?? []) as string[];

          if (point.id !== prayerPoint.id) return point;

          const updatedLinkedTopics = existingTopics.filter(
            (t) => t !== topicId,
          );

          return {
            ...point,
            linkedTopics: updatedLinkedTopics,
          };
        }),
      };
    }

    case 'SET_SIMILAR_PRAYERS':
      return {
        ...state,
        similarPrayerPairs: action.payload,
      };

    default:
      return state;
  }
}

export {
  prayerMetadataReducer,
  initialState,
  PrayerMetadataAction,
  PrayerMetadataState,
};
