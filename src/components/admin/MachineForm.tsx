import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createMachine, updateMachine, Machine } from '../../services/machines';
import toast from 'react-hot-toast';

interface MachineFormProps {
  onClose: () => void;
  onSuccess: () => void;
  machine?: Machine;
}

const MachineForm: React.FC<MachineFormProps> = ({ onClose, onSuccess, machine }) => {
  const [formData, setFormData] = useState({
    name: machine?.name || '',
    type: machine?.type || 'main' as 'main' | 'secondary' | 'equipment',
    description: machine?.description || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (machine?.id) {
        await updateMachine(machine.id, formData);
        toast.success('Machine modifiée avec succès');
      } else {
        await createMachine(formData);
        toast.success('Machine ajoutée avec succès');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving machine:', error);
      if (error.message === 'Une machine avec ce nom existe déjà') {
        toast.error('Une machine avec ce nom existe déjà');
      } else {
        toast.error(machine?.id ? 'Erreur lors de la modification de la machine' : 'Erreur lors de la création de la machine');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {machine?.id ? 'Modifier la machine' : 'Ajouter une nouvelle machine'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la machine <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Ex: Machine de production A"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type de machine <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'main' | 'secondary' | 'equipment' })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="main">Machine principale</option>
              <option value="secondary">Machine secondaire</option>
              <option value="equipment">Autre équipement</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Description détaillée de la machine..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {machine?.id ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MachineForm;