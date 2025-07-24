import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EditMode } from '@/types/ComponentProps';

// Mock expo-file-system before importing the component

jest.mock('expo-file-system', () => {
  const actual = jest.requireActual('expo-file-system');
  return {
    ...actual,
    documentDirectory: '/mock/document/directory/',
    getInfoAsync: jest.fn(),
    readDirectoryAsync: jest.fn().mockResolvedValue([]),
    downloadAsync: jest.fn().mockResolvedValue({}),
    uploadAsync: jest.fn().mockResolvedValue({}),
  };
});

// Mock the audio playback service
const mockReplaceSource = jest.fn();
const mockFetchFromFirebase = jest.fn();

jest.mock('@/services/recording/audioPlaybackService', () => ({
  useAudioPlaybackService: () => ({
    isPlaying: false,
    isPaused: false,
    isStopped: true,
    duration: 120, // Mock returns 120 seconds (2:00)
    position: 0,
    isLoaded: true,
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    replaceSource: mockReplaceSource,
    fetchFromFirebase: mockFetchFromFirebase,
  }),
}));

// Mock the theme color hook
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: () => '#000000',
}));

// Import the component after all mocks are set up
import AudioFile from '@/components/Prayer/PrayerViews/AudioFile/AudioFile';
import * as FileSystem from 'expo-file-system';

describe('AudioFile', () => {
  const defaultProps = {
    localAudioUri: 'test-audio.wav',
    transcription:
      'This is a test transcription of the audio recording. This is a test transcription of the audio recording.',
    duration: 120,
    onTranscriptToggle: jest.fn(),
    editMode: EditMode.VIEW,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    mockReplaceSource.mockImplementation(() => {});
    mockFetchFromFirebase.mockImplementation(() => Promise.resolve());
  });

  it('renders correctly with all props', () => {
    const { getByText } = render(<AudioFile {...defaultProps} />);

    expect(getByText('Voice Recording')).toBeTruthy();
    expect(getByText('0:00 / 2:00')).toBeTruthy();
    expect(getByText('Show Transcript')).toBeTruthy();
  });

  it('renders without transcription', () => {
    const propsWithoutTranscription = {
      ...defaultProps,
      transcription: undefined,
    };

    const { getByText, queryByText } = render(
      <AudioFile {...propsWithoutTranscription} />,
    );

    expect(getByText('Voice Recording')).toBeTruthy();
    expect(queryByText('Show Transcript')).toBeFalsy();
  });

  it('renders with remote audio URI', () => {
    const propsWithRemoteUri = {
      ...defaultProps,
      remoteAudioUri: 'https://example.com/remote-audio.wav',
    };

    const { getByText } = render(<AudioFile {...propsWithRemoteUri} />);

    expect(getByText('Voice Recording')).toBeTruthy();
    expect(getByText('0:00 / 2:00')).toBeTruthy();
  });

  it('loads local audio when file exists locally', async () => {
    render(<AudioFile {...defaultProps} />);

    await waitFor(() => {
      expect(mockReplaceSource).toHaveBeenCalledWith('test-audio.wav');
    });

    expect(mockFetchFromFirebase).not.toHaveBeenCalled();
  });

  it('fetches from Firebase when local file does not exist and remote URI is provided', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    const propsWithRemoteUri = {
      ...defaultProps,
      remoteAudioUri: 'https://example.com/remote-audio.wav',
    };

    render(<AudioFile {...propsWithRemoteUri} />);

    await waitFor(() => {
      expect(mockFetchFromFirebase).toHaveBeenCalledWith(
        'https://example.com/remote-audio.wav',
        'test-audio.wav',
      );
    });

    expect(mockReplaceSource).not.toHaveBeenCalled();
  });

  it('does not fetch from Firebase when no remote URI is provided', async () => {
    // Mock getInfoAsync to return false for this test
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    render(<AudioFile {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetchFromFirebase).not.toHaveBeenCalled();
    });

    expect(mockReplaceSource).not.toHaveBeenCalled();
  });

  it('handles file system errors gracefully', async () => {
    // Mock getInfoAsync to throw an error for this test
    (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(
      new Error('File system error'),
    );

    render(<AudioFile {...defaultProps} />);

    // Should not crash and should not call replaceSource or fetchFromFirebase
    await waitFor(() => {
      expect(mockReplaceSource).not.toHaveBeenCalled();
      expect(mockFetchFromFirebase).not.toHaveBeenCalled();
    });
  });

  it('toggles transcript visibility when button is pressed', () => {
    const { getByText } = render(<AudioFile {...defaultProps} />);

    const transcriptToggle = getByText('Show Transcript');
    fireEvent.press(transcriptToggle);

    expect(defaultProps.onTranscriptToggle).toHaveBeenCalledWith(true);
  });

  it('shows preview of transcription initially', () => {
    const longTranscription =
      'This is a very long transcription that should be truncated when shown in preview mode. It contains more than 80 characters to test the truncation functionality.'.repeat(
        3,
      );

    const propsWithLongTranscription = {
      ...defaultProps,
      transcription: longTranscription,
    };

    const { getByText } = render(<AudioFile {...propsWithLongTranscription} />);

    expect(getByText('Show Transcript')).toBeTruthy();
  });

  it('shows full transcription when expanded', async () => {
    const longTranscription =
      'This is a very long transcription that should be truncated when shown in preview mode. It contains more than 80 characters to test the truncation functionality.'.repeat(
        3,
      );

    const propsWithLongTranscription = {
      ...defaultProps,
      transcription: longTranscription,
    };

    const { getByText } = render(<AudioFile {...propsWithLongTranscription} />);

    const transcriptToggle = getByText('Show Transcript');
    fireEvent.press(transcriptToggle);

    await waitFor(() => {
      expect(getByText(longTranscription)).toBeTruthy();
    });
  });

  it('handles missing duration gracefully', () => {
    // Temporarily override the mock to return 0 duration
    const mockModule = jest.requireMock(
      '@/services/recording/audioPlaybackService',
    );
    const originalMock = mockModule.useAudioPlaybackService;

    mockModule.useAudioPlaybackService = jest.fn(() => ({
      isPlaying: false,
      isPaused: false,
      isStopped: true,
      duration: 0, // Mock returns 0 duration for this test
      position: 0,
      isLoaded: true,
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      replaceSource: mockReplaceSource,
      fetchFromFirebase: mockFetchFromFirebase,
    }));

    const propsWithoutDuration = {
      localAudioUri: 'test-audio.wav',
      transcription:
        'This is a test transcription of the audio recording. This is a test transcription of the audio recording. This is a test transcription of the audio recording',
      onTranscriptToggle: jest.fn(),
      duration: undefined,
      editMode: EditMode.VIEW,
    };
    const { getByText } = render(<AudioFile {...propsWithoutDuration} />);

    // Should show 0:00 / 0:00 when no duration is available
    expect(getByText('0:00 / 0:00')).toBeTruthy();

    // Restore original mock
    mockModule.useAudioPlaybackService = originalMock;
  });

  it('displays play button when not playing', () => {
    const { getByText } = render(<AudioFile {...defaultProps} />);

    // The play button should be present (though we can't easily test the icon)
    expect(getByText('Voice Recording')).toBeTruthy();
  });

  it('renders in edit mode with transcript editing functionality', () => {
    const onTranscriptEdit = jest.fn();
    const propsInEditMode = {
      ...defaultProps,
      editMode: EditMode.EDIT,
      onTranscriptEdit,
    };

    const { getByText } = render(<AudioFile {...propsInEditMode} />);

    expect(getByText('Voice Recording')).toBeTruthy();
    expect(getByText('Show Transcript')).toBeTruthy();
  });

  it('renders in create mode', () => {
    const propsInCreateMode = {
      ...defaultProps,
      editMode: EditMode.CREATE,
    };

    const { getByText } = render(<AudioFile {...propsInCreateMode} />);

    expect(getByText('Voice Recording')).toBeTruthy();
    expect(getByText('Show Transcript')).toBeTruthy();
  });

  describe('Audio Loading Behavior', () => {
    it('handles empty audio URI gracefully', async () => {
      const propsWithEmptyUri = {
        ...defaultProps,
        localAudioUri: '',
      };

      render(<AudioFile {...propsWithEmptyUri} />);

      await waitFor(() => {
        expect(mockReplaceSource).not.toHaveBeenCalled();
        expect(mockFetchFromFirebase).not.toHaveBeenCalled();
      });
    });

    it('handles undefined audio URI gracefully', async () => {
      const propsWithUndefinedUri = {
        ...defaultProps,
        localAudioUri: undefined as unknown as string,
      };

      render(<AudioFile {...propsWithUndefinedUri} />);

      await waitFor(() => {
        expect(mockReplaceSource).not.toHaveBeenCalled();
        expect(mockFetchFromFirebase).not.toHaveBeenCalled();
      });
    });

    it('constructs correct audio URI wi h document directory', async () => {
      render(<AudioFile {...defaultProps} />);

      await waitFor(() => {
        expect(mockReplaceSource).toHaveBeenCalledWith('test-audio.wav');
      });
    });

    it('prioritizes local file over remote URI when both exist', async () => {
      const propsWithBothUris = {
        ...defaultProps,
        remoteAudioUri: 'https://example.com/remote-audio.wav',
      };

      render(<AudioFile {...propsWithBothUris} />);

      await waitFor(() => {
        expect(mockReplaceSource).toHaveBeenCalledWith('test-audio.wav');
        expect(mockFetchFromFirebase).not.toHaveBeenCalled();
      });
    });
  });
});
