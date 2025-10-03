import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAIz6KKfwAtAcD1UDJcVfdQM3S_F5uphzk",
  authDomain: "expresso-van-16d96.firebaseapp.com",
  projectId: "expresso-van-16d96",
  storageBucket: "expresso-van-16d96.firebasestorage.app",
  messagingSenderId: "351665381201",
  appId: "1:351665381201:web:028fd8c395f92570f5bd70",
  measurementId: "G-EYCQLP8LQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;