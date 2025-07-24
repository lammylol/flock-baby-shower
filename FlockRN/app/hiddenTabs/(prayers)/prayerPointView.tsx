/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import useAuthContext from '@/hooks/useAuthContext';
import { ThemedText } from '@/components/ThemedText';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { EntityType } from '@/types/PrayerSubtypes';
import { EditMode, From } from '@/types/ComponentProps';
import { prayerPointService } from '@/services/prayer/prayerPointService';
import PrayerPointLinking from '@/components/Prayer/PrayerViews/PrayerPointLinking';
import { PrayerPoint } from '@shared/types/firebaseTypes';
import { getDateStringWithTime } from '@/utils/dateUtils';
import { NavigationUtils } from '@/utils/navigation';

const PrayerPointView = () => {
  const {
    id: prayerPointId,
    from,
    fromId,
  } = useLocalSearchParams() as {
    id: string;
    from: From;
    fromId: string;
  };

  const { userPrayerPoints, updateCollection } = usePrayerCollectionWithAuth();

  const user = useAuthContext().user;
  const [error, setError] = useState<string | null>(null);
  const [isDeleting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'textPrimary');
  const scrollViewRef = useRef<ScrollView>(null);
  const prayerPoint =
    userPrayerPoints.find((p) => p.id === prayerPointId) || null;

  const fetchPrayerPoint = useCallback(async () => {
    try {
      const fetchedPrayer =
        await prayerPointService.getPrayerPoint(prayerPointId);
      if (fetchedPrayer) {
        updateCollection(fetchedPrayer, 'prayerPoint');
      }
    } catch (err) {
      console.error(err);
      setError('Prayer could not be fetched. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [prayerPointId, updateCollection]);

  useEffect(() => {
    if (!prayerPoint) {
      fetchPrayerPoint();
    }
  }, [prayerPoint, fetchPrayerPoint]);

  const isOwner =
    prayerPoint && user && (prayerPoint as PrayerPoint).authorId === user.uid;

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrayerPoint();
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []); // Scroll to bottom whenever messages change

  const handleEdit = () => {
    if (!prayerPoint) return;

    try {
      // Use standardized navigation utility
      NavigationUtils.toEditPrayerPoint({
        from: From.PRAYER_POINT,
        fromId: prayerPoint.id,
      });
    } catch (error) {
      console.error('Error navigating to edit screen:', error);
      Alert.alert('Error', 'Failed to navigate to edit screen');
    }
  };

  const handleRouteBack = () => {
    if (from === From.PRAYER && fromId) {
      NavigationUtils.toPrayer(fromId);
    } else {
      NavigationUtils.back();
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
        ) : isDeleting ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ContentUnavailable
              errorTitle="Deleting Prayer Point"
              errorMessage="Your prayer point is being deleted right now."
            />
          </>
        ) : prayerPoint ? (
          <>
            <Stack.Screen
              options={{
                headerRight: () =>
                  isOwner ? (
                    <HeaderButton onPress={handleEdit} label="Edit" />
                  ) : null,
                headerLeft: () => (
                  <HeaderButton onPress={handleRouteBack} label="Back" />
                ),
              }}
            />
            <ThemedText style={[styles.createdAtText, { color: textColor }]}>
              Created on: {getDateStringWithTime(prayerPoint.createdAt)}
            </ThemedText>

            <PrayerContent
              editMode={EditMode.VIEW}
              prayer={prayerPoint}
              entityType={EntityType.PrayerPoint}
              backgroundColor={backgroundColor}
            />

            {prayerPoint.linkedTopics && (
              <PrayerPointLinking
                disabled={true}
                prayerPoint={prayerPoint}
                isEditMode={false}
              />
            )}

            <View style={styles.spacer} />
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ThemedText style={styles.loadingText}>
              Loading prayer point...
            </ThemedText>
          </View>
        )}
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
  // Add a spacer that will push content up and delete button to the bottom
  spacer: {
    flex: 1,
    minHeight: 20, // Minimum height to ensure some spacing even when content is long
  },
});

export default PrayerPointView;
