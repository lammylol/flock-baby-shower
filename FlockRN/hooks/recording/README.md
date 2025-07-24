# Recording System Architecture

This directory contains a modular recording system that separates concerns and provides clean, reusable components.

## Architecture Overview

The recording system is built with a modular approach:

```
services/recording/          # Pure services (no React state)
├── audioService.ts         # Audio recording operations
├── speechRecognitionService.ts # Speech recognition operations
├── permissionsService.ts   # Permission management
└── index.ts               # Service exports

hooks/recording/            # React hooks
├── useRecording.ts        # Main orchestration hook
├── useRecordingContext.ts # Context wrapper hook
├── useRecordingHook.ts    # Direct hook (no context)
└── index.ts               # Hook exports

context/RecordingContext.tsx # Global state provider
```

## Usage

### 1. Global State (Recommended for most cases)

```tsx
import { RecordingProvider } from '@/context/RecordingContext';
import { useRecordingContext } from '@/hooks/recording';

// Wrap your app
<RecordingProvider>
  <YourApp />
</RecordingProvider>;

// Use in components
const { recording, handleRecordPrayer, transcription } = useRecordingContext();
```

### 2. Local State (For isolated components)

```tsx
import { useRecordingHook } from '@/hooks/recording';

const MyComponent = () => {
  const { recording, handleRecordPrayer, transcription } = useRecordingHook();
  // ...
};
```

### 3. Advanced Usage (Custom orchestration)

```tsx
import {
  useAudioService,
  useSpeechRecognitionService,
  usePermissionsService,
} from '@/services/recording';

const CustomRecordingComponent = () => {
  const { startRecording, stopRecording } = useAudioService();
  const { transcription, isTranscribing } = useSpeechRecognitionService();
  const { permissionsGranted, requestPermissions } = usePermissionsService();

  // Custom logic here
};
```

## Key Features

- **Modular Design**: Each service handles one specific concern
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Comprehensive error handling throughout
- **Permission Management**: Automatic permission requests and checks
- **Speech Recognition**: Real-time transcription with prayer-specific context
- **Audio Recording**: High-quality audio recording with proper cleanup

## Migration from Old System

The old system had three separate files:

- `useAudioRecording.ts` ❌ (deleted)
- `useSpeechRecognition.ts` ❌ (deleted)
- `RecordingContext.tsx` ✅ (updated)

The new system provides the same functionality but with better separation of concerns and reusability.
