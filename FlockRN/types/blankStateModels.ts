import { collection, doc, Timestamp } from 'firebase/firestore';
import {
  BasePrayerEntity,
  Prayer,
  PrayerPoint,
  PrayerTopic,
} from '../../shared/types/firebaseTypes';
import { EntityType, PrayerType } from './PrayerSubtypes';
import { db } from '@/firebase/firebaseConfig';
import { User } from 'firebase/auth';

export const blankId = (entityType: EntityType) => {
  switch (entityType) {
    case EntityType.Prayer:
      return doc(collection(db, 'prayers')).id;
    case EntityType.PrayerPoint:
      return doc(collection(db, 'prayerPoints')).id;
    case EntityType.PrayerTopic:
      return doc(collection(db, 'prayerTopics')).id;
    default:
      return doc(collection(db, 'prayerPoints')).id;
  }
};

// Assume you have a way to get the current user
const blankBaseEntity = (
  user: User,
  overrides?: Partial<BasePrayerEntity>,
): BasePrayerEntity => ({
  id: blankId(overrides?.entityType ?? EntityType.Prayer),
  // these will always be replaced by firestore by the time of creation. unless user has multiple not-posted prayers at a time, there's little risk.
  content: '',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  authorId: user?.uid ?? 'unknown',
  authorName: user?.displayName ?? 'Unknown',
  privacy: 'private', // or 'private', depending on your default
  entityType: EntityType.Prayer, // or dynamically set
  isNew: true,
  ...overrides,
});

export const blankPrayer = (user: User): Prayer => ({
  ...blankBaseEntity(user, { entityType: EntityType.Prayer }),
  prayerPoints: [],
});

export const blankPrayerPoint = (user: User, id?: string): PrayerPoint => ({
  ...blankBaseEntity(user, { id: id, entityType: EntityType.PrayerPoint }),
  title: '',
  prayerType: PrayerType.Request, // or default value
  tags: [PrayerType.Request],
  recipients: [
    {
      name: 'User',
      id: 'unknown',
    },
  ],
});

export const blankPrayerTopic = (user: User, id?: string): PrayerTopic => ({
  ...blankBaseEntity(user, { id: id, entityType: EntityType.PrayerTopic }),
  title: '',
  prayerTypes: [],
  status: 'open', // or default status
  recipients: [
    {
      name: 'User',
      id: 'unknown',
    },
  ],
  journey: [],
});
