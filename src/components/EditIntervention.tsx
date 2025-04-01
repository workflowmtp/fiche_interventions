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

import { ArrowLeft, Save, Play, Pause, PlayCircle, StopCircle } from 'lucide-react';
import SupervisorComment from './sections/SupervisoComment';
const EditIntervention = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentTime] = useState(new Date());
  const [formData, setFormData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [originalData, setOriginalData] = useState<any>(null);

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
        
        // Store original data for comparison
        setOriginalData(JSON.stringify(data));
        
        // Initialize form data
        setFormData({
          ...data,
          timeEntries: data.timeEntries || []
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
      } catch (error) {
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
      ]
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
      ]
    };
    
    setFormData(newFormData);
    
    try {
      await saveIntervention(user.uid, newFormData);
      toast.success('Intervention terminée');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.uid) {
        toast.error('Vous devez être connecté pour modifier une intervention');
        return;
      }

      // Check if data has been modified
      if (JSON.stringify(formData) === originalData) {
        toast.error('Aucune modification n\'a été effectuée');
        return;
      }

      // Check if intervention is completed
      if (formData.status === 'completed') {
        toast.error('Cette intervention est terminée et ne peut plus être modifiée');
        return;
      }

      // Check if user has permission
      if (formData.userId !== user.uid) {
        toast.error('Vous n\'avez pas les droits pour modifier cette intervention');
        return;
      }

      await saveIntervention(user.uid, formData);
      toast.success('Intervention enregistrée');
      navigate('/interventions');
    } catch (error: any) {
      console.error('Error saving intervention:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
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
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="w-5 h-5" />
              Enregistrer
            </button>
          </div>

          <Header
            currentTime={currentTime}
            isRunning={isRunning}
            isPaused={isPaused}
            elapsedTime={elapsedTime}
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
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditIntervention;