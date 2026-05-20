import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9Tc1QnzPDKXTgKbwkhUiJ8sgIIjDvNS8",
  authDomain: "pea-tracker-87d61.firebaseapp.com",
  projectId: "pea-tracker-87d61",
  storageBucket: "pea-tracker-87d61.firebasestorage.app",
  messagingSenderId: "440523082502",
  appId: "1:440523082502:web:cbb9ebc1971c231439ac87",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
