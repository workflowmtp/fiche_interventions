import React from 'react';

interface IssueDescriptionProps {
  formData: any;
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

const IssueDescription: React.FC<IssueDescriptionProps> = ({ formData, onFormChange, isEditable }) => {
  const inputClasses = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${!isEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  return (
    <section className="border rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">4. Description de la Panne</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description initiale de la panne (par le conducteur) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.initialDescription}
            onChange={(e) => onFormChange({ ...formData, initialDescription: e.target.value })}
            className={inputClasses}
            rows={4}
            required
            disabled={!isEditable}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description et évaluation de la panne (par le technicien) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.technicalDescription}
            onChange={(e) => onFormChange({ ...formData, technicalDescription: e.target.value })}
            className={inputClasses}
            rows={4}
            required
            disabled={!isEditable}
          />
        </div>
      </div>
    </section>
  );
};

export default IssueDescription;