import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjc8PC_oJBWtECf4f89D6jYrNjpxDb-Ls",
  authDomain: "rent-track-e8e32.firebaseapp.com",
  projectId: "rent-track-e8e32",
  storageBucket: "rent-track-e8e32.firebasestorage.app",
  messagingSenderId: "381379480202",
  appId: "1:381379480202:web:904586eec4cb28004b7b73"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);