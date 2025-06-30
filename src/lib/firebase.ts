
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTsZ8dL0rP7KzsL66Cw6Fw9DY1RmnSWb8",
  authDomain: "kinetic-flow-bwah3.firebaseapp.com",
  projectId: "kinetic-flow-bwah3",
  storageBucket: "kinetic-flow-bwah3.firebasestorage.app",
  messagingSenderId: "1003084073207",
  appId: "1:1003084073207:web:32f2763190598251b02bf2"
};

const hasFirebaseConfig = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (hasFirebaseConfig) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
}

export { app, auth, db, hasFirebaseConfig, googleProvider };
