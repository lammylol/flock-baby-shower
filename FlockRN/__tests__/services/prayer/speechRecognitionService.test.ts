/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('expo-speech-recognition', () =>
  require('../../../__mocks__/modules/expo-speech-recognition'),
);

jest.mock('expo-file-system', () =>
  require('../../../__mocks__/modules/expo-file-system'),
);

// Mock the module before importing
import * as FileSystem from 'expo-file-system';
import { SpeechRecognitionService } from '../../../services/recording/speechRecognitionService';
import { RecordingUtils } from '@/utils/recording/recordingUtils';
import { describe, it, expect, jest } from '@jest/globals';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import * as ExpoFileSystem from '../../../__mocks__/modules/expo-file-system';

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;
  let mockFileSystem: jest.Mocked<typeof FileSystem>;
  let mockSpeechRecognition: jest.Mocked<typeof ExpoSpeechRecognitionModule>;

  beforeEach(() => {
    service = new SpeechRecognitionService();
    mockFileSystem = ExpoFileSystem as unknown as jest.Mocked<
      typeof FileSystem
    >;
    mockSpeechRecognition = ExpoSpeechRecognitionModule as jest.Mocked<
      typeof ExpoSpeechRecognitionModule
    >;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('startRecognition', () => {
    it('should create recordings directory if it does not exist', async () => {
      // Mock directory doesn't exist
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: false,
      });

      // Mock directory creation
      mockFileSystem.makeDirectoryAsync.mockResolvedValue(undefined);

      // Mock speech recognition start
      mockSpeechRecognition.start.mockImplementation(() => {});

      await service.startRecognition();

      // Verify directory was checked
      expect(mockFileSystem.getInfoAsync).toHaveBeenCalledWith(
        'file:///test/documents/flock/recordings/',
      );

      // Verify directory was created
      expect(mockFileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        'file:///test/documents/flock/recordings/',
        { intermediates: true },
      );
    });

    it('should not create directory if it already exists', async () => {
      // Mock directory already exists
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: true,
        size: 0,
        modificationTime: Date.now(),
      });

      // Mock speech recognition start
      mockSpeechRecognition.start.mockImplementation(() => {});

      await service.startRecognition();

      // Verify directory was checked
      expect(mockFileSystem.getInfoAsync).toHaveBeenCalledWith(
        'file:///test/documents/flock/recordings/',
      );

      // Verify directory was NOT created
      expect(mockFileSystem.makeDirectoryAsync).not.toHaveBeenCalled();

      // Verify speech recognition was started
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    it('should generate unique filenames with timestamps', async () => {
      // Mock directory exists
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: true,
        size: 0,
        modificationTime: Date.now(),
      });

      // Mock speech recognition start
      mockSpeechRecognition.start.mockImplementation(() => {});

      await service.startRecognition();

      // Verify the filename contains timestamp
      const callArgs = mockSpeechRecognition.start.mock.calls[0][0];
      const fileName = callArgs.recordingOptions?.outputFileName;

      expect(fileName).toMatch(/flock_prayer_recording_\d+\.wav/);
      expect(fileName).not.toBe('flock_prayer_recording_.wav'); // Should have actual timestamp
    });

    it('should include prayer-specific contextual strings', async () => {
      // Mock directory exists
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: true,
        size: 0,
        modificationTime: Date.now(),
      });

      // Mock speech recognition start
      mockSpeechRecognition.start.mockImplementation(() => {});

      await service.startRecognition();

      const callArgs = mockSpeechRecognition.start.mock.calls[0][0];
      const contextualStrings = callArgs.contextualStrings;

      expect(contextualStrings).toContain('Jesus');
      expect(contextualStrings).toContain('Lord');
      expect(contextualStrings).toContain('God');
      expect(contextualStrings).toContain('Prayer');
      expect(contextualStrings).toContain('Amen');
    });

    it('should handle errors during directory creation', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Mock directory doesn't exist
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: false,
      });

      // Mock directory creation to fail
      mockFileSystem.makeDirectoryAsync.mockRejectedValue(
        new Error('Directory creation failed'),
      );

      await expect(service.startRecognition()).rejects.toThrow(
        'Directory creation failed',
      );

      // Optionally verify the error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to start speech recognition:',
        expect.any(Error),
      );
    });
  });

  describe('stopRecognition', () => {
    it('should call ExpoSpeechRecognitionModule.stop', () => {
      service.stopRecognition();
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('should handle errors during stop', () => {
      mockSpeechRecognition.stop.mockImplementation(() => {
        throw new Error('Stop failed');
      });

      expect(() => service.stopRecognition()).toThrow('Stop failed');
    });
  });

  describe('abortRecognition', () => {
    it('should call ExpoSpeechRecognitionModule.abort', () => {
      service.abortRecognition();
      expect(mockSpeechRecognition.abort).toHaveBeenCalled();
    });

    it('should handle errors during abort', () => {
      mockSpeechRecognition.abort.mockImplementation(() => {
        throw new Error('Abort failed');
      });

      expect(() => service.abortRecognition()).toThrow('Abort failed');
    });
  });
});

describe('RecordingUtils', () => {
  let mockFileSystem: jest.Mocked<typeof FileSystem>;

  beforeEach(() => {
    mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
    jest.clearAllMocks();
  });

  describe('getFileNameFromUri', () => {
    it('should extract filename from URI', () => {
      const uri =
        'file:///test/documents/flock/recordings/flock_prayer_recording_1234567890.wav';
      const fileName = RecordingUtils.getFileNameFromUri(uri);
      expect(fileName).toBe('flock_prayer_recording_1234567890.wav');
    });

    it('should return unknown_recording for invalid URI', () => {
      const fileName = RecordingUtils.getFileNameFromUri('');
      expect(fileName).toBe('unknown_recording');
    });
  });

  describe('getTimestampFromFileName', () => {
    it('should extract timestamp from valid filename', () => {
      const fileName = 'flock_prayer_recording_1234567890.wav';
      const timestamp = RecordingUtils.getTimestampFromFileName(fileName);
      expect(timestamp).toBe(1234567890);
    });

    it('should extract timestamp from iOS filename', () => {
      const fileName = 'flock_prayer_recording_1234567890.caf';
      const timestamp = RecordingUtils.getTimestampFromFileName(fileName);
      expect(timestamp).toBe(1234567890);
    });

    it('should return null for invalid filename', () => {
      const timestamp = RecordingUtils.getTimestampFromFileName(
        'invalid_filename.txt',
      );
      expect(timestamp).toBeNull();
    });
  });

  describe('formatRecordingTime', () => {
    it('should format timestamp correctly', () => {
      const timestamp = 1234567890000; // Some timestamp
      const formatted = RecordingUtils.formatRecordingTime(timestamp);
      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/\d+\/\d+\/\d+/); // Should contain date
    });
  });

  describe('isRecentRecording', () => {
    it('should return true for recent recording', () => {
      const recentTimestamp = Date.now() - 1000; // 1 second ago
      expect(RecordingUtils.isRecentRecording(recentTimestamp)).toBe(true);
    });

    it('should return false for old recording', () => {
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      expect(RecordingUtils.isRecentRecording(oldTimestamp)).toBe(false);
    });
  });

  describe('getRecordingsDirectory', () => {
    it('should return correct directory path', () => {
      const directory = RecordingUtils.getRecordingsDirectory();
      expect(directory).toBe('file:///test/documents/flock/recordings/');
    });
  });

  describe('listRecordings', () => {
    it('should return empty array when directory does not exist', async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: false,
      });

      const recordings = await RecordingUtils.listRecordings();
      expect(recordings).toEqual([]);
    });

    it('should return filtered recording files', async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: true,
        size: 0,
        modificationTime: Date.now(),
      });

      mockFileSystem.readDirectoryAsync.mockResolvedValue([
        'flock_prayer_recording_1234567890.wav',
        'flock_prayer_recording_1234567891.caf',
        'other_file.txt',
        'flock_prayer_recording_1234567892.wav',
      ]);

      const recordings = await RecordingUtils.listRecordings();
      expect(recordings).toEqual([
        'flock_prayer_recording_1234567890.wav',
        'flock_prayer_recording_1234567891.caf',
        'flock_prayer_recording_1234567892.wav',
      ]);
    });

    it('should handle errors gracefully', async () => {
      mockFileSystem.getInfoAsync.mockRejectedValue(
        new Error('File system error'),
      );

      const recordings = await RecordingUtils.listRecordings();
      expect(recordings).toEqual([]);
    });
  });

  describe('getRecordingInfo', () => {
    it('should return file info for existing file', async () => {
      const mockFileInfo: FileSystem.FileInfo = {
        exists: true,
        uri: 'file:///test/documents/flock/recordings/test.wav',
        isDirectory: false,
        size: 1024,
        modificationTime: Date.now(),
      };

      mockFileSystem.getInfoAsync.mockResolvedValue(mockFileInfo);

      const fileInfo = await RecordingUtils.getRecordingInfo('test.wav');
      expect(fileInfo).toEqual(mockFileInfo);
    });

    it('should return null for non-existent file', async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: 'file:///test/documents/flock/recordings/test.wav',
        isDirectory: false,
      });

      const fileInfo = await RecordingUtils.getRecordingInfo('test.wav');
      expect(fileInfo).toBeNull();
    });
  });

  describe('deleteRecording', () => {
    it('should delete file successfully', async () => {
      mockFileSystem.deleteAsync.mockResolvedValue(undefined);

      const result = await RecordingUtils.deleteRecording('test.wav');
      expect(result).toBe(true);
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith(
        'file:///test/documents/flock/recordings/test.wav',
      );
    });

    it('should handle deletion errors', async () => {
      mockFileSystem.deleteAsync.mockRejectedValue(new Error('Delete failed'));

      const result = await RecordingUtils.deleteRecording('test.wav');
      expect(result).toBe(false);
    });
  });

  describe('getRecordingsSize', () => {
    it('should calculate total size of all recordings', async () => {
      // Mock getInfoAsync to handle both directory check and individual file checks
      mockFileSystem.getInfoAsync.mockImplementation((path: string) => {
        if (path === 'file:///test/documents/flock/recordings/') {
          // Directory info
          return Promise.resolve({
            exists: true,
            uri: path,
            isDirectory: true,
            size: 0,
            modificationTime: Date.now(),
          });
        } else if (path.endsWith('flock_prayer_recording_1234567890.wav')) {
          // File 1 info
          return Promise.resolve({
            exists: true,
            uri: path,
            isDirectory: false,
            size: 1024,
            modificationTime: Date.now(),
          });
        } else if (path.endsWith('flock_prayer_recording_1234567891.caf')) {
          // File 2 info
          return Promise.resolve({
            exists: true,
            uri: path,
            isDirectory: false,
            size: 2048,
            modificationTime: Date.now(),
          });
        }
        // Default: not found
        return Promise.resolve({
          exists: false,
          uri: path,
          isDirectory: false,
        });
      });

      // Mock directory listing
      mockFileSystem.readDirectoryAsync.mockResolvedValue([
        'flock_prayer_recording_1234567890.wav',
        'flock_prayer_recording_1234567891.caf',
      ]);

      const totalSize = await RecordingUtils.getRecordingsSize();
      expect(totalSize).toBe(3072); // 1024 + 2048
    });

    it('should return 0 when no recordings exist', async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: false,
      });

      const totalSize = await RecordingUtils.getRecordingsSize();
      expect(totalSize).toBe(0);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(RecordingUtils.formatFileSize(0)).toBe('0 Bytes');
      expect(RecordingUtils.formatFileSize(1024)).toBe('1 KB');
      expect(RecordingUtils.formatFileSize(1048576)).toBe('1 MB');
      expect(RecordingUtils.formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('testFileSaving', () => {
    it('should return test results when directory exists', async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: true,
        size: 0,
        modificationTime: Date.now(),
      });

      mockFileSystem.readDirectoryAsync.mockResolvedValue([
        'flock_prayer_recording_1234567890.wav',
        'flock_prayer_recording_1234567891.caf',
      ]);

      const results = await RecordingUtils.testFileSaving();

      expect(results).toEqual({
        directoryExists: true,
        directoryPath: 'file:///test/documents/flock/recordings/',
        filesCount: 2,
        filesList: [
          'flock_prayer_recording_1234567890.wav',
          'flock_prayer_recording_1234567891.caf',
        ],
        totalSize: expect.stringMatching(/\d+(\.\d+)? \w+/), // e.g., "2.5 KB" or "0 Bytes"
      });
    });

    it('should return test results when directory does not exist', async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: 'file:///test/documents/flock/recordings/',
        isDirectory: false,
      });

      const results = await RecordingUtils.testFileSaving();
      expect(results).toEqual({
        directoryExists: false,
        directoryPath: 'file:///test/documents/flock/recordings/',
        filesCount: 0,
        filesList: [],
        totalSize: '0 Bytes',
      });
    });
  });
});
