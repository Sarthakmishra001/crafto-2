import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAqxKEfmsFAttIa_RdVzSkqqpTowf-ku-o",
  authDomain: "crafto-ead62.firebaseapp.com",
  projectId: "crafto-ead62",
  storageBucket: "crafto-ead62.firebasestorage.app",
  messagingSenderId: "839650197309",
  appId: "1:839650197309:web:5beaa20b6570919d35cf54",
  measurementId: "G-FX3MR33GT9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
