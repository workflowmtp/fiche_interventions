import { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  role?: 'user' | 'admin' | 'technician' | 'supervisor';
  photoURL?: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Récupérer les informations supplémentaires de Firestore
        const userRef = doc(db, 'users', authUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const appUser: AppUser = {
              uid: authUser.uid,
              displayName: authUser.displayName || userData.displayName || authUser.email?.split('@')[0],
              email: authUser.email,
              photoURL: authUser.photoURL || userData.photoURL,
              role: userData.role || 'user'
            };

            setUser(appUser);
            setIsAdmin(userData.role === 'admin');
          } else {
            // Fallback si le document Firestore n'existe pas
            const appUser: AppUser = {
              uid: authUser.uid,
              displayName: authUser.displayName || authUser.email?.split('@')[0],
              email: authUser.email,
              photoURL: authUser.photoURL,
              role: 'user'
            };
            setUser(appUser);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isAdmin };
};