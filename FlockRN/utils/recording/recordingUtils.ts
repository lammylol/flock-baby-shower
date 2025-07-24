import * as FileSystem from 'expo-file-system';

/**
 * Utility functions for recording file management
 */
export const RecordingUtils = {
  /**
   * Extract filename from recording URI
   */
  getFileNameFromUri(uri: string): string {
    return uri.split('/').pop() || 'unknown_recording';
  },

  /**
   * Get recording timestamp from filename
   */
  getTimestampFromFileName(fileName: string): number | null {
    const match = fileName.match(/flock_prayer_recording_(\d+)\.(wav|caf)/);
    return match ? parseInt(match[1], 10) : null;
  },

  /**
   * Generate a human-readable timestamp for display
   */
  formatRecordingTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  },

  /**
   * Check if a recording file is recent (within last 24 hours)
   */
  isRecentRecording(timestamp: number): boolean {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return timestamp > oneDayAgo;
  },

  /**
   * Get the recordings directory path
   */
  getRecordingsDirectory(): string {
    return `${FileSystem.documentDirectory}flock/recordings/`;
  },

  /**
   * List all recording files in the recordings directory
   */
  async listRecordings(): Promise<string[]> {
    try {
      const recordingsDir = this.getRecordingsDirectory();
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);

      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(recordingsDir);
      return files.filter((file) =>
        file.match(/flock_prayer_recording_\d+\.(wav|caf)/),
      );
    } catch (error) {
      console.error('Error listing recordings:', error);
      return [];
    }
  },

  /**
   * Get file info for a recording
   */
  async getRecordingInfo(
    fileName: string,
  ): Promise<FileSystem.FileInfo | null> {
    try {
      const recordingsDir = this.getRecordingsDirectory();
      const filePath = `${recordingsDir}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      return fileInfo.exists ? fileInfo : null;
    } catch (error) {
      console.error('Error getting recording info:', error);
      return null;
    }
  },

  /**
   * Delete a recording file
   */
  async deleteRecording(fileName: string): Promise<boolean> {
    try {
      const recordingsDir = this.getRecordingsDirectory();
      const filePath = `${recordingsDir}${fileName}`;
      await FileSystem.deleteAsync(filePath);
      console.log('Deleted recording:', fileName);
      return true;
    } catch (error) {
      console.error('Error deleting recording:', error);
      return false;
    }
  },

  /**
   * Get total size of all recordings
   */
  async getRecordingsSize(): Promise<number> {
    try {
      const files = await this.listRecordings();
      let totalSize = 0;

      for (const fileName of files) {
        const fileInfo = await this.getRecordingInfo(fileName);
        if (fileInfo && fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating recordings size:', error);
      return 0;
    }
  },

  /**
   * Format file size in human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Test function to verify file saving functionality
   */
  async testFileSaving(): Promise<{
    directoryExists: boolean;
    directoryPath: string;
    filesCount: number;
    filesList: string[];
    totalSize: string;
  }> {
    try {
      const recordingsDir = this.getRecordingsDirectory();
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);

      if (!dirInfo.exists) {
        return {
          directoryExists: false,
          directoryPath: recordingsDir,
          filesCount: 0,
          filesList: [],
          totalSize: '0 Bytes',
        };
      }

      const files = await this.listRecordings();
      const totalSize = await this.getRecordingsSize();

      return {
        directoryExists: true,
        directoryPath: recordingsDir,
        filesCount: files.length,
        filesList: files,
        totalSize: this.formatFileSize(totalSize),
      };
    } catch (error) {
      console.error('Error testing file saving:', error);
      return {
        directoryExists: false,
        directoryPath: this.getRecordingsDirectory(),
        filesCount: 0,
        filesList: [],
        totalSize: '0 Bytes',
      };
    }
  },
};
