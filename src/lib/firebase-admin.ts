
import * as admin from 'firebase-admin';

// When running in a managed environment like Firebase App Hosting,
// the Admin SDK can be initialized without any parameters.
// It automatically discovers the necessary service account credentials.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    if (error instanceof Error) {
        console.error('Firebase admin initialization error', error.stack);
    } else {
        console.error('An unknown error occurred during Firebase admin initialization', error);
    }
  }
}

// These are now exported as potentially null values.
// During the build process, they will be null, preventing build errors.
// At runtime, they will be initialized if the environment variables are present.
const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
const adminAuth = admin.apps.length > 0 ? admin.auth() : null;

export { adminDb, adminAuth };
