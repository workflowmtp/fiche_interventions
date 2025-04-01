import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  AlertCircle, 
  AlertOctagon, 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  FileText, 
  Edit2, 
  Plus, 
  Check,
  Download,
  Eye,
  Calendar as CalendarIcon
} from 'lucide-react';
import { getUserInterventions, getCompletedInterventions, formatDuration } from '../services/interventions';
import { useAuth } from '../hooks/useAuth';

import toast from 'react-hot-toast';

interface Intervention {
  id: string;
  interventionNumber: number;
  date: string;
  mainMachine: string;
  secondaryMachine?: string;
  initialDescription: string;
  technicianName: string;
  priority: 'yellow' | 'orange' | 'red';
  status: 'in_progress' | 'completed';
  timeEntries: any[];
  timeStats?: any;
  completedAt?: string;
}

const InterventionsListe = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filteredInterventions, setFilteredInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'yellow' | 'orange' | 'red'>('all');
  const [filterMachine, setFilterMachine] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'priority' | 'machine' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [uniqueMachines, setUniqueMachines] = useState<string[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  // Fetch interventions
  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        if (!user?.uid) return;
        
        setLoading(true);
        let data;
        
        if (isAdmin) {
          // Admins can see all interventions
          data = await getCompletedInterventions();
        } else {
          // Regular users see only their interventions
          data = await getUserInterventions(user.uid);
        }
        
        setInterventions(data);
        
        // Extract unique machine names for filtering
        const machines = Array.from(new Set(
          data.map((intervention: Intervention) => intervention.mainMachine)
        )).filter(Boolean);
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

  // Apply filters and sorting
  useEffect(() => {
    let result = [...interventions];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(intervention => 
        (intervention.mainMachine && intervention.mainMachine.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (intervention.technicianName && intervention.technicianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (intervention.initialDescription && intervention.initialDescription.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(intervention => intervention.status === filterStatus);
    }
    
    // Apply priority filter
    if (filterPriority !== 'all') {
      result = result.filter(intervention => intervention.priority === filterPriority);
    }
    
    // Apply machine filter
    if (filterMachine !== 'all') {
      result = result.filter(intervention => intervention.mainMachine === filterMachine);
    }
    
    // Apply date range filter
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      result = result.filter(intervention => new Date(intervention.date) >= startDate);
    }
    
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // End of the day
      result = result.filter(intervention => new Date(intervention.date) <= endDate);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
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
          const statusValues = { in_progress: 1, completed: 2 };
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

  const handleSort = (field: 'date' | 'priority' | 'machine' | 'status') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set default direction
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleNewIntervention = () => {
    navigate('/');
  };

  const handleEditIntervention = (id: string) => {
    navigate(`/interventions/${id}`);
  };

  const handleViewReport = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setIsReportModalOpen(true);
  };

  const calculateEffectiveTime = (timeEntries: any[]) => {
    if (!timeEntries || timeEntries.length === 0) return 0;
    
    let effectiveTime = 0;
    let startTime: Date | null = null;
    
    timeEntries.forEach(entry => {
      if (entry.action === 'start' || entry.action === 'resume') {
        startTime = new Date(entry.timestamp);
      } else if ((entry.action === 'pause' || entry.action === 'stop') && startTime) {
        const endTime = new Date(entry.timestamp);
        effectiveTime += endTime.getTime() - startTime.getTime();
        startTime = null;
      }
    });
    
    return effectiveTime;
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

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'in_progress':
        return 'En cours';
      default:
        return status;
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white dark:bg-dark-surface rounded-lg shadow-lg dark:shadow-dark overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
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
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-dark-surface border dark:border-dark-border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par machine, technicien, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-surface dark:text-dark-text-primary"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-surface dark:text-dark-text-primary"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminées</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-surface dark:text-dark-text-primary"
                >
                  <option value="all">Toutes les priorités</option>
                  <option value="yellow">Surveillance</option>
                  <option value="orange">Risque élevé</option>
                  <option value="red">Critique</option>
                </select>

                <select
                  value={filterMachine}
                  onChange={(e) => setFilterMachine(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-surface dark:text-dark-text-primary"
                >
                  <option value="all">Toutes les machines</option>
                  {uniqueMachines.map(machine => (
                    <option key={machine} value={machine}>{machine}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 w-5 h-5 text-gray-500 dark:text-dark-text-secondary" />
                  <span className="text-sm text-gray-600 dark:text-dark-text-secondary">Période:</span>
                </div>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="px-3 py-1 border border-gray-300 dark:border-dark-border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-surface dark:text-dark-text-primary"
                />
                <span className="text-gray-500 dark:text-dark-text-secondary">à</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="px-3 py-1 border border-gray-300 dark:border-dark-border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-surface dark:text-dark-text-primary"
                />
              </div>

              <button
                onClick={resetFilters}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {filteredInterventions.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-16 w-16 text-gray-400 dark:text-dark-text-secondary" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-dark-text-primary">
                Aucune intervention trouvée
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">
                Aucune intervention ne correspond à vos critères de recherche ou vous n'avez pas encore créé d'intervention.
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
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-dark-surface">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      N°
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortField === 'date' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSort('machine')}
                    >
                      <div className="flex items-center">
                        Machine
                        {sortField === 'machine' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Technicien
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Description
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center">
                        Priorité
                        {sortField === 'priority' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Temps
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Statut
                        {sortField === 'status' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                  {filteredInterventions.map((intervention) => (
                    <tr key={intervention.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                        #{intervention.interventionNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                        {new Date(intervention.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text-primary">
                        {intervention.mainMachine || '-'}
                        {intervention.secondaryMachine && (
                          <span className="block text-xs text-gray-500 dark:text-dark-text-secondary">
                            + {intervention.secondaryMachine}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                        {intervention.technicianName || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-dark-text-secondary line-clamp-2">
                        {intervention.initialDescription}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(intervention.priority)}`}>
                          {getPriorityIcon(intervention.priority)}
                          <span className="ml-1">{getPriorityText(intervention.priority)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(calculateEffectiveTime(intervention.timeEntries))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(intervention.status)}`}>
                          {intervention.status === 'completed' ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {getStatusText(intervention.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                             onClick={() => handleEditIntervention(intervention.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                            title="Modifier l'intervention"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewReport(intervention)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 p-1"
                            title="Voir le rapport"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewReport(intervention)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1"
                            title="Télécharger le rapport"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-dark-text-secondary">
            <div>
              Total: {filteredInterventions.length} intervention(s)
            </div>
            <div>
              {interventions.length !== filteredInterventions.length && (
                <span>Affichage de {filteredInterventions.length} sur {interventions.length} interventions</span>
              )}
            </div>
          </div>
        </div>
      </div>

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