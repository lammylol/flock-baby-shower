// ramon jiang
// 1/29/25
// set all types for Firebase
import type { EntityType, PrayerType, Privacy, Status } from '../../FlockRN/types/PrayerSubtypes';

// Use a fallback type for Timestamp if firebase/firestore types are not available
// Remove the direct import to avoid module resolution errors
// import { FieldValue, Timestamp } from 'firebase/firestore';
type Timestamp = any;
type FieldValue = any;

// ===== UserProfiles =====

export interface UserProfile {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  createdAt: Timestamp;
  friends: string[];
  groups: string[];
  // used for searching
  normalizedUsername: string;
  normalizedFirstName: string;
  normalizedLastName: string;
}

export interface UserProfileResponse extends UserProfile {
  id: string;
}

// ===== Friends =====

export interface FriendRequest {
  userId: string;
  username: string;
  displayName: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Timestamp;
}

export interface Group {
  name: string;
  description: string;
  admins: string[];
  members: string[];
  createdAt: Timestamp;
}

// ===== Base Type =====
export interface BasePrayerEntity {
  id: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  authorId: string;
  authorName: string;
  privacy: Privacy;
  entityType: EntityType;
  isNew?: boolean;
}

// ===== Specific Entities =====
export interface Prayer extends BasePrayerEntity {
  linkedTopics?: string[] | FieldValue; // linked topics. id of topic.
  prayerPoints?: PrayerPoint[]; // could have no prayer points
  audioLocalPath?: string;
  audioRemotePath?: string;
  audioDuration?: number;
  whoPrayed?: Recipient[]; // same type as a recipient.
}

export interface PrayerPoint extends BasePrayerEntity {
  title: string;
  prayerId?: string | string[];
  prayerType: PrayerType;
  tags: PrayerType[];
  linkedTopics?: string[] | FieldValue; // linked topics. id of topic.
  recipients?: Recipient[];
  contextAsStrings?: string | FieldValue;
  contextAsEmbeddings?: number[] | FieldValue;
}

export interface PrayerTopic extends BasePrayerEntity {
  title: string;
  endDate?: Timestamp;
  prayerTypes: PrayerType[];
  status: Status;
  recipients?: Recipient[];
  journey: PrayerPointInTopicJourneyDTO[] | FieldValue; // prayer points in this topic
  contextAsEmbeddings?: number[] | FieldValue; // context embeddings - optional without AI
  aggregatedEmbedding?: number[] | FieldValue; // aggregated embedding - optional without AI
}

// ===== Other Types =====
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Timestamp;
}

export interface FeedPrayer {
  prayerId: string;
  addedAt: Timestamp;
}

// ==== DTOs for creating/updating ====
export type CreatePrayerDTO = Omit<
  Prayer,
  'id' | 'createdAt' | 'updatedAt' | 'prayerPoints' | 'entityType'
>;

export type UpdatePrayerDTO = Partial<
  Omit<Prayer, 'id' | 'createdAt' | 'updatedAt' | 'entityType'>
>;

export type CreatePrayerPointDTO = Omit<
  PrayerPoint,
  'id' | 'createdAt' | 'updatedAt' | 'entityType'
>;

export type UpdatePrayerPointDTO = Partial<
  Omit<PrayerPoint, 'id' | 'createdAt' | 'updatedAt' | 'entityType'>
>;

export type CreatePrayerTopicDTO = Omit<
  PrayerTopic,
  'id' | 'createdAt' | 'updatedAt' | 'entityType' | 'endDate'
>;

export type UpdatePrayerTopicDTO = Partial<
  Omit<PrayerTopic, 'id' | 'createdAt' | 'updatedAt' | 'entityType' | 'endDate'>
>;

// may want to refactor this in the future if document becomes too large.
export type PrayerPointInTopicJourneyDTO = Pick<
  PrayerPoint,
  | 'id'
  | 'prayerType'
  | 'title'
  | 'content'
  | 'createdAt'
  | 'authorId'
  | 'authorName'
  | 'recipients'
>;

export type PrayerPointInPrayerDTO = Pick<
  PrayerPoint,
  'id' | 'prayerType' | 'title' | 'recipients' | 'linkedTopics'
>;

export interface Recipient {
  name: string;
  id: string;
}

export type RecipientInPrayerDTO = Pick<PrayerPoint, 'recipients'>;

export type FlatPrayerTopicDTO = CreatePrayerTopicDTO | UpdatePrayerTopicDTO;
export type FlatPrayerPointDTO = CreatePrayerPointDTO | UpdatePrayerPointDTO;
export type AnyPrayerEntity = PrayerTopic | PrayerPoint | Prayer;
export type AnyPrayerEntityDTO = Omit<AnyPrayerEntity, 'id' | 'isNew'>;
export type LinkedPrayerEntity = PrayerTopic | PrayerPoint;

export type PartialLinkedPrayerEntity =
  | (Partial<PrayerPoint> & { similarity?: number })
  | (Partial<PrayerTopic> & { similarity?: number });

export interface ServiceResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
}

export type LinkedPrayerPointPair = {
  prayerPoint: PrayerPoint;
  originPrayer?: LinkedPrayerEntity | null;
  topicTitle?: string | null;
  topicId?: string | null;
};

export type SimilarPrayersPair = {
  prayerPoint: PrayerPoint;
  similarPrayer: PartialLinkedPrayerEntity;
  similarity?: number;
};

// ==== AI Analysis Result Type ====
export interface PrayerAnalysisResult {
  title: string;
  cleanedTranscription?: string;
  tags: PrayerType[];
  prayerPoints: PrayerPoint[];
}
