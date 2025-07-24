# AudioFile Component

The `AudioFile` component provides audio playback functionality for voice recordings with transcription support. It follows the design pattern of other prayer view components like `RecipientSection`.

## Features

- **Audio Playback**: Play, pause, and stop controls
- **Progress Tracking**: Visual progress bar and time display
- **Transcript Support**: Show/hide transcript with preview mode
- **Themed Design**: Consistent with app's design system
- **Responsive**: Works with different audio file formats

## Usage

### Basic Usage

```tsx
import AudioFile from '@/components/Prayer/PrayerViews/AudioFile';

<AudioFile
  audioUri="file://path/to/audio.wav"
  transcription="This is the transcribed text..."
  duration={120} // Optional: duration in seconds
  onTranscriptToggle={(showTranscript) => {
    console.log('Transcript toggled:', showTranscript);
  }}
/>;
```

### In Create Prayer Flow

The component is automatically included in the create prayer flow when a voice recording is available:

```tsx
// In createPrayer.tsx
{
  recordingUri && hasTranscription && (
    <AudioFile
      audioUri={recordingUri}
      transcription={transcription}
      onTranscriptToggle={(showTranscript) => {
        console.log('Transcript toggled:', showTranscript);
      }}
    />
  );
}
```

### In Existing Prayer Views

For viewing existing prayers with audio recordings:

```tsx
import PrayerViewWithAudio from '@/components/Prayer/PrayerViews/PrayerViewWithAudio';

<PrayerViewWithAudio
  prayer={prayer}
  audioUri={prayer.audioUri} // If stored in prayer data
  transcription={prayer.transcription}
  duration={prayer.audioDuration}
/>;
```

## Props

| Prop                 | Type                                | Required | Description                                 |
| -------------------- | ----------------------------------- | -------- | ------------------------------------------- |
| `audioUri`           | `string`                            | Yes      | URI of the audio file to play               |
| `transcription`      | `string`                            | No       | Transcribed text of the audio               |
| `duration`           | `number`                            | No       | Duration of audio in seconds                |
| `onTranscriptToggle` | `(showTranscript: boolean) => void` | No       | Callback when transcript visibility changes |

## Audio Playback Service

The component uses the `useAudioPlaybackService` hook which provides:

- **State Management**: Playing, paused, stopped states
- **Progress Tracking**: Current position and duration
- **Audio Controls**: Play, pause, stop, seek functionality
- **File Management**: Load and unload audio files

## Integration with Speech Recognition

The component works seamlessly with the existing speech recognition system:

1. **Recording**: Audio files are created by `speechRecognitionService`
2. **Playback**: Audio files are played by `audioPlaybackService`
3. **Transcription**: Text is provided from speech recognition results

## File Storage

Audio files are stored in the app's document directory:

- **Path**: `FileSystem.documentDirectory}flock/recordings/`
- **Format**: `.wav` (Android) or `.caf` (iOS)
- **Naming**: `flock_prayer_recording_${timestamp}.wav`

## Dependencies

- `expo-audio`: Audio playback functionality
- `expo-speech-recognition`: Speech recognition and recording
- `expo-file-system`: File system access
- `@expo/vector-icons`: UI icons (FontAwesome5)

## Styling

The component follows the app's design system:

- Uses `ThemedView` and `ThemedText` components
- Supports light/dark theme
- Consistent border radius and padding
- Responsive layout

## Error Handling

The component includes error handling for:

- Audio file loading failures
- Playback errors
- Missing transcription
- Invalid audio URIs

## Future Enhancements

- Audio file upload to cloud storage
- Multiple audio file support per prayer
- Audio editing capabilities
- Background playback support
- Audio quality settings
