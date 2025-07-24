import { initializeAudioMode } from '@/utils/audioModeUtils';
import { AudioModule } from 'expo-audio';

// Mock expo-audio
jest.mock('expo-audio', () => ({
  AudioModule: {
    setAudioModeAsync: jest.fn(),
  },
}));

describe('audioModeUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeAudioMode', () => {
    it('should initialize with playback mode by default', async () => {
      await initializeAudioMode();

      expect(AudioModule.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: true,
      });
    });
  });
});
