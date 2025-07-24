import { Stack } from 'expo-router';
import { ThemedStack } from '@/components/ThemedStack';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { NavigationUtils } from '@/utils/navigation';

export default function prayers() {
  return (
    <ThemedStack>
      <Stack.Screen
        name="index"
        options={{
          title: 'MyPrayers',
          headerShown: false,
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="prayerPointView"
        options={{
          title: 'Prayer Point',
          headerBackButtonDisplayMode: 'default',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="prayerTopicView"
        options={{
          title: 'Prayer Topic',
          headerBackButtonDisplayMode: 'default',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerShown: true,
          // INSERT_YOUR_CODE
          headerLeft: () => (
            <HeaderButton
              onPress={() => {
                NavigationUtils.back();
              }}
              label="Back"
              hasBackIcon={true}
            />
          ),
        }}
      />
      <Stack.Screen
        name="createAndEditPrayerPoint"
        options={{
          title: 'Add Prayer Point',
          headerBackButtonDisplayMode: 'default',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="editPrayerTopic"
        options={{
          title: 'Edit Prayer Topic',
          headerBackButtonDisplayMode: 'default',
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="createPrayerTopic"
        options={{
          title: 'Add Prayer Topic',
          presentation: 'modal',
          headerShown: true,
          headerShadowVisible: false,
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
          headerLeft: () => (
            <HeaderButton
              onPress={() => {
                NavigationUtils.back();
              }}
              label="Cancel"
            />
          ),
        }}
      />
    </ThemedStack>
  );
}
