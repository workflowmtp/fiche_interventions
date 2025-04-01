import { db } from '../config/firebase';
import { Firestore } from 'firebase/firestore';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy, arrayUnion, getCountFromServer, getDoc } from 'firebase/firestore';
import { Part, updatePart } from './parts';
import { getUserByUsername, getUserRole } from './users';



export interface TimeEntry {
  action: 'start' | 'pause' | 'resume' | 'stop';
  timestamp: string;
}

export interface TimeStats {
  effectiveTime: number;
  totalTime: number;
  pauseCount: number;
  pauseDurations: number[];
  averagePauseDuration: number;
  startTime: string | null;
  endTime: string | null;
}

export interface Intervention {
  id?: string;
  interventionNumber: number;
  userId: string;
  emitter: string;
  emitterRole: string;
  date: string;
  mainMachine?: string;
  secondaryMachine?: string;
  otherEquipment?: string;
  priority: 'yellow' | 'orange' | 'red';
  status: 'in_progress' | 'completed';
  timeEntries: TimeEntry[];
  timeStats?: TimeStats;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export const calculateTimeStats = (timeEntries: TimeEntry[]): TimeStats => {
  let effectiveTime = 0;
  let totalTime = 0;
  let pauseCount = 0;
  let pauseDurations: number[] = [];
  let lastTimestamp: Date | null = null;
  let pauseStartTime: Date | null = null;
  let startTime: string | null = null;
  let endTime: string | null = null;

  timeEntries.forEach((entry) => {
    const currentTime = new Date(entry.timestamp);

    switch (entry.action) {
      case 'start':
        lastTimestamp = currentTime;
        startTime = entry.timestamp;
        break;
      case 'pause':
        if (lastTimestamp) {
          effectiveTime += currentTime.getTime() - lastTimestamp.getTime();
          pauseStartTime = currentTime;
          pauseCount++;
        }
        break;
      case 'resume':
        if (pauseStartTime) {
          const pauseDuration = currentTime.getTime() - pauseStartTime.getTime();
          pauseDurations.push(pauseDuration);
          lastTimestamp = currentTime;
          pauseStartTime = null;
        }
        break;
      case 'stop':
        if (lastTimestamp) {
          if (pauseStartTime) {
            const pauseDuration = currentTime.getTime() - pauseStartTime.getTime();
            pauseDurations.push(pauseDuration);
          } else {
            effectiveTime += currentTime.getTime() - lastTimestamp.getTime();
          }
          endTime = entry.timestamp;
          const firstEntry = timeEntries[0];
          totalTime = currentTime.getTime() - new Date(firstEntry.timestamp).getTime();
        }
        break;
    }
  });

  const averagePauseDuration = pauseDurations.length > 0
    ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length
    : 0;

  return {
    effectiveTime,
    totalTime,
    pauseCount,
    pauseDurations,
    averagePauseDuration,
    startTime,
    endTime
  };
};

export const getNextInterventionNumber = async (): Promise<number> => {
  try {
    const interventionsRef = collection(db, 'interventions');
    const snapshot = await getCountFromServer(interventionsRef);
    return snapshot.data().count + 1;
  } catch (error) {
    console.error('Error getting intervention count:', error);
    throw new Error('Erreur lors de la génération du numéro d\'intervention');
  }
};

export const getIntervention = async (id: string, userId: string) => {
  if (!id) {
    throw new Error('ID d\'intervention manquant');
  }

  if (!userId) {
    throw new Error('Vous devez être connecté pour accéder à cette intervention');
  }

  try {
    const docRef = doc(db, 'interventions', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Intervention introuvable');
    }
    
    const data = docSnap.data();
    
    // Désactiver temporairement la vérification d'autorisation
    /* Commentez ces lignes pour tester
    // Vérifier si l'utilisateur est admin
    const userRole = await getUserRole(userId);
    
    // Autoriser l'accès si l'utilisateur est le créateur OU un admin
    if (data.userId !== userId && userRole !== 'admin') {
      console.warn('Tentative d\'accès non autorisé', {
        interventionUserId: data.userId,
        currentUserId: userId,
        userRole: userRole
      });
      throw new Error('Vous n\'avez pas accès à cette intervention');
    }
    */
    
    // Initialize timeEntries if not present
    if (!data.timeEntries) {
      data.timeEntries = [];
    }
    
    return {
      id: docSnap.id,
      ...data,
      timeEntries: data.timeEntries || []
    };
  } catch (error: any) {
    console.error('Error getting intervention:', error);
    // Return the specific error message or a generic one
    throw new Error(error.message || 'Erreur lors du chargement de l\'intervention');
  }
};

export const saveIntervention = async (userId: string, formData: any): Promise<string> => {
  if (!userId) {
    throw new Error('Vous devez être connecté pour sauvegarder une intervention');
  }

  let retries = 3;
  let delay = 1000;

  while (retries > 0) {
    try {
      const interventionNumber = formData.interventionNumber || await getNextInterventionNumber();
      
      const timeStats = formData.timeEntries?.length > 0
        ? calculateTimeStats(formData.timeEntries)
        : null;

      // Update parts information if any parts are specified
      if (formData.replacedParts?.length > 0) {
        for (const part of formData.replacedParts) {
          if (!part.designation) continue;

          const partsRef = collection(db, 'parts');
          const q = query(partsRef, where('designation', '==', part.designation));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            // Create new part
            await addDoc(partsRef, {
              designation: part.designation,
              reference: part.reference,
              supplier: part.supplier,
              purchasePrice: part.purchasePrice,
              history: [{
                purchasePrice: part.purchasePrice,
                supplier: part.supplier,
                date: new Date().toISOString()
              }],
              replacementFrequency: part.interventionType === 'replacement' ? 1 : 0,
              repairFrequency: part.interventionType === 'repair' ? 1 : 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          } else {
            // Update existing part
            const partDoc = querySnapshot.docs[0];
            const partData = partDoc.data() as Part;
            
            await updatePart(partDoc.id, {
              purchasePrice: part.purchasePrice,
              supplier: part.supplier,
              replacementFrequency: part.interventionType === 'replacement' 
                ? (partData.replacementFrequency || 0) + 1 
                : (partData.replacementFrequency || 0),
              repairFrequency: part.interventionType === 'repair'
                ? (partData.repairFrequency || 0) + 1
                : (partData.repairFrequency || 0)
            });
          }
        }
      }
      
      const now = new Date().toISOString();

      // Create base intervention data with required fields
      const baseInterventionData = {
        interventionNumber,
        userId, // Always set the current user's ID
        date: formData.date || now.split('T')[0],
        emitter: formData.emitter || '',
        status: formData.status || 'in_progress',
        createdAt: formData.id ? formData.createdAt : now,
        updatedAt: now
      };

      // Add optional fields if they exist in formData
      const interventionData = {
        ...baseInterventionData,
        ...formData,
        timeEntries: formData.timeEntries || [],
        timeStats,
        startTime: timeStats?.startTime || null,
        endTime: timeStats?.endTime || null,
        completedAt: formData.status === 'completed' ? now : null
      };

      // Remove any undefined values
      Object.keys(interventionData).forEach(key => 
        interventionData[key] === undefined && delete interventionData[key]
      );

      // Verify user has access if updating
      if (formData.id) {
        const docRef = doc(db, 'interventions', formData.id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Intervention introuvable');
        }
        
        const existingData = docSnap.data();
        
        // Vérifier si l'utilisateur est admin
        const userRole = await getUserRole(userId);
        
        // Debug logs pour diagnostiquer le problème d'autorisation
        console.log("Sauvegarde d'intervention - Informations d'accès:", {
          interventionId: formData.id,
          interventionUserId: existingData.userId,
          currentUserId: userId,
          userRole: userRole
        });
        
        // Permettre l'accès si l'utilisateur est le créateur OU un admin
        if (existingData.userId !== userId && userRole !== 'admin') {
          console.error("Vérification d'accès échouée", {
            interventionUserId: existingData.userId,
            currentUserId: userId,
            userRole: userRole
          });
          throw new Error('Vous n\'avez pas accès à cette intervention');
        }
        
        // Préserver l'userId original pour maintenir la propriété
        const preservedUserId = existingData.userId;
        await updateDoc(docRef, {
          ...interventionData,
          userId: preservedUserId // Ne pas modifier l'userId original
        });
        return formData.id;
      } else {
        const docRef = await addDoc(collection(db, 'interventions'), interventionData);
        return docRef.id;
      }
    } catch (error: any) {
      console.warn(`Attempt ${4 - retries}/3 failed:`, error.message);
      
      if ((error.message.includes('offline') || error.code === 'unavailable') && retries > 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        retries--;
        continue;
      }
      
      throw new Error(error.message || 'Erreur lors de la sauvegarde de l\'intervention');
    }
  }
  
  throw new Error('Erreur lors de la sauvegarde de l\'intervention après plusieurs tentatives');
};

export const updateInterventionTime = async (interventionId: string, timeEntry: TimeEntry) => {
  if (!interventionId) {
    throw new Error('ID d\'intervention manquant');
  }

  try {
    const interventionRef = doc(db, 'interventions', interventionId);
    await updateDoc(interventionRef, {
      timeEntries: arrayUnion({
        ...timeEntry,
        timestamp: new Date(timeEntry.timestamp).toISOString()
      })
    });
  } catch (error: any) {
    console.error('Error updating intervention time:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour du temps d\'intervention');
  }
};

export const getCompletedInterventions = async () => {
  try {
    const interventionsRef = collection(db, 'interventions');
    // First try with the composite index
    try {
      const q = query(
        interventionsRef,
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (indexError) {
      // If composite index fails, fallback to simple query
      console.warn('Composite index not available, falling back to simple query');
      const q = query(
        interventionsRef,
        where('status', '==', 'completed')
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort in memory as fallback
      return results.sort((a: any, b: any) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      });
    }
  } catch (error: any) {
    console.error('Error getting completed interventions:', error);
    throw new Error(error.message || 'Erreur lors du chargement des interventions terminées');
  }
};

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const getUserInterventions = async (userId: string) => {
  if (!userId) {
    throw new Error('Vous devez être connecté pour accéder à vos interventions');
  }

  let retries = 3;
  let delay = 1000;

  while (retries > 0) {
    try {
      const interventionsRef = collection(db, 'interventions');
      
      // Vérifier si l'utilisateur est admin
      const userRole = await getUserRole(userId);
      
      let q;
      
      if (userRole === 'admin') {
        // Les administrateurs peuvent voir toutes les interventions en cours
        q = query(
          interventionsRef,
          where('status', '==', 'in_progress')
        );
      } else {
        // Les utilisateurs normaux ne voient que leurs propres interventions
        q = query(
          interventionsRef,
          where('userId', '==', userId),
          where('status', '==', 'in_progress')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const interventions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort in memory
      return interventions.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error: any) {
      console.warn(`Attempt ${4 - retries}/3 failed:`, error.message);
      
      if ((error.message.includes('offline') || error.code === 'unavailable') && retries > 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        retries--;
        continue;
      }
      
      throw new Error(error.message || 'Erreur lors du chargement de vos interventions');
    }
  }
  
  throw new Error('Erreur lors du chargement de vos interventions après plusieurs tentatives');
};