import { StyleSheet, View } from 'react-native';
import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { FlashList } from '@shopify/flash-list';
import Animated from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';
import { getDateString, simplifiedDateString } from '@/utils/dateUtils';
import PrayerDayGroup from '@/components/Prayer/PrayerViews/PrayerJournalDay';
import RulerSidebar from '@/components/ui/verticalRulerScroll';
import { Prayer } from '@shared/types/firebaseTypes';
import {
  createCombinedModule,
  TopicModule,
} from '@/components/Prayer/PrayerViews/TopicModule';
import { SwipeableTopicModule } from '@/components/Prayer/PrayerViews/SwipeableTopicModule';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';
import { TopicModuleElia } from '@/components/Prayer/PrayerViews/TopicModuleElia';
import { TopicModuleThingsToPrayFor } from '@/components/Prayer/PrayerViews/TopicModuleThingsToPrayFor';

type FlatDataItem =
  | { type: 'group'; key: string; prayers: Prayer[] }
  | { type: 'header'; key: string };

export default function PrayerJournalScreen() {
  const { filteredUserPrayers, loadPrayers } = usePrayerCollectionWithAuth();

  const [isRefreshing] = useState(false);
  const [isProgrammaticScrolling, setIsProgrammaticScrolling] = useState(false);

  const scrollRef = useRef<FlashList<FlatDataItem>>(null);
  const itemHeights = useRef<Record<string, number>>({});
  const hasMeasuredTitle = useRef(false);

  const groupedEntries = useMemo(() => {
    const grouped: Record<string, Prayer[]> = {};
    filteredUserPrayers.forEach((prayer) => {
      let dateKey: string;
      if (prayer.createdAt) {
        dateKey = getDateString(prayer.createdAt);
      } else {
        dateKey = 'Unknown Date';
      }

      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(prayer);
    });

    // Sort the entries by date in descending order (newest first)
    return Object.entries(grouped).sort(([dateA], [dateB]) => {
      if (dateA === 'Unknown Date') return 1;
      if (dateB === 'Unknown Date') return -1;
      return dateB.localeCompare(dateA); // Descending order (newest first)
    });
  }, [filteredUserPrayers]);

  const dateKeys = groupedEntries.map(([key]) => key);

  // Reset measurement when data changes
  useEffect(() => {
    hasMeasuredTitle.current = false;
  }, [filteredUserPrayers.length]); // Re-measure when prayer count changes

  const { flatData, headerIndexMap, stickyHeaderIndices } = useMemo(() => {
    const flatList: FlatDataItem[] = [];
    const headerMap: Record<string, number> = {};
    const stickyIndices: number[] = [];

    groupedEntries.forEach(([key, prayers]) => {
      const currentIndex = flatList.length;
      headerMap[key] = currentIndex;

      flatList.push({ type: 'header', key });
      stickyIndices.push(currentIndex); // ONLY header gets sticky

      flatList.push({ type: 'group', key, prayers }); // non-sticky
    });

    return {
      flatData: flatList,
      headerIndexMap: headerMap,
      stickyHeaderIndices: stickyIndices,
    };
  }, [groupedEntries]);

  const { handleScroll, isScrolling, titleAnimatedStyle } =
    useScrollDirection();

  const scrollToDateKey = useCallback(
    (dateKey: string) => {
      const index = headerIndexMap[dateKey];
      if (index != null && scrollRef.current) {
        setIsProgrammaticScrolling(true);
        scrollRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0,
        });
        setTimeout(() => setIsProgrammaticScrolling(false), 100);
      }
    },
    [headerIndexMap],
  );

  const renderTopicModule = useCallback(() => {
    const modules = [
      <TopicModule
        key="prayer-overview"
        items={createCombinedModule(filteredUserPrayers)}
        prayers={filteredUserPrayers}
      />,
      <TopicModuleElia key="daily-inspiration" />,
      <TopicModuleThingsToPrayFor key="things-to-pray-for" />,
    ];

    return <SwipeableTopicModule modules={modules} />;
  }, [filteredUserPrayers]);

  const onRefresh = useCallback(() => {
    sentryAnalytics.trackJournalInteraction('refresh');
    loadPrayers();
  }, [loadPrayers]);

  return (
    <ThemedView style={styles.view}>
      <ThemedView style={styles.outerContainer}>
        <Animated.View style={titleAnimatedStyle}>
          {renderTopicModule()}
        </Animated.View>

        <FlashList
          ref={scrollRef}
          data={flatData}
          estimatedItemSize={40}
          stickyHeaderIndices={
            isProgrammaticScrolling ? [] : stickyHeaderIndices
          }
          getItemType={(item) => item.type}
          overrideItemLayout={(layout, item) => {
            layout.size =
              item.type === 'header' ? 60 : itemHeights.current[item.key] || 80;
          }}
          onScroll={filteredUserPrayers.length > 2 ? handleScroll : undefined}
          keyboardDismissMode="on-drag"
          scrollEventThrottle={16}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <ThemedView style={styles.header}>
                  <ThemedText type="title" style={styles.collapsibleTitle}>
                    {simplifiedDateString(item.key)}
                  </ThemedText>
                </ThemedView>
              );
            }

            if (item.type === 'group') {
              return <PrayerDayGroup prayers={item.prayers} />;
            }

            return null;
          }}
          keyExtractor={(item, index) => {
            if (item.type === 'header') return `header-${item.key}-${index}`;
            if (item.type === 'group') return `group-${item.key}-${index}`;
            return `item-${index}`;
          }}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredUserPrayers.length > 2
              ? styles.contentContaineExpanded
              : styles.contentContainer
          }
        />
      </ThemedView>

      {isScrolling && (
        <View style={styles.rulerContainer}>
          <RulerSidebar dateKeys={dateKeys} onPress={scrollToDateKey} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  view: { flex: 1, paddingHorizontal: 24 },
  outerContainer: { flex: 1, gap: 24, paddingTop: 0 },
  header: { paddingBottom: 8 },
  collapsibleTitle: { fontSize: 20 },
  rulerContainer: {
    position: 'absolute',
    right: 2,
    top: '30%',
    width: 100,
  },
  contentContaineExpanded: {
    paddingBottom: 200,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});
