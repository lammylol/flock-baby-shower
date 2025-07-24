// Temporary view for showing Pray for Flock.

import { TopicBanner } from './Prayer/PrayerViews/TopicBanner';
import { TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

const PrayForFlockBanner = () => {
  const textColor = useThemeColor({}, 'textOnBackgroundColor');
  const backgroundColor = useThemeColor({}, 'textPrimary');

  const handlePress = () => {
    router.push({
      pathname: '/(tabs)/(prayers)/prayerTopicView',
      params: { id: 'hwuewVSP8ej8YSCeD1Ne' },
    });
  };

  return (
    <TopicBanner backgroundColor={backgroundColor}>
      <TouchableOpacity style={styles.container} onPress={handlePress}>
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <ThemedText style={[styles.titleText, { color: textColor }]}>
              {'#PrayForFlock'}
            </ThemedText>
          </View>
          <IconSymbol
            name="chevron.right.circle.fill"
            size={28}
            color={textColor}
          />
        </View>
      </TouchableOpacity>
    </TopicBanner>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    flex: 1,
    gap: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  headerContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PrayForFlockBanner;
