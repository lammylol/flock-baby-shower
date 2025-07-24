import { PrayerMetadataContextProvider } from '@/context/PrayerMetadataContext/PrayerMetadataContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import useAuthContext from '@/hooks/useAuthContext';
import { Stack } from 'expo-router';
import { User } from 'firebase/auth';
import { NavigationUtils } from '@/utils/navigation';
import { PrayerPointContextProvider } from '@/context/PrayerPointContext/PrayerPointContext';
import { useMemo } from 'react';
import { HeaderButton } from '@/components/ui/HeaderButton';

export default function CreatePrayerFlowLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'textPrimary');
  const voiceRecordingHeaderColor = useThemeColor(
    {},
    'backgroundVoiceRecording',
  );
  const { user } = useAuthContext();
  const PrayerMetadataProvider = useMemo(
    () => PrayerMetadataContextProvider(user as User),
    [user],
  );

  const PrayerPointProvider = useMemo(
    () => PrayerPointContextProvider(user as User),
    [user],
  );

  return (
    <PrayerMetadataProvider>
      <PrayerPointProvider>
        <Stack
          screenOptions={{
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: { backgroundColor },
            headerTitleStyle: { color: textColor },
            headerTintColor: textColor,
          }}
          initialRouteName="prayerCreateModal"
        >
          <Stack.Screen
            name="prayerCreateModal"
            options={{
              title: 'PRAY',
              headerBackButtonDisplayMode: 'default',
              headerLeft: () => (
                <HeaderButton
                  onPress={() => NavigationUtils.back()}
                  label="Cancel"
                />
              ),
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          <Stack.Screen
            name="writePrayer"
            options={{
              title: 'Add Prayer',
              headerBackButtonDisplayMode: 'default',
              headerBackTitle: 'Back',
              headerLeft: () => (
                <HeaderButton
                  onPress={() => NavigationUtils.back()}
                  label="Cancel"
                />
              ),
            }}
          />
          <Stack.Screen
            name="voiceRecording"
            options={{
              title: 'Record Prayer',
              headerBackButtonDisplayMode: 'default',
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: voiceRecordingHeaderColor,
              },
            }}
          />
          <Stack.Screen
            name="createPrayer"
            options={{
              title: 'Edit Prayer',
              headerBackButtonDisplayMode: 'default',
              headerBackTitle: 'Back',
              headerShown: true,
              headerLeft: () => (
                <HeaderButton
                  onPress={() => NavigationUtils.back()}
                  label="Back"
                  hasBackIcon={true}
                />
              ),
            }}
          />
          <Stack.Screen
            name="createPrayerPointFromContent"
            options={{
              title: 'Create Prayer Point',
              headerBackButtonDisplayMode: 'default',
              headerShown: true,
              headerBackTitle: 'Back',
            }}
          />
        </Stack>
      </PrayerPointProvider>
    </PrayerMetadataProvider>
  );
}
