import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAeHZDYHmTnTVWhTOV--FPKpnO9rFPuJSw",
  authDomain: "changepassword-26b32.firebaseapp.com",
  projectId: "changepassword-26b32",
  storageBucket: "changepassword-26b32.firebasestorage.app",
  messagingSenderId: "166730611046",
  appId: "1:166730611046:web:d05b432da251a5bc0bf0a7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);