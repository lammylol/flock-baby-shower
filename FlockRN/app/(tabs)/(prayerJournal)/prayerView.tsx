/* This file sets the screen that a user sees when clicking into a prayer.*/
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import PrayerContent from '@/components/Prayer/PrayerViews/PrayerContent';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { useAuthenticatedUser } from '@/hooks/useAuthContext';
import ContentUnavailable from '@/components/UnavailableScreens/ContentUnavailable';
import { useThemeColor } from '@/hooks/useThemeColor';
import PrayerPointSection from '@/components/Prayer/PrayerViews/PrayerPointSection';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { usePrayerCollectionWithAuth } from '@/hooks/zustand/prayerSlice/prayerStore';
import { Prayer, PrayerPoint } from '@shared/types/firebaseTypes';
import { EntityType } from '@/types/PrayerSubtypes';
import { EditMode, From } from '@/types/ComponentProps';
import { prayerPointService } from '@/services/prayer/prayerPointService';
import { NavigationUtils } from '@/utils/navigation';
import AudioFile from '@/components/Prayer/PrayerViews/AudioFile/AudioFile';
import { resolveAudioUri } from '@/utils/recording/getAudioPaths';
import WhoPrayedSection from '@/components/Prayer/PrayerViews/WhoPrayed';
import { sentryAnalytics } from '@/services/analytics/sentryAnalytics';

const PrayerView = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthenticatedUser();
  const colorScheme = useThemeColor({}, 'backgroundSecondary');
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [prayerPoints, setPrayerPoints] = useState<PrayerPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const { userPrayers } = usePrayerCollectionWithAuth();

  const loadPrayer = useCallback(async () => {
    if (!id || !user) return;

    try {
      const prayerData = userPrayers.find((p) => p.id === id);

      if (prayerData) {
        setPrayer(prayerData);
        setIsOwner(prayerData.authorId === user.uid);

        // Load prayer points if they exist
        if (prayerData.prayerPoints && prayerData.prayerPoints.length > 0) {
          const points = await Promise.all(
            prayerData.prayerPoints.map(async (prayerPoint: PrayerPoint) => {
              try {
                return await prayerPointService.getPrayerPointById(
                  prayerPoint.id,
                );
              } catch (error) {
                console.error('PrayerView Error loading prayer point:', error);
                return null;
              }
            }),
          );

          const validPoints = points.filter(
            (p): p is PrayerPoint => p !== null,
          );

          setPrayerPoints(validPoints);
        }
      } else {
        setError('Prayer not found');
      }
    } catch (error) {
      console.error('PrayerView Error loading prayer:', error);
      setError('Failed to load prayer');
    }
  }, [id, user, userPrayers]);

  useEffect(() => {
    loadPrayer();
  }, [loadPrayer]);

  const onRefresh = useCallback(() => {
    sentryAnalytics.trackPrayerViewInteraction('refresh', id);
    setRefreshing(true);
    loadPrayer();
    setRefreshing(false);
  }, [loadPrayer, id]);

  const handleEdit = useCallback(() => {
    sentryAnalytics.trackUserInteraction('edit', 'PrayerView', 'handleEdit', {
      prayerId: id,
    });
    NavigationUtils.toEditPrayer(EditMode.EDIT, {
      from: From.PRAYER,
      fromId: id,
    });
  }, [id]);

  // Determine audio URI for AudioFile component
  const audioUri = useMemo(
    () => resolveAudioUri(prayer?.audioLocalPath, prayer?.audioRemotePath),
    [prayer?.audioLocalPath, prayer?.audioRemotePath],
  );

  return (
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
      ) : (
        prayer && (
          <>
            <Stack.Screen
              options={{
                headerRight: () =>
                  isOwner && <HeaderButton onPress={handleEdit} label="Edit" />,
              }}
            />
            {prayer?.whoPrayed && (
              <WhoPrayedSection
                whoPrayed={prayer.whoPrayed}
                editMode={EditMode.VIEW}
              />
            )}
            {/* Audio File Component - Show when there's a recording */}
            {audioUri && (
              <AudioFile
                localAudioUri={audioUri}
                remoteAudioUri={prayer?.audioRemotePath}
                transcription={prayer?.content}
                editMode={EditMode.VIEW}
              />
            )}
            {prayerPoints && prayerPoints.length > 0 && (
              <PrayerPointSection
                prayerPoints={prayerPoints}
                isPrayerCardsEditable={false}
                editMode={EditMode.VIEW}
                from={{ from: From.PRAYER, fromId: id }}
              />
            )}
            {!audioUri && (
              <PrayerContent
                editMode={EditMode.VIEW}
                prayer={prayer}
                entityType={EntityType.Prayer}
                backgroundColor={colorScheme}
              />
            )}
          </>
        )
      )}
    </ThemedScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
});

export default PrayerView;
