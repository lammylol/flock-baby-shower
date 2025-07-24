import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import {
  AnyPrayerEntity,
  LinkedPrayerEntity,
  PrayerPointInTopicJourneyDTO,
  PrayerTopic,
} from '@shared/types/firebaseTypes';
import { prayerTagDisplayNames } from '@/types/Tag';
import {
  getDateString,
  normalizeDate,
  simplifiedDateString,
} from '../dateUtils';

/**
 * Returns the prayer type of a given prayer entity.
 *
 * @param prayer - The entity (such as a prayer, prayer point, or topic) from which to extract the prayer type.
 * @returns The prayer type if present, otherwise undefined.
 */
export function getPrayerType(prayer: AnyPrayerEntity): PrayerType | undefined {
  if ('prayerType' in prayer) {
    return prayer.prayerType;
  }
  return undefined; // Return undefined if it's not a PrayerPoint
}

/**
 * Returns the prayer type of a given prayer entity.
 *
 * @param prayer - The prayer entity to extract the prayer type from.
 * @returns The prayer type if present, otherwise undefined.
 */
export function getLatestTopicUpdate(topic: PrayerTopic): {
  title: string;
  prayerType: string | undefined;
} {
  if (
    !topic.journey ||
    !Array.isArray(topic.journey) ||
    topic.journey.length === 0
  ) {
    return { title: '', prayerType: undefined };
  }
  const journeyArr = topic.journey as PrayerPointInTopicJourneyDTO[];

  const latestJourney = journeyArr.reduce((latest, current) => {
    const latestDate = normalizeDate(latest.createdAt);
    const currentDate = normalizeDate(current.createdAt);
    return currentDate > latestDate ? current : latest;
  }, journeyArr[0]);

  return {
    title: latestJourney.title ?? '',
    prayerType: latestJourney.prayerType,
  };
}

/**
 * Returns the latest update information for a given prayer topic.
 *
 * @param topic - The PrayerTopic object to extract the latest journey update from.
 * @returns An object containing the latest title and prayerType from the topic's journey.
 */
export function getPrayerCardHeaderInfo(
  entityType: EntityType,
  prayer: AnyPrayerEntity,
  prayerType: PrayerType,
) {
  const isPrayerPoint = entityType === EntityType.PrayerPoint;
  const isPrayerTopic = entityType === EntityType.PrayerTopic;
  const isPrayer = entityType === EntityType.Prayer;
  let latestTopicUpdate:
    | { title: string; prayerType: string | undefined }
    | undefined;

  const title = isPrayerTopic
    ? `#${(prayer as PrayerTopic).title}`
    : isPrayerPoint || isPrayer
      ? (prayer as LinkedPrayerEntity).title
      : 'Prayer';

  if (isPrayerTopic) {
    latestTopicUpdate = getLatestTopicUpdate(prayer as PrayerTopic);
  }

  const subtitle = isPrayerPoint
    ? prayerTagDisplayNames[prayerType]?.charAt(0).toUpperCase() +
      prayerTagDisplayNames[prayerType]?.slice(1)
    : isPrayerTopic
      ? `${simplifiedDateString(getDateString(prayer.updatedAt)) ?? 'Topic'} • ${
          latestTopicUpdate?.title !== ''
            ? latestTopicUpdate?.title
            : prayer.content
        } `
      : undefined;

  const iconType = isPrayerPoint
    ? prayerType
    : getLatestTopicUpdate(prayer as PrayerTopic).prayerType;

  return {
    isPrayer,
    isPrayerPoint,
    isPrayerTopic,
    title,
    subtitle,
    iconType,
  };
}
