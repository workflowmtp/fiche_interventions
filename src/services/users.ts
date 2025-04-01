import { db } from '../config/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

export const setUserRole = async (userId: string, role: 'user' | 'admin', username?: string) => {
  let retries = MAX_RETRIES;
  let delay = INITIAL_RETRY_DELAY;

  while (retries > 0) {
    try {
      // Check if username exists
      if (username) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          throw new Error('username-already-exists');
        }
      }

      await setDoc(doc(db, 'users', userId), {
        role,
        username: username?.toLowerCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return; // Success
    } catch (error: any) {
      console.warn(`Attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES} failed:`, error.message);
      
      if ((error.message.includes('offline') || error.code === 'unavailable') && retries > 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        retries--;
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Failed to set user role after all retries');
};

export const getUserRole = async (userId: string): Promise<'user' | 'admin'> => {
  let retries = MAX_RETRIES;
  let delay = INITIAL_RETRY_DELAY;
  let lastError = null;

  while (retries > 0) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
      
      return 'user'; // Default role if document doesn't exist
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES} failed:`, error.message);
      
      if ((error.message.includes('offline') || error.code === 'unavailable') && retries > 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        retries--;
        continue;
      }
      
      if (retries === 1) {
        console.error('Failed to get user role after all retries:', lastError);
        return 'user'; // Default to user role after all retries failed
      }
      
      throw error;
    }
  }

  return 'user'; // Default role after all retries failed
};

export const getUserByUsername = async (username: string) => {
  let retries = MAX_RETRIES;
  let delay = INITIAL_RETRY_DELAY;

  while (retries > 0) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      
      return null;
    } catch (error: any) {
      console.warn(`Attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES} failed:`, error.message);
      
      if ((error.message.includes('offline') || error.code === 'unavailable') && retries > 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        retries--;
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Failed to get user after all retries');
};