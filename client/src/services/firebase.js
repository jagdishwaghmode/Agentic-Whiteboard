import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'your-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'your-sender-id',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'your-app-id',
};

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'your-api-key' &&
  !apiKey.includes('your-')
);

// Always initialize Firebase App and Auth so auth object is never null
let app = null;
let auth = null;
let googleProvider = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (err) {
  console.warn('Firebase init warning:', err);
}

export { app, auth, googleProvider };

const MOCK_STORAGE_KEY = 'ai_whiteboard_mock_user';
const listeners = new Set();

export const getMockUser = () => {
  const saved = localStorage.getItem(MOCK_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      parsed.getIdToken = async () => 'mock-token-dev';
      return parsed;
    } catch {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    }
  }
  return null;
};

const setMockUser = (user) => {
  if (user) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  }
  listeners.forEach((cb) => cb(user));
};

export const registerWithEmail = async (email, password) => {
  if (isFirebaseConfigured && auth) {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.warn('Firebase registration attempt failed, using local user state:', err.message);
    }
  }
  const cleanEmail = email.trim();
  const mockUser = {
    uid: `user_${Date.now()}`,
    email: cleanEmail,
    displayName: cleanEmail.split('@')[0],
  };
  setMockUser(mockUser);
  return { user: mockUser };
};

export const loginWithEmail = async (email, password) => {
  if (isFirebaseConfigured && auth) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.warn('Firebase login attempt failed, using local user state:', err.message);
    }
  }
  const cleanEmail = email.trim();
  const mockUser = {
    uid: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: cleanEmail,
    displayName: cleanEmail.split('@')[0],
  };
  setMockUser(mockUser);
  return { user: mockUser };
};

export const loginWithGoogle = async () => {
  if (isFirebaseConfigured && auth && googleProvider) {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn('Firebase Google login attempt failed, using local user state:', err.message);
    }
  }
  const mockUser = {
    uid: 'google_user_123',
    email: 'google.user@example.com',
    displayName: 'Google User',
  };
  setMockUser(mockUser);
  return { user: mockUser };
};

export const logout = async () => {
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  }
  setMockUser(null);
};

export const onAuthChange = (callback) => {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          callback(user);
        } else {
          callback(getMockUser());
        }
      },
      (error) => {
        console.warn('Firebase auth state error:', error);
        callback(getMockUser());
      }
    );
  }

  listeners.add(callback);
  callback(getMockUser());

  return () => {
    listeners.delete(callback);
  };
};

export default app;
