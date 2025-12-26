import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { AppState } from '../types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEPpZYG0ODz86RJDL_tt9I5QZ34fTaqdg",
  authDomain: "flowdo-e76f0.firebaseapp.com",
  projectId: "flowdo-e76f0",
  storageBucket: "flowdo-e76f0.firebasestorage.app",
  messagingSenderId: "1019578484262",
  appId: "1:1019578484262:web:a6a4f559d969f5725dc8e7",
  measurementId: "G-2TP35K72RG"
};

// Initialize Firebase with error handling
let app: any = null;
let auth: any = null;
let db: any = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Set to null to prevent crashes - functions will check and throw appropriate errors
  auth = null;
  db = null;
}

export { auth, db };

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signInAnonymouslyUser = async () => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.warn('Firebase auth is not initialized');
    callback(null);
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};

// Firestore functions for saving flows
export interface SavedFlow {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  flowData: AppState;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export const saveFlowToFirebase = async (flowData: AppState, title: string, description?: string, tags?: string[]): Promise<string> => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to save flows');
  }

  try {
    const flowDoc = {
      userId: user.uid,
      title,
      description: description || '',
      flowData,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: tags || []
    };

    const docRef = await addDoc(collection(db, 'flows'), flowDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error saving flow to Firebase:', error);
    throw error;
  }
};

export const updateFlowInFirebase = async (flowId: string, flowData: AppState, title?: string, description?: string, tags?: string[]): Promise<void> => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to update flows');
  }

  try {
    const flowRef = doc(db, 'flows', flowId);
    const updateData: any = {
      flowData,
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;

    await updateDoc(flowRef, updateData);
  } catch (error) {
    console.error('Error updating flow in Firebase:', error);
    throw error;
  }
};

export const loadFlowFromFirebase = async (flowId: string): Promise<SavedFlow | null> => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to load flows');
  }

  try {
    const flowRef = doc(db, 'flows', flowId);
    const flowSnap = await getDoc(flowRef);

    if (!flowSnap.exists()) {
      return null;
    }

    const data = flowSnap.data();
    if (data.userId !== user.uid) {
      throw new Error('You do not have permission to access this flow');
    }

    return {
      id: flowSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as SavedFlow;
  } catch (error) {
    console.error('Error loading flow from Firebase:', error);
    throw error;
  }
};

export const getUserFlows = async (): Promise<SavedFlow[]> => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to load flows');
  }

  try {
    const q = query(
      collection(db, 'flows'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as SavedFlow[];
  } catch (error) {
    console.error('Error loading user flows:', error);
    throw error;
  }
};

export const searchUserFlows = async (searchTerm: string): Promise<SavedFlow[]> => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to search flows');
  }

  try {
    // Get all user flows first (Firestore doesn't support full-text search easily)
    const q = query(
      collection(db, 'flows'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const allFlows = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as SavedFlow[];

    // Client-side filtering for title, description, and tags
    const searchLower = searchTerm.toLowerCase();
    return allFlows.filter(flow => 
      flow.title.toLowerCase().includes(searchLower) ||
      flow.description?.toLowerCase().includes(searchLower) ||
      flow.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  } catch (error) {
    console.error('Error searching flows:', error);
    throw error;
  }
};

export const deleteFlowFromFirebase = async (flowId: string): Promise<void> => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to delete flows');
  }

  try {
    // Verify ownership
    const flow = await loadFlowFromFirebase(flowId);
    if (!flow || flow.userId !== user.uid) {
      throw new Error('You do not have permission to delete this flow');
    }

    await deleteDoc(doc(db, 'flows', flowId));
  } catch (error) {
    console.error('Error deleting flow from Firebase:', error);
    throw error;
  }
};

