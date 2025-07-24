import { config } from "../config";
// @ts-expect-error: Shared types may not be available in local dev environment
import type { Prayer, PrayerPoint, PrayerTopic } from '../../shared/types/firebaseTypes';
import { Timestamp } from 'firebase-admin/firestore';

const now = Timestamp.now();

// === Mock Data ===
export const testUser = {
  id: config.testUid,
  displayName: "Test User",
  email: "testuser@example.com",
  photoURL: "https://example.com/photo.jpg",
  createdAt: now,
};

export const testPrayerNew: Partial<Prayer> = {
  id: 'test-prayer-id-1',
  title: "Test Prayer",
  description: "This is a test prayer.",
  dummy: true,
};

export const testPrayer: Prayer = {
  id: 'test-prayer-id-2',
  title: "Test Prayer",
  description: "This is a test prayer.",
  authorId: config.testUid,
  createdAt: now,
  updatedAt: now,
  dummy: true,
};

export const testPrayerPointNew: Partial<PrayerPoint> = {
  id: 'test-point-id-new',
  title: "Test Point",
  description: "This is a test point.",
  dummy: true,
  prayerType: 'prayerRequest',
  isNew: true,
};

export const testPrayerTopic: PrayerTopic = {
  id: 'test-topic-id',
  title: "Test Topic",
  description: "This is a test topic.",
  authorId: config.testUid,
  createdAt: now,
  updatedAt: now,
  contextAsEmbeddings: [0.1, 0.2, 0.3],
  dummy: true,
};

export const testPrayerTopic2: PrayerTopic = {
  id: 'test-topic-id-2',
  title: "Test Topic 2",
  description: "This is a test topic 2.",
  authorId: config.testUid,
  createdAt: now,
  updatedAt: now,
  contextAsEmbeddings: [0.4, 0.5, 0.6],
  journey: [{ id: 'test-point-id-2', createdAt: now, entityType: 'prayerPoint' }],
  dummy: true,
};

export const testPrayerPoints: PrayerPoint[] = [
  {
    id: 'test-point-id-1',
    title: "Test Point 1",
    description: "This is the first test point.",
    authorId: config.testUid,
    contextAsEmbeddings: [0.1, 0.2, 0.3],
    createdAt: now,
    updatedAt: now,
    prayerType: 'prayerRequest',
    dummy: true,
  },
  {
    id: 'test-point-id-2',
    title: "Test Point 2",
    description: "This is the second test point.",
    authorId: config.testUid,
    contextAsEmbeddings: [0.4, 0.5, 0.6],
    createdAt: now,
    updatedAt: now,
    prayerType: 'praise',
    dummy: true,
  },
];

// export const testPrayerTopicExisting: PrayerTopic = {
//   id: 'test-topic-id-existing',
//   title: "Test Topic",
//   description: "This is a test topic.",
//   authorId: config.testUid,
//   createdAt: now,
//   updatedAt: now,
//   dummy: true,
// };