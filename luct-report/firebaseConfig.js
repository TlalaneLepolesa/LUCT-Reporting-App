import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase project configuration
const firebaseConfig = {
apiKey: "AIzaSyA5zgkag5cXbDXoo11lYhUz5SXStziPKPg",
  authDomain: "luct-reporting-app-8f780.firebaseapp.com",
  projectId: "luct-reporting-app-8f780",
  storageBucket: "luct-reporting-app-8f780.firebasestorage.app",
  messagingSenderId: "1023449258542",
  appId: "1:1023449258542:web:834f2c49a0f73befe4ddbf",
  measurementId: "G-0EBY97JNJZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);