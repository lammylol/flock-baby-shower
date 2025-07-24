import { AudioModule } from 'expo-audio';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useState, useCallback, useMemo } from 'react';

/**
 * Permissions service - handles all permission-related operations
 */
export class PermissionsService {
  /**
   * Check if all required permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const recordPermission = await AudioModule.getRecordingPermissionsAsync();
      const speechPermission =
        await ExpoSpeechRecognitionModule.getSpeechRecognizerPermissionsAsync();

      return recordPermission.granted && speechPermission.granted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Request all required permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const recordPermission = await AudioModule.getRecordingPermissionsAsync();
      const speechPermission =
        await ExpoSpeechRecognitionModule.getSpeechRecognizerPermissionsAsync();

      if (!recordPermission.granted || !speechPermission.granted) {
        await AudioModule.requestRecordingPermissionsAsync();
        await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync();

        // Check permissions again after requesting
        const newRecordPermission =
          await AudioModule.getRecordingPermissionsAsync();
        const newSpeechPermission =
          await ExpoSpeechRecognitionModule.getSpeechRecognizerPermissionsAsync();

        return newRecordPermission.granted && newSpeechPermission.granted;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get detailed permission status
   */
  async getPermissionStatus() {
    try {
      const recordPermission = await AudioModule.getRecordingPermissionsAsync();
      const speechPermission =
        await ExpoSpeechRecognitionModule.getSpeechRecognizerPermissionsAsync();

      return {
        recording: recordPermission.granted,
        speechRecognition: speechPermission.granted,
        allGranted: recordPermission.granted && speechPermission.granted,
      };
    } catch (error) {
      console.error('Error getting permission status:', error);
      return {
        recording: false,
        speechRecognition: false,
        allGranted: false,
      };
    }
  }
}

/**
 * Hook for permissions management
 */
export function usePermissionsService() {
  const permissionsService = useMemo(() => new PermissionsService(), []);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const checkPermissions = useCallback(async () => {
    const granted = await permissionsService.checkPermissions();
    setPermissionsGranted(granted);
    return granted;
  }, [permissionsService]);

  const requestPermissions = useCallback(async () => {
    const granted = await permissionsService.requestPermissions();
    setPermissionsGranted(granted);
    return granted;
  }, [permissionsService]);

  const getPermissionStatus = useCallback(async () => {
    return await permissionsService.getPermissionStatus();
  }, [permissionsService]);

  return {
    permissionsGranted,
    checkPermissions,
    requestPermissions,
    getPermissionStatus,
  };
}
