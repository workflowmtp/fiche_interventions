import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';

interface RootCauseAnalysisProps {
  formData: any;
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

interface Why {
  id: string;
  value: string;
}

interface RootCauseAnalysis {
  problem: string;
  whys: Why[];
  rootCause: string;
  actions: string;
  results: string;
}

const RootCauseAnalysis: React.FC<RootCauseAnalysisProps> = ({ formData, onFormChange, isEditable }) => {
  const handleAddAnalysis = () => {
    if (!isEditable) return;

    const newAnalysis: RootCauseAnalysis = {
      problem: '',
      whys: Array(5).fill(null).map(() => ({ 
        id: Date.now().toString() + Math.random(), 
        value: '' 
      })),
      rootCause: '',
      actions: '',
      results: ''
    };
    onFormChange({
      ...formData,
      rootCauseAnalysis: formData.rootCauseAnalysis ? [...formData.rootCauseAnalysis, newAnalysis] : [newAnalysis]
    });
  };

  const handleRemoveAnalysis = (index: number) => {
    if (!isEditable) return;

    const newAnalysis = formData.rootCauseAnalysis?.filter((_: any, i: number) => i !== index) || [];
    onFormChange({
      ...formData,
      rootCauseAnalysis: newAnalysis
    });
  };

  const handleAnalysisChange = (index: number, field: keyof RootCauseAnalysis, value: any) => {
    if (!isEditable) return;

    const newAnalysis = formData.rootCauseAnalysis.map((analysis: RootCauseAnalysis, i: number) => {
      if (i === index) {
        return { ...analysis, [field]: value };
      }
      return analysis;
    });
    onFormChange({
      ...formData,
      rootCauseAnalysis: newAnalysis
    });
  };

  const handleWhyChange = (analysisIndex: number, whyIndex: number, value: string) => {
    if (!isEditable) return;

    const newAnalysis = formData.rootCauseAnalysis.map((analysis: RootCauseAnalysis, i: number) => {
      if (i === analysisIndex) {
        const newWhys = [...analysis.whys];
        newWhys[whyIndex] = {
          ...newWhys[whyIndex],
          value: value
        };
        return {
          ...analysis,
          whys: newWhys
        };
      }
      return analysis;
    });
    onFormChange({
      ...formData,
      rootCauseAnalysis: newAnalysis
    });
  };

  // Ensure each analysis has exactly 5 whys
  React.useEffect(() => {
    if (!formData.rootCauseAnalysis) return;
    
    const updatedAnalyses = formData.rootCauseAnalysis.map((analysis: RootCauseAnalysis) => {
      if (analysis.whys.length !== 5) {
        return {
          ...analysis,
          whys: Array(5).fill(null).map((_, i) => 
            analysis.whys[i] || { 
              id: Date.now().toString() + Math.random(), 
              value: '' 
            }
          )
        };
      }
      return analysis;
    });

    if (JSON.stringify(updatedAnalyses) !== JSON.stringify(formData.rootCauseAnalysis)) {
      onFormChange({
        ...formData,
        rootCauseAnalysis: updatedAnalyses
      });
    }
  }, [formData.rootCauseAnalysis]);

  const inputClasses = `w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-6 py-3 ${!isEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`;
  const textareaClasses = `w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-6 py-3 ${!isEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  return (
    <section className="border rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">6. Analyse approfondie et actions</h2>
        <button
          type="button"
          onClick={handleAddAnalysis}
          disabled={!isEditable}
          className={`flex items-center gap-2 px-6 py-3 rounded ${
            isEditable 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          Ajouter une analyse
        </button>
      </div>
      
      <div className="space-y-6">
        {formData.rootCauseAnalysis && formData.rootCauseAnalysis.map((analysis: RootCauseAnalysis, index: number) => (
          <div key={index} className="border rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">
                Analyse #{index + 1} <span className="text-red-500">*</span>
              </h3>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveAnalysis(index)}
                  disabled={!isEditable}
                  className={`text-red-600 hover:text-red-800 ${!isEditable && 'opacity-50 cursor-not-allowed'}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problème Identifié <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={analysis.problem}
                  onChange={(e) => handleAnalysisChange(index, 'problem', e.target.value)}
                  className={inputClasses}
                  required
                  disabled={!isEditable}
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Les 5 Pourquoi <span className="text-red-500">*</span>
                </label>
                
                <div className="space-y-3">
                  {analysis.whys.map((_, whyIndex) => (
                    <div key={whyIndex} className="flex gap-2">
                      <div className="flex-grow relative">
                        <input
                          type="text"
                          value={analysis.whys[whyIndex].value}
                          onChange={(e) => handleWhyChange(index, whyIndex, e.target.value)}
                          placeholder={`Pourquoi ${whyIndex + 1}`}
                          className={`${inputClasses} pr-12`}
                          required
                          disabled={!isEditable}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cause racine <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={analysis.rootCause}
                  onChange={(e) => handleAnalysisChange(index, 'rootCause', e.target.value)}
                  className={inputClasses}
                  required
                  disabled={!isEditable}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actions entreprises <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={analysis.actions}
                  onChange={(e) => handleAnalysisChange(index, 'actions', e.target.value)}
                  rows={3}
                  className={textareaClasses}
                  required
                  disabled={!isEditable}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Résultats Observés <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={analysis.results}
                  onChange={(e) => handleAnalysisChange(index, 'results', e.target.value)}
                  rows={3}
                  className={textareaClasses}
                  required
                  disabled={!isEditable}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RootCauseAnalysis;