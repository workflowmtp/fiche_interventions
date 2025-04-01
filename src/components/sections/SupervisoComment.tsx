
import React from 'react';

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
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFormChange({
      ...formData,
      supervisorComment: e.target.value
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Commentaire du responsable (optionnel)</h2>
      
      <div className="mt-4">
        <textarea
          id="supervisorComment"
          name="supervisorComment"
          rows={4}
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.supervisorComment || ''}
          onChange={handleChange}
          placeholder="Ajoutez un commentaire (optionnel)"
          disabled={!isEditable}
        />
      </div>
    </div>
  );
};

export default SupervisorComment;
