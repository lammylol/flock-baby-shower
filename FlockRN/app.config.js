export default {
  expo: {
    owner: 'flockteam',
    name: 'FlockBabyShower',
    slug: 'flock-baby-shower',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/flock_branding/flock_LOGO.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.lammylol.FlockBabyShower',
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST,
      infoPlist: {
        NSSpeechRecognitionUsageDescription:
          'We need access to speech recognition to enable voice commands and transcription.',
        NSMicrophoneUsageDescription:
          'We need access to the microphone for capturing your voice input.',
        NSPhotoLibraryUsageDescription:
          'This app may request photo library access through third-party modules.',
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ['audio'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      googleServicesFile: './firebase/google-services.json',
      package: 'com.lammylol.FlockBabyShower',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-speech-recognition',
        {
          microphonePermission: 'Allow $(PRODUCT_NAME) to use the microphone.',
          speechRecognitionPermission:
            'Allow $(PRODUCT_NAME) to use speech recognition.',
          androidSpeechServicePackages: [
            'com.google.android.googlequicksearchbox',
          ],
        },
      ],
      [
        'expo-audio',
        {
          microphonePermission:
            'Allow $(PRODUCT_NAME) to access your microphone.',
        },
      ],
      'expo-speech-recognition',
      './plugins/withCustomPodfile',
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          project: 'react-native',
          organization: 'flock-0p',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/flock_branding/flock_NoBKGRD.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#82B362',
          darkMode: {
            image: './assets/images/flock_branding/flock_NoBKGRD.png',
            backgroundColor: '#1c1d22',
          },
          ios: {
            image: './assets/images/flock_branding/flock_NoBKGRD.png',
            imageWidth: 200,
            resizeMode: 'contain',
            backgroundColor: '#82B362',
            darkMode: {
              image: './assets/images/flock_branding/flock_NoBKGRD.png',
              backgroundColor: '#1c1d22',
            },
          },
          android: {
            image: './assets/images/flock_branding/flock_NoBKGRD.png',
            imageWidth: 200,
            resizeMode: 'contain',
            backgroundColor: '#82B362',
            darkMode: {
              image: './assets/images/flock_branding/flock_NoBKGRD.png',
              backgroundColor: '#1c1d22',
            },
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'cde9ecbd-1e9a-4c8f-a021-45d6c9d65720',
      },
    },
    updates: {
      url: 'https://u.expo.dev/cde9ecbd-1e9a-4c8f-a021-45d6c9d65720',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
  },
};
