import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface SupervisorCommentProps {
  formData: any;
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

const SupervisorComment: React.FC<SupervisorCommentProps> = ({
  formData,
  onFormChange,
  isEditable
}) => {
  const { user } = useAuth();
  const [comment, setComment] = useState(formData.supervisorComment || '');
  
  // Vérifier si l'utilisateur actuel est le responsable
  const isSupervisor = user?.uid === formData.supervisorSignature?.uid;
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };
  
  const handleSave = () => {
    if (!isSupervisor) {
      toast.error('Seul le responsable désigné peut valider cette section');
      return;
    }
    
    onFormChange({
      ...formData,
      supervisorComment: comment,
      supervisorSignature: {
        ...formData.supervisorSignature,
        validated: true,
        timestamp: new Date().toISOString()
      }
    });
    
    toast.success('Commentaire du responsable enregistré et validé');
  };
  
  const handleCancel = () => {
    if (!isSupervisor) {
      toast.error('Seul le responsable désigné peut annuler la validation');
      return;
    }
    
    onFormChange({
      ...formData,
      supervisorSignature: {
        ...formData.supervisorSignature,
        validated: false
      }
    });
    
    toast.success('Validation annulée');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Commentaire et validation du responsable</h2>
      
      <div className="mt-4">
        <textarea
          id="supervisorComment"
          name="supervisorComment"
          rows={4}
          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isSupervisor ? 'bg-gray-100' : ''}`}
          value={comment}
          onChange={handleChange}
          placeholder="Ajoutez un commentaire (optionnel)"
          disabled={!isEditable || !isSupervisor}
        />
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500">
            {formData.supervisorSignature?.validated 
              ? `Validé par ${formData.supervisorSignature?.name || 'le responsable'}`
              : 'Non validé'}
          </span>
        </div>
        
        {isEditable && isSupervisor && (
          <div className="flex space-x-2">
            {!formData.supervisorSignature?.validated ? (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Check className="w-4 h-4 mr-1" /> Valider
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <X className="w-4 h-4 mr-1" /> Annuler validation
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorComment;
