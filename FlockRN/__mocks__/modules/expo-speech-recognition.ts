// Mock expo-speech-recognition
export const ExpoSpeechRecognitionModule = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  getRecognizingStatusAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  checkPermissionsAsync: jest.fn(),
};

export const useSpeechRecognitionEvent = jest.fn();

export default {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
};
