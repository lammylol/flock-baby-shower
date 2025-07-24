import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useAudioPlaybackService } from '@/services/recording/audioPlaybackService';
import { EditMode } from '@/types/ComponentProps';
import * as FileSystem from 'expo-file-system';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';

const TRANSCRIPT_LENGTH_THRESHOLD = 80;

type AudioFileProps = {
  localAudioUri: string;
  remoteAudioUri?: string;
  transcription?: string;
  onTranscriptEdit?: (transcript: string) => void;
  duration?: number;
  onTranscriptToggle?: (showTranscript: boolean) => void;
  editMode: EditMode;
};

const AudioFile = ({
  localAudioUri,
  remoteAudioUri,
  transcription,
  duration: initialDuration,
  onTranscriptEdit,
  onTranscriptToggle,
  editMode,
}: AudioFileProps) => {
  const borderColor = useThemeColor(
    { dark: Colors.dark.backgroundSecondary },
    'borderPrimary',
  );
  const textColor = useThemeColor({}, 'textPrimary');
  const placeholderColor = useThemeColor({}, 'textSecondary');
  const iconColor = useThemeColor({}, 'textSecondary');

  const [showTranscript, setShowTranscript] = useState(false);
  const [displayedTranscription, setDisplayedTranscription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const textInputRef = useRef<TextInput>(null);

  const {
    isPlaying,
    isStopped,
    duration,
    position,
    isLoaded,
    play,
    pause,
    stop,
    replaceSource,
    fetchFromFirebase,
  } = useAudioPlaybackService(localAudioUri);

  // Memoize the checkIfFileExists function to prevent unnecessary re-creation
  const checkIfFileExists = useCallback(
    async (uri: string): Promise<boolean> => {
      console.log('AudioFile checking if file exists:', uri);
      const existsLocally = await FileSystem.getInfoAsync(uri)
        .then((info) => {
          console.log('AudioFile existsLocally:', info.exists);
          return info.exists;
        })
        .catch((error) => {
          console.error('AudioFile error checking if file exists:', error);
          return false;
        });
      return existsLocally;
    },
    [],
  );

  // Memoize the loadAudio function to prevent unnecessary re-creation
  const loadAudio = useCallback(async () => {
    if (!localAudioUri) return;

    console.log('AudioFile loading audio:', localAudioUri);

    const existsLocally = await checkIfFileExists(localAudioUri);
    if (existsLocally) {
      console.log('AudioFile replacing audio source:', localAudioUri);
      replaceSource(localAudioUri);
      return;
    }

    if (remoteAudioUri) {
      console.log('AudioFile fetching audio from firebase:', remoteAudioUri);
      await fetchFromFirebase(remoteAudioUri, localAudioUri);
    }
  }, [
    localAudioUri,
    remoteAudioUri,
    replaceSource,
    fetchFromFirebase,
    checkIfFileExists,
  ]);

  // Load audio when component mounts
  useEffect(() => {
    loadAudio();
  }, [loadAudio]);

  // Handle transcript display
  useEffect(() => {
    if (transcription) {
      setDisplayedTranscription(transcription);
    }
  }, [transcription, showTranscript]);

  // Focus TextInput when editing starts
  useEffect(() => {
    if (isEditing && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [isEditing]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const handlePlayPause = useCallback(async () => {
    try {
      if (isPlaying) {
        pause();
      } else {
        play();
        sentryAnalytics.trackAudioPlayback();
        sentryAnalytics.trackUserInteraction(
          'audio_play',
          'AudioFile',
          'handlePlayPause',
        );
      }
    } catch (error) {
      console.error('AudioFile Error toggling play/pause:', error);
    }
  }, [isPlaying, pause, play]);

  const handleStop = useCallback(async () => {
    try {
      stop();
    } catch (error) {
      console.error('AudioFile Error stopping audio:', error);
    }
  }, [stop]);

  const handleTranscriptToggle = useCallback(() => {
    const newShowTranscript = !showTranscript;
    setShowTranscript(newShowTranscript);
    onTranscriptToggle?.(newShowTranscript);
  }, [showTranscript, onTranscriptToggle]);

  const handleEditTranscriptToggle = useCallback(() => {
    if (isPlaying) {
      handlePlayPause();
    }
    setShowTranscript(true);
    setIsEditing(true);
    setEditingText(transcription || '');
    sentryAnalytics.trackUserInteraction(
      'edit_transcript_start',
      'AudioFile',
      'handleEditTranscriptToggle',
    );
  }, [isPlaying, transcription, handlePlayPause]);

  const handleSaveEdit = useCallback(() => {
    setIsEditing(false);
    onTranscriptEdit?.(editingText);
    sentryAnalytics.trackTranscriptionEdit();
    sentryAnalytics.trackUserInteraction(
      'edit_transcript_save',
      'AudioFile',
      'handleSaveEdit',
    );
  }, [editingText, onTranscriptEdit]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingText('');
  }, []);

  const getPlayPauseIcon = useCallback(() => {
    const icon = isPlaying ? 'pause' : 'play';
    return icon;
  }, [isPlaying]);

  // Memoize the iconColor to prevent unnecessary re-renders
  const memoizedIconColor = useMemo(() => iconColor, [iconColor]);

  const getPlayPauseColor = useCallback(() => {
    const color = isPlaying ? Colors.primary : memoizedIconColor;
    return color;
  }, [isPlaying, memoizedIconColor]);

  return (
    <ThemedView style={[styles.container, { borderColor }]}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          Voice Recording
        </ThemedText>
      </View>

      <View style={styles.body}>
        {/* Audio Controls */}
        <View style={styles.audioControls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: getPlayPauseColor() },
            ]}
            onPress={handlePlayPause}
            disabled={!isLoaded}
          >
            <FontAwesome5 name={getPlayPauseIcon()} size={16} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: iconColor }]}
            onPress={handleStop}
            disabled={!isLoaded || isStopped}
          >
            <FontAwesome5 name="stop" size={16} color="white" />
          </TouchableOpacity>

          <View style={styles.timeInfo}>
            <ThemedText style={[styles.timeText, { color: textColor }]}>
              {formatTime(position)} /{' '}
              {formatTime(duration || initialDuration || 0)}
            </ThemedText>
          </View>
        </View>

        {/* Progress Bar */}
        {isLoaded && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: placeholderColor },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: Colors.primary,
                    width: `${(position / (duration || initialDuration || 1)) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Transcript Section */}
        {transcription && (
          <View style={styles.transcriptSection}>
            <View style={styles.transcriptHeader}>
              {isEditing ? (
                <>
                  <View style={styles.transcriptToggle}>
                    <ThemedText
                      style={[
                        styles.editingTranscriptText,
                        { color: textColor },
                      ]}
                    >
                      Editing Transcript...
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <ThemedText
                      style={[styles.cancelButtonText, { color: iconColor }]}
                    >
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {transcription.length > TRANSCRIPT_LENGTH_THRESHOLD ? (
                    <TouchableOpacity
                      style={styles.transcriptToggle}
                      onPress={handleTranscriptToggle}
                    >
                      <ThemedText
                        style={[
                          styles.transcriptToggleText,
                          { color: textColor },
                        ]}
                      >
                        {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                      </ThemedText>
                      <FontAwesome5
                        name={showTranscript ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color={iconColor}
                        style={styles.transcriptToggleIcon}
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.transcriptToggle}>
                      <ThemedText
                        style={[
                          styles.transcriptToggleText,
                          { color: textColor },
                        ]}
                      >
                        Transcript
                      </ThemedText>
                    </View>
                  )}

                  {(editMode === EditMode.CREATE ||
                    editMode === EditMode.EDIT) && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleEditTranscriptToggle}
                      >
                        <Feather name="edit-2" size={14} color={iconColor} />
                      </TouchableOpacity>
                    )}
                </>
              )}
            </View>

            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  ref={textInputRef}
                  style={[
                    styles.editTextInput,
                    {
                      color: textColor,
                    },
                  ]}
                  value={editingText}
                  onChangeText={setEditingText}
                  multiline
                  placeholder="Edit transcript..."
                  placeholderTextColor={placeholderColor}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.textButton}
                    onPress={handleSaveEdit}
                  >
                    <ThemedText
                      style={[styles.saveButtonText, { color: iconColor }]}
                    >
                      Save
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              displayedTranscription && (
                <ThemedText
                  onPress={handleTranscriptToggle}
                  suppressHighlighting
                  numberOfLines={showTranscript ? undefined : 2}
                  ellipsizeMode="tail"
                  style={[
                    styles.transcriptText,
                    { color: transcription ? textColor : placeholderColor },
                  ]}
                >
                  {displayedTranscription}
                </ThemedText>
              )
            )}
          </View>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 15,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    marginTop: 12,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  transcriptSection: {
    marginTop: 8,
  },
  transcriptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transcriptToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editingTranscriptText: {
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  transcriptToggleIcon: {
    marginLeft: 8,
  },
  transcriptText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 30,
  },
  editContainer: {
    padding: 0,
  },
  editTextInput: {
    padding: 0,
    fontSize: 16,
    minHeight: 40,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AudioFile;
