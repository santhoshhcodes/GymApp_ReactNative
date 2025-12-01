// firebaseConfig.js
import { firebase } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

// Firebase is usually auto-configured by google-services.json
// No manual config needed for React Native

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp();
}

export { messaging };
export default firebase;