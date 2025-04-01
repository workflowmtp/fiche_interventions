import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveIntervention, getNextInterventionNumber, calculateTimeStats } from '../services/interventions';
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

import { ArrowLeft, Save, Play, Pause, PlayCircle, StopCircle } from 'lucide-react';

const CreateIntervention = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentTime] = useState(new Date());
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [formInitialized, setFormInitialized] = useState(false);
  
  // Initialiser formData avec des valeurs par défaut
  const [formData, setFormData] = useState({
    interventionNumber: 0,
    date: new Date().toISOString().split('T')[0],
    emitter: '',
    emitterRole: '',
    userId: '',
    userName: '',
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
    supervisorSignature: { name: '', validated: false },
    status: 'in_progress',
    timeEntries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Initialisation du formulaire avec les infos de l'utilisateur quand elles sont disponibles
  useEffect(() => {
    const initForm = async () => {
      try {
        // Attendez que l'utilisateur soit chargé
        if (user?.uid && !formInitialized) {
          const nextNumber = await getNextInterventionNumber();
          
          setFormData(prev => ({
            ...prev,
            interventionNumber: nextNumber,
            userId: user.uid,
            userName: user.displayName || '',
            emitter: user.displayName || ''
          }));
          
          setFormInitialized(true);
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation du formulaire:", error);
      }
    };

    initForm();
  }, [user, formInitialized]);

  // Calculer les statistiques de temps
  const timeStats = useMemo(() => {
    if (!formData.timeEntries?.length) return null;
    return calculateTimeStats(formData.timeEntries);
  }, [formData.timeEntries]);

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
    
    const newTimeEntries = [
      ...formData.timeEntries,
      { action: 'start', timestamp: now.toISOString() }
    ];
    
    const newFormData = {
      ...formData,
      status: 'in_progress',
      timeEntries: newTimeEntries,
      updatedAt: now.toISOString()
    };
    
    setFormData(newFormData);
    
    try {
      const interventionId = await saveIntervention(user.uid, newFormData);
      toast.success('Intervention démarrée');
      
      // Mettre à jour l'ID
      setFormData(prev => ({
        ...prev,
        id: interventionId
      }));
    } catch (error) {
      console.error('Error starting intervention:', error);
      toast.error(error.message || 'Erreur lors du démarrage');
    }
  };

  const handlePause = async () => {
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour mettre en pause une intervention');
      return;
    }

    if (!formData.id) {
      toast.error('Veuillez d\'abord démarrer l\'intervention');
      return;
    }

    const now = new Date();
    setIsPaused(true);
    
    const newTimeEntries = [
      ...formData.timeEntries,
      { action: 'pause', timestamp: now.toISOString() }
    ];
    
    const newFormData = {
      ...formData,
      timeEntries: newTimeEntries,
      updatedAt: now.toISOString()
    };
    
    setFormData(newFormData);
    
    try {
      await saveIntervention(user.uid, newFormData);
      toast.success('Intervention mise en pause');
    } catch (error) {
      console.error('Error pausing intervention:', error);
      toast.error(error.message || 'Erreur lors de la mise en pause');
    }
  };

  const handleResume = async () => {
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour reprendre une intervention');
      return;
    }

    if (!formData.id) {
      toast.error('Veuillez d\'abord démarrer l\'intervention');
      return;
    }

    const now = new Date();
    setIsPaused(false);
    
    const newTimeEntries = [
      ...formData.timeEntries,
      { action: 'resume', timestamp: now.toISOString() }
    ];
    
    const newFormData = {
      ...formData,
      timeEntries: newTimeEntries,
      updatedAt: now.toISOString()
    };
    
    setFormData(newFormData);
    
    try {
      await saveIntervention(user.uid, newFormData);
      toast.success('Intervention reprise');
    } catch (error) {
      console.error('Error resuming intervention:', error);
      toast.error(error.message || 'Erreur lors de la reprise');
    }
  };

  const handleStop = async () => {
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour terminer une intervention');
      return;
    }

    if (!formData.id) {
      toast.error('Veuillez d\'abord démarrer l\'intervention');
      return;
    }

    const now = new Date();
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setElapsedTime('00:00:00');
    
    const newTimeEntries = [
      ...formData.timeEntries,
      { action: 'stop', timestamp: now.toISOString() }
    ];
    
    const newFormData = {
      ...formData,
      status: 'completed',
      timeEntries: newTimeEntries,
      completedAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    setFormData(newFormData);
    
    try {
      await saveIntervention(user.uid, newFormData);
      toast.success('Intervention terminée');
      navigate('/interventions');
    } catch (error) {
      console.error('Error stopping intervention:', error);
      toast.error(error.message || 'Erreur lors de la terminaison');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!user?.uid) {
        toast.error('Vous devez être connecté pour créer une intervention');
        return;
      }

      // Vérifier les champs obligatoires
      if (!formData.mainMachine || !formData.initialDescription) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const now = new Date().toISOString();
      const newFormData = {
        ...formData,
        userId: user.uid,
        userName: user.displayName || '',
        updatedAt: now,
      };
      
      await saveIntervention(user.uid, newFormData);
      toast.success('Intervention enregistrée avec succès');
      navigate('/interventions');
    } catch (error) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Définir si les sections du formulaire sont éditables
  const isFormEditable = isRunning && !isPaused;

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
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Création...' : 'Enregistrer'}
            </button>
          </div>

          <Header
            currentTime={currentTime}
            isRunning={isRunning}
            isPaused={isPaused}
            elapsedTime={elapsedTime}
            timeStats={timeStats}
          />

          <div className="flex flex-wrap gap-2 mb-6 mt-6">
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 min-w-[120px]"
            >
              <Play className="w-4 h-4" /> Démarrer
            </button>
            <button
              onClick={handlePause}
              disabled={!isRunning || isPaused}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 min-w-[120px]"
            >
              <Pause className="w-4 h-4" /> Pause
            </button>
            <button
              onClick={handleResume}
              disabled={!isPaused}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 min-w-[120px]"
            >
              <PlayCircle className="w-4 h-4" /> Reprendre
            </button>
            <button
              onClick={handleStop}
              disabled={!isRunning}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 min-w-[120px]"
            >
              <StopCircle className="w-4 h-4" /> Terminer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <GeneralInfo
              formData={formData}
              relatedHistory={[]}
              onFormChange={setFormData}
              isEditable={true}
            />
            
            <PriorityLevel
              formData={formData}
              onFormChange={setFormData}
              isEditable={true}
            />
            
            <PreviousIssues
              formData={formData}
              onFormChange={setFormData}
              isEditable={true}
            />
            
            <IssueDescription
              formData={formData}
              onFormChange={setFormData}
              isEditable={true}
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
              isEditable={user?.role === 'supervisor'}
            />
            
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Création en cours...' : 'Créer l\'intervention'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateIntervention;