import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIntervention, saveIntervention } from '../services/interventions';
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


import { ArrowLeft, Save, Play, Pause, PlayCircle, StopCircle, Send } from 'lucide-react';
import SupervisorComment from './sections/SupervisoComment';

// Types
interface TimeEntry {
  action: 'start' | 'pause' | 'resume' | 'stop';
  timestamp: string;
}

interface RootCauseItem {
  problem: string;
  whys: Array<{ id: string, value: string }>;
  rootCause: string;
  actions: string;
  results: string;
}

interface ReplacedPart {
  name: string;
  interventionType: string;
  quantity: number;
  lastPurchasePrice: number;
  supplier: string;
}

interface FormDataType {
  id?: string;
  createdBy: string; // Nouveau champ
  userId: string;
  interventionNumber: number;
  date: string;
  emitter: string;
  emitterRole: string;
  mainMachine: string;
  secondaryMachine: string;
  otherEquipment: string;
  priority: 'yellow' | 'orange' | 'red';
  previouslyEncountered: boolean;
  pcaInformed: boolean;
  pcaOpinion: string;
  initialDescription: string;
  technicalDescription: string;
  technicianName: string;
  electricalIssues: string[];
  mechanicalIssues: string[];
  pneumaticHydraulicIssues: string[];
  electronicIssues: string[];
  softwareIssues: string[];
  humanIssues: string[];
  environmentalIssues: string[];
  consumableIssues: string[];
  maintenanceIssues: string[];
  otherIssues: string;
  rootCauseAnalysis: RootCauseItem[];
  replacedParts: ReplacedPart[];
  verificationTest: boolean;
  verificationObservations: string;
  finalConclusion: string;
  technicianSignatures: { name: string; date: string; uid: string }[];
  supervisorSignature: { name: string; validated: boolean; uid: string };
  timeEntries: TimeEntry[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'in_progress' | 'completed' | 'submitted';
  completedAt?: string;
}

const EditIntervention = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentTime] = useState(new Date());
  const [formData, setFormData] = useState<FormDataType | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [originalData, setOriginalData] = useState<string | null>(null);
  const [timeStats, setTimeStats] = useState<any>(null);
  const [isInterventionCompleted, setIsInterventionCompleted] = useState(false);

  useEffect(() => {
    const fetchIntervention = async () => {
      try {
        // Vérifiez si l'ID et l'utilisateur sont disponibles
        if (!id) {
          toast.error('ID d\'intervention manquant');
          navigate('/interventions');
          return;
        }
        
        if (!user?.uid) {
          // Au lieu de rediriger immédiatement, attendez le chargement de l'utilisateur
          console.log('Utilisateur non chargé, attente...');
          return; // Sortir de la fonction sans erreur
        }
        
        const data = await getIntervention(id, user.uid);
        
        // Calculer les statistiques de temps
        if (data.timeEntries?.length > 0) {
          const stats = calculateTimeStats(data.timeEntries);
          setTimeStats(stats);
        }
        
        // S'assurer que rootCauseAnalysis est un tableau
        if (!Array.isArray(data.rootCauseAnalysis)) {
          data.rootCauseAnalysis = [{
            problem: '',
            whys: [{ id: Date.now().toString(), value: '' }],
            rootCause: '',
            actions: '',
            results: ''
          }];
        }
        
        // S'assurer que replacedParts est un tableau
        if (!Array.isArray(data.replacedParts)) {
          data.replacedParts = [{
            name: '',
            interventionType: '',
            quantity: 0,
            lastPurchasePrice: 0,
            supplier: ''
          }];
        }
        
        // S'assurer que timeEntries est un tableau
        if (!Array.isArray(data.timeEntries)) {
          data.timeEntries = [];
        }
        
        // Store original data for comparison
        setOriginalData(JSON.stringify(data));
        
        // Initialize form data
        setFormData({
          ...data,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
          createdBy: user.uid // Nouvelle propriété
        });
  
        // Set initial timer state based on timeEntries
        if (data.timeEntries?.length > 0) {
          const lastEntry = data.timeEntries[data.timeEntries.length - 1];
          if (lastEntry.action === 'start' || lastEntry.action === 'resume') {
            setIsRunning(true);
            setIsPaused(false);
            setStartTime(new Date(lastEntry.timestamp));
          } else if (lastEntry.action === 'pause') {
            setIsRunning(true);
            setIsPaused(true);
          }
        }
      } catch (error: any) {
        console.error('Error fetching intervention:', error);
        toast.error(error.message || 'Erreur lors du chargement de l\'intervention');
        navigate('/interventions');
      } finally {
        setLoading(false);
      }
    };
  
    // Exécuter fetchIntervention uniquement si user et id sont disponibles
    if (user && id) {
      fetchIntervention();
    }
  }, [id, user, navigate]);

  // Fonction pour calculer les statistiques de temps
  const calculateTimeStats = (timeEntries: TimeEntry[]) => {
    let effectiveTime = 0;
    let totalTime = 0;
    let pauseCount = 0;
    let pauseDurations: number[] = [];
    let lastStartTime: Date | null = null;
    let lastPauseTime: Date | null = null;

    timeEntries.forEach((entry, index) => {
      const currentTime = new Date(entry.timestamp);
      
      switch (entry.action) {
        case 'start':
          lastStartTime = currentTime;
          break;
          
        case 'pause':
          if (lastStartTime) {
            effectiveTime += currentTime.getTime() - lastStartTime.getTime();
            lastStartTime = null;
          }
          lastPauseTime = currentTime;
          pauseCount++;
          break;
          
        case 'resume':
          if (lastPauseTime) {
            pauseDurations.push(currentTime.getTime() - lastPauseTime.getTime());
            lastPauseTime = null;
          }
          lastStartTime = currentTime;
          break;
          
        case 'stop':
          if (lastStartTime) {
            effectiveTime += currentTime.getTime() - lastStartTime.getTime();
            lastStartTime = null;
          }
          
          // Calculer le temps total (du premier start au dernier stop)
          if (index === timeEntries.length - 1 && timeEntries[0].action === 'start') {
            totalTime = currentTime.getTime() - new Date(timeEntries[0].timestamp).getTime();
          }
          break;
      }
    });

    // Si l'intervention est toujours en cours, ajouter le temps jusqu'à maintenant
    if (lastStartTime) {
      const now = new Date();
      effectiveTime += now.getTime() - lastStartTime.getTime();
    }

    // Calculer la durée moyenne des pauses
    const averagePauseDuration = pauseDurations.length 
      ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length 
      : 0;

    return {
      effectiveTime,
      totalTime,
      pauseCount,
      pauseDurations,
      averagePauseDuration
    };
  };

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
    if (!user?.uid || !formData) {
      toast.error('Vous devez être connecté pour démarrer une intervention');
      return;
    }

    const now = new Date();
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(now);
    
    const newTimeEntries = [
      ...(formData.timeEntries || []),
      { action: 'start', timestamp: now.toISOString() }
    ];
    
    const updatedFormData = {
      ...formData,
      timeEntries: newTimeEntries,
      status: 'in_progress',
      updatedAt: now.toISOString()
    };
    
    setFormData(updatedFormData);
    
    try {
      await saveIntervention(updatedFormData.userId, updatedFormData);
      toast.success('Intervention démarrée');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handlePause = async () => {
    if (!user?.uid || !formData) {
      toast.error('Vous devez être connecté pour mettre en pause une intervention');
      return;
    }

    const now = new Date();
    setIsPaused(true);
    
    const newTimeEntries = [
      ...(formData.timeEntries || []),
      { action: 'pause', timestamp: now.toISOString() }
    ];
    
    const updatedFormData = {
      ...formData,
      timeEntries: newTimeEntries,
      updatedAt: now.toISOString()
    };
    
    setFormData(updatedFormData);
    
    try {
      await saveIntervention(user.uid, updatedFormData);
      toast.success('Intervention mise en pause');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleResume = async () => {
    if (!user?.uid || !formData) {
      toast.error('Vous devez être connecté pour reprendre une intervention');
      return;
    }

    const now = new Date();
    setIsPaused(false);
    
    const newTimeEntries = [
      ...(formData.timeEntries || []),
      { action: 'resume', timestamp: now.toISOString() }
    ];
    
    const updatedFormData = {
      ...formData,
      timeEntries: newTimeEntries,
      updatedAt: now.toISOString()
    };
    
    setFormData(updatedFormData);
    
    try {
      await saveIntervention(updatedFormData.userId, updatedFormData);
      toast.success('Intervention reprise');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleStop = async () => {
    if (!user?.uid || !formData) {
      toast.error('Vous devez être connecté pour terminer une intervention');
      return;
    }

    const now = new Date();
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    setElapsedTime('00:00:00');
    
    const newTimeEntries = [
      ...(formData.timeEntries || []),
      { action: 'stop', timestamp: now.toISOString() }
    ];
    
    const updatedFormData = {
      ...formData,
      timeEntries: newTimeEntries,
      status: 'completed',
      completedAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    setFormData(updatedFormData);
    
    try {
      await saveIntervention(updatedFormData.userId, updatedFormData);
      toast.success('Intervention terminée');
      
      // Mettre à jour les statistiques de temps
      const stats = calculateTimeStats(newTimeEntries);
      setTimeStats(stats);
      
      // Définir l'intervention comme terminée
      setIsInterventionCompleted(true);
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.uid || !formData) {
        toast.error('Vous devez être connecté pour modifier une intervention');
        return;
      }

      // Check if data has been modified
      if (JSON.stringify(formData) === originalData) {
        toast.error('Aucune modification n\'a été effectuée');
        return;
      }

      // Check if intervention is submitted
      if (formData.status === 'submitted') {
        toast.error('Cette intervention a été soumise et ne peut plus être modifiée');
        return;
      }

      // Check if user has permission
      const isCreator = formData.userId === user.uid || formData.createdBy === user.uid;
      const isTechnician = formData.technicianSignatures?.some(sig => 
        sig.uid === user.uid || sig.name === user.uid
      );
      const isSupervisor = formData.supervisorSignature?.uid === user.uid;

      // Logs de débogage
      console.log("Vérification des permissions :", {
        userId: user.uid,
        formDataUserId: formData.userId,
        formDataCreatedBy: formData.createdBy,
        isCreator,
        technicianSignatures: formData.technicianSignatures,
        isTechnician,
        supervisorSignature: formData.supervisorSignature,
        isSupervisor
      });

      if (!isCreator && !isTechnician && !isSupervisor) {
        toast.error('Vous n\'avez pas les droits pour modifier cette intervention');
        return;
      }

      const updatedFormData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      await saveIntervention(updatedFormData.userId, updatedFormData);
      toast.success('Intervention enregistrée');
      navigate('/interventions');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.uid || !formData) {
        toast.error('Vous devez être connecté pour soumettre une intervention');
        return;
      }

      // Vérifier les permissions
      const isCreator = formData.userId === user.uid || formData.createdBy === user.uid;
      const isTechnician = formData.technicianSignatures?.some(sig => 
        sig.uid === user.uid || sig.name === user.uid
      );
      const isSupervisor = formData.supervisorSignature?.uid === user.uid;

      if (!isCreator && !isTechnician && !isSupervisor) {
        toast.error('Vous n\'avez pas les droits pour soumettre cette intervention');
        return;
      }

      // Préparer les données avec le statut "submitted"
      const updatedFormData = {
        ...formData,
        status: 'submitted',
        updatedAt: new Date().toISOString()
      };

      // Enregistrer l'intervention avec le statut "submitted"
      await saveIntervention(updatedFormData.userId, updatedFormData);
      toast.success('Intervention soumise avec succès');
      navigate('/interventions');
    } catch (error: any) {
      console.error('Error submitting intervention:', error);
      toast.error(error.message || 'Erreur lors de la soumission');
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isFormEditable = isRunning && !isPaused;
  
  // Fonction pour vérifier si tous les champs obligatoires sont remplis
  const areRequiredFieldsFilled = () => {
    if (!formData) return false;
    
    // Vérifier si le PCA a été informé
    const isPcaInformed = formData.pcaInformed === true;
    
    // Vérifier si l'avis du PCA est rempli (si le PCA est informé)
    const isPcaOpinionFilled = !formData.pcaInformed || (formData.pcaInformed && !!formData.pcaOpinion);
    
    // Vérifier si la description initiale est remplie
    const isInitialDescriptionFilled = !!formData.initialDescription;
    
    // Vérifier si la description technique est remplie
    const isTechnicalDescriptionFilled = !!formData.technicalDescription;
    
    // Vérifier si au moins un type de problème est sélectionné
    const hasSelectedIssueType = 
      (formData.electricalIssues && formData.electricalIssues.length > 0) ||
      (formData.mechanicalIssues && formData.mechanicalIssues.length > 0) ||
      (formData.pneumaticHydraulicIssues && formData.pneumaticHydraulicIssues.length > 0) ||
      (formData.electronicIssues && formData.electronicIssues.length > 0) ||
      (formData.softwareIssues && formData.softwareIssues.length > 0) ||
      (formData.humanIssues && formData.humanIssues.length > 0) ||
      (formData.environmentalIssues && formData.environmentalIssues.length > 0) ||
      (formData.consumableIssues && formData.consumableIssues.length > 0) ||
      (formData.maintenanceIssues && formData.maintenanceIssues.length > 0) ||
      !!formData.otherIssues;
    
    // Vérifier si l'analyse des causes racines est remplie
    const isRootCauseAnalysisFilled = formData.rootCauseAnalysis && 
      formData.rootCauseAnalysis.length > 0 && 
      formData.rootCauseAnalysis.every(analysis => 
        analysis.problem && 
        analysis.rootCause && 
        analysis.actions
      );
    
    // Vérifier si la conclusion finale est remplie
    const isFinalConclusionFilled = !!formData.finalConclusion;
    
    // Retourner true seulement si toutes les conditions sont remplies
    return isPcaInformed && isPcaOpinionFilled && isInitialDescriptionFilled && 
           isTechnicalDescriptionFilled && hasSelectedIssueType && 
           isRootCauseAnalysisFilled && isFinalConclusionFilled;
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
            {isInterventionCompleted && (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Save className="w-5 h-5" />
                Enregistrer
              </button>
            )}
          </div>

          <Header
            currentTime={currentTime}
            isRunning={isRunning}
            isPaused={isPaused}
            elapsedTime={elapsedTime}
            timeStats={timeStats}
          />

          <div className="flex flex-wrap gap-2 mb-6 mt-6">
            {formData.status === 'draft' && (
              <button
                onClick={handleStart}
                disabled={isRunning}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 min-w-[120px]"
              >
                <Play className="w-4 h-4" /> Démarrer
              </button>
            )}
            {formData.status === 'in_progress' && (
              <button
                onClick={handlePause}
                disabled={!isRunning || isPaused}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 min-w-[120px]"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            )}
            {formData.status === 'in_progress' && (
              <button
                onClick={handleResume}
                disabled={!isPaused}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 min-w-[120px]"
              >
                <PlayCircle className="w-4 h-4" /> Reprendre
              </button>
            )}
            {formData.status === 'in_progress' && (
              <button
                onClick={handleStop}
                disabled={!isRunning || !areRequiredFieldsFilled()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 min-w-[120px]"
                title={!areRequiredFieldsFilled() ? "Veuillez compléter tous les champs obligatoires avant de terminer l'intervention" : "Terminer l'intervention"}
              >
                <StopCircle className="w-4 h-4" /> Terminer
              </button>
            )}
            {formData.status === 'completed' && (
              <button
                onClick={handleSubmitFinal}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 min-w-[120px]"
              >
                <Send className="w-4 h-4" /> Soumettre
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <GeneralInfo
              formData={formData}
              relatedHistory={[]}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
            
            <PriorityLevel
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
            
            <PreviousIssues
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
            
            <IssueDescription
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
            
            <Diagnosis
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
            
            <RootCauseAnalysis
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
            
            <ReplacedParts
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
            
            <TestValidation
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
            
            <FinalReport
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
            
            <SupervisorComment
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
                      
            <div className="flex justify-end pt-6">
              {formData.status !== 'completed' ? (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={formData.status === 'submitted'}
                  title={formData.status === 'submitted' ? "L'intervention a été soumise et ne peut plus être modifiée" : "Enregistrer les modifications"}
                >
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditIntervention;