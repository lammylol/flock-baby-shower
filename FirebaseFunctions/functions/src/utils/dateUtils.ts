import { Timestamp } from "firebase-admin/firestore";

export function getDateString(
  timestamp: Timestamp | string | number | Date | null | undefined
): string {
  if (!timestamp) return 'Unknown Date';

  let date: Date;

  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    // Firestore Timestamp
    date = (timestamp as Timestamp).toDate();
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'Unknown Date';
  }

  if (isNaN(date.getTime())) return 'Invalid Date';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-indexed
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}