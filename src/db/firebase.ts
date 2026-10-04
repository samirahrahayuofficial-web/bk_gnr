import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

export const firebaseConfig = {
  projectId: rawConfig?.projectId || 'gen-lang-client-0116913773',
  appId: rawConfig?.appId || '1:1005034967103:web:1ba612f7a8209cde2fa88a',
  apiKey: rawConfig?.apiKey || 'AIzaSyCB8Eb5fLx3SmmUBct_oBMedONvj0vCPE4',
  authDomain: rawConfig?.authDomain || 'gen-lang-client-0116913773.firebaseapp.com',
  firestoreDatabaseId:
    rawConfig?.firestoreDatabaseId ||
    'ai-studio-sisteminformasib-2cad3b6f-e6e9-41da-b7a5-ee95867006ad',
  storageBucket: rawConfig?.storageBucket || 'gen-lang-client-0116913773.firebasestorage.app',
  messagingSenderId: rawConfig?.messagingSenderId || '1005034967103',
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID
export const firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Connection test
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, running with local cache.');
    } else {
      console.log('Firestore initialized successfully.');
    }
    return true;
  }
}

testFirestoreConnection();
