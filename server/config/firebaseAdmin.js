import admin from 'firebase-admin';

let firebaseInitialized = false;

export const initFirebaseAdmin = () => {
  if (firebaseInitialized) {
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const isPlaceholder =
    !projectId ||
    !clientEmail ||
    !privateKey ||
    projectId === 'your-project-id' ||
    clientEmail.includes('your-service-account') ||
    privateKey.includes('YOUR_KEY');

  if (isPlaceholder) {
    console.warn(
      'Firebase Admin SDK not configured. Set FIREBASE_* env vars to enable authentication.'
    );
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized');
    return admin;
  } catch (error) {
    console.warn('Firebase Admin SDK initialization failed:', error.message);
    return null;
  }
};

export const getFirebaseAdmin = () => {
  if (!firebaseInitialized) {
    return initFirebaseAdmin();
  }
  return admin;
};

export default admin;
