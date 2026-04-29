import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
<<<<<<< HEAD
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
=======
  apiKey: "AIzaSyAqxKEfmsFAttIa_RdVzSkqqpTowf-ku-o",
  authDomain: "crafto-ead62.firebaseapp.com",
  projectId: "crafto-ead62",
  storageBucket: "crafto-ead62.firebasestorage.app",
  messagingSenderId: "839650197309",
  appId: "1:839650197309:web:5beaa20b6570919d35cf54",
  measurementId: "G-FX3MR33GT9"
>>>>>>> b39509f (video feature)
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
