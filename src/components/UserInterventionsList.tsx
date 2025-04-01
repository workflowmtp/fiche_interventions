import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, AlertOctagon, FileText, Search, Plus, ClipboardList, Edit2 } from 'lucide-react';
import { getUserInterventions, saveIntervention, getNextInterventionNumber } from '../services/interventions';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const UserInterventionsList = () => {
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchInterventions = async () => {
    try {
      if (!user?.uid) return;
      
      const data = await getUserInterventions(user.uid);
      setInterventions(data);
    } catch (error) {
      console.error('Error fetching interventions:', error);
      toast.error('Erreur lors du chargement des interventions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, [user]);

  const handleNewIntervention = async () => {
    try {
      if (!user) {
        toast.error('Vous devez être connecté pour créer une intervention');
        return;
      }

      const nextNumber = await getNextInterventionNumber();
      
      // Create a new intervention with only essential fields
      const interventionData = {
        interventionNumber: nextNumber,
        date: new Date().toISOString().split('T')[0],
        emitter: user.displayName || '',
        emitterRole: '',
        mainMachine: '',
        secondaryMachine: '',
        otherEquipment: '',
        priority: 'yellow',
        previouslyEncountered: false,
        pcaInformed: false,
        pcaOpinion: '',
        initialDescription: '',
        technicalDescription: '',
        technicianName: '',
        electricalIssues: [],
        mechanicalIssues: [],
        pneumaticHydraulicIssues: [],
        electronicIssues: [],
        softwareIssues: [],
        humanIssues: [],
        environmentalIssues: [],
        consumableIssues: [],
        maintenanceIssues: [],
        otherIssues: '',
        rootCauseAnalysis: [{
          problem: '',
          whys: [{ id: Date.now().toString(), value: '' }],
          rootCause: '',
          actions: '',
          results: ''
        }],
        replacedParts: [{
          name: '',
          interventionType: '',
          quantity: 0,
          lastPurchasePrice: 0,
          supplier: ''
        }],
        verificationTest: false,
        verificationObservations: '',
        finalConclusion: '',
        technicianSignatures: [],
        supervisorSignature: '',
        timeEntries: [],
        status: 'in_progress'
      };

      // Save the intervention and get the ID
      const id = await saveIntervention(user.uid, interventionData);
      
      // Navigate to the edit page with the intervention ID
      navigate(`/interventions/${id}`);
      
      toast.success('Nouvelle intervention créée');
    } catch (error) {
      console.error('Error creating intervention:', error);
      toast.error('Erreur lors de la création de l\'intervention');
    }
  };

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

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = 
      intervention.mainMachine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.initialDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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
              <div className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Mes interventions en cours
                </h1>
              </div>
              <button
                onClick={handleNewIntervention}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvelle intervention
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par machine ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {interventions.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune intervention en cours</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par créer une nouvelle intervention
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleNewIntervention}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle intervention
                  </button>
                </div>
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
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priorité
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInterventions.map((intervention) => (
                      <tr 
                        key={intervention.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleEditIntervention(intervention.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{intervention.interventionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(intervention.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {intervention.mainMachine || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {intervention.initialDescription?.substring(0, 100)}
                          {intervention.initialDescription?.length > 100 ? '...' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getPriorityIcon(intervention.priority)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getPriorityText(intervention.priority)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditIntervention(intervention.id);
                              }}
                              className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded-full"
                              title="Modifier l'intervention"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditIntervention(intervention.id);
                              }}
                              className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-full"
                              title="Voir les détails"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredInterventions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      Aucune intervention ne correspond à votre recherche
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInterventionsList;