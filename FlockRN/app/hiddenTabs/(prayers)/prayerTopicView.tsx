/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, ActivityIndicator, View, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { ThemedText } from '@/components/ThemedText';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';
import { EntityType } from '@/types/PrayerSubtypes';
import { EditMode, From } from '@/types/ComponentProps';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import { HeaderButton } from '@/components/ui/HeaderButton';
import useAuthContext from '@/hooks/useAuthContext';
import {
  PrayerPoint,
  PrayerPointInTopicJourneyDTO,
} from '@shared/types/firebaseTypes';
import { sortPrayersByDate } from '@/utils/dateUtils';
import { NavigationUtils } from '@/utils/navigation';

const PrayerTopicView = () => {
  const { id } = useLocalSearchParams() as {
    id: string;
  };

  const { refreshPrayerTopicAndPoints, getPrayerTopicAndPoints } =
    usePrayerCollectionWithAuth();

  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'textPrimary');
  const user = useAuthContext().user;

  // Get data directly from store to be reactive to changes
  const { userPrayerTopics, userPrayerPoints } = usePrayerCollectionWithAuth();

  // Find the current topic and its points from the store
  const prayerTopic = userPrayerTopics.find((topic) => topic.id === id) || null;
  const isOwner = prayerTopic && user && prayerTopic.authorId === user.uid;

  const prayerPoints = useMemo(() => {
    const mappedPoints = prayerTopic?.journey?.map(
      (journey: PrayerPointInTopicJourneyDTO) =>
        userPrayerPoints.find((point: PrayerPoint) => point.id === journey.id),
    );

    // Filter out undefined values before sorting
    const validPoints =
      mappedPoints?.filter(
        (point: PrayerPoint | undefined): point is PrayerPoint =>
          point !== undefined,
      ) || [];

    return sortPrayersByDate(validPoints) as PrayerPoint[];
  }, [userPrayerPoints, prayerTopic?.journey]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getPrayerTopicAndPoints(id);
        if (!result) {
          setError('Prayer topic could not be fetched. Please try again.');
          return;
        }
      } catch (err) {
        setError('Failed to load prayer topic. Please try again.');
        console.error('Error loading prayer topic:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, getPrayerTopicAndPoints]); // Include getPrayerTopicAndPoints in dependencies

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPrayerTopicAndPoints(id);
    } catch (err) {
      console.error('Error refreshing prayer topic:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const formattedDate = (() => {
    if (!prayerTopic?.createdAt) return 'Unknown Date'; // Handle missing date

    let date: Date;
    if (prayerTopic.createdAt instanceof Date) {
      date = prayerTopic.createdAt;
    } else if (
      typeof prayerTopic.createdAt === 'object' &&
      'seconds' in prayerTopic.createdAt
    ) {
      date = new Date(prayerTopic.createdAt.seconds * 1000);
    } else {
      date = new Date(prayerTopic.createdAt);
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  })();

  const handleEdit = () => {
    if (!prayerTopic) return;

    try {
      // Be explicit with the complete path to the specific file
      NavigationUtils.toEditPrayerTopic({
        from: From.PRAYER_TOPIC,
        fromId: prayerTopic.id,
      });
    } catch (error) {
      console.error('Error navigating to edit screen:', error);
      Alert.alert('Error', 'Failed to navigate to edit screen');
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: useThemeColor({}, 'background') },
      ]}
    >
      <ThemedScrollView
        style={styles.scrollView}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {error ? (
          <ContentUnavailable
            errorTitle="Content Unavailable"
            errorMessage="Sorry, your prayer can't be loaded right now."
          />
        ) : prayerTopic ? (
          <>
            <Stack.Screen
              options={{
                headerRight: () =>
                  isOwner && <HeaderButton onPress={handleEdit} label="Edit" />,
              }}
            />
            <ThemedText style={[styles.createdAtText, { color: textColor }]}>
              Created on: {formattedDate}
            </ThemedText>

            <PrayerContent
              editMode={EditMode.VIEW}
              prayer={prayerTopic}
              entityType={EntityType.PrayerTopic}
              backgroundColor={backgroundColor}
            />
            <PrayerPointSection
              prayerPoints={prayerPoints as PrayerPoint[]}
              editMode={EditMode.VIEW}
              from={{ from: From.PRAYER_TOPIC, fromId: id }}
            />
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={textColor} />
            <ThemedText style={[styles.loadingText, { color: textColor }]}>
              {isLoading ? 'Loading prayer topic...' : 'Prayer topic not found'}
            </ThemedText>
          </View>
        )}

        {/* Spacer to push content up and button to bottom */}
      </ThemedScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createdAtText: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 20,
    marginBottom: 0,
    paddingLeft: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
});

export default PrayerTopicView;
