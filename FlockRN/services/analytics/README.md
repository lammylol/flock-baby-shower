# Sentry Analytics Implementation

This directory contains the analytics implementation for tracking user interactions and session data in the Flock app.

## Overview

The analytics system tracks:

- **Session Management**: New sessions start when users click the pray tab
- **User Interactions**: Record vs text choice, audio playback, transcription editing
- **Session Phases**: Phase 1 (input) and Phase 2 (editing) durations
- **App Usage**: Prayer views, journal interactions, function execution

## Key Components

### `sentryAnalytics.ts`

Main analytics service that provides:

- Session tracking with unique session IDs
- Phase duration tracking (input vs editing)
- User interaction breadcrumbs
- Audio playback and transcription editing tracking
- Function execution tracking for debugging

### `sessionUtils.ts`

Utility functions for session management:

- `endSessionViaSync()`: Ends session via sync store (prevents crashes)
- `endSessionDirect()`: Ends session directly (use only when safe)

### Session Data Structure

```typescript
interface SessionData {
  sessionId: string;
  startTime: number;
  phase1StartTime?: number;
  phase1EndTime?: number;
  phase2StartTime?: number;
  phase2EndTime?: number;
  recordingMethod?: 'record' | 'text';
  hasAudio?: boolean;
  transcriptionEdited?: boolean;
  audioPlayed?: boolean;
  prayerSaved?: boolean;
}
```

## Tracked Events

### Session Events

- **New Session**: Triggered when user clicks pray tab
- **Phase 1 Complete**: When recording/text input is finished
- **Phase 2 Start**: When editing prayer begins
- **Phase 2 Complete**: When prayer is saved
- **Session End**: When app goes to background or prayer flow completes

### User Interaction Events

- **Recording Method**: Track if user chose record or text
- **Audio Playback**: Track when users play their recordings
- **Transcription Edit**: Track when users edit transcriptions
- **Prayer View**: Track prayer viewing, editing, refreshing
- **Journal Interaction**: Track scrolling, refreshing in journal

### Function Execution Events

- **Navigation**: Track all navigation function calls
- **Component Actions**: Track button clicks and user actions
- **Error Handling**: Track errors with context

## Integration Points

### Tab Layout (`app/(tabs)/_layout.tsx`)

- Tracks pray tab clicks
- Starts new sessions

### Prayer Creation Flow

- **PrayerCreateModal**: Tracks record vs text choice
- **VoiceRecording**: Tracks recording completion and retry
- **WritePrayer**: Tracks text input completion
- **CreatePrayer**: Tracks prayer saving and editing

### Audio Components

- **AudioFile**: Tracks audio playback and transcription editing
- **SpeechRecognitionService**: Tracks recording events

### Navigation

- **NavigationUtils**: Tracks all navigation function calls
- **PrayerJournal**: Tracks journal interactions
- **PrayerView**: Tracks prayer view interactions

### Session Management

- **useSessionTracking**: Tracks app state changes
- **useSessionEndOnUnmount**: Tracks component unmounting

### Sync Store Integration

- **Sync Store**: Handles session ending via pending actions
- **Sync Worker**: Processes session end actions
- **Mutations**: End sessions when prayers/prayer points are saved

## Sentry Configuration

The analytics use Sentry's breadcrumb system to track events:

- **Category**: session, user_interaction, session_phase, audio_interaction, function_execution
- **Level**: info, debug
- **Data**: Session ID, timestamps, metadata

## Usage Examples

### Starting a Session

```typescript
sentryAnalytics.startNewSession();
```

### Tracking User Choice

```typescript
sentryAnalytics.trackRecordingMethod('record'); // or 'text'
```

### Tracking Phase Completion

```typescript
sentryAnalytics.trackPhase1Complete();
sentryAnalytics.trackPhase2Start();
sentryAnalytics.trackPhase2Complete();
```

### Tracking Audio Interactions

```typescript
sentryAnalytics.trackAudioPlayback();
sentryAnalytics.trackTranscriptionEdit();
```

### Tracking General Interactions

```typescript
sentryAnalytics.trackUserInteraction(
  'button_click',
  'ComponentName',
  'functionName',
  { metadata },
);
```

### Ending Session (Safe Methods)

```typescript
// Via sync store (prevents crashes)
endSessionViaSync();

// Direct (use only when component won't unmount)
endSessionDirect();
```

## Crash Prevention

The session ending system prevents crashes by:

1. **Sync Store Integration**: Session ending is handled via the sync store as a pending action
2. **Async Processing**: The sync worker processes session end actions asynchronously
3. **Mutation Integration**: Sessions end when mutations complete successfully
4. **App State Tracking**: Sessions end when app goes to background

### Why This Approach?

- **Component Unmounting**: Components can unmount before Sentry finishes sending data
- **Async Operations**: Sentry operations are async and can be interrupted
- **Sync Store Reliability**: The sync store persists actions and processes them reliably
- **Mutation Success**: Sessions end only when data is successfully saved

## Data Analysis

The tracked data can be analyzed in Sentry to understand:

- **User Behavior**: How users interact with the app
- **Session Patterns**: Duration and completion rates
- **Feature Usage**: Which features are most/least used
- **Error Patterns**: Where users encounter issues
- **Performance**: Function execution timing

## Privacy Considerations

- All data is sent to Sentry with user consent
- Session IDs are randomly generated
- No personally identifiable information is tracked
- Data is used for analytics and debugging only
