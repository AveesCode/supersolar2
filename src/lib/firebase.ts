/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer
} from 'firebase/firestore';
import { OperationType, FirestoreErrorInfo } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Handle cases where configuration might be default/mock or actual user configuration
const isConfigured = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('FakeKeyPlaceholder');

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, signInAnonymously };

/**
 * Handle Firestore errors following the Firebase Integration Skill guidelines
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore on initialization
 */
export async function testConnection(): Promise<boolean> {
  if (!isConfigured) {
    console.warn("Firebase configuration appears to be placeholders. Firestore features will run with standard mock failovers if offline.");
    return false;
  }
  try {
    // Attempt standard server read test
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore database connection tested successfully.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client appears offline.");
    } else {
      console.warn("Firestore collection lookup returned an error (expected if no custom connection test documents exist):", error);
    }
    return false;
  }
}
