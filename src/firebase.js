import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxzIjYzinlQPQER9yQFc17dAd8nz26lRk",
  authDomain: "datamuncher-73deb.firebaseapp.com",
  databaseURL: "https://datamuncher-73deb-default-rtdb.firebaseio.com",
  projectId: "datamuncher-73deb",
  storageBucket: "datamuncher-73deb.appspot.com",
  messagingSenderId: "618381763506",
  appId: "1:618381763506:web:a375469163f1ce3fa07aab",
  measurementId: "G-2N1T194BML"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };


// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyBxzIjYzinlQPQER9yQFc17dAd8nz26lRk",
//   authDomain: "datamuncher-73deb.firebaseapp.com",
//   projectId: "datamuncher-73deb",
//   storageBucket: "datamuncher-73deb.appspot.com",
//   messagingSenderId: "618381763506",
//   appId: "1:618381763506:web:a375469163f1ce3fa07aab",
//   measurementId: "G-2N1T194BML"
// };

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);