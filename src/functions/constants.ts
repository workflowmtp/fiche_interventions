// Définir les constantes localement
const INTERVENTION_STATUS = {
    EN_COURS: 'en cours',
    COMPLETED: 'completed',
    SUBMITTED: 'submitted'
  };
  
  const STATUS_CLASS = {
    'en cours': 'bg-blue-100 text-blue-800',
    'completed': 'bg-yellow-100 text-yellow-800',
    'submitted': 'bg-green-100 text-green-800',
    // Compatibilité avec les anciens statuts
    'in_progress': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'draft': 'bg-gray-100 text-gray-800'
  };
  
  const STATUS_TEXT = {
    'en cours': 'En cours',
    'completed': 'Terminée',
    'submitted': 'Soumise',
    // Compatibilité avec les anciens statuts
    'in_progress': 'En cours',
    'in-progress': 'En cours',
    'draft': 'Brouillon'
  };
  
  const PRIORITY_CLASS = {
    'yellow': 'bg-yellow-100 text-yellow-800',
    'orange': 'bg-orange-100 text-orange-800',
    'red': 'bg-red-100 text-red-800'
  };
  
  const PRIORITY_TEXT = {
    'yellow': 'Surveillance',
    'orange': 'Risque élevé',
    'red': 'Critique'
  };
  
  // Types