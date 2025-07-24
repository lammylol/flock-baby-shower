import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface TopicModuleThingsToPrayForProps {
    style?: React.ComponentProps<typeof View>['style'];
    containerStyle?: React.ComponentProps<typeof View>['style'];
}

export function TopicModuleThingsToPrayFor({
    style,
    containerStyle,
}: TopicModuleThingsToPrayForProps) {
    const hasMeasuredTitle = useRef(false);
    const backgroundColor = useThemeColor({}, 'backgroundSecondary');
    const textTitleTextColor = useThemeColor({}, 'textPrimary');
    const overlayColor = useThemeColor({}, 'backgroundVoiceRecording');
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
                        What to Pray For:
                    </ThemedText>
                </View>
                <View style={[styles.content, style]}>
                    <View style={styles.mainSection}>
                        <ThemedText type="subtitle" style={styles.subtitle}>
                            - Pray for Ellie's health and safety.{'\n'}- Pray that Elia would
                            hear God's voice well and listen.{'\n'}- That she would love the
                            Lord her God.
                            {'\n'}- Pray that she would be loving, and caring for the world
                            beyond herself.
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
        width: 2000,
        height: 1300,
        bottom: -1275,
        right: -925,
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
    mainSection: {
        gap: 12,
    },
});
