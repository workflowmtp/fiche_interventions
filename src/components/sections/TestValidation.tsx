import React from 'react';

interface TestValidationProps {
  formData: any;
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

const TestValidation: React.FC<TestValidationProps> = ({ formData, onFormChange, isEditable }) => {
  const inputClasses = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${!isEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  return (
    <section className="border rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">8. Test et Validation</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test de vérification après intervention
          </label>
          <div className="flex gap-4">
            <label className={`inline-flex items-center ${!isEditable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="verificationTest"
                checked={formData.verificationTest}
                onChange={() => onFormChange({ ...formData, verificationTest: true })}
                className="form-radio h-4 w-4 text-blue-600"
                disabled={!isEditable}
              />
              <span className="ml-2">Oui</span>
            </label>
            <label className={`inline-flex items-center ${!isEditable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="verificationTest"
                checked={!formData.verificationTest}
                onChange={() => onFormChange({ ...formData, verificationTest: false })}
                className="form-radio h-4 w-4 text-blue-600"
                disabled={!isEditable}
              />
              <span className="ml-2">Non</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Observations</label>
          <textarea
            value={formData.verificationObservations}
            onChange={(e) => onFormChange({ ...formData, verificationObservations: e.target.value })}
            className={inputClasses}
            rows={4}
            placeholder="Notez vos observations suite au test de vérification..."
            disabled={!isEditable}
          />
        </div>
      </div>
    </section>
  );
};

export default TestValidation;