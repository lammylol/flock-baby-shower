import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import {
  AnyPrayerEntity,
  Prayer,
  PrayerTopic,
} from '@shared/types/firebaseTypes';
import EditablePrayerCard from '@/components/Prayer/PrayerViews/PrayerCard';
import SearchBar from '@/components/ui/SearchBar';
import { FloatingAddTopicButton } from '@/components/Prayer/PrayerViews/FloatingAddTopic';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';
import PrayForFlockBanner from '@/components/PrayForFlock';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useCallback, useEffect, useRef } from 'react';
import { NavigationUtils } from '@/utils/navigation';

export default function TabTwoScreen() {
  const buttonBackgroundColor = useThemeColor({}, 'textSecondary');
  const { filteredUserPrayerTopics, loadPrayerTopics, searchPrayers } =
    usePrayerCollectionWithAuth();

  // Use useRef to store stable references to avoid infinite loops
  const loadPrayerTopicsRef = useRef(loadPrayerTopics);
  loadPrayerTopicsRef.current = loadPrayerTopics;

  const loadPrayerTopicsCallback = useCallback(() => {
    console.log('Loading prayer topics');
    loadPrayerTopicsRef.current();
  }, []);

  useEffect(() => {
    loadPrayerTopicsCallback();
  }, [loadPrayerTopicsCallback]);

  const handlePress = (prayer: AnyPrayerEntity) => {
    switch (prayer.entityType) {
      case 'prayerPoint':
        router.push({
          pathname: '/(tabs)/(prayers)/prayerPointView',
          params: { id: prayer.id },
        });
        break;
      case 'prayer':
        router.push({
          pathname: '/(tabs)/(prayerJournal)/prayerView',
          params: { id: (prayer as Prayer).id },
        });
        break;
      case 'prayerTopic':
        router.push({
          pathname: '/(tabs)/(prayers)/prayerTopicView',
          params: { id: (prayer as PrayerTopic).id },
        });
        break;
      default:
        // Handle unknown entity type
        console.error('Unknown entity type:', prayer.entityType);
        return;
    }
  };

  return (
    <>
      <ThemedView style={styles.view}>
        <ThemedScrollView
          style={styles.scrollView}
          onRefresh={loadPrayerTopics}
        >
          <ThemedView style={styles.outerContainer}>
            <PrayForFlockBanner />
            <ThemedView style={styles.innerContainer}>
              <ThemedText type="title" style={styles.title}>
                #Topics I'm Praying For 🙏
              </ThemedText>

              <SearchBar
                placeholder={'Search Prayer Topics'}
                onSearch={searchPrayers}
                openModalOnFocus={false}
              />
              <ThemedView style={styles.content}>
                <ThemedView style={styles.cardList}>
                  {filteredUserPrayerTopics.map((topic: PrayerTopic) => (
                    <EditablePrayerCard
                      key={topic.id}
                      prayer={topic}
                      editable={false}
                      onPress={() => handlePress(topic)}
                      maxLines={3}
                    />
                  ))}
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedScrollView>
        <FloatingAddTopicButton
          onPress={() => {
            NavigationUtils.toCreatePrayerTopic();
          }}
          style={{
            backgroundColor: buttonBackgroundColor + '30',
          }}
          bottom={30}
          right={30}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    gap: 24,
  },
  content: {},
  view: {
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 100,
  },
  innerContainer: {
    paddingBottom: 32,
    gap: 24,
  },
  cardList: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
});
