import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, arrayUnion } from 'firebase/firestore';

export interface Part {
  id?: string;
  designation: string;
  reference: string;
  supplier: string;
  purchasePrice: number;
  history?: {
    purchasePrice: number;
    supplier: string;
    date: string;
  }[];
  replacementFrequency?: number;
  repairFrequency?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const getParts = async (): Promise<Part[]> => {
  try {
    const partsRef = collection(db, 'parts');
    const q = query(partsRef, orderBy('designation'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Part[];
  } catch (error) {
    console.error('Error getting parts:', error);
    throw error;
  }
};

export const createPart = async (part: Part): Promise<Part> => {
  try {
    // Check if part with same designation already exists
    const partsRef = collection(db, 'parts');
    const q = query(partsRef, where('designation', '==', part.designation));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('Une pièce avec cette désignation existe déjà');
    }

    const now = new Date().toISOString();

    // Create new part
    const docRef = await addDoc(partsRef, {
      ...part,
      history: [{
        purchasePrice: part.purchasePrice,
        supplier: part.supplier,
        date: now
      }],
      replacementFrequency: 0,
      repairFrequency: 0,
      createdAt: now,
      updatedAt: now
    });

    return {
      id: docRef.id,
      ...part,
      replacementFrequency: 0,
      repairFrequency: 0,
      createdAt: now,
      updatedAt: now
    };
  } catch (error) {
    console.error('Error creating part:', error);
    throw error;
  }
};

export const updatePart = async (partId: string, updates: Partial<Part>): Promise<void> => {
  try {
    const partRef = doc(db, 'parts', partId);
    const now = new Date().toISOString();

    // If price or supplier changed, add to history
    if (updates.purchasePrice !== undefined || updates.supplier !== undefined) {
      await updateDoc(partRef, {
        ...updates,
        history: arrayUnion({
          purchasePrice: updates.purchasePrice,
          supplier: updates.supplier,
          date: now
        }),
        updatedAt: now
      });
    } else {
      await updateDoc(partRef, {
        ...updates,
        updatedAt: now
      });
    }
  } catch (error) {
    console.error('Error updating part:', error);
    throw error;
  }
};