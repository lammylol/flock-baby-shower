import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { sentryAnalytics } from '../analytics/sentryAnalytics';

/**
 * Speech recognition service - handles speech recognition operations
 */
export class SpeechRecognitionService {
  /**
   * Ensure the flock recordings directory exists
   */
  private async ensureRecordingsDirectory(): Promise<void> {
    try {
      const recordingsDir = `${FileSystem.documentDirectory}flock/recordings/`;
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, {
          intermediates: true,
        });
        console.log('Created recordings directory:', recordingsDir);
      }
    } catch (error) {
      console.error('Error ensuring recordings directory exists:', error);
      throw error;
    }
  }

  /**
   * Start speech recognition with prayer-specific contextual strings
   */
  async startRecognition(): Promise<void> {
    try {
      // Ensure recordings directory exists
      await this.ensureRecordingsDirectory();

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const uniqueFileName = `flock_prayer_recording_${timestamp}.wav`;

      console.log('SpeechRecognitionService startRecognition called');

      // Create recordings directory path using expo-file-system
      const recordingsDir = `${FileSystem.documentDirectory}flock/recordings/`;

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        iosCategory: {
          category: 'playAndRecord',
          categoryOptions: ['defaultToSpeaker', 'allowBluetooth'],
          mode: 'default',
        },
        contextualStrings: [
          'Jesus',
          'Lord',
          'God',
          'Holy Spirit',
          'Holy',
          'Prayer',
          'Pray',
          'Amen',
          'Bible',
          'Father',
          'Holy Father',
          'Yahweh',
          'Adonai',
          'Yeshua',
          'Elia',
          'Ellie',
          'Lams',
          'Esther',
          'Matt',
          'Leia',
          'Lam',
          'Flock',
        ],
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        continuous: true,
        recordingOptions: {
          persist: true,
          // Use expo-file-system document directory with recordings subfolder
          outputDirectory: recordingsDir,
          // The module will automatically save to the app's documents directory
          // with the unique filename we provide
          outputFileName: uniqueFileName,
          // Optional: Specify the output sample rate
          // Default sample rate: 16000 on Android, 44100/48000 on iOS
          outputSampleRate: Platform.OS === 'ios' ? 44100 : 16000,
          // Optional: Specify the output encoding
          // Default encoding: pcmFormatInt16 on Android, pcmFormatFloat32 on iOS
          outputEncoding:
            Platform.OS === 'ios' ? 'pcmFormatFloat32' : 'pcmFormatInt16',
        },
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      throw error;
    }
  }

  /**
   * Stop speech recognition
   */
  stopRecognition(): void {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      throw error;
    }
  }

  /**
   * Abort speech recognition
   */
  abortRecognition(): void {
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch (error) {
      console.error('Error aborting speech recognition:', error);
      throw error;
    }
  }
}

/**
 * Hook for speech recognition with event handling
 */
export function useSpeechRecognitionService() {
  const speechService = new SpeechRecognitionService();
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Wrapper function to handle async startRecognition
  const startRecognition = async () => {
    try {
      await speechService.startRecognition();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      throw error;
    }
  };

  // Speech recognition event handlers
  useSpeechRecognitionEvent('result', (event) => {
    try {
      if (event.results && event.results.length > 0) {
        if (event.isFinal) {
          const fullTranscription = event.results[0]?.transcript;
          setTranscription((prev) => `${prev} ${fullTranscription}`.trim());
          // Track when transcription processing is complete
          sentryAnalytics.trackTranscriptionProcessingComplete();
        }
      }
    } catch (error) {
      console.error('Error during transcription:', error);
    }
  });

  useSpeechRecognitionEvent('start', () => {
    console.log('Speech recognition started');
    setIsTranscribing(true);
    // Track transcription start
    sentryAnalytics.trackTranscriptionStart();
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('Speech recognition ended');
    // Track when speech ends and processing begins
    sentryAnalytics.trackSpeechEnd();
    // // Add delay to ensure all final results are processed
    setTimeout(() => setIsTranscribing(false), 1000);
  });

  // Recording events for file management
  useSpeechRecognitionEvent('audiostart', (event) => {
    setIsRecording(true);
    // Note: event.uri will be null if recordingOptions.persist is not enabled
    if (event.uri) {
      setRecordingUri(event.uri);
    }
  });

  useSpeechRecognitionEvent('audioend', (event) => {
    setIsRecording(false);
    // Recording ended, the file is now safe to use
    // Android: Will be saved as a .wav file
    // iOS: Will be saved as a .caf file
    if (event.uri) {
      setRecordingUri(event.uri);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    // Ignore "no-speech" errors as they're common when starting recording
    if (event.error === 'no-speech') {
      console.log(
        'No speech detected yet - this is normal when starting recording',
      );
      return;
    }
    console.error(
      'Speech recognition error:',
      event.error,
      'message:',
      event.message,
    );
  });

  return {
    transcription,
    setTranscription,
    isTranscribing,
    recordingUri,
    isRecording,
    setRecordingUri,
    startRecognition,
    stopRecognition: speechService.stopRecognition.bind(speechService),
    abortRecognition: speechService.abortRecognition.bind(speechService),
  };
}
