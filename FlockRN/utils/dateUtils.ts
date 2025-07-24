import { AnyPrayerEntity } from '@shared/types/firebaseTypes';
import { Timestamp } from 'firebase/firestore';

// Support Firestore Timestamp-like plain objects (both with and without underscores)
type TimestampLike = {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
};

const isTimestampLike = (input: unknown): input is TimestampLike =>
  typeof input === 'object' &&
  input !== null &&
  (('seconds' in input && 'nanoseconds' in input) ||
    ('_seconds' in input && '_nanoseconds' in input)) &&
  (typeof (input as TimestampLike).seconds === 'number' ||
    typeof (input as TimestampLike)._seconds === 'number') &&
  (typeof (input as TimestampLike).nanoseconds === 'number' ||
    typeof (input as TimestampLike)._nanoseconds === 'number');

const normalizeDate = (
  input: Date | Timestamp | TimestampLike | string | number | null | undefined,
): Date => {
  if (input instanceof Date) return input;

  if (input instanceof Timestamp) {
    return input.toDate();
  }

  if (isTimestampLike(input)) {
    // Handle both formats: with and without underscores
    const seconds = input.seconds ?? input._seconds ?? 0;
    const nanoseconds = input.nanoseconds ?? input._nanoseconds ?? 0;
    return new Date(seconds * 1000 + nanoseconds / 1e6);
  }

  const date = new Date(input ?? Date.now());
  return isNaN(date.getTime()) ? new Date() : date;
};

const getDateString = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return 'Unknown Date';

  const date = normalizeDate(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const simplifiedDateString = (dateString: string): string => {
  if (!dateString) return '';

  // Safely parse "YYYY-MM-DD" in local time
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-based
  const day = Number(dayStr);

  if (!year || !month || !day) return dateString;

  // Create date in **local time**
  const parsedDate = new Date(year, month - 1, day); // month is 0-indexed

  const now = new Date();

  const parsedLocal = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
  );
  const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = parsedLocal.getTime() - nowLocal.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';

  // Format using local time with 3-letter month abbreviation
  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getDateStringWithTime = (
  timestamp: Timestamp | Date | undefined,
): string | null => {
  if (!timestamp) return null; // Handle case if Timestamp is undefined

  const date = normalizeDate(timestamp);

  // Use a more efficient date formatting approach
  const year = date.getFullYear();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');

  return `${month} ${day}, ${year} at ${displayHour}:${displayMinute} ${ampm}`;
};

const getTimeString = (timestamp: Timestamp | Date | undefined): string => {
  if (!timestamp) return '';
  const date = normalizeDate(timestamp);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');

  return `${displayHour}:${displayMinute} ${ampm}`;
};

// Helper function to sort prayers by createdAt in descending order (newest first)
const sortPrayersByDate = (prayers: AnyPrayerEntity[]): AnyPrayerEntity[] => {
  return [...prayers].sort((a, b) => {
    if (!a?.createdAt && !b?.createdAt) return 0;
    if (!a?.createdAt) return 1;
    if (!b?.createdAt) return -1;
    try {
      // Use the normalizeDate function to handle all timestamp formats consistently
      const dateA = normalizeDate(a.createdAt);
      const dateB = normalizeDate(b.createdAt);

      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    } catch (error) {
      console.error('Error sorting prayers:', error, {
        prayerA: a.id,
        prayerB: b.id,
        createdAtA: a.createdAt,
        createdAtB: b.createdAt,
      });
      return 0; // Keep original order on error
    }
  });
};

export {
  normalizeDate,
  getDateString,
  getDateStringWithTime,
  simplifiedDateString,
  sortPrayersByDate,
  getTimeString,
};
