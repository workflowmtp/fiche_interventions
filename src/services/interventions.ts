import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  or
} from 'firebase/firestore';

// ======================================
// Types
// ======================================
export interface Intervention {
  id: string; // ID is non-optional now
  createdBy: string; // Nouveau champ
  userId: string; // ID of the user who created the intervention
  modifiedBy?: string; // ID of the user who last modified the intervention
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  interventionNumber?: string; // Numéro d'intervention
  clientName: string; // Nom du client
  clientAddress: string; // Adresse du client
  clientPhone?: string; // Téléphone du client (optionnel)
  clientEmail?: string; // Email du client (optionnel)
  interventionDate: string; // Date d'intervention
  date?: string; // Date alternative (pour compatibilité)
  interventionTime: string; // Heure d'intervention
  priority: 'yellow' | 'orange' | 'red'; // Align with component usage
  degreeUrgence: 'Faible' | 'Moyenne' | 'Élevée'; // Keep original French if needed elsewhere, or consolidate
  interventionType: string;
  description?: string; // Optional if sometimes absent
  initialDescription?: string; // Added field
  status: 'in_progress' | 'completed' | 'submitted'; // Align with component usage
  technicianId?: string; // ID of the assigned technician
  technicianName?: string; // Added field
  emitterId?: string; // ID of the emitter if different from creator
  intervenants?: string[]; // List of other involved personnel IDs
  technicianSignatures?: Array<{ uid: string; name: string; date: string; signature: string; validated?: boolean }>; // Added validated field (optional)
  supervisorSignature?: { uid: string; name: string; date: string; signature: string; validated?: boolean }; // Signature du superviseur
  clientSignature?: { name: string; date: string; signature: string }; // Client signature
  observations?: string;
  materielUsed?: Array<{ name: string; quantity: number }>; // Material used
  timeEntries?: Array<{ start: string; end: string; description?: string }>; // Time tracking
  mainMachine?: string; // Added field
  secondaryMachine?: string; // Added field
}

// Constantes
const COLLECTION_INTERVENTIONS = 'interventions';

/**
 * Sauvegarde une intervention dans Firestore
 */
export const saveIntervention = async (userId: string, interventionData: Partial<Intervention>) => {
  try {
    const now = new Date().toISOString();
    let interventionId = interventionData.id || doc(collection(db, COLLECTION_INTERVENTIONS)).id;
    
    // Préparer les données
    const dataToSave = {
      ...interventionData,
      createdBy: interventionData.createdBy || userId, // Préserve le créateur original
      modifiedBy: userId, // Enregistre le dernier modificateur
      id: interventionId,
      // Ne pas écraser le userId existant s'il y en a un
      userId: userId || interventionData.userId,
      updatedAt: now,
      createdAt: interventionData.createdAt || now
    };
    
    // Sauvegarder ou mettre à jour l'intervention
    await setDoc(doc(db, COLLECTION_INTERVENTIONS, interventionId), dataToSave, { merge: true });
    
    return interventionId;
  } catch (error) {
    console.error('Error saving intervention:', error);
    throw error;
  }
};

/**
 * Récupère une intervention spécifique par son ID
 */
export const getIntervention = async (interventionId: string, userId: string): Promise<Intervention> => {
  try {
    const interventionDoc = await getDoc(doc(db, COLLECTION_INTERVENTIONS, interventionId));
    
    if (!interventionDoc.exists()) {
      throw new Error('Intervention not found');
    }
    
    const interventionData = interventionDoc.data();
    
    // Vérifier les permissions pour l'accès à l'intervention
    // L'utilisateur doit être soit le créateur, soit l'admin, soit associé à l'intervention
    if (interventionData.userId !== userId && interventionData.createdBy !== userId) {
      // Vérifier si l'utilisateur est associé à l'intervention
      const isAssociated = 
        // Technicien assigné
        interventionData.technicianId === userId || 
        // Émetteur de la demande
        interventionData.emitterId === userId ||
        // Dans la liste des intervenants
        (interventionData.intervenants && 
          Array.isArray(interventionData.intervenants) && 
          interventionData.intervenants.includes(userId)) ||
        // Dans la liste des signatures de techniciens
        (interventionData.technicianSignatures && 
          Array.isArray(interventionData.technicianSignatures) &&
          interventionData.technicianSignatures.some(sig => 
            sig.uid === userId || sig.name === userId || sig.technicianId === userId)) ||
        // Est le superviseur
        (interventionData.supervisorSignature && 
          (interventionData.supervisorSignature.uid === userId || 
           interventionData.supervisorSignature.name === userId));
      
      if (!isAssociated) {
        throw new Error('Unauthorized access to intervention');
      }
    }
    
    return {
      id: interventionDoc.id,
      ...interventionData
    } as Intervention;
  } catch (error) {
    console.error('Error fetching intervention:', error);
    throw error;
  }
};

/**
 * Récupère toutes les interventions d'un utilisateur
 * Y compris celles où l'utilisateur est intervenant via technicianSignatures
 */
export const getUserInterventions = async (userId: string): Promise<Intervention[]> => {
  try {
    const interventions: Intervention[] = [];
    const processedIds = new Set<string>();
    
    // 1. Récupérer les interventions créées par l'utilisateur
    const creatorQuery = query(
      collection(db, COLLECTION_INTERVENTIONS),
      where('createdBy', '==', userId)
    );
    const creatorSnapshot = await getDocs(creatorQuery);
    
    creatorSnapshot.forEach(doc => {
      processedIds.add(doc.id);
      interventions.push({
        id: doc.id,
        ...doc.data()
      } as Intervention);
    });
    
    // 2. Récupérer les interventions où l'utilisateur est technicien
    // Firestore ne peut pas faire de requête complexe sur les éléments d'un tableau
    // On doit donc faire une requête plus large et filtrer côté client
    const allInterventionsQuery = query(collection(db, COLLECTION_INTERVENTIONS));
    const allInterventionsSnapshot = await getDocs(allInterventionsQuery);
    
    allInterventionsSnapshot.forEach(doc => {
      // Éviter les doublons
      if (processedIds.has(doc.id)) return;
      
      const data = doc.data();
      
      // Vérifier si l'utilisateur est technicien
      const isTechnician = data.technicianSignatures && 
        Array.isArray(data.technicianSignatures) &&
        data.technicianSignatures.some(sig => sig.uid === userId);
      
      // Vérifier si l'utilisateur est superviseur
      const isSupervisor = data.supervisorSignature && 
        data.supervisorSignature.uid === userId;
      
      // Ajouter l'intervention si l'utilisateur est technicien ou superviseur
      if (isTechnician || isSupervisor) {
        interventions.push({
          id: doc.id,
          ...data
        } as Intervention);
      }
    });
    
    // Trier par date de mise à jour (les plus récentes d'abord)
    return interventions.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt).getTime() - 
      new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching user interventions:', error);
    throw error;
  }
};

/**
 * Récupère les interventions soumises (accessible par les administrateurs)
 */
export const getCompletedInterventions = async (): Promise<Intervention[]> => {
  try {
    const interventionsRef = collection(db, COLLECTION_INTERVENTIONS);
    // On récupère uniquement les interventions avec le statut "submitted"
    const q = query(interventionsRef, where('status', '==', 'submitted'));
    const snapshot = await getDocs(q);
    
    const interventions: Intervention[] = [];
    
    snapshot.forEach(doc => {
      interventions.push({
        id: doc.id,
        ...doc.data()
      } as Intervention);
    });
    
    // Trier par date de mise à jour décroissante (les plus récentes d'abord)
    return interventions.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt).getTime() - 
      new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching submitted interventions:', error);
    throw error;
  }
};

/**
 * Récupère le prochain numéro d'intervention disponible
 */
export const getNextInterventionNumber = async () => {
  try {
    const interventionsRef = collection(db, COLLECTION_INTERVENTIONS);
    const q = query(interventionsRef, orderBy('interventionNumber', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 1; // Premier numéro d'intervention
    }
    
    const latestIntervention = snapshot.docs[0].data();
    const latestNumber = latestIntervention.interventionNumber || 0;
    
    return latestNumber + 1;
  } catch (error) {
    console.error('Error getting next intervention number:', error);
    throw error;
  }
};

/**
 * Formate la durée en millisecondes en format heures:minutes:secondes
 */
export const formatDuration = (durationMs: number) => {
  const seconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Calcule les statistiques de temps à partir des entrées de temps
 */
export const calculateTimeStats = (timeEntries: any[]) => {
  if (!timeEntries || timeEntries.length === 0) {
    return {
      effectiveTime: 0,
      totalTime: 0,
      pauseCount: 0,
      pauseDurations: [],
      averagePauseDuration: 0
    };
  }
  
  let effectiveTime = 0;
  let totalTime = 0;
  let startTime = null;
  let pauseStartTime = null;
  let pauseCount = 0;
  let pauseDurations = [];
  
  // Trier les entrées par timestamp
  const sortedEntries = [...timeEntries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const currentTime = new Date(entry.timestamp);
    
    switch (entry.action) {
      case 'start':
        startTime = currentTime;
        break;
        
      case 'pause':
        if (startTime) {
          effectiveTime += currentTime.getTime() - startTime.getTime();
          startTime = null;
        }
        pauseStartTime = currentTime;
        pauseCount++;
        break;
        
      case 'resume':
        if (pauseStartTime) {
          const pauseDuration = currentTime.getTime() - pauseStartTime.getTime();
          pauseDurations.push(pauseDuration);
          pauseStartTime = null;
        }
        startTime = currentTime;
        break;
        
      case 'stop':
        if (startTime) {
          effectiveTime += currentTime.getTime() - startTime.getTime();
          startTime = null;
        }
        if (pauseStartTime) {
          const pauseDuration = currentTime.getTime() - pauseStartTime.getTime();
          pauseDurations.push(pauseDuration);
          pauseStartTime = null;
        }
        break;
    }
  }
  
  // Calculer le temps total
  if (sortedEntries.length >= 2) {
    const firstTime = new Date(sortedEntries[0].timestamp);
    const lastTime = new Date(sortedEntries[sortedEntries.length - 1].timestamp);
    totalTime = lastTime.getTime() - firstTime.getTime();
  }
  
  // Calculer la durée moyenne des pauses
  const averagePauseDuration = pauseDurations.length
    ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length
    : 0;
  
  return {
    effectiveTime,
    totalTime,
    pauseCount,
    pauseDurations,
    averagePauseDuration
  };
};