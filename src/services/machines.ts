import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export interface Machine {
  id?: string;
  name: string;
  type: 'main' | 'secondary' | 'equipment';
  description?: string;
  createdAt: string;
}

export const createMachine = async (machine: Omit<Machine, 'id' | 'createdAt'>) => {
  try {
    // Check if machine with same name exists
    const machinesRef = collection(db, 'machines');
    const q = query(machinesRef, where('name', '==', machine.name));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('Une machine avec ce nom existe déjà');
    }

    const docRef = await addDoc(machinesRef, {
      ...machine,
      createdAt: new Date().toISOString()
    });

    return {
      id: docRef.id,
      ...machine,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating machine:', error);
    throw error;
  }
};

export const updateMachine = async (machineId: string, machine: Partial<Machine>) => {
  try {
    // Check if another machine with the same name exists (excluding current machine)
    if (machine.name) {
      const machinesRef = collection(db, 'machines');
      const q = query(machinesRef, where('name', '==', machine.name));
      const querySnapshot = await getDocs(q);
      
      const exists = querySnapshot.docs.some(doc => doc.id !== machineId);
      if (exists) {
        throw new Error('Une machine avec ce nom existe déjà');
      }
    }

    const machineRef = doc(db, 'machines', machineId);
    await updateDoc(machineRef, {
      ...machine,
      updatedAt: new Date().toISOString()
    });

    return {
      id: machineId,
      ...machine
    };
  } catch (error) {
    console.error('Error updating machine:', error);
    throw error;
  }
};

export const getMachines = async () => {
  try {
    const machinesRef = collection(db, 'machines');
    const q = query(machinesRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Machine[];
  } catch (error) {
    console.error('Error getting machines:', error);
    throw error;
  }
};

export const deleteMachine = async (machineId: string) => {
  try {
    await deleteDoc(doc(db, 'machines', machineId));
  } catch (error) {
    console.error('Error deleting machine:', error);
    throw error;
  }
};