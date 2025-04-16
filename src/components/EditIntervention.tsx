import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { getIntervention, saveIntervention } from '../services/interventions';
import GeneralInfo from './sections/GeneralInfo';
import PriorityLevel from './sections/PriorityLevel';
import PreviousIssues from './sections/PreviousIssues';
import IssueDescription from './sections/IssueDescription';
import Diagnosis from './sections/Diagnosis';
import RootCauseAnalysis from './sections/RootCauseAnalysis';
import ReplacedParts from './sections/ReplacedParts';
import TestValidation from './sections/TestValidation';
import FinalReport from './sections/FinalReport';
import SupervisoComment from './sections/SupervisoComment';
import { ArrowLeft, Save, Play, Pause, PlayCircle, StopCircle, Send } from 'lucide-react';

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
  interventionNumber: string; // Changé en string
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

const EditIntervention: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentTime] = useState(new Date());
  const [formData, setFormData] = useState<FormDataType | null>(null);
  const [originalData, setOriginalData] = useState<string | null>(null);
  const [isInterventionCompleted, setIsInterventionCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
        console.log("Intervention chargée:", data);
        
        // Simplifier le traitement des données pour éviter les erreurs
        setFormData({
          ...data,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        });
        
        setOriginalData(JSON.stringify(data));
        
        // Initialiser l'état de l'intervention
        if (data.status === 'in_progress') {
          setIsRunning(true);
          setIsPaused(false);
        } else if (data.status === 'completed') {
          setIsRunning(false);
          setIsPaused(false);
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

  const handleStart = async () => {
    if (!user?.uid || !formData) {
      toast.error('Vous devez être connecté pour démarrer une intervention');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    
    const updatedFormData = {
      ...formData,
      status: 'in_progress',
      updatedAt: new Date().toISOString()
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

    setIsPaused(true);
    
    const updatedFormData = {
      ...formData,
      updatedAt: new Date().toISOString()
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

    setIsPaused(false);
    
    const updatedFormData = {
      ...formData,
      updatedAt: new Date().toISOString()
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

  // Fonction pour vérifier si tous les champs obligatoires sont remplis
  const areRequiredFieldsFilled = (): boolean => {
    if (!formData) {
      console.log("formData est null ou undefined");
      return false;
    }
    
    // Vérification simplifiée des champs obligatoires de base
    const requiredFields = [
      { field: 'mainMachine', name: 'Machine principale' },
      { field: 'initialDescription', name: 'Description initiale' },
      { field: 'technicalDescription', name: 'Description technique' },
      { field: 'finalConclusion', name: 'Conclusion finale' }
    ];
    
    for (const { field, name } of requiredFields) {
      if (!formData[field]) {
        console.log(`Champ obligatoire manquant: ${name}`);
        return false;
      }
    }
    
    // Vérifier qu'au moins un type de problème est sélectionné
    const hasIssueType = 
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
    
    if (!hasIssueType) {
      console.log("Aucun type de problème sélectionné");
      return false;
    }
    
    console.log("Tous les champs obligatoires sont remplis");
    return true;
  };

  const handleStop = async () => {
    if (!user?.uid || !formData) {
      toast.error('Erreur: Utilisateur ou données manquantes');
      return;
    }

    // Mise à jour de l'état
    setIsRunning(false);
    setIsPaused(false);
    
    const updatedFormData = {
      ...formData,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Convertir interventionNumber en string si c'est un nombre
      interventionNumber: formData.interventionNumber ? String(formData.interventionNumber) : undefined
    };
    
    // Mise à jour des données du formulaire
    setFormData(updatedFormData);
    
    try {
      await saveIntervention(updatedFormData.userId, updatedFormData);
      toast.success('Intervention terminée avec succès');
      
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

          <div className="flex flex-wrap gap-2 mb-6 mt-6">
            {formData.status !== 'submitted' && (
              <>
                <button
                  onClick={handleStart}
                  disabled={isRunning || formData.status === 'completed'}
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
              </>
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
            
            <SupervisoComment
              formData={formData}
              onFormChange={setFormData}
              isEditable={formData.status !== 'submitted' && isFormEditable}
            />
                      
           
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditIntervention;