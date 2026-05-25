import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyANYzudfOg1C_aG1yVrlbUBxrpjIKqwJck",
  authDomain: "tunify-6bedd.firebaseapp.com",
  projectId: "tunify-6bedd",
  storageBucket: "tunify-6bedd.firebasestorage.app",
  messagingSenderId: "798226911568",
  appId: "1:798226911568:android:89aec96f0d6855f5885c55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
