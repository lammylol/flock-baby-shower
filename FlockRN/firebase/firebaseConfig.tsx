// Purpose of this code: This code snippet initializes Firebase services
// and exports them for use in the application.

// src/firebase.ts or src/firebaseConfig.ts
import { initializeApp } from '@firebase/app'; // FirebaseApp initialization
import { initializeFirestore } from '@firebase/firestore'; // Firestore initialization
import { getReactNativePersistence, initializeAuth } from '@firebase/auth'; // Firebase Auth
import { getFunctions } from '@firebase/functions'; // Firebase Functions
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAmQgA6GlTitQbHoAx7i-8SI7bTUUMm5f8',
  authDomain: 'flock-dev-cb431.firebaseapp.com',
  projectId: 'flock-dev-cb431',
  storageBucket: 'flock-dev-cb431.firebasestorage.app',
  messagingSenderId: '722774892392',
  appId: '1:722774892392:web:116ac42e664da3178000dd',
  measurementId: 'G-498Y2Q93QY',
};

const app = initializeApp(firebaseConfig);
// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore with settings for Expo Go
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Initialize Firebase Functions
const functions = getFunctions(app);

export { auth, db, functions };
export default app;
