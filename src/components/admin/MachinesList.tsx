import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Pencil } from 'lucide-react';
import { Machine, getMachines, deleteMachine } from '../../services/machines';
import MachineForm from './MachineForm';
import toast from 'react-hot-toast';

const MachinesList = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMachine, setSelectedMachine] = useState<Machine | undefined>();

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const machinesData = await getMachines();
      setMachines(machinesData);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast.error('Erreur lors du chargement des machines');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    try {
      await deleteMachine(machineId);
      setMachines(machines.filter(machine => machine.id !== machineId));
      toast.success('Machine supprimée avec succès');
    } catch (error) {
      console.error('Error deleting machine:', error);
      toast.error('Erreur lors de la suppression de la machine');
    }
  };

  const handleEditMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedMachine(undefined);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'main':
        return 'Machine principale';
      case 'secondary':
        return 'Machine secondaire';
      case 'equipment':
        return 'Autre équipement';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'main':
        return 'bg-blue-100 text-blue-800';
      case 'secondary':
        return 'bg-green-100 text-green-800';
      case 'equipment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || machine.type === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle machine
        </button>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une machine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="main">Machines principales</option>
            <option value="secondary">Machines secondaires</option>
            <option value="equipment">Autres équipements</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date d'ajout
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMachines.map((machine) => (
              <tr key={machine.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{machine.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(machine.type)}`}>
                    {getTypeLabel(machine.type)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{machine.description || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(machine.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleEditMachine(machine)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Modifier"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette machine ?')) {
                          handleDeleteMachine(machine.id!);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredMachines.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Aucune machine ne correspond à votre recherche
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <MachineForm
          onClose={handleCloseForm}
          onSuccess={fetchMachines}
          machine={selectedMachine}
        />
      )}
    </div>
  );
};

export default MachinesList;