import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/context/AuthContext';
import { UserProvider } from '@/context/UserContext';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NetworkSyncProvider } from '@/hooks/zustand/syncSlice/netInfoListener';
import AppContent from '@/components/AppContent';
import { DataInitializer } from '@/components/DataInitializer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RecordingProvider } from '@/context/RecordingContext';
import { useSessionTracking } from '@/hooks/useSessionTracking';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  fade: true,
  duration: 200,
});

// Initialize Sentry
Sentry.init({
  dsn: 'https://68b8b9ac6b73f6e6ae8a86b3108103e9@o4509259538366464.ingest.us.sentry.io/4509350248972288',
  sendDefaultPii: true,
  // spotlight: __DEV__,
  debug: __DEV__, // Enable debug mode in development
  enableAutoSessionTracking: true,
  // Enable performance monitoring
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  // Enable experimental features
  _experiments: {
    enableLogs: true,
    reactNativeTracing: true,
  },
  // Configure beforeSend to filter out certain errors
  beforeSend(event) {
    // Log all events in development
    if (__DEV__) {
      console.log('Sentry event:', event);
    }
    return event;
  },
  // Configure integrations
  integrations: [
    // Add React Navigation integration if needed
  ],
});

// Note: Sentry automatically captures unhandled errors and promise rejections
// in production builds when properly configured

const queryClient = new QueryClient();

function RootLayoutWithProviders() {
  useSessionTracking();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <QueryClientProvider client={queryClient}>
              <RecordingProvider>
                <NetworkSyncProvider>
                  <DataInitializer />
                  <AppContent />
                </NetworkSyncProvider>
              </RecordingProvider>
            </QueryClientProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayoutWithProviders);
