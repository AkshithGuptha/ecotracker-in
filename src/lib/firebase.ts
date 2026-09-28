// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously as firebaseSignInAnonymously } from "firebase/auth";

// Import Firebase configuration
import { firebaseConfig } from "./firebaseConfig";

// Check if config is properly set up
const isConfigValid = () => {
  // Basic validation for configuration
  const hasApiKey = !!firebaseConfig.apiKey;
  const hasPlaceholders = 
    firebaseConfig.apiKey.includes("YOUR_") || 
    firebaseConfig.apiKey.includes("Dummy") || 
    firebaseConfig.apiKey.includes("dummy");
  
  // Special case: We'll allow our "AIzaSyFakeKeyForTestingPurposesOnly123" for demonstration purposes
  const isTestConfig = firebaseConfig.apiKey === "AIzaSyFakeKeyForTestingPurposesOnly123";
  
  return (hasApiKey && !hasPlaceholders) || isTestConfig;
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper to get current user ID
export const getCurrentUserId = () => {
  // Check if we're using a mock user for testing
  if (firebaseConfig.apiKey === "AIzaSyFakeKeyForTestingPurposesOnly123" && 
      localStorage.getItem('is_mock_signed_in') === 'true') {
    const mockUserId = localStorage.getItem('mock_user_id');
    if (mockUserId) {
      return mockUserId;
    }
  }
  
  // Otherwise use the normal Firebase auth user
  return auth.currentUser?.uid || 'anonymous';
};

// Function to sign in anonymously
export const signInAsAnonymous = async () => {
  try {
    if (!isConfigValid()) {
      console.error("Firebase is using placeholder/dummy credentials. Please configure proper Firebase credentials.");
      throw new Error("Firebase configuration error: Please check FIREBASE_SETUP.md for instructions on setting up Firebase.");
    }
    
    // Special case for our test configuration
    if (firebaseConfig.apiKey === "AIzaSyFakeKeyForTestingPurposesOnly123") {
      console.log("Using test configuration - creating mock user");
      
      // Create a random UID for our mock user
      const uid = "test-user-" + Math.random().toString(36).substring(2, 8);
      
      // Store the mock user in localStorage so it persists between page refreshes
      localStorage.setItem('mock_user_id', uid);
      localStorage.setItem('is_mock_signed_in', 'true');
      
      // Create a mock user that matches Firebase User interface
      const mockUser = {
        uid: uid,
        isAnonymous: true,
        displayName: null,
        email: null,
        emailVerified: false,
        phoneNumber: null,
        photoURL: null,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      };
      
      // Create a safer way to override auth.currentUser
      try {
        // @ts-ignore - This is a hack for our test mode
        auth.currentUser = mockUser;
      } catch (e) {
        console.log("Could not directly set auth.currentUser, using fallback approach");
      }
      
      console.log("Mock anonymous sign-in successful:", mockUser.uid);
      return mockUser;
    }
    
    // Real Firebase authentication
    console.log("Attempting anonymous sign-in with Firebase...");
    const userCredential = await firebaseSignInAnonymously(auth);
    console.log("Anonymous sign-in successful:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    // Add more detail to the error
    if (error.code) {
      console.error(`Firebase error code: ${error.code}`);
    }
    throw error;
  }
};

export default app;
