import { auth, db } from '../config/firebase';
import { User, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  role?: 'user' | 'admin';
  photoURL?: string | null;
  username?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserUpdateData {
  displayName?: string;
  email?: string;
  role?: 'user' | 'admin';
  photoURL?: string;
  username?: string;
}

export interface InterventionUpdateData {
  interventionId: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'submitted';
  technician?: string;
  supervisor?: string;
  comment?: string;
}

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

/**
 * Convertit un objet User de Firebase Auth en AppUser
 */
const convertToAppUser = async (user: User): Promise<AppUser> => {
  // Récupère le rôle de l'utilisateur depuis Firestore
  let role: 'user' | 'admin' = 'user';
  try {
    role = await getUserRole(user.uid);
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle:', error);
  }

  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
    email: user.email,
    photoURL: user.photoURL,
    role
  };
};

/**
 * Récupère tous les utilisateurs disponibles
 */
export const getAllUsers = async (): Promise<AppUser[]> => {
  try {
    // Récupérer tous les utilisateurs de Firestore
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    const users: AppUser[] = [];
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        displayName: data.displayName || 'Utilisateur',
        email: data.email || null,
        role: data.role || 'user',
        photoURL: data.photoURL || null,
        username: data.username,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    
    return users;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw new Error('Impossible de récupérer la liste des utilisateurs');
  }
};

/**
 * Récupère les informations de l'utilisateur courant
 */
export const getCurrentUser = async (): Promise<AppUser | null> => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    return null;
  }
  
  return await convertToAppUser(currentUser);
};

/**
 * Recherche des utilisateurs par nom ou email
 */
export const searchUsers = async (query: string): Promise<AppUser[]> => {
  try {
    const users = await getAllUsers();
    
    if (!query) {
      return users;
    }
    
    const lowercaseQuery = query.toLowerCase();
    return users.filter(user => 
      user.displayName?.toLowerCase().includes(lowercaseQuery) ||
      user.email?.toLowerCase().includes(lowercaseQuery) ||
      user.username?.toLowerCase().includes(lowercaseQuery)
    );
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    throw new Error('Impossible de rechercher des utilisateurs');
  }
};

/**
 * Récupère les administrateurs
 */
export const getAdmins = async (): Promise<AppUser[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);
    
    const users: AppUser[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        displayName: data.displayName || 'Utilisateur',
        email: data.email || null,
        role: 'admin',
        photoURL: data.photoURL || null,
        username: data.username
      });
    });
    
    return users;
  } catch (error) {
    console.error('Erreur lors de la récupération des administrateurs:', error);
    throw new Error('Impossible de récupérer la liste des administrateurs');
  }
};

/**
 * Récupère les utilisateurs standard (non-admin)
 */
export const getStandardUsers = async (): Promise<AppUser[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'user'));
    const querySnapshot = await getDocs(q);
    
    const users: AppUser[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        displayName: data.displayName || 'Utilisateur',
        email: data.email || null,
        role: 'user',
        photoURL: data.photoURL || null,
        username: data.username
      });
    });
    
    return users;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs standard:', error);
    throw new Error('Impossible de récupérer la liste des utilisateurs standard');
  }
};

/**
 * Définit le rôle d'un utilisateur
 */
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
        
        // Vérifier que si le nom d'utilisateur existe, il appartient à l'utilisateur actuel
        if (!querySnapshot.empty && querySnapshot.docs[0].id !== userId) {
          throw new Error('username-already-exists');
        }
      }

      await setDoc(doc(db, 'users', userId), {
        role,
        username: username?.toLowerCase(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
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

/**
 * Récupère le rôle d'un utilisateur
 */
export const getUserRole = async (userId: string): Promise<'user' | 'admin'> => {
  let retries = MAX_RETRIES;
  let delay = INITIAL_RETRY_DELAY;
  let lastError = null;

  while (retries > 0) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        return userDoc.data().role === 'admin' ? 'admin' : 'user';
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

/**
 * Récupère un utilisateur par son nom d'utilisateur
 */
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

/**
 * Créer un nouvel utilisateur avec email et mot de passe
 */
export const createUser = async (email: string, password: string, userData: UserUpdateData) => {
  try {
    // Créer l'utilisateur dans Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Mettre à jour le profil si displayName est fourni
    if (userData.displayName) {
      await updateProfile(user, {
        displayName: userData.displayName,
        photoURL: userData.photoURL || null
      });
    }
    
    // Enregistrer les données utilisateur dans Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: userData.displayName || user.email?.split('@')[0] || 'Utilisateur',
      role: userData.role || 'user', // Par défaut 'user' sauf si spécifié
      username: userData.username?.toLowerCase(),
      photoURL: userData.photoURL || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || user.email?.split('@')[0] || 'Utilisateur'
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  }
};

/**
 * Met à jour les informations d'un utilisateur
 */
export const updateUser = async (userId: string, userData: UserUpdateData) => {
  try {
    // Si username est fourni, vérifier s'il existe déjà
    if (userData.username) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', userData.username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty && querySnapshot.docs[0].id !== userId) {
        throw new Error('Ce nom d\'utilisateur est déjà utilisé');
      }
    }
    
    // Mettre à jour les données dans Firestore
    await updateDoc(doc(db, 'users', userId), {
      ...userData,
      username: userData.username?.toLowerCase(),
      updatedAt: new Date().toISOString()
    });
    
    // Mettre à jour le profil Auth si nécessaire
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId && (userData.displayName || userData.photoURL)) {
      await updateProfile(currentUser, {
        displayName: userData.displayName || currentUser.displayName,
        photoURL: userData.photoURL || currentUser.photoURL
      });
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    throw error;
  }
};

/**
 * Met à jour les informations d'une intervention associée à un utilisateur
 */
export const createInterventionUpdate = async (userId: string, updateData: InterventionUpdateData) => {
  try {
    // Vérifier les permissions selon le rôle de l'utilisateur
    const userRole = await getUserRole(userId);
    const isAdmin = userRole === 'admin';
    
    // Vérifier que l'intervention existe
    const interventionRef = doc(db, 'interventions', updateData.interventionId);
    const interventionDoc = await getDoc(interventionRef);
    
    if (!interventionDoc.exists()) {
      throw new Error('Intervention introuvable');
    }
    
    const interventionData = interventionDoc.data();
    
    // Vérifier les permissions
    // Seuls l'auteur de l'intervention et les admins peuvent la modifier
    if (interventionData.userId !== userId && !isAdmin) {
      throw new Error('Vous n\'avez pas les permissions nécessaires pour modifier cette intervention');
    }
    
    // Si l'état est "submitted", seuls les admins peuvent le modifier
    if (interventionData.status === 'submitted' && !isAdmin) {
      throw new Error('Cette intervention a déjà été soumise et ne peut plus être modifiée');
    }
    
    // Préparer les données à mettre à jour
    const updateFields: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    };
    
    if (updateData.status) {
      updateFields.status = updateData.status;
      
      // Si statut passe à "submitted", enregistrer la date de soumission
      if (updateData.status === 'submitted') {
        updateFields.submittedAt = new Date().toISOString();
      }
    }
    
    // Assigner un technicien (limité aux admins)
    if (updateData.technician && isAdmin) {
      updateFields.technicianId = updateData.technician;
    }
    
    // Assigner un superviseur (limité aux admins)
    if (updateData.supervisor && isAdmin) {
      updateFields.supervisorId = updateData.supervisor;
    }
    
    // Ajouter un commentaire
    if (updateData.comment) {
      // Ajouter à un tableau de commentaires avec timestamp et userId
      updateFields.comments = [...(interventionData.comments || []), {
        userId,
        comment: updateData.comment,
        timestamp: new Date().toISOString()
      }];
    }
    
    // Mettre à jour l'intervention dans Firestore
    await updateDoc(interventionRef, updateFields);
    
    // Créer une entrée dans l'historique des modifications
    await setDoc(doc(collection(db, 'interventions', updateData.interventionId, 'history')), {
      userId,
      timestamp: new Date().toISOString(),
      changes: updateFields,
      action: 'update'
    });
    
    return {
      success: true,
      interventionId: updateData.interventionId
    };
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'intervention:', error);
    throw error;
  }
};

/**
 * Obtient l'historique des interventions d'un utilisateur
 */
export const getUserInterventionsHistory = async (userId: string) => {
  try {
    const interventions: any[] = [];
    
    // 1. Récupérer les interventions créées par l'utilisateur
    const userCreatedRef = collection(db, 'interventions');
    const userCreatedQuery = query(userCreatedRef, where('userId', '==', userId));
    const userCreatedSnapshot = await getDocs(userCreatedQuery);
    
    // 2. Récupérer les interventions où l'utilisateur est technicien
    const technicianRef = collection(db, 'interventions');
    const technicianQuery = query(technicianRef, where('technicianId', '==', userId));
    const technicianSnapshot = await getDocs(technicianQuery);
    
    // 3. Récupérer les interventions où l'utilisateur est émetteur
    const emitterRef = collection(db, 'interventions');
    const emitterQuery = query(emitterRef, where('emitterId', '==', userId));
    const emitterSnapshot = await getDocs(emitterQuery);
    
    // Combiner les résultats en évitant les doublons
    const processedIds = new Set();
    
    // Traiter les interventions et récupérer leur historique
    const processSnapshots = async (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
      for (const doc of snapshot.docs) {
        // Éviter les doublons
        if (processedIds.has(doc.id)) continue;
        processedIds.add(doc.id);
        
        const data = doc.data();
        
        // Récupérer l'historique de cette intervention
        const historyRef = collection(db, 'interventions', doc.id, 'history');
        const historySnapshot = await getDocs(historyRef);
        
        const history = historySnapshot.docs.map(historyDoc => ({
          id: historyDoc.id,
          ...historyDoc.data()
        }));
        
        interventions.push({
          id: doc.id,
          ...data,
          history
        });
      }
    };
    
    // Traiter les trois types de résultats
    await processSnapshots(userCreatedSnapshot);
    await processSnapshots(technicianSnapshot);
    await processSnapshots(emitterSnapshot);
    
    // Trier par date de mise à jour décroissante
    return interventions.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    throw error;
  }
};