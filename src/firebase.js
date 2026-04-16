import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlKU2D66-etmOHtlefViHvx4whRVdRiEE",
  authDomain: "controle-praia-2026.firebaseapp.com",
  projectId: "controle-praia-2026",
  storageBucket: "controle-praia-2026.firebasestorage.app",
  messagingSenderId: "744354320192",
  appId: "1:744354320192:web:da72b446d481158ce834a5"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);