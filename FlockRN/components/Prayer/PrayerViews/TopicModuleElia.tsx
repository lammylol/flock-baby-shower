import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface TopicModuleEliaProps {
  style?: React.ComponentProps<typeof View>['style'];
  containerStyle?: React.ComponentProps<typeof View>['style'];
}

export function TopicModuleElia({
  style,
  containerStyle,
}: TopicModuleEliaProps) {
  const hasMeasuredTitle = useRef(false);
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textTitleTextColor = useThemeColor({}, 'textPrimary');
  const overlayColor = useThemeColor({}, 'backgroundVoiceRecording');
  const nicknameColor = useThemeColor({}, 'background');
  const handleTitleLayout = useCallback(() => {
    if (!hasMeasuredTitle.current) {
      hasMeasuredTitle.current = true;
    }
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Background */}
      <View style={[styles.background, { backgroundColor: backgroundColor }]} />

      {/* Subtle overlay elements */}
      <View style={styles.overlayContainer}>
        <View
          style={[
            styles.overlayShape2,
            styles.overlay2,
            { backgroundColor: overlayColor },
          ]}
        />
      </View>

      {/* Content container */}
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer} onLayout={handleTitleLayout}>
          <ThemedText
            type="title"
            style={[styles.topicTitle, { color: textTitleTextColor }]}
          >
            What does Elia mean?
          </ThemedText>
        </View>
        <View style={[styles.content, style]}>
          <View style={styles.mainSection}>
            <ThemedText type="subtitle" style={styles.subtitle}>
              <ThemedText style={styles.bold}>Elia</ThemedText> is a Hebrew name
              that means{' '}
              <ThemedText style={styles.quote}>"My God is Yahweh"</ThemedText>.
            </ThemedText>
            <ThemedText type="subtitle" style={styles.minimal}>
              <ThemedText style={styles.strong}>El</ThemedText> (אֵל) "God" •{' '}
              <ThemedText style={styles.strong}>-i</ThemedText> (ִי) "my" •{' '}
              <ThemedText style={styles.strong}>Yahu</ThemedText> (יָהוּ)
              "Yahweh"
            </ThemedText>
          </View>

          <View style={styles.nicknameSection}>
            <ThemedText
              type="subtitle"
              style={[styles.subtitle, { color: nicknameColor }]}
            >
              shortened nickname...{' '}
              <ThemedText style={[styles.bold, { color: nicknameColor }]}>
                Ellie!
              </ThemedText>{' '}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  overlayShape2: {
    position: 'absolute',
    borderRadius: '50%',
    // opacity: 0.08,
  },
  overlay2: {
    width: 2100,
    height: 1200,
    bottom: -1150,
    right: -850,
  },
  contentContainer: {
    padding: 24,
    gap: 16,
    position: 'relative',
    zIndex: 1,
    height: '100%',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  content: {
    gap: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  topicTitle: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  minimal: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  bold: {
    fontWeight: '600',
  },
  strong: {
    fontWeight: '600',
    fontSize: 14,
  },
  quote: {
    fontStyle: 'italic',
  },
  mainSection: {
    gap: 12,
  },
  nicknameSection: {
    marginTop: 8,
  },
});
