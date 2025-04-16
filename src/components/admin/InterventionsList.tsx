import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileText, AlertTriangle, AlertCircle, AlertOctagon, ClipboardX, Plus, X, Download, Calendar, Settings } from 'lucide-react';
import { getCompletedInterventions } from '../../services/interventions';
import { getParts, createPart, Part } from '../../services/parts';
import { exportToPDF, exportToCSV } from '../../services/export';
import { useAuth } from '../../hooks/useAuth';
import { Dialog, Transition } from '@headlessui/react';
import PartsList from './PartsList';
import MachinesList from './MachinesList';
import InterventionReport from '../InterventionReport ';
import toast from 'react-hot-toast';

interface Intervention {
  id: string;
  interventionNumber: number;
  date: string;
  mainMachine: string;
  emitter: string;
  priority: 'yellow' | 'orange' | 'red';
  technicianName: string;
  status: string;
  completedAt: string;
}

interface ExportPeriod {
  startDate: string;
  endDate: string;
}

const InterventionsList = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [newPart, setNewPart] = useState<Part>({
    designation: '',
    reference: '',
    supplier: '',
    purchasePrice: 0
  });
  const [interventionReport, setInterventionReport] = useState<string>(''); // Ajout de l'état pour le rapport d'intervention
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [interventionsData, partsData] = await Promise.all([
          getCompletedInterventions(),
          getParts()
        ]);
        
        // Ensure emitter is a string and filter to keep only "submitted" interventions
        const processedInterventions = interventionsData
          .filter(intervention => intervention.status === 'submitted')
          .map(intervention => ({
            ...intervention,
            emitter: typeof intervention.emitter === 'object' ? intervention.emitter.name : intervention.emitter
          }));
        
        setInterventions(processedInterventions);
        setParts(partsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const handleEditIntervention = (id: string) => {
    navigate(`/interventions/${id}`);
  };
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'yellow':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'orange':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'red':
        return <AlertOctagon className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'yellow':
        return 'Surveillance';
      case 'orange':
        return 'Risque élevé';
      case 'red':
        return 'Critique';
      default:
        return '';
    }
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdPart = await createPart(newPart);
      setParts([createdPart, ...parts]);
      setIsPartModalOpen(false);
      setNewPart({
        designation: '',
        reference: '',
        supplier: '',
        purchasePrice: 0
      });
      toast.success('Pièce créée avec succès');
    } catch (error) {
      console.error('Error creating part:', error);
      toast.error('Erreur lors de la création de la pièce');
    }
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    try {
      const startDate = new Date(exportPeriod.startDate);
      const endDate = new Date(exportPeriod.endDate);
      endDate.setHours(23, 59, 59, 999);

      const filteredInterventions = interventions.filter(intervention => {
        const interventionDate = new Date(intervention.date);
        return interventionDate >= startDate && interventionDate <= endDate;
      });

      if (filteredInterventions.length === 0) {
        toast.error('Aucune intervention trouvée pour cette période');
        return;
      }

      if (format === 'pdf') {
        exportToPDF(filteredInterventions);
      } else {
        exportToCSV(filteredInterventions);
      }
      
      setIsExportModalOpen(false);
      toast.success(`Export ${format.toUpperCase()} réussi`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(`Erreur lors de l'export ${format.toUpperCase()}`);
    }
  };

  const filteredInterventions = interventions
    .filter(intervention => {
      const matchesSearch = 
        intervention.mainMachine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof intervention.emitter === 'string' && intervention.emitter.toLowerCase().includes(searchTerm.toLowerCase())) ||
        intervention.technicianName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = filterPriority === 'all' || intervention.priority === filterPriority;
      const matchesMachine = filterMachine === 'all' || intervention.mainMachine === filterMachine;

      return matchesSearch && matchesPriority && matchesMachine;
    });

  const uniqueMachines = Array.from(new Set(interventions.map(i => i.mainMachine))).filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Liste des interventions
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Calendar className="w-4 h-4" />
                  Exporter par période
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par machine, émetteur ou technicien..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="all">Toutes les priorités</option>
                    <option value="yellow">Surveillance</option>
                    <option value="orange">Risque élevé</option>
                    <option value="red">Critique</option>
                  </select>
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterMachine}
                    onChange={(e) => setFilterMachine(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="all">Toutes les machines</option>
                    {uniqueMachines.map(machine => (
                      <option key={machine} value={machine}>{machine}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {interventions.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardX className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Aucune intervention enregistrée
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Les interventions s'afficheront ici une fois qu'elles seront créées.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N°
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Machine
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Émetteur
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priorité
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Technicien
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInterventions.map((intervention) => (
                      <tr key={intervention.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{intervention.interventionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(intervention.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {intervention.mainMachine}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {typeof intervention.emitter === 'object' ? intervention.emitter.name : intervention.emitter}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getPriorityIcon(intervention.priority)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getPriorityText(intervention.priority)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {intervention.technicianName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            intervention.status === 'submitted' 
                              ? 'bg-purple-100 text-purple-800' 
                              : intervention.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {intervention.status === 'submitted' 
                              ? 'Soumise' 
                              : intervention.status === 'completed' 
                                ? 'Terminée' 
                                : 'En cours'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedIntervention(intervention);
                              setIsReportModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredInterventions.length === 0 && (
                  <div className="text-center py-12">
                    <ClipboardX className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">
                      Aucune intervention ne correspond à votre recherche
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-6 h-6 text-gray-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                Gestion des machines
              </h2>
            </div>
            <MachinesList />
          </div>
        </div>

        <PartsList parts={parts} onNewPart={() => setIsPartModalOpen(true)} />
      </div>

      {/* Export Modal */}
      <Transition.Root show={isExportModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsExportModalOpen(false)}
        >
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => setIsExportModalOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                      Exporter les interventions
                    </Dialog.Title>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          Date de début
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          value={exportPeriod.startDate}
                          onChange={(e) => setExportPeriod({ ...exportPeriod, startDate: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          Date de fin
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={exportPeriod.endDate}
                          onChange={(e) => setExportPeriod({ ...exportPeriod, endDate: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex gap-4 mt-6">
                        <button
                          type="button"
                          onClick={() => handleExport('pdf')}
                          className="flex-1 inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExport('csv')}
                          className="flex-1 inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700"
                        >
                          <Download className="w-4 h-4" />
                          CSV
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* New Part Modal */}
      <Transition.Root show={isPartModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsPartModalOpen(false)}
        >
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => setIsPartModalOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                      Nouvelle pièce
                    </Dialog.Title>
                    <form onSubmit={handleCreatePart} className="space-y-4">
                      <div>
                        <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                          Désignation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="designation"
                          value={newPart.designation}
                          onChange={(e) => setNewPart({ ...newPart, designation: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                          Référence <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="reference"
                          value={newPart.reference}
                          onChange={(e) => setNewPart({ ...newPart, reference: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                          Fournisseur <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="supplier"
                          value={newPart.supplier}
                          onChange={(e) => setNewPart({ ...newPart, supplier: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">
                          Prix d'achat <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="purchasePrice"
                          min="0"
                          step="0.01"
                          value={newPart.purchasePrice}
                          onChange={(e) => setNewPart({ ...newPart, purchasePrice: parseFloat(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          Créer la pièce
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                          onClick={() => setIsPartModalOpen(false)}
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Report Modal */}
      
      <Transition.Root show={isReportModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 "
          onClose={() => setIsReportModalOpen(false)}
        >
          {selectedIntervention && (
                      <InterventionReport 
                        intervention={selectedIntervention} 
                        isOpen={isReportModalOpen} 
                        onClose={() => setIsReportModalOpen(false)} 
                      />
                    )}
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default InterventionsList;