import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBBRZtW7N2LRjRAlPVntciHf9rf_0AWY8E",
  authDomain: "controle-praia.firebaseapp.com",
  projectId: "controle-praia",
  storageBucket: "controle-praia.firebasestorage.app",
  messagingSenderId: "1007327676976",
  appId: "1:1007327676976:web:57d3f0ec7c496a0a0f3bf5"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);