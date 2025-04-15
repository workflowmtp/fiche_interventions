import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { saveIntervention, getNextInterventionNumber, getIntervention } from '../services/interventions';
import { useAuth } from '../hooks/useAuth';
import { getAllUsers, AppUser } from '../services/users';
import toast from 'react-hot-toast';
import Header from './Header';
import { ArrowLeft, Save, Users, User, UserCheck, Briefcase, Search, CheckCircle, Trash2 } from 'lucide-react';

const CreateInterventionUpdated = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [currentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!id);
  const [formData, setFormData] = useState<any>({
    interventionNumber: 0,
    date: new Date().toISOString().split('T')[0],
    emitter: user?.displayName || '',
    emitterRole: '',
    userId: user?.uid || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    initialDescription: '',
    technicianSignatures: [],
    supervisorSignature: { uid: '', name: '', role: '', validated: false }
  });
  
  // État pour la liste des utilisateurs disponibles
  const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pas besoin de filtre pour seulement deux types d'utilisateurs
  
  // État pour les techniciens sélectionnés
  const [selectedTechnicians, setSelectedTechnicians] = useState<AppUser[]>([]);
  
  // État pour le superviseur sélectionné
  const [selectedSupervisor, setSelectedSupervisor] = useState<AppUser | null>(null);

  // Charger les données de l'intervention existante si on est en mode édition
  useEffect(() => {
    const loadExistingIntervention = async () => {
      if (id && user?.uid) {
        try {
          setLoading(true);
          const interventionData = await getIntervention(id, user.uid);
          
          if (interventionData) {
            // Mettre à jour le formulaire avec les données existantes
            setFormData({
              ...interventionData,
              // S'assurer que la date est au bon format pour l'input date
              date: interventionData.date || interventionData.interventionDate || new Date().toISOString().split('T')[0],
              // Mettre à jour pour indiquer que c'est une édition
              updatedAt: new Date().toISOString()
            });
            
            // Récupérer les techniciens et le superviseur si présents
            if (interventionData.technicianSignatures && interventionData.technicianSignatures.length > 0) {
              // Convertir les signatures en objets AppUser pour les sélectionnés
              const techs = interventionData.technicianSignatures.map((sig: any) => ({
                uid: sig.uid,
                displayName: sig.name,
                email: '',
                role: sig.role || 'technician'
              }));
              setSelectedTechnicians(techs);
            }
            
            if (interventionData.supervisorSignature && interventionData.supervisorSignature.uid) {
              setSelectedSupervisor({
                uid: interventionData.supervisorSignature.uid,
                displayName: interventionData.supervisorSignature.name,
                email: '',
                role: 'supervisor'
              });
            }
            
            toast.success("Intervention chargée avec succès");
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'intervention:", error);
          toast.error("Erreur lors du chargement de l'intervention");
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadExistingIntervention();
  }, [id, user]);

  useEffect(() => {
    const initializeForm = async () => {
      try {
        setLoading(true);
        // Récupérer le prochain numéro d'intervention seulement si on n'est pas en mode édition
        if (!isEditMode && !formData.interventionNumber) {
          const nextNumber = await getNextInterventionNumber();
          setFormData(prev => ({ ...prev, interventionNumber: nextNumber }));
        }
        
        // Récupérer la liste des utilisateurs
        await loadUsers();
      } catch (error) {
        console.error('Error initializing form:', error);
        toast.error('Erreur lors de l\'initialisation du formulaire');
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, []);

  const loadUsers = async () => {
    try {
      // Récupérer tous les utilisateurs
      const users = await getAllUsers();
      setAvailableUsers(users);
      
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  useEffect(() => {
    // Update user ID in formData if user changes
    if (user?.uid && formData.userId !== user.uid) {
      setFormData(prev => ({
        ...prev,
        userId: user.uid,
        emitter: user.displayName || prev.emitter
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredUsers = searchQuery 
    ? availableUsers.filter(user => 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableUsers;

  const selectTechnician = (selectedUser: AppUser) => {
    if (!selectedTechnicians.some(tech => tech.uid === selectedUser.uid)) {
      setSelectedTechnicians([...selectedTechnicians, selectedUser]);
      setSearchQuery(''); // Clear search after selection
    }
  };

  const removeTechnician = (userId: string) => {
    setSelectedTechnicians(selectedTechnicians.filter(tech => tech.uid !== userId));
  };

  const selectSupervisor = (selectedUser: AppUser) => {
    setSelectedSupervisor(selectedUser);
    setSearchQuery(''); // Clear search after selection
  };

  const removeSupervisor = () => {
    setSelectedSupervisor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour créer une intervention');
      return;
    }

    // Validation des champs obligatoires
    if (!formData.initialDescription) {
      toast.error('Veuillez fournir une description de l\'incident');
      return;
    }

    try {
      setLoading(true);
      
      // Préparer les données pour l'enregistrement
      const interventionToSave = {
        ...formData,
        createdBy: user.uid, // Ajout du créateur
        // En mode édition, on conserve l'ID de l'utilisateur d'origine
        userId: isEditMode ? formData.userId : user.uid,
        // En mode édition, on conserve la date de création originale
        createdAt: isEditMode ? formData.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: isEditMode ? formData.status : 'en cours', // Utiliser le statut existant en mode édition
        
        // Ajouter automatiquement le créateur comme technicien s'il n'est pas déjà dans la liste
        technicianSignatures: [
          // Ajouter d'abord le créateur comme technicien
          {
            uid: user.uid,
            name: user.displayName || 'Utilisateur',
            role: user.role || 'user',
            validated: true // Le créateur valide automatiquement sa signature
          },
          // Puis ajouter les autres techniciens sélectionnés (sauf si c'est le créateur)
          ...selectedTechnicians
            .filter(tech => tech.uid !== user.uid) // Éviter les doublons
            .map(tech => ({ 
              uid: tech.uid,
              name: tech.displayName, 
              role: tech.role || 'user',
              validated: false 
            }))
        ],
        
        supervisorSignature: selectedSupervisor 
          ? {
              uid: selectedSupervisor.uid,
              name: selectedSupervisor.displayName,
              role: selectedSupervisor.role || 'user',
              validated: false
            }
          : null
      };

      // En mode édition, on ajoute l'ID existant
      if (isEditMode && id) {
        interventionToSave.id = id;
      }
      
      // Enregistrer l'intervention
      await saveIntervention(user.uid, interventionToSave);
      toast.success(isEditMode ? 'Intervention mise à jour avec succès' : 'Intervention créée avec succès');
      navigate('/interventions');
    } catch (error: any) {
      console.error(isEditMode ? 'Error updating intervention:' : 'Error creating intervention:', error);
      toast.error(error.message || (isEditMode ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création'));
    } finally {
      setLoading(false);
    }
  };

  // Fonction de chargement simplifiée sans filtres

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/interventions')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à la liste
            </button>
            <h1 className="text-2xl font-bold text-center text-gray-800">
              {isEditMode ? "Édition d'une fiche d'intervention" : "Nouvelle fiche d'intervention"}
            </h1>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isEditMode ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>

          <Header
            currentTime={currentTime}
            isRunning={false}
            isPaused={false}
            elapsedTime="00:00:00"
          />

          <form onSubmit={handleSubmit} className="space-y-8 mt-8">
            {/* Section Informations Générales */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Informations Générales</h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro d'intervention
                    </label>
                    <input
                      type="text"
                      value={`#${formData.interventionNumber}`}
                      disabled
                      className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de création
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Émetteur de la demande
                    </label>
                    <input
                      type="text"
                      name="emitter"
                      value={formData.emitter}
                      onChange={handleInputChange}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="Nom de l'émetteur"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fonction de l'émetteur
                    </label>
                    <input
                      type="text"
                      name="emitterRole"
                      value={formData.emitterRole}
                      onChange={handleInputChange}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="Fonction de l'émetteur"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description de l'incident <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="initialDescription"
                    value={formData.initialDescription}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Décrivez en détail l'incident ou le problème rencontré..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Section Intervenants */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  Intervenants
                </h2>
              </div>
              <div className="p-4 md:p-6">
                {/* Recherche d'utilisateurs avec filtres */}
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row gap-3 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        value={searchQuery}
                        onChange={handleUserSearch}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    {/* Pas de filtres nécessaires pour seulement deux types d'utilisateurs */}
                  </div>
                  
                  {searchQuery && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-md max-h-60 overflow-y-auto z-10">
                      {filteredUsers.length === 0 ? (
                        <div className="p-3 text-center text-gray-500">
                          Aucun utilisateur trouvé
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {filteredUsers.map(user => (
                            <li 
                              key={user.uid} 
                              className="p-3 hover:bg-gray-50 flex justify-between items-center cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{user.displayName || 'Sans nom'}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                  <div className="text-xs text-gray-500">
                                    Rôle: {user.role === 'admin' ? 'Administrateur' : 'Utilisateur standard'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => selectTechnician(user)}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                  disabled={user.role === 'admin'} // Désactiver si c'est un admin
                                >
                                  + Technicien
                                </button>
                                <button
                                  type="button"
                                  onClick={() => selectSupervisor(user)}
                                  className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                                  disabled={user.role === 'admin'} // Désactiver si c'est un admin
                                >
                                  + Superviseur
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Techniciens sélectionnés */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-500" />
                    Techniciens sélectionnés
                  </h3>
                  
                  {selectedTechnicians.length === 0 ? (
                    <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-center">
                        <Users className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Aucun technicien sélectionné</p>
                        <p className="text-xs text-gray-400">Utilisez la recherche ci-dessus pour ajouter des techniciens</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTechnicians.map((tech) => (
                        <div 
                          key={tech.uid}
                          className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                              {tech.displayName?.charAt(0) || tech.email?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{tech.displayName}</div>
                              <div className="text-xs text-gray-500">{tech.email}</div>
                              <div className="text-xs text-blue-600">
                                {tech.role === 'admin' ? 'Administrateur' : 'Utilisateur standard'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTechnician(tech.uid)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Superviseur */}
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-purple-500" />
                    Superviseur sélectionné
                  </h3>
                  
                  {!selectedSupervisor ? (
                    <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-center">
                        <Briefcase className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Aucun superviseur sélectionné</p>
                        <p className="text-xs text-gray-400">Utilisez la recherche ci-dessus pour ajouter un superviseur</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-medium">
                          {selectedSupervisor.displayName?.charAt(0) || selectedSupervisor.email?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{selectedSupervisor.displayName}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Superviseur
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{selectedSupervisor.email}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeSupervisor}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end py-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                {isEditMode ? "Mettre à jour l'intervention" : "Créer l'intervention"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInterventionUpdated;