import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

interface AppConfig {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
  }
}

function getFirebaseConfig() {
  const windowConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ || {} : {};
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);

  return {
    apiKey:
      windowConfig.firebaseApiKey ||
      (env.VITE_FIREBASE_API_KEY as string) ||
      'AIzaSyCqRDG0wdaBrmIHZwIg8Y7Pgd4BIp2wj8U',
    authDomain:
      windowConfig.firebaseAuthDomain ||
      (env.VITE_FIREBASE_AUTH_DOMAIN as string) ||
      'money-spending-tracker.firebaseapp.com',
    projectId:
      windowConfig.firebaseProjectId ||
      (env.VITE_FIREBASE_PROJECT_ID as string) ||
      'money-spending-tracker',
    storageBucket:
      windowConfig.firebaseStorageBucket ||
      (env.VITE_FIREBASE_STORAGE_BUCKET as string) ||
      'money-spending-tracker.firebasestorage.app',
    messagingSenderId:
      windowConfig.firebaseMessagingSenderId ||
      (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) ||
      '259178922510',
    appId:
      windowConfig.firebaseAppId ||
      (env.VITE_FIREBASE_APP_ID as string) ||
      '1:259178922510:web:8c03f50cc2a8c40abc325f',
  };
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(getFirebaseConfig());
    } else {
      app = getApp();
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}
