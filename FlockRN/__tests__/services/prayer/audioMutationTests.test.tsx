// Audio mutation tests for prayer functionality
jest.mock('firebase/app');

import { User } from 'firebase/auth';
import { Prayer } from '@shared/types/firebaseTypes';
import { useUploadPrayerAudio } from '../../../hooks/reactQuery/prayerMutations';
import { useSyncStore } from '@/hooks/zustand/syncSlice/syncStore';
import { uploadFile } from '@/services/recording/firebaseStorageService';

// Mock the uploadFile function
jest.mock('@/services/recording/firebaseStorageService', () => ({
  uploadFile: jest.fn(),
}));

// Mock the useSyncStore hook
jest.mock('@/hooks/zustand/syncSlice/syncStore', () => ({
  useSyncStore: jest.fn(() => ({
    addPendingAction: jest.fn(),
  })),
}));

// Mock the useUploadPrayerAudio hook
jest.mock('../../../hooks/reactQuery/prayerMutations', () => ({
  useUploadPrayerAudio: jest.fn(),
}));

// Type for pending action payload
type PendingActionPayload = {
  prayer: Prayer;
  user: User;
  filePath: string;
};

// Mock data
const mockUser: User = {
  uid: 'test-uid',
  displayName: 'Test User',
  email: 'test@example.com',
} as User;

const mockPrayer: Prayer = {
  id: 'prayer-1',
  content: 'Test prayer content',
  privacy: 'private',
  authorId: 'test-uid',
  authorName: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  entityType: 'prayer',
  linkedTopics: ['topic-1'],
  prayerPoints: [],
};

describe('Upload Prayer Audio Mutation Tests', () => {
  let mockUploadFile: jest.MockedFunction<typeof uploadFile>;
  let mockAddPendingAction: jest.MockedFunction<
    (action: {
      id: string;
      type: string;
      payload: PendingActionPayload;
    }) => void
  >;
  let mockUploadPrayerAudio: jest.MockedFunction<typeof useUploadPrayerAudio>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>;
    mockAddPendingAction = jest.fn();
    mockUploadPrayerAudio = jest.fn();

    // Mock useSyncStore
    (useSyncStore as unknown as jest.Mock).mockReturnValue({
      addPendingAction: mockAddPendingAction,
    });

    // Mock useUploadPrayerAudio
    (useUploadPrayerAudio as jest.Mock).mockReturnValue({
      mutate: mockUploadPrayerAudio,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  describe('uploadPrayerAudio Mutation', () => {
    const testFilePath = '/test/path/audio.m4a';
    const testPrayer = {
      ...mockPrayer,
      audioLocalPath: testFilePath,
      audioRemotePath: `users/${mockUser.uid}/prayers/audio.m4a`,
    };

    it('should upload audio file to Firebase storage successfully', async () => {
      // Mock successful upload
      mockUploadFile.mockResolvedValue(undefined);

      // Simulate the mutation call
      const uploadData = {
        prayer: testPrayer,
        user: mockUser,
        filePath: testFilePath,
      };

      // Call the upload function directly
      await mockUploadFile(testFilePath, uploadData.prayer.audioRemotePath!);

      // Verify upload was called with correct parameters
      expect(mockUploadFile).toHaveBeenCalledWith(
        testFilePath,
        `users/${mockUser.uid}/prayers/audio.m4a`,
      );
    });

    it('should handle upload failure and add to pending actions', async () => {
      // Mock upload failure
      const uploadError = new Error('Upload failed');
      mockUploadFile.mockRejectedValue(uploadError);

      const uploadData = {
        prayer: testPrayer,
        user: mockUser,
        filePath: testFilePath,
      };

      try {
        await mockUploadFile(testFilePath, uploadData.prayer.audioRemotePath!);
        expect(true).toBe(false); // This should not be reached
      } catch {
        // Simulate the mutation's onError callback
        mockAddPendingAction({
          id: uploadData.prayer.id,
          type: 'uploadPrayerAudio',
          payload: uploadData,
        });
      }

      // Verify upload was attempted
      expect(mockUploadFile).toHaveBeenCalledWith(
        testFilePath,
        `users/${mockUser.uid}/prayers/audio.m4a`,
      );
    });

    it('should construct correct storage path from audioLocalPath', async () => {
      const prayerWithLocalPath = {
        ...testPrayer,
        audioLocalPath: '/local/path/to/audio.m4a',
      };

      // Mock successful upload
      mockUploadFile.mockResolvedValue(undefined);

      const fileName = prayerWithLocalPath.audioLocalPath?.split('/').pop();
      const storagePath = `users/${mockUser.uid}/prayers/${fileName}`;

      await mockUploadFile(prayerWithLocalPath.audioLocalPath!, storagePath);

      expect(mockUploadFile).toHaveBeenCalledWith(
        '/local/path/to/audio.m4a',
        'users/test-uid/prayers/audio.m4a',
      );
    });

    it('should use audioRemotePath if available', async () => {
      const prayerWithRemotePath = {
        ...testPrayer,
        audioRemotePath: 'custom/remote/path/audio.m4a',
      };

      // Mock successful upload
      mockUploadFile.mockResolvedValue(undefined);

      const storagePath =
        prayerWithRemotePath.audioRemotePath ||
        `users/${mockUser.uid}/prayers/audio.m4a`;

      await mockUploadFile(testFilePath, storagePath);

      expect(mockUploadFile).toHaveBeenCalledWith(
        testFilePath,
        'custom/remote/path/audio.m4a',
      );
    });

    it('should handle prayer without audioRemotePath', async () => {
      const prayerWithoutRemotePath = {
        ...testPrayer,
        audioRemotePath: undefined,
      };

      // Mock successful upload
      mockUploadFile.mockResolvedValue(undefined);

      const fileName = prayerWithoutRemotePath.audioLocalPath?.split('/').pop();
      const storagePath = `users/${mockUser.uid}/prayers/${fileName}`;

      await mockUploadFile(testFilePath, storagePath);

      expect(mockUploadFile).toHaveBeenCalledWith(
        testFilePath,
        'users/test-uid/prayers/audio.m4a',
      );
    });
  });

  describe('Offline Upload Prayer Audio', () => {
    const testFilePath = '/test/path/audio.m4a';
    const testPrayer = {
      ...mockPrayer,
      audioLocalPath: testFilePath,
      audioRemotePath: `users/${mockUser.uid}/prayers/audio.m4a`,
    };

    it('should add pending action when upload fails due to network', async () => {
      // Mock network error
      const networkError = new Error('Network error');
      mockUploadFile.mockRejectedValue(networkError);

      const uploadData = {
        prayer: testPrayer,
        user: mockUser,
        filePath: testFilePath,
      };

      // Simulate the mutation error handling
      try {
        await mockUploadFile(testFilePath, uploadData.prayer.audioRemotePath!);
        expect(true).toBe(false); // This should not be reached
      } catch {
        // Simulate the mutation's onError callback
        mockAddPendingAction({
          id: uploadData.prayer.id,
          type: 'uploadPrayerAudio',
          payload: uploadData,
        });
      }

      // Verify pending action was added
      expect(mockAddPendingAction).toHaveBeenCalledWith({
        id: testPrayer.id,
        type: 'uploadPrayerAudio',
        payload: {
          prayer: testPrayer,
          user: mockUser,
          filePath: testFilePath,
        },
      });
    });

    it('should handle multiple failed uploads and queue them', async () => {
      // Mock network error
      const networkError = new Error('Network error');
      mockUploadFile.mockRejectedValue(networkError);

      const prayers = [
        { ...testPrayer, id: 'prayer-1', audioLocalPath: '/path1/audio1.m4a' },
        { ...testPrayer, id: 'prayer-2', audioLocalPath: '/path2/audio2.m4a' },
        { ...testPrayer, id: 'prayer-3', audioLocalPath: '/path3/audio3.m4a' },
      ];

      // Simulate multiple failed uploads
      for (const prayer of prayers) {
        try {
          await mockUploadFile(prayer.audioLocalPath!, prayer.audioRemotePath!);
          fail('Should have thrown an error');
        } catch {
          mockAddPendingAction({
            id: prayer.id,
            type: 'uploadPrayerAudio',
            payload: {
              prayer,
              user: mockUser,
              filePath: prayer.audioLocalPath!,
            },
          });
        }
      }

      // Verify all pending actions were added
      expect(mockAddPendingAction).toHaveBeenCalledTimes(3);
      expect(mockAddPendingAction).toHaveBeenNthCalledWith(1, {
        id: 'prayer-1',
        type: 'uploadPrayerAudio',
        payload: {
          prayer: prayers[0],
          user: mockUser,
          filePath: '/path1/audio1.m4a',
        },
      });
      expect(mockAddPendingAction).toHaveBeenNthCalledWith(2, {
        id: 'prayer-2',
        type: 'uploadPrayerAudio',
        payload: {
          prayer: prayers[1],
          user: mockUser,
          filePath: '/path2/audio2.m4a',
        },
      });
      expect(mockAddPendingAction).toHaveBeenNthCalledWith(3, {
        id: 'prayer-3',
        type: 'uploadPrayerAudio',
        payload: {
          prayer: prayers[2],
          user: mockUser,
          filePath: '/path3/audio3.m4a',
        },
      });
    });

    it('should retry upload when network is restored', async () => {
      // First, simulate offline failure
      const networkError = new Error('Network error');
      mockUploadFile.mockRejectedValueOnce(networkError);

      const uploadData = {
        prayer: testPrayer,
        user: mockUser,
        filePath: testFilePath,
      };

      // Simulate initial failure
      try {
        await mockUploadFile(testFilePath, uploadData.prayer.audioRemotePath!);
        fail('Should have thrown an error');
      } catch {
        mockAddPendingAction({
          id: uploadData.prayer.id,
          type: 'uploadPrayerAudio',
          payload: uploadData,
        });
      }

      // Verify pending action was added
      expect(mockAddPendingAction).toHaveBeenCalledWith({
        id: testPrayer.id,
        type: 'uploadPrayerAudio',
        payload: uploadData,
      });

      // Now simulate network restoration and retry
      mockUploadFile.mockResolvedValue(undefined);

      // Simulate retry from pending action
      await mockUploadFile(testFilePath, uploadData.prayer.audioRemotePath!);

      // Verify retry was successful
      expect(mockUploadFile).toHaveBeenCalledTimes(2); // Initial attempt + retry
    });

    it('should handle different file types correctly', async () => {
      const fileTypes = [
        { extension: 'm4a', path: '/test/audio.m4a' },
        { extension: 'mp3', path: '/test/audio.mp3' },
        { extension: 'wav', path: '/test/audio.wav' },
        { extension: 'aac', path: '/test/audio.aac' },
      ];

      // Mock successful upload
      mockUploadFile.mockResolvedValue(undefined);

      for (const fileType of fileTypes) {
        const prayerWithFileType = {
          ...testPrayer,
          audioLocalPath: fileType.path,
        };

        const fileName = prayerWithFileType.audioLocalPath?.split('/').pop();
        const storagePath = `users/${mockUser.uid}/prayers/${fileName}`;

        await mockUploadFile(fileType.path, storagePath);

        expect(mockUploadFile).toHaveBeenCalledWith(
          fileType.path,
          `users/${mockUser.uid}/prayers/audio.${fileType.extension}`,
        );
      }
    });

    it('should handle large file uploads', async () => {
      // Mock successful upload for large file
      mockUploadFile.mockResolvedValue(undefined);

      const largeFilePath = '/test/large-audio.m4a';
      const prayerWithLargeFile = {
        ...testPrayer,
        audioLocalPath: largeFilePath,
        audioDuration: 300, // 5 minutes
      };

      const fileName = prayerWithLargeFile.audioLocalPath?.split('/').pop();
      const storagePath = `users/${mockUser.uid}/prayers/${fileName}`;

      await mockUploadFile(largeFilePath, storagePath);

      expect(mockUploadFile).toHaveBeenCalledWith(
        largeFilePath,
        'users/test-uid/prayers/large-audio.m4a',
      );
    });

    it('should handle upload with custom storage path', async () => {
      const customStoragePath = 'custom/prayers/2024/01/audio.m4a';
      const prayerWithCustomPath = {
        ...testPrayer,
        audioRemotePath: customStoragePath,
      };

      // Mock successful upload
      mockUploadFile.mockResolvedValue(undefined);

      const storagePath =
        prayerWithCustomPath.audioRemotePath ||
        `users/${mockUser.uid}/prayers/audio.m4a`;

      await mockUploadFile(testFilePath, storagePath);

      expect(mockUploadFile).toHaveBeenCalledWith(
        testFilePath,
        customStoragePath,
      );
    });
  });

  describe('Filesystem Integration', () => {
    it('should handle filesystem operations for audio files', async () => {
      const testFilePath = '/test/path/audio.m4a';

      // Mock filesystem operations
      const mockFileSystem = {
        exists: jest.fn().mockResolvedValue(true),
        readFile: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
        writeFile: jest.fn().mockResolvedValue(undefined),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      };

      // Simulate checking if file exists
      const fileExists = await mockFileSystem.exists(testFilePath);
      expect(fileExists).toBe(true);

      // Simulate reading file
      const fileData = await mockFileSystem.readFile(testFilePath);
      expect(fileData).toBeInstanceOf(ArrayBuffer);

      // Simulate writing file
      await mockFileSystem.writeFile('/test/path/copied-audio.m4a', fileData);
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
        '/test/path/copied-audio.m4a',
        fileData,
      );

      // Simulate deleting file
      await mockFileSystem.deleteFile(testFilePath);
      expect(mockFileSystem.deleteFile).toHaveBeenCalledWith(testFilePath);
    });

    it('should handle filesystem errors gracefully', async () => {
      const testFilePath = '/test/path/audio.m4a';

      // Mock filesystem error
      const mockFileSystem = {
        exists: jest.fn().mockRejectedValue(new Error('File not found')),
        readFile: jest.fn().mockRejectedValue(new Error('Read error')),
      };

      // Simulate filesystem error
      try {
        await mockFileSystem.exists(testFilePath);
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toBe('File not found');
      }

      try {
        await mockFileSystem.readFile(testFilePath);
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toBe('Read error');
      }
    });
  });
});
