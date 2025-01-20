import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCZo-HCtTqI7U8sHu9RYOPgPeHgCGuUjSM',
  authDomain: 'shopsyncai-19aba.firebaseapp.com',
  projectId: 'shopsyncai-19aba',
  storageBucket: 'shopsyncai-19aba.firebasestorage.app',
  messagingSenderId: '617167398621',
  appId: '1:617167398621:web:d21c2a4da4525318969d34',
  measurementId: 'G-X5FD4VCMEJ',
};

console.log('Initializing Firebase with config:', {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId,
  storageBucket: !!firebaseConfig.storageBucket,
  messagingSenderId: !!firebaseConfig.messagingSenderId,
  appId: !!firebaseConfig.appId,
  measurementId: !!firebaseConfig.measurementId,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
let analytics = null;
// Only initialize analytics if we're in a browser environment
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Export Firebase services
export { auth, analytics, db, storage, googleProvider };
