import React from 'react';

interface DiagnosisProps {
  formData: any;
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

const diagnosticOptions = {
  electrical: [
    'Court-circuit',
    'Composant défectueux (contacteur, relais, fusible)',
    'Câblage endommagé ou desserré',
    'Alimentation instable ou coupure de courant'
  ],
  mechanical: [
    'Usure des pièces (paliers, roulements, courroies, engrenages)',
    'Déréglage des axes ou des capteurs',
    'Lubrification insuffisante ou absente',
    'Grippage ou blocage mécanique'
  ],
  pneumaticHydraulic: [
    'Fuite d\'air ou d\'huile',
    'Pression insuffisante ou excessive',
    'Vanne ou vérin défaillant',
    'Encrassement des filtres'
  ],
  electronic: [
    'Carte électronique défaillante',
    'Capteur défectueux ou mal calibré',
    'Variateur de vitesse en panne',
    'Problème de communication entre automates'
  ],
  software: [
    'Programme défectueux ou corrompu',
    'Mauvais paramétrage de la machine',
    'Perte de données ou de configuration'
  ],
  human: [
    'Erreur de manipulation par l\'opérateur',
    'Formation insuffisante du personnel',
    'Mauvaise communication des consignes'
  ],
  environmental: [
    'Température excessive ou trop basse',
    'Taux d\'humidité élevé',
    'Présence de poussières ou de résidus dans les composants'
  ],
  consumable: [
    'Utilisation de matières premières non conformes',
    'Encrassement des têtes d\'impression ou des rouleaux',
    'Qualité d\'encre ou de solvant inadéquate'
  ],
  maintenance: [
    'Contrôles visuels et audits techniques insuffisants'
  ]
};

const Diagnosis: React.FC<DiagnosisProps> = ({ formData, onFormChange, isEditable }) => {
  const handleMultiSelect = (field: string, value: string) => {
    if (!isEditable) return;
    
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    onFormChange({ ...formData, [field]: newValues });
  };

  const inputClasses = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${!isEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  return (
    <section className="border rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">5. Analyse et Diagnostic</h2>
      <div className="space-y-6">
        {Object.entries(diagnosticOptions).map(([category, options]) => (
          <div key={category}>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {category === 'electrical' && 'Problèmes électriques'}
              {category === 'mechanical' && 'Problèmes mécaniques'}
              {category === 'pneumaticHydraulic' && 'Problèmes pneumatiques / hydrauliques'}
              {category === 'electronic' && 'Problèmes liés aux composants électroniques'}
              {category === 'software' && 'Problèmes logiciels / automates'}
              {category === 'human' && 'Problèmes humains / organisationnels'}
              {category === 'environmental' && 'Facteurs environnementaux'}
              {category === 'consumable' && 'Problèmes liés aux consommables et matériaux'}
              {category === 'maintenance' && 'Manque de maintenance préventive'}
            </h3>
            <div className="space-y-2">
              {options.map((option) => (
                <label key={option} className={`flex items-center ${!isEditable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={formData[`${category}Issues`]?.includes(option)}
                    onChange={() => handleMultiSelect(`${category}Issues`, option)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={!isEditable}
                  />
                  <span className="ml-2 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Autres</h3>
          <textarea
            value={formData.otherIssues}
            onChange={(e) => onFormChange({ ...formData, otherIssues: e.target.value })}
            className={inputClasses}
            rows={4}
            placeholder="Précisez d'autres causes possibles..."
            disabled={!isEditable}
          />
        </div>
      </div>
    </section>
  );
};

export default Diagnosis;