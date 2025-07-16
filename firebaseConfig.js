import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqzKaMhcX3Kp2162LafRqwS353ZlLY8n0",
  authDomain: "hostel-mart-9ccca.firebaseapp.com",
  projectId: "hostel-mart-9ccca",
  storageBucket: "hostel-mart-9ccca.appspot.com",
  messagingSenderId: "135690318458",
  appId: "1:135690318458:web:995750312e28f6700981c3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
