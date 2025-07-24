import { PrayerTextInput } from '@/components/Prayer/PrayerEdit/prayerTextInput';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EditMode } from '@/types/ComponentProps';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { NavigationUtils } from '@/utils/navigation';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import Animated from 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';

interface PrayerWriteScreenProps {
  content?: string;
}

export function PrayerWriteScreen({
  content: initialContent,
}: PrayerWriteScreenProps) {
  const [content, setContent] = useState(initialContent || '');
  const placeholderTextColor = useThemeColor({}, 'textSecondary');

  const handleNext = () => {
    try {
      if (!content.trim()) {
        Alert.alert('Error', 'Please write your prayer before continuing');
        return;
      }

      sentryAnalytics.trackPhase1Complete();
      sentryAnalytics.trackPhase2Start();
      sentryAnalytics.trackUserInteraction(
        'next_button_clicked',
        'PrayerWriteScreen',
        'handleNext',
        { contentLength: content.length },
      );

      // Navigate to metadata screen with the prayer content
      NavigationUtils.toCreatePrayer({
        content: content.trim(),
        hasTranscription: 'false',
        editMode: EditMode.CREATE,
      });
    } catch (error) {
      console.error('Error in handleNext:', error);
      Sentry.captureException(error, {
        tags: { component: 'writePrayer', action: 'handleNext' },
        contexts: {
          prayer: {
            contentLength: content.length,
            hasContent: !!content.trim(),
          },
        },
      });
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    try {
      setInputKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error in writePrayer useEffect:', error);
      Sentry.captureException(error, {
        tags: { component: 'writePrayer', action: 'useEffect' },
      });
    }
  }, []);

  const scrollRef = useRef<Animated.ScrollView>(null);

  const handleTextChange = (text: string) => {
    try {
      setContent(text);
    } catch (error) {
      console.error('Error in handleTextChange:', error);
      Sentry.captureException(error, {
        tags: { component: 'writePrayer', action: 'handleTextChange' },
        contexts: {
          text: {
            length: text.length,
          },
        },
      });
    }
  };

  return (
    <ThemedKeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ThemedScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        scrollEnabled={true}
        ref={scrollRef as React.RefObject<Animated.ScrollView>}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Stack.Screen
          options={{
            headerRight: () => (
              <HeaderButton onPress={handleNext} label="Next" />
            ),
            title: 'Write Prayer',
            headerTitleStyle: styles.headerTitleStyle,
            headerShadowVisible: true,
          }}
        />
        <PrayerTextInput
          key={inputKey}
          placeholder="Write your prayer..."
          value={content}
          onChangeText={handleTextChange}
          placeholderTextColor={placeholderTextColor}
        />
      </ThemedScrollView>
    </ThemedKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: '500',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingVertical: 16,
  },
});
export default PrayerWriteScreen;
