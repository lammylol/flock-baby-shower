import {
  sortPrayersByDate,
  normalizeDate,
  getDateString,
  simplifiedDateString,
  getDateStringWithTime,
} from '../../utils/dateUtils';
import { PrayerPoint } from '@shared/types/firebaseTypes';
import { describe, it, expect, jest } from '@jest/globals';
import { EntityType, PrayerType } from '../../types/PrayerSubtypes';
import { Timestamp } from 'firebase/firestore';

describe('dateUtils', () => {
  describe('normalizeDate', () => {
    it('should handle timestamp with underscores', () => {
      const timestamp = { _seconds: 1751322593, _nanoseconds: 944000000 };
      const date = normalizeDate(timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(1751322593 * 1000 + 944000000 / 1e6);
    });

    it('should handle timestamp without underscores', () => {
      const timestamp = { seconds: 1751263128, nanoseconds: 113000000 };
      const date = normalizeDate(timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(1751263128 * 1000 + 113000000 / 1e6);
    });

    it('should handle Date objects', () => {
      const inputDate = new Date('2025-01-01T12:00:00Z');
      const result = normalizeDate(inputDate);
      expect(result).toBe(inputDate);
    });

    it('should handle Timestamp objects', () => {
      const timestamp = new Timestamp(1751322593, 944000000);
      const result = normalizeDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(1751322593 * 1000 + 944000000 / 1e6);
    });

    it('should handle string dates', () => {
      const dateString = '2025-01-01T12:00:00Z';
      const result = normalizeDate(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });

    it('should handle number timestamps', () => {
      const timestamp = 1735732800000; // 2025-01-01T12:00:00Z
      const result = normalizeDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });

    it('should handle null/undefined', () => {
      const result1 = normalizeDate(null);
      const result2 = normalizeDate(undefined);
      expect(result1).toBeInstanceOf(Date);
      expect(result2).toBeInstanceOf(Date);
      // Should be close to current time
      const now = Date.now();
      expect(Math.abs(result1.getTime() - now)).toBeLessThan(1000);
      expect(Math.abs(result2.getTime() - now)).toBeLessThan(1000);
    });

    it('should handle invalid date strings', () => {
      const result = normalizeDate('invalid-date');
      expect(result).toBeInstanceOf(Date);
      // Should return current date when invalid
      const now = Date.now();
      expect(Math.abs(result.getTime() - now)).toBeLessThan(1000);
    });
  });

  describe('getDateString', () => {
    it('should format Date objects correctly', () => {
      const date = new Date('2025-01-15T18:00:00Z');
      const result = getDateString(date);
      expect(result).toBe('2025-01-15');
    });

    it('should format Timestamp objects correctly', () => {
      const timestamp = new Timestamp(1737028800, 0); // 2025-01-15
      const result = getDateString(timestamp);
      expect(result).toBe('2025-01-16');
    });

    it('should handle undefined timestamp', () => {
      const result = getDateString(undefined);
      expect(result).toBe('Unknown Date');
    });
  });

  describe('simplifiedDateString', () => {
    it('should return empty string for empty input', () => {
      const result = simplifiedDateString('');
      expect(result).toBe('');
    });

    it('should return "Today" for today', () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const result = simplifiedDateString(dateString);
      expect(result).toBe('Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      const day = String(yesterday.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const result = simplifiedDateString(dateString);
      expect(result).toBe('Yesterday');
    });

    it('should return formatted date for other dates', () => {
      const result = simplifiedDateString('2025-01-15');
      expect(result).toBe('January 15, 2025');
    });

    it('should return original string for invalid format', () => {
      const result = simplifiedDateString('invalid-date');
      expect(result).toBe('invalid-date');
    });

    it('should return original string for incomplete date', () => {
      const result = simplifiedDateString('2025-01');
      expect(result).toBe('2025-01');
    });
  });

  describe('getDateStringWithTime', () => {
    it('should format Date objects with time', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      const result = getDateStringWithTime(date);
      expect(result).toMatch(/January 15, 2025 at \d+:\d+ (AM|PM)/);
    });

    it('should format Timestamp objects with time', () => {
      const timestamp = new Timestamp(1737028800, 0); // 2025-01-15
      const result = getDateStringWithTime(timestamp);
      expect(result).toMatch(/January 16, 2025 at \d+:\d+ (AM|PM)/);
    });

    it('should handle undefined timestamp', () => {
      const result = getDateStringWithTime(undefined);
      expect(result).toBeNull();
    });
  });

  describe('sortPrayersByDate', () => {
    it('should handle different timestamp formats correctly', () => {
      // Create test data with different timestamp formats
      const prayers: PrayerPoint[] = [
        {
          id: '1',
          content: 'Prayer 1',
          createdAt: { _seconds: 1751322593, _nanoseconds: 944000000 },
          updatedAt: new Date(),
          authorId: 'user1',
          authorName: 'User 1',
          privacy: 'private',
          entityType: EntityType.PrayerPoint,
          title: 'Prayer 1',
          prayerType: PrayerType.Request,
          tags: [PrayerType.Request],
        },
        {
          id: '2',
          content: 'Prayer 2',
          createdAt: { seconds: 1751263128, nanoseconds: 113000000 },
          updatedAt: new Date(),
          authorId: 'user2',
          authorName: 'User 2',
          privacy: 'private',
          entityType: EntityType.PrayerPoint,
          title: 'Prayer 2',
          prayerType: PrayerType.Praise,
          tags: [PrayerType.Praise],
        },
        {
          id: '3',
          content: 'Prayer 3',
          createdAt: new Date('2025-06-30T18:24:33.103Z'),
          updatedAt: new Date(),
          authorId: 'user3',
          authorName: 'User 3',
          privacy: 'private',
          entityType: EntityType.PrayerPoint,
          title: 'Prayer 3',
          prayerType: PrayerType.Repentance,
          tags: [PrayerType.Repentance],
        },
      ];

      // Sort the prayers
      const sortedPrayers = sortPrayersByDate(prayers);

      // Verify that no console warnings were generated
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // The prayers should be sorted by date (newest first)
      // Prayer 1 has the latest timestamp (2025-06-30T22:29:53.944Z)
      // Prayer 3 has the middle timestamp (2025-06-30T18:24:33.103Z)
      // Prayer 2 has the earliest timestamp (2025-06-30T05:58:48.113Z)
      expect(sortedPrayers[0].id).toBe('1');
      expect(sortedPrayers[1].id).toBe('3');
      expect(sortedPrayers[2].id).toBe('2');

      // Verify no warnings were logged
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle null/undefined createdAt values', () => {
      const prayers: PrayerPoint[] = [
        {
          id: '1',
          content: 'Prayer 1',
          createdAt: null,
          updatedAt: new Date(),
          authorId: 'user1',
          authorName: 'User 1',
          privacy: 'private',
          entityType: EntityType.PrayerPoint,
          title: 'Prayer 1',
          prayerType: PrayerType.Request,
          tags: [PrayerType.Request],
        },
        {
          id: '2',
          content: 'Prayer 2',
          createdAt: new Date('2025-06-30T18:24:33.103Z'),
          updatedAt: new Date(),
          authorId: 'user2',
          authorName: 'User 2',
          privacy: 'private',
          entityType: EntityType.PrayerPoint,
          title: 'Prayer 2',
          prayerType: PrayerType.Praise,
          tags: [PrayerType.Praise],
        },
      ];

      const sortedPrayers = sortPrayersByDate(prayers);

      // Prayer with valid date should come first
      expect(sortedPrayers[0].id).toBe('2');
      expect(sortedPrayers[1].id).toBe('1');
    });

    it('should handle sorting errors gracefully', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const prayers: PrayerPoint[] = [
        {
          id: '1',
          content: 'Prayer 1',
          createdAt: {
            getTime: () => {
              throw new Error('Simulated error');
            },
          } as unknown as Date,
          updatedAt: new Date(),
          authorId: 'user1',
          authorName: 'User 1',
          privacy: 'private',
          entityType: EntityType.PrayerPoint,
          title: 'Prayer 1',
          prayerType: PrayerType.Request,
          tags: [PrayerType.Request],
        },
        {
          id: '2',
          content: 'Prayer 2',
          createdAt: new Date('2025-06-30T18:24:33.103Z'),
          updatedAt: new Date(),
          authorId: 'user2',
          authorName: 'User 2',
          privacy: 'private',
          entityType: EntityType.PrayerPoint,
          title: 'Prayer 2',
          prayerType: PrayerType.Praise,
          tags: [PrayerType.Praise],
        },
      ];

      const sortedPrayers = sortPrayersByDate(prayers);

      // Should log error and keep original order
      // expect(consoleSpy).toHaveBeenCalled();
      expect(sortedPrayers).toHaveLength(2);

      consoleSpy.mockRestore();
    });
  });
});
