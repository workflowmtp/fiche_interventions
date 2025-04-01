import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getMachines, Machine } from '../../services/machines';

interface GeneralInfoProps {
  formData: any;
  relatedHistory: any[];
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

const GeneralInfo: React.FC<GeneralInfoProps> = ({ formData, relatedHistory, onFormChange, isEditable }) => {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const machinesData = await getMachines();
        setMachines(machinesData);
      } catch (error) {
        console.error('Error fetching machines:', error);
      }
    };
    fetchMachines();
  }, []);

  // Update emitter when user changes
  useEffect(() => {
    if (user?.displayName && !formData.emitter) {
      onFormChange({ ...formData, emitter: user.displayName });
    }
  }, [user?.displayName]);

  const mainMachines = machines.filter(m => m.type === 'main');
  const secondaryMachines = machines.filter(m => m.type === 'secondary');
  const equipment = machines.filter(m => m.type === 'equipment');

  const getHistoryPriorityColor = (priority: string) => {
    switch (priority) {
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'orange': return 'bg-orange-100 text-orange-800';
      case 'red': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const inputClasses = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-6 py-3 ${!isEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`;
  const readOnlyClasses = "mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm px-6 py-3 cursor-not-allowed";

  return (
    <section className="border rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">1. Informations Générales</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">N° d'intervention</label>
          <input
            type="number"
            value={formData.interventionNumber || ''}
            readOnly
            className={readOnlyClasses}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date de la demande <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date}
            readOnly
            className={readOnlyClasses}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nom de l'émetteur <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.emitter}
            onChange={(e) => onFormChange({ ...formData, emitter: e.target.value })}
            className={inputClasses}
            placeholder={user?.displayName || ''}
            required
            disabled={!isEditable}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fonction <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.emitterRole}
            onChange={(e) => onFormChange({ ...formData, emitterRole: e.target.value })}
            className={inputClasses}
            required
            disabled={!isEditable}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Machines principales
          </label>
          <select
            value={formData.mainMachine}
            onChange={(e) => onFormChange({ ...formData, mainMachine: e.target.value })}
            className={inputClasses}
            disabled={!isEditable}
          >
            <option value="">Sélectionner une machine</option>
            {mainMachines.map(machine => (
              <option key={machine.id} value={machine.name}>{machine.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Machines secondaires</label>
          <select
            value={formData.secondaryMachine}
            onChange={(e) => onFormChange({ ...formData, secondaryMachine: e.target.value })}
            className={inputClasses}
            disabled={!isEditable}
          >
            <option value="">Sélectionner une machine</option>
            {secondaryMachines.map(machine => (
              <option key={machine.id} value={machine.name}>{machine.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Autres appareils</label>
          <select
            value={formData.otherEquipment}
            onChange={(e) => onFormChange({ ...formData, otherEquipment: e.target.value })}
            className={inputClasses}
            disabled={!isEditable}
          >
            <option value="">Sélectionner un appareil</option>
            {equipment.map(machine => (
              <option key={machine.id} value={machine.name}>{machine.name}</option>
            ))}
          </select>
        </div>
      </div>

      {relatedHistory.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <History className="w-5 h-5" />
            <h3 className="font-medium">Historique des interventions pour {formData.mainMachine}</h3>
          </div>
          <div className="space-y-2">
            {relatedHistory.map((intervention) => (
              <div
                key={intervention.id}
                className={`p-3 rounded-lg ${getHistoryPriorityColor(intervention.priority)} flex items-center justify-between`}
              >
                <div>
                  <div className="font-medium">{intervention.description}</div>
                  <div className="text-sm opacity-75">Date: {intervention.date}</div>
                </div>
                <div className="text-sm font-medium">
                  #{intervention.interventionNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default GeneralInfo;