/* eslint-disable react-native/no-color-literals */
// Screen for when voice recording is recording.
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import useRecordingContext from '@/hooks/recording/useRecordingContext';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  RecordButton,
  FinishButton,
  RetryButton,
} from '@/components/Prayer/PrayerViews/Recording/RecordingButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { NavigationUtils } from '@/utils/navigation';
import { From } from '@/types/ComponentProps';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';

const VoiceRecording = () => {
  const params = useLocalSearchParams();
  const from = { from: params.from, fromId: params.fromId };
  const hasStartedRecording = useRef(false);

  const { handleRecordPrayer, recording, resetRecording, timer, setTimer } =
    useRecordingContext();
  const colorScheme = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textPrimary');
  const overlayColor = useThemeColor({}, 'backgroundVoiceRecording');

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // set timer only when recording is active
  useEffect(() => {
    if (recording === 'recording') {
      // Only start the timer when recording is active
      const interval = setInterval(() => {
        setTimer(timer + 1);
      }, 1000);

      return () => clearInterval(interval); // Cleanup when recording changes or component unmounts
    }
  }, [recording, timer, setTimer]);

  /* handles setting the content for the next screen. Transcription will not 
be carried over if "transcription unavailable. Transcription Unavailable is
set in RecordingContext.tsx" */
  const handleFinish = () => {
    sentryAnalytics.trackPhase1Complete();
    sentryAnalytics.trackPhase2Start();
    sentryAnalytics.trackUserInteraction(
      'finish_recording',
      'VoiceRecording',
      'handleFinish',
      { timer },
    );
    // Navigate to metadata screen with the prayer content
    NavigationUtils.toCreatePrayer({
      hasTranscription: 'true',
      editMode: 'create',
      from: from?.from as From,
      fromId: from?.fromId as string,
    });
  };

  /* handles retry" */
  const handleRetry = () => {
    sentryAnalytics.trackUserInteraction(
      'retry_recording',
      'VoiceRecording',
      'handleRetry',
      { timer },
    );
    resetRecording();
    hasStartedRecording.current = false; // Reset the guard for retry
    handleRecordPrayer();
    setTimer(0);
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={colorScheme} />
      {/* Background view that extends into status bar area */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: colorScheme }]}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerTitle: 'Record Prayer',
          headerBackButtonDisplayMode: 'default',
          headerStyle: {
            backgroundColor: colorScheme, // Use the theme's voice recording background
          },
          headerLeft: () => (
            <HeaderButton
              onPress={() => {
                resetRecording();
                NavigationUtils.back();
              }}
              label="Cancel"
            />
          ),
        }}
      />
      <View style={styles.backgroundContainer}>
        <View style={[styles.container, { backgroundColor: colorScheme }]}>
          <View style={styles.upperSection}>
            <View style={styles.recordingIndicator}>
              <FontAwesome5 name="dot-circle" size={28} color={textColor} />
              <Text style={[styles.recordingText, { color: textColor }]}>
                {recording === 'recording' ? 'Recording' : 'Paused'}
              </Text>
            </View>

            <Text style={[styles.timerText, { color: textColor }]}>
              {formatTime(timer)}
            </Text>
          </View>

          <View style={styles.horizontalContainer}>
            {/* Stop Button */}
            <RecordButton
              isRecording={recording === 'recording'}
              onPress={handleRecordPrayer}
            />

            {recording === 'complete' && (
              <>
                <FinishButton onPress={handleFinish} />

                <RetryButton onPress={handleRetry} />
              </>
            )}
          </View>
          <View
            style={[styles.recordingCard, { backgroundColor: overlayColor }]}
          ></View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  horizontalContainer: {
    flex: 0,
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'space-between',
    marginBottom: 40,
    zIndex: 1,
  },
  recordingCard: {
    height: 1000,
    width: 1000,
    borderRadius: 500,
    position: 'absolute', // Float it over the container
    bottom: -700, // Adjust positioning as needed
    zIndex: 0,
  },
  recordingIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 50,
  },
  recordingText: {
    fontSize: 28,
    fontWeight: '600',
    marginLeft: 8,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  upperSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VoiceRecording;
