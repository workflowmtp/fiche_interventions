import React from 'react';

interface PreviousIssuesProps {
  formData: any;
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

const PreviousIssues: React.FC<PreviousIssuesProps> = ({ formData, onFormChange, isEditable }) => {
  const inputClasses = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${!isEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  return (
    <section className="border rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">3. Pannes Rencontrées et PCA informé</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Panne déjà rencontrée ? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="previouslyEncountered"
                checked={formData.previouslyEncountered}
                onChange={() => onFormChange({ ...formData, previouslyEncountered: true })}
                className="form-radio h-4 w-4 text-blue-600"
                required
                disabled={!isEditable}
              />
              <span className="ml-2">Oui</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="previouslyEncountered"
                checked={!formData.previouslyEncountered}
                onChange={() => onFormChange({ ...formData, previouslyEncountered: false })}
                className="form-radio h-4 w-4 text-blue-600"
                required
                disabled={!isEditable}
              />
              <span className="ml-2">Non</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Le PCA est-il informé ? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="pcaInformed"
                checked={formData.pcaInformed}
                onChange={() => onFormChange({ ...formData, pcaInformed: true })}
                className="form-radio h-4 w-4 text-blue-600"
                required
                disabled={!isEditable}
              />
              <span className="ml-2">Oui</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="pcaInformed"
                checked={!formData.pcaInformed}
                onChange={() => onFormChange({ ...formData, pcaInformed: false })}
                className="form-radio h-4 w-4 text-blue-600"
                required
                disabled={!isEditable}
              />
              <span className="ml-2">Non</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Avis du PCA {formData.pcaInformed && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={formData.pcaOpinion}
            onChange={(e) => onFormChange({ ...formData, pcaOpinion: e.target.value })}
            className={inputClasses}
            rows={4}
            required={formData.pcaInformed}
            disabled={!isEditable}
          />
        </div>
      </div>
    </section>
  );
};

export default PreviousIssues;