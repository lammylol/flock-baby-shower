import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { TopicModuleItem } from './TopicModuleItem';
import { Prayer } from '@shared/types/firebaseTypes';
import {
  getDateString,
  normalizeDate,
  simplifiedDateString,
} from '@/utils/dateUtils';
import { UniqueAuthorBadgesBabyShower } from '@/components/ui/authorBadgeBabyShower';
import flockSymbol from '@/assets/images/flock_branding/flock_SYMBOL.png';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface TopicModuleItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export interface TopicModuleProps {
  title?: string;
  items: TopicModuleItem[];
  prayers?: Prayer[];
  style?: React.ComponentProps<typeof View>['style'];
  containerStyle?: React.ComponentProps<typeof View>['style'];
}

export function TopicModule({
  title,
  items,
  prayers,
  style,
  containerStyle,
}: TopicModuleProps) {
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
        {/* <View
          style={[
            styles.overlayShape,
            styles.overlay1,
            { backgroundColor: overlayColor },
          ]}
        /> */}
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
            Prayers for Elia Lam 👧🏻
          </ThemedText>
        </View>
        {title && (
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
        )}
        <View style={[styles.content, style]}>
          {items.map((item, index) => (
            <TopicModuleItem
              key={index}
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </View>
        {prayers && (
          <TopicModuleItem
            label="Prayer buddies"
            icon={<Image source={flockSymbol} style={styles.icon} />}
          >
            <UniqueAuthorBadgesBabyShower prayers={prayers} />
          </TopicModuleItem>
        )}
      </View>
    </View>
  );
}

// Helper functions for common use cases
export function createDateStartedModule(prayers: Prayer[]): TopicModuleItem[] {
  if (!prayers.length) {
    return [
      {
        label: 'Date Started',
        value: 'No prayers yet',
      },
    ];
  }

  // Find the earliest prayer
  const sortedPrayers = [...prayers].sort((a, b) => {
    const dateA = normalizeDate(a.createdAt);
    const dateB = normalizeDate(b.createdAt);
    return dateA.getTime() - dateB.getTime();
  });

  const firstPrayer = sortedPrayers[0];
  const startDate = simplifiedDateString(getDateString(firstPrayer.createdAt));

  return [
    {
      label: 'Date Started',
      value: startDate || 'Unknown',
    },
  ];
}

export function createPrayerCountModule(prayers: Prayer[]): TopicModuleItem[] {
  const totalPrayers = prayers.length;

  return [
    {
      label: 'Total Prayers',
      value: totalPrayers.toString(),
    },
  ];
}

export function createCombinedModule(prayers: Prayer[]): TopicModuleItem[] {
  const dateItems = createDateStartedModule(prayers);
  const countItems = createPrayerCountModule(prayers);

  return [...dateItems, ...countItems];
}

export function createPrayerStatsModule(prayers: Prayer[]): TopicModuleItem[] {
  if (!prayers.length) {
    return [
      {
        label: 'Prayer Stats',
        value: 'No prayers yet',
      },
    ];
  }

  // Calculate some basic stats
  const totalPrayers = prayers.length;
  const prayersWithAudio = prayers.filter(
    (p) => p.audioLocalPath || p.audioRemotePath,
  ).length;
  const prayersWithPoints = prayers.filter(
    (p) => p.prayerPoints && p.prayerPoints.length > 0,
  ).length;

  return [
    {
      label: 'Total Prayers',
      value: totalPrayers.toString(),
    },
    {
      label: 'With Audio',
      value: prayersWithAudio.toString(),
    },
    {
      label: 'With Points',
      value: prayersWithPoints.toString(),
    },
  ];
}

export function createPrayerTopicsModule(prayers: Prayer[]): TopicModuleItem[] {
  if (!prayers.length) {
    return [
      {
        label: 'Prayer Topics',
        value: 'No prayers yet',
      },
    ];
  }

  // Count unique linked topics
  const topics = new Set<string>();
  prayers.forEach((prayer) => {
    if (prayer.linkedTopics && Array.isArray(prayer.linkedTopics)) {
      prayer.linkedTopics.forEach((topic: string) => topics.add(topic));
    }
  });

  return [
    {
      label: 'Linked Topics',
      value: topics.size.toString(),
    },
    {
      label: 'Most Active',
      value: topics.size > 0 ? 'Family & Health' : 'None',
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    position: 'relative',
    borderColor: Colors.secondary,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
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
    bottom: -1130,
    right: -800,
  },
  contentContainer: {
    padding: 24,
    gap: 16,
    position: 'relative',
    zIndex: 1,
    height: '100%',
  },
  title: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
  },
  content: {
    gap: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
  },
  topicTitle: {
    fontSize: 28,
    fontWeight: '600',
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
});
