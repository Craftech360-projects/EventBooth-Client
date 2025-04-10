import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8ZJf1DKZXUDqpUFkaUjIMRHYEHHoVma0",
  authDomain: "event-booth-cft360.firebaseapp.com",
  projectId: "event-booth-cft360",
  storageBucket: "event-booth-cft360.firebasestorage.app",
  messagingSenderId: "741751085742",
  appId: "1:741751085742:web:f637c70fa86228c0b16b3f",
  measurementId: "G-FEFRB2ZPXN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
