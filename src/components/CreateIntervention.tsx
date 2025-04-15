// Nous déplacerons ces fonctions après la déclaration de formDataimport React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveIntervention, getNextInterventionNumber } from '../services/interventions';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import Header from './Header';
import GeneralInfo from './sections/GeneralInfo';
import PriorityLevel from './sections/PriorityLevel';
import PreviousIssues from './sections/PreviousIssues';
import IssueDescription from './sections/IssueDescription';
import Diagnosis from './sections/Diagnosis';
import RootCauseAnalysis from './sections/RootCauseAnalysis';
import ReplacedParts from './sections/ReplacedParts';
import TestValidation from './sections/TestValidation';
import FinalReport from './sections/FinalReport';
import SupervisorComment from './sections/SupervisoComment';

import { ArrowLeft, Save, Play, Pause, PlayCircle, StopCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const CreateIntervention = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime] = useState(new Date());
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
   // Statuts possibles pour l'intervention
   const INTERVENTION_STATUS = {
    DRAFT: 'draft',           // Brouillon initial
    IN_PROGRESS: 'in_progress', // Intervention en cours
    COMPLETED: 'completed',    // Intervention terminée techniquement
    SUBMITTED: 'submitted'     // Intervention soumise et validée
  };
  const [formData, setFormData] = useState<any>({
    // Initialisation avec des valeurs par défaut
    interventionNumber: 0, // Sera mis à jour par getNextInterventionNumber
    userId: user?.uid || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0], // Date du jour au format YYYY-MM-DD
    status: 'in_progress', // On commence directement en in_progress
    timeEntries: [],
    // Initialisation correcte de rootCauseAnalysis comme un tableau
    rootCauseAnalysis: [{
      problem: '',
      whys: [{ id: Date.now().toString(), value: '' }],
      rootCause: '',
      actions: '',
      results: ''
    }],
    // Autres structures
    rootCauses: [],
    replacedParts: [],
    testsPerformed: [],
    // Autres champs par défaut selon votre modèle de données
  });

  useEffect(() => {
    // Mettre à jour l'ID utilisateur dans formData si user change
    if (user?.uid && formData.userId !== user.uid) {
      setFormData((prev: any) => ({
        ...prev,
        userId: user.uid
      }));
    }
  }, [user, formData.userId]);

  // Effet pour obtenir le numéro d'intervention suivant
  useEffect(() => {
    const fetchNextInterventionNumber = async () => {
      try {
        const nextNumber = await getNextInterventionNumber();
        setFormData(prev => ({
          ...prev,
          interventionNumber: nextNumber
        }));
      } catch (error) {
        console.error("Erreur lors de la récupération du numéro d'intervention:", error);
        toast.error("Impossible de récupérer le numéro d'intervention");
      }
    };

    // Appeler la fonction seulement si le numéro d'intervention n'est pas déjà défini
    if (formData.interventionNumber === 0) {
      fetchNextInterventionNumber();
    }
  }, [formData.interventionNumber]);
  
  // Vérification des champs obligatoires
  const validateRequiredFields = () => {
    // Liste des champs obligatoires à vérifier
    const requiredFields = [
      { key: 'mainMachine', label: 'Machine principale' },
      { key: 'initialDescription', label: 'Description initiale' },
      { key: 'technicianName', label: 'Nom du technicien' }
    ];
    
    for (const field of requiredFields) {
      if (!formData[field.key] || formData[field.key].trim() === '') {
        return { isValid: false, missingField: field.label };
      }
    }
    
    return { isValid: true };
  };
  
  // Vérifier si le formulaire est valide pour l'enregistrement
  const canSubmitForm = () => {
    return validateRequiredFields().isValid && user?.uid;
  };
  
  // Vérifier le statut actuel de l'intervention
  const isInterventionDraft = formData.status === INTERVENTION_STATUS.DRAFT;
  const isInterventionInProgress = formData.status === INTERVENTION_STATUS.IN_PROGRESS;
  const isInterventionCompleted = formData.status === INTERVENTION_STATUS.COMPLETED;
  const isInterventionSubmitted = formData.status === INTERVENTION_STATUS.SUBMITTED;
  
  // Vérifier si l'intervention peut être modifiée
  const isInterventionFinished = isInterventionCompleted || isInterventionSubmitted;

  // 🔴 Changement important ici : on définit isFormEditable en fonction de l'état de l'intervention
  const isFormEditable = (isRunning && !isPaused) && !isInterventionFinished;

  useEffect(() => {
    const timer = setInterval(() => {
      if (isRunning && !isPaused && startTime) {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isPaused, startTime]);

  const handleStart = async () => {
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour démarrer une intervention');
      return;
    }

    const now = new Date();
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(now);
    
    const newFormData = {
      ...formData,
      timeEntries: [
        ...(formData.timeEntries || []),
        { action: 'start', timestamp: now.toISOString() }
      ],
      status: INTERVENTION_STATUS.IN_PROGRESS
    };
    
    setFormData(newFormData);
    
    try {
      await saveIntervention(user.uid, newFormData);
      toast.success('Intervention démarrée');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handlePause = async () => {
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour mettre en pause une intervention');
      return;
    }

    const now = new Date();
    setIsPaused(true);
    
    const newFormData = {
      ...formData,
      timeEntries: [
        ...(formData.timeEntries || []),
        { action: 'pause', timestamp: now.toISOString() }
      ]
    };
    
    setFormData(newFormData);
    
    try {
      await saveIntervention(user.uid, newFormData);
      toast.success('Intervention mise en pause');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleResume = async () => {
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour reprendre une intervention');
      return;
    }

    const now = new Date();
    setIsPaused(false);
    
    const newFormData = {
      ...formData,
      timeEntries: [
        ...(formData.timeEntries || []),
        { action: 'resume', timestamp: now.toISOString() }
      ]
    };
    
    setFormData(newFormData);
    
    try {
      await saveIntervention(user.uid, newFormData);
      toast.success('Intervention reprise');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleStop = async () => {
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour terminer une intervention');
      return;
    }

    // Demander confirmation à l'utilisateur avant de terminer définitivement l'intervention
    if (!window.confirm("Êtes-vous sûr de vouloir terminer cette intervention ? Une fois terminée, elle ne pourra plus être modifiée.")) {
      return;
    }

    const now = new Date();
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setElapsedTime('00:00:00');
    
    const newFormData = {
      ...formData,
      timeEntries: [
        ...(formData.timeEntries || []),
        { action: 'stop', timestamp: now.toISOString() }
      ],
      status: INTERVENTION_STATUS.COMPLETED,
      completedAt: now.toISOString()
    };
    
    setFormData(newFormData);
    
    try {
      await saveIntervention(user.uid, newFormData);
      toast.success('Intervention terminée avec succès. Elle est maintenant en lecture seule.');
      // Rediriger vers la liste des interventions après quelques secondes
      setTimeout(() => {
        navigate('/interventions');
      }, 2000);
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Fonction pour soumettre l'intervention après complétion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.uid) {
        toast.error('Vous devez être connecté pour créer une intervention');
        return;
      }

      // Ensure all required fields are filled
      const validation = validateRequiredFields();
      if (!validation.isValid) {
        toast.error(`Veuillez remplir le champ obligatoire: ${validation.missingField}`);
        return;
      }

      // Si l'intervention est déjà terminée, la marquer comme soumise
      const statusToSet = isInterventionCompleted ? 
                         INTERVENTION_STATUS.SUBMITTED : 
                         isInterventionInProgress ? 
                         INTERVENTION_STATUS.IN_PROGRESS : 
                         INTERVENTION_STATUS.DRAFT;

      // Add creation metadata
      const interventionToSave = {
        ...formData,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
        status: statusToSet,
        submittedAt: isInterventionCompleted ? new Date().toISOString() : formData.submittedAt
      };

      await saveIntervention(user.uid, interventionToSave);
      
      if (isInterventionCompleted) {
        toast.success('Intervention soumise avec succès');
        // Mettre à jour le statut local
        setFormData({
          ...interventionToSave,
          status: INTERVENTION_STATUS.SUBMITTED
        });
      } else {
        toast.success('Intervention enregistrée avec succès');
      }
      
      // Ne rediriger que si l'intervention est soumise
      if (isInterventionCompleted) {
        navigate('/interventions');
      }
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

 

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
            
            {/* Affichage du statut actuel de l'intervention */}
            <div className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-sm font-medium mr-4 ${
                isInterventionDraft ? 'bg-gray-100 text-gray-800' :
                isInterventionInProgress ? 'bg-blue-100 text-blue-800' :
                isInterventionCompleted ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {isInterventionDraft ? 'Brouillon' :
                 isInterventionInProgress ? 'En cours' :
                 isInterventionCompleted ? 'Terminée' :
                 'Soumise'}
              </div>
              
              {!isInterventionFinished ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmitForm() || isInterventionFinished}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {isInterventionCompleted ? 'Soumettre' : 'Enregistrer'}
                </button>
              ) : (
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {isInterventionSubmitted ? 'Soumise' : 'Terminée'}
                </div>
              )}
            </div>
          </div>

          <Header
            currentTime={currentTime}
            isRunning={isRunning}
            isPaused={isPaused}
            elapsedTime={elapsedTime}
          />

          <div className="flex flex-wrap gap-2 mb-6 mt-6">
            {!isInterventionFinished ? (
              <>
                <button
                  onClick={handleStart}
                  disabled={isRunning || isInterventionFinished}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 min-w-[120px]"
                >
                  <Play className="w-4 h-4" /> Démarrer
                </button>
                <button
                  onClick={handlePause}
                  disabled={!isRunning || isPaused || isInterventionFinished}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 min-w-[120px]"
                >
                  <Pause className="w-4 h-4" /> Pause
                </button>
                <button
                  onClick={handleResume}
                  disabled={!isPaused || isInterventionFinished}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 min-w-[120px]"
                >
                  <PlayCircle className="w-4 h-4" /> Reprendre
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isRunning || isInterventionFinished}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 min-w-[120px]"
                >
                  <StopCircle className="w-4 h-4" /> Terminer
                </button>
              </>
            ) : (
              <div className="w-full bg-green-100 text-green-800 p-3 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {isInterventionSubmitted ? 
                  "Cette intervention a été soumise et validée" : 
                  "Cette intervention est terminée et ne peut plus être modifiée"}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <GeneralInfo
              formData={formData}
              relatedHistory={[]}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />
            
            <PriorityLevel
              formData={formData}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />
            
            <PreviousIssues
              formData={formData}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />
            
            <IssueDescription
              formData={formData}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />
            
            <Diagnosis
              formData={formData}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />
            
            <RootCauseAnalysis
              formData={formData}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />
            
            <ReplacedParts
              formData={formData}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />
            
            <TestValidation
              formData={formData}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />
            
            <FinalReport
              formData={formData}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />

            <SupervisorComment
              formData={formData}
              onFormChange={setFormData}
              isEditable={isFormEditable}
            />

            <div className="flex justify-end pt-6">
              {!isInterventionCompleted ? (
                <button
                  type="submit"
                  disabled={!canSubmitForm() }
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {isInterventionCompleted ? 'Soumettre l\'intervention' : 'Créer l\'intervention'}
                </button>
              ) : (
                <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5 inline-block mr-2" />
                  {isInterventionSubmitted ? 'Intervention soumise' : 'Intervention terminée'}
                </div>
              )}
              {!canSubmitForm() && !isInterventionFinished && (
                <span className="ml-2 text-sm text-red-500 self-center">
                  Veuillez remplir tous les champs obligatoires
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateIntervention;