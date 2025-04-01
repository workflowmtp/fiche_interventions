import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserRole } from '../services/users';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const role = await getUserRole(user.uid);
          setAuthState({
            user,
            loading: false,
            isAdmin: role === 'admin'
          });
        } catch (error) {
          console.error('Error getting user role:', error);
          toast.error('Erreur de connexion. Certaines fonctionnalités peuvent être limitées.');
          setAuthState({
            user,
            loading: false,
            isAdmin: false // Default to non-admin on error
          });
        }
      } else {
        setAuthState({
          user: null,
          loading: false,
          isAdmin: false
        });
      }
    });

    return unsubscribe;
  }, []);

  return authState;
};