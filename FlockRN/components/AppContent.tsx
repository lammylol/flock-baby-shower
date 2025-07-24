import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import useAuthContext from '@/hooks/useAuthContext';
import useUserContext from '@/hooks/useUserContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import SpaceMonoFont from '../assets/fonts/SpaceMono-Regular.ttf';

export default function AppContent() {
  const { userIsAuthenticated, isAuthLoading, authChecked } = useAuthContext();
  const { flagsLoaded } = useUserContext();
  const backgroundColor = useThemeColor({}, 'background');
  const [fontsLoaded] = useFonts({
    SpaceMono: SpaceMonoFont,
  });
  const [appReady, setAppReady] = useState(false);

  // Wait for all dependencies before marking app as ready
  useEffect(() => {
    if (fontsLoaded && authChecked && !isAuthLoading && flagsLoaded) {
      setAppReady(true);
    }
  }, [fontsLoaded, authChecked, isAuthLoading, flagsLoaded]);

  useEffect(() => {
    console.log('Dependencies changed:', {
      fontsLoaded,
      authChecked,
      isAuthLoading,
      flagsLoaded,
      appReady,
    });
  }, [fontsLoaded, authChecked, isAuthLoading, flagsLoaded, appReady]);

  const onLayoutRootView = useCallback(async () => {
    if (!appReady) return;

    try {
      await SplashScreen.hideAsync();
      if (userIsAuthenticated) {
        router.replace('/(tabs)/(prayerJournal)');
      } else {
        router.replace('/auth/login');
      }
    } catch (err) {
      console.error('Navigation error:', err);
    }
  }, [appReady, userIsAuthenticated]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!appReady) {
    return (
      <SafeAreaView edges={['top']} style={[styles.view, { backgroundColor }]}>
        <ActivityIndicator
          size="large"
          color="#ffffff"
          style={styles.activityIndicator}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.view, { backgroundColor }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor },
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
  },
  activityIndicator: {
    flex: 1,
  },
});
