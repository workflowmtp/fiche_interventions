import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  AlertCircle, 
  AlertOctagon, 
  Search, 
  Clock, 
  FileText, 
  Edit2, 
  Plus, 
  Check,
  Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  getUserInterventions, 
  Intervention 
} from '../services/interventions';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { exportToPDF } from '../services/export';

// ======================================
// Helper Functions
// ======================================

const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'yellow': return 'bg-yellow-100 text-yellow-800';
    case 'orange': return 'bg-orange-100 text-orange-800';
    case 'red': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'submitted': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'yellow': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'orange': return <AlertCircle className="h-4 w-4 text-orange-600" />;
    case 'red': return <AlertOctagon className="h-4 w-4 text-red-600" />;
    default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'yellow': return 'Faible';
    case 'orange': return 'Moyenne';
    case 'red': return 'Élevée';
    default: return 'Non définie';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'in_progress': return 'En cours';
    case 'completed': return 'Terminée';
    case 'submitted': return 'Soumise';
    default: return 'Non défini';
  }
};

// Fonction pour manipuler les dates en toute sécurité
const safeDate = (dateString?: string) => {
  if (!dateString) return new Date(); // Date actuelle si undefined
  try {
    const date = new Date(dateString);
    // Vérifier si la date est valide
    return isNaN(date.getTime()) ? new Date() : date;
  } catch (e) {
    return new Date(); // Date actuelle en cas d'erreur
  }
};

// ======================================
// Types and Interfaces
// ======================================

// ======================================
// Modal de rapport d'intervention
// ======================================

const InterventionReport: React.FC<{ 
  intervention: Intervention; 
  isOpen: boolean; 
  onClose: () => void; 
}> = ({ intervention, isOpen, onClose }) => {
  if (!isOpen) return null;

  // Utiliser safeDate pour gérer les dates en toute sécurité
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return safeDate(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Rapport d'intervention #{intervention.interventionNumber}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {/* Contenu du rapport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date :</label>
                  <div className="mt-1 text-gray-900">
                    {formatDate(intervention.date)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Machine :</label>
                  <div className="mt-1 text-gray-900">
                    {intervention.mainMachine}
                    {intervention.secondaryMachine && (
                      <span className="text-gray-500 text-sm ml-2">
                        + {intervention.secondaryMachine}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Technicien :</label>
                  <div className="mt-1 text-gray-900">
                    {intervention.technicianName || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Priorité :</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(intervention.priority)}`}>
                      {getPriorityIcon(intervention.priority)}
                      <span className="ml-1">{getPriorityText(intervention.priority)}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Statut :</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(intervention.status)}`}>
                      {intervention.status === 'completed' ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : (
                        <Clock className="w-4 h-4 mr-1" />
                      )}
                      {getStatusText(intervention.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description du problème</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {intervention.initialDescription || "Aucune description disponible"}
                </p>
              </div>
            </div>
          </div>

          {/* Temps d'intervention */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Temps d'intervention</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center text-gray-800">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-medium">Temps effectif : </span>
                <span className="ml-2">
                  Temps non calculé pour le moment
                </span>
              </div>
            </div>
          </div>

          {/* Intervenants (technicianSignatures) */}
          {intervention.technicianSignatures && intervention.technicianSignatures.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Intervenants</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <ul className="space-y-2">
                  {intervention.technicianSignatures.map((signature, index) => (
                    <li key={index} className="flex items-center text-gray-800">
                      <span className="w-4 h-4 mr-2 text-purple-500">•</span>
                      {signature.name}
                      {signature.validated && (
                        <span className="ml-2 text-green-500 text-xs">
                          <Check className="w-3 h-3 inline" /> Validé
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                toast.success("Téléchargement du rapport...");
              }}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Télécharger le rapport
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================================
// Composant principal
// ======================================

const InterventionsListe: React.FC = () => {
  // ======================================
  // Hooks et états
  // ======================================
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // État des interventions
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filteredInterventions, setFilteredInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États des filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed' | 'submitted'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'yellow' | 'orange' | 'red'>('all');
  const [filterMachine, setFilterMachine] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // États du tri
  const [sortField, setSortField] = useState<'date' | 'priority' | 'machine' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Autres états
  const [uniqueMachines, setUniqueMachines] = useState<string[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  // ======================================
  // Fonctions d'aide
  // ======================================

  // ======================================
  // Effets (useEffect)
  // ======================================
  
  // Charger les interventions
  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        if (!user?.uid) return;
        
        setLoading(true);
        let data;
        
        if (isAdmin) {
          // Admins peuvent voir toutes les interventions
          data = await getUserInterventions(user.uid);
        } else {
          // Utilisateurs standard voient leurs interventions
          data = await getUserInterventions(user.uid);
        }
        
        setInterventions(data);
        
        // Extraire les noms de machines uniques pour le filtre
        const machines = Array.from(new Set(
          data.map((intervention: Intervention) => intervention.mainMachine)
            .filter((machine): machine is string => Boolean(machine)) // Type guard pour garantir que ce sont des strings
        ));
        setUniqueMachines(machines);
      } catch (error: any) {
        console.error('Error fetching interventions:', error);
        toast.error(error.message || 'Erreur lors du chargement des interventions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterventions();
  }, [user, isAdmin]);

  // Appliquer les filtres et le tri
  useEffect(() => {
    let result = [...interventions];
    
    // Appliquer le filtre de recherche
    if (searchTerm) {
      result = result.filter(intervention => 
        (intervention.mainMachine && intervention.mainMachine.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (intervention.technicianName && intervention.technicianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (intervention.initialDescription && intervention.initialDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (intervention.interventionNumber && intervention.interventionNumber.toString().includes(searchTerm))
      );
    }
    
    // Appliquer le filtre de statut
    if (filterStatus !== 'all') {
      result = result.filter(intervention => intervention.status === filterStatus);
    }
    
    // Appliquer le filtre de priorité
    if (filterPriority !== 'all') {
      result = result.filter(intervention => intervention.priority === filterPriority);
    }
    
    // Appliquer le filtre de machine
    if (filterMachine !== 'all') {
      result = result.filter(intervention => intervention.mainMachine === filterMachine);
    }
    
    // Appliquer le filtre de plage de dates
    if (dateRange.startDate) {
      const startDate = safeDate(dateRange.startDate);
      result = result.filter(intervention => safeDate(intervention.date) >= startDate);
    }
    
    if (dateRange.endDate) {
      const endDate = safeDate(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Fin de la journée
      result = result.filter(intervention => safeDate(intervention.date) <= endDate);
    }
    
    // Appliquer le tri
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = safeDate(a.date).getTime() - safeDate(b.date).getTime();
          break;
        case 'priority': {
          const priorityValues = { yellow: 1, orange: 2, red: 3 };
          comparison = (priorityValues[a.priority] || 0) - (priorityValues[b.priority] || 0);
          break;
        }
        case 'machine':
          comparison = (a.mainMachine || '').localeCompare(b.mainMachine || '');
          break;
        case 'status': {
          const statusValues = { in_progress: 1, completed: 2, submitted: 3 };
          comparison = (statusValues[a.status] || 0) - (statusValues[b.status] || 0);
          break;
        }
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredInterventions(result);
  }, [
    interventions, 
    searchTerm, 
    filterStatus, 
    filterPriority, 
    filterMachine,
    dateRange, 
    sortField, 
    sortDirection
  ]);

  // ======================================
  // Division des listes
  // ======================================
  const createdList = useMemo(() => 
    filteredInterventions.filter(int => int.createdBy === user?.uid), 
    [filteredInterventions, user]
  );

  const assignedList = useMemo(() => 
    filteredInterventions.filter(int => 
      int.technicianSignatures?.some(sig => sig.uid === user?.uid) ||
      (int.supervisorSignature && int.supervisorSignature.uid === user?.uid)
    ), 
    [filteredInterventions, user]
  );

  // ======================================
  // Handlers
  // ======================================
  
  const handleSort = (field: 'date' | 'priority' | 'machine' | 'status') => {
    if (sortField === field) {
      // Inverser le sens du tri si même champ
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouveau champ, tri descendant par défaut
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleNewIntervention = () => {
    navigate('/intervention/new/');
  };

  const handleEditIntervention = (id: string) => {
    navigate(`/interventions/${id}`);
  };

  const handleViewReport = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setIsReportModalOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterMachine('all');
    setDateRange({ startDate: '', endDate: '' });
    setSortField('date');
    setSortDirection('desc');
  };

  const handleExportPDF = () => {
    if (filteredInterventions.length === 0) {
      toast.error("Aucune intervention à exporter.");
      return;
    }
    try {
      exportToPDF(filteredInterventions); // Exporte toutes les interventions filtrées (pas séparées)
      toast.success("Export PDF généré avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast.error("Erreur lors de la génération du PDF.");
    }
  };

  const handleEditCreatedIntervention = (intervention: Intervention) => {
    // Naviguer vers le formulaire de création avec l'ID de l'intervention pour pré-remplir les données
    navigate(`/intervention/edit/${intervention.id}`);
  };

  // ======================================
  // Fonction pour rendre une table
  // ======================================
  const renderInterventionTable = (title: string, list: Intervention[], isCreatedList: boolean = false) => {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">{title} ({list.length})</h2>
        {list.length === 0 ? (
          <p className="text-gray-500 italic">Aucune intervention trouvée pour cette catégorie.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
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
                    Machine Principale
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {list.map((intervention) => (
                  <tr key={intervention.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {intervention.interventionNumber || intervention.id.substring(0, 6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {safeDate(intervention.date).toLocaleDateString()}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {intervention.mainMachine || '-'}
                    </td>
                    <td className="px-6 py-4 max-w-xs text-sm text-gray-500 truncate">
                      {intervention.initialDescription}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(intervention.priority)}`}>
                        {getPriorityIcon(intervention.priority)}
                        <span className="ml-1">{getPriorityText(intervention.priority)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(intervention.status)}`}>
                        {intervention.status === 'completed' ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Clock className="w-4 h-4 mr-1" />
                        )}
                        {getStatusText(intervention.status)}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewReport(intervention)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100 transition-colors"
                        title="Voir le rapport"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {isCreatedList ? (
                        // Pour les fiches créées par l'utilisateur, rediriger vers la page d'édition existante
                        <button
                          onClick={() => handleEditCreatedIntervention(intervention)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-100 transition-colors"
                          title="Modifier cette fiche"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      ) : (
                        // Pour les fiches assignées, conserver le comportement actuel
                        <button
                          onClick={() => handleEditIntervention(intervention.id)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-100 transition-colors"
                          title="Voir les détails"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ======================================
  // JSX Rendu
  // ======================================
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* En-tête avec titre et bouton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Liste des interventions
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleNewIntervention}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle intervention
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter au format PDF
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        {/* Recherche et filtres */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par machine, technicien, description, numéro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminées</option>
              <option value="submitted">Soumises</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="yellow">Surveillance</option>
              <option value="orange">Risque élevé</option>
              <option value="red">Critique</option>
            </select>

            <select
              value={filterMachine}
              onChange={(e) => setFilterMachine(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes les machines</option>
              {uniqueMachines.map(machine => (
                <option key={machine} value={machine}>{machine}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtres de date et bouton de réinitialisation */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">Période:</span>
            </div>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">à</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={resetFilters}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Indicateur de chargement */}
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        // Affichage des listes séparées
        <>
          {renderInterventionTable("Mes Fiches Créées", createdList, true)}
          {renderInterventionTable("Fiches Assignées", assignedList)}
        </>
      )}

      {/* Modal de rapport */}
      {selectedIntervention && (
        <InterventionReport
          intervention={selectedIntervention}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default InterventionsListe;