import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence,
  initializeAuth,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  connectFirestoreEmulator,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Initialize Auth with custom configuration for WebContainer environment
let auth;
try {
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });

  // Set persistence to local
  setPersistence(auth, browserLocalPersistence).catch(error => {
    console.warn('Error setting auth persistence:', error);
  });
} catch (error) {
  console.error('Error initializing Firebase Auth:', error);
  throw error;
}

// Initialize Firestore with settings optimized for WebContainer environment
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Force long polling for WebContainer
    cache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
  });

  // Enable multi-tab persistence with error handling
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firebase persistence failed: Multiple tabs open');
      // Optionally fall back to memory-only persistence
      console.warn('Falling back to memory-only persistence');
    } else if (err.code === 'unimplemented') {
      console.warn('Firebase persistence not supported in this browser');
    }
  });
} catch (error) {
  console.error('Error initializing Firestore:', error);
  throw error;
}

// Initialize Analytics only in production
let analytics = null;
if (!import.meta.env.DEV) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Error initializing Firebase Analytics:', error);
  }
}

// Export initialized services
export { analytics, db, auth };