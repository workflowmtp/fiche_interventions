import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, PlayCircle, StopCircle, CheckCircle, ArrowLeft } from 'lucide-react';
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
import { saveIntervention, getNextInterventionNumber, calculateTimeStats } from '../services/interventions';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime] = useState(new Date());
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [formData, setFormData] = useState({
    interventionNumber: 0,
    date: new Date().toISOString().split('T')[0],
    emitter: user?.displayName || '',
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
    supervisorSignature: { name: '', validated: false },
    timeEntries: []
  });

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

  useEffect(() => {
    const initializeForm = async () => {
      try {
        if (!formData.interventionNumber) {
          const nextNumber = await getNextInterventionNumber();
          setFormData(prev => ({ ...prev, interventionNumber: nextNumber }));
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        toast.error('Erreur lors de l\'initialisation du formulaire');
      }
    };

    initializeForm();
  }, []);

  const timeStats = useMemo(() => {
    if (!formData.timeEntries?.length) return null;
    return calculateTimeStats(formData.timeEntries);
  }, [formData.timeEntries]);

  const isFormEditable = isRunning && !isPaused;

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
    
    setFormData(prev => ({ ...prev, timeEntries: newTimeEntries }));
    
    try {
      await saveIntervention(user.uid, { ...formData, timeEntries: newTimeEntries });
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
    
    // Vérifier que formData.timeEntries existe, sinon initialiser comme tableau vide
    const currentTimeEntries = formData.timeEntries || [];
    
    const newTimeEntries = [
      ...currentTimeEntries,
      { action: 'pause', timestamp: now.toISOString() }
    ];
    
    setFormData(prev => ({ ...prev, timeEntries: newTimeEntries }));
    
    try {
      // S'assurer qu'un ID valide existe pour l'intervention
      // Si c'est une nouvelle intervention qui n'a pas encore été sauvegardée,
      // il faut d'abord la sauvegarder avant de mettre à jour les timeEntries
      const interventionData = { ...formData, timeEntries: newTimeEntries };
      await saveIntervention(user.uid, interventionData);
      toast.success('Intervention mise en pause');
    } catch (error) {
      console.error('Error saving intervention:', error);
      toast.error('Erreur lors de la sauvegarde');
      // Revenir à l'état précédent en cas d'erreur
      setIsPaused(false);
    }
  };

  const handleResume = async () => {
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour reprendre une intervention');
      return;
    }

    const now = new Date();
    setIsPaused(false);
    
    const newTimeEntries = [
      ...formData.timeEntries,
      { action: 'resume', timestamp: now.toISOString() }
    ];
    
    setFormData(prev => ({ ...prev, timeEntries: newTimeEntries }));
    
    try {
      await saveIntervention(user.uid, { ...formData, timeEntries: newTimeEntries });
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

    const now = new Date();
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setElapsedTime('00:00:00');
    
    const newTimeEntries = [
      ...formData.timeEntries,
      { action: 'stop', timestamp: now.toISOString() }
    ];
    
    setFormData(prev => ({ ...prev, timeEntries: newTimeEntries }));
    
    try {
      await saveIntervention(user.uid, { ...formData, timeEntries: newTimeEntries });
      toast.success('Intervention terminée');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      toast.error('Vous devez être connecté pour soumettre une intervention');
      return;
    }

    try {
      await saveIntervention(user.uid, {
        ...formData,
        userId: user.uid,
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      toast.success('Intervention terminée avec succès');
      
      const nextNumber = await getNextInterventionNumber();
      setFormData({
        interventionNumber: nextNumber,
        date: new Date().toISOString().split('T')[0],
        emitter: user?.displayName || '',
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
        supervisorSignature: { name: '', validated: false },
        timeEntries: []
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <Header
              currentTime={currentTime}
              isRunning={isRunning}
              isPaused={isPaused}
              elapsedTime={elapsedTime}
              timeStats={timeStats}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
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

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <CheckCircle className="w-6 h-6" />
                Soumettre l'intervention
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;