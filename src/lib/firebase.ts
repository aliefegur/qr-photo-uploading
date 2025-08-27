// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app';
import {getAnalytics} from 'firebase/analytics';
import {getStorage} from "@firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCfUwN_genSWabgPxbomeLKP4-j4xtoikM',
  authDomain: 'oguzhan-ve-haticenin-dugunu.firebaseapp.com',
  projectId: 'oguzhan-ve-haticenin-dugunu',
  storageBucket: 'oguzhan-ve-haticenin-dugunu.firebasestorage.app',
  messagingSenderId: '341267875712',
  appId: '1:341267875712:web:ae9d97c7cd9a3c98182365',
  measurementId: 'G-6ELEREV2BZ',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);
