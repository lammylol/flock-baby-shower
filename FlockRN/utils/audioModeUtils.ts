import { AudioModule } from 'expo-audio';

let isInitialized = false;

export const initializeAudioMode = async () => {
  if (isInitialized) return;

  try {
    AudioModule.setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
    });

    isInitialized = true;
    console.log('[Audio] Audio mode initialized for background playback');
  } catch (error) {
    console.error('[Audio] Failed to initialize audio mode:', error);
  }
};
