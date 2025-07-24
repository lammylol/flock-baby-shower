import { Stack } from 'expo-router';
import { ThemedStack } from '@/components/ThemedStack';

export default function prayerJournal() {
  return (
    <ThemedStack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Prayer Journal',
          headerShown: false,
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="prayerView"
        options={{
          title: 'Prayer',
          headerBackButtonDisplayMode: 'default',
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="createAndEditPrayer"
        options={{
          title: 'Edit Prayer',
          headerBackButtonDisplayMode: 'default',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerShown: true,
        }}
      />
    </ThemedStack>
  );
}
