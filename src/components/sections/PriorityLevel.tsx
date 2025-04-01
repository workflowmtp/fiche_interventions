import React from 'react';
import { AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';

interface PriorityLevelProps {
  formData: any;
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

const PriorityLevel: React.FC<PriorityLevelProps> = ({ formData, onFormChange, isEditable }) => {
  const priorities = [
    {
      value: 'yellow',
      icon: AlertTriangle,
      title: 'Surveillance recommandée',
      description: 'Intervention planifiable, pas d\'urgence immédiate',
      color: 'yellow'
    },
    {
      value: 'orange',
      icon: AlertCircle,
      title: 'Risque élevé',
      description: 'Intervention rapide nécessaire',
      color: 'orange'
    },
    {
      value: 'red',
      icon: AlertOctagon,
      title: 'Critique',
      description: 'Intervention immédiate requise',
      color: 'red'
    }
  ];

  const getPriorityStyles = (priority: string) => {
    const isSelected = formData.priority === priority;
    const baseStyles = "relative flex flex-col items-center p-6 rounded-xl transition-all duration-300";
    const cursorStyles = isEditable ? "cursor-pointer" : "cursor-not-allowed opacity-60";
    const borderStyles = "before:absolute before:inset-0 before:rounded-xl before:border-2 before:transition-all before:duration-300";

    const colorStyles = {
      yellow: isSelected
        ? `${baseStyles} ${borderStyles} bg-yellow-50 before:border-yellow-500 before:bg-yellow-500/10 text-yellow-900`
        : `${baseStyles} ${borderStyles} bg-white before:border-yellow-200 hover:before:border-yellow-300 text-yellow-800`,
      orange: isSelected
        ? `${baseStyles} ${borderStyles} bg-orange-50 before:border-orange-500 before:bg-orange-500/10 text-orange-900`
        : `${baseStyles} ${borderStyles} bg-white before:border-orange-200 hover:before:border-orange-300 text-orange-800`,
      red: isSelected
        ? `${baseStyles} ${borderStyles} bg-red-50 before:border-red-500 before:bg-red-500/10 text-red-900`
        : `${baseStyles} ${borderStyles} bg-white before:border-red-200 hover:before:border-red-300 text-red-800`
    }[priority];

    return `${colorStyles} ${cursorStyles}`;
  };

  const getIconStyles = (color: string, isSelected: boolean) => {
    const baseStyles = "w-12 h-12 mb-4 transition-all duration-300";
    
    const colorStyles = {
      yellow: isSelected ? "text-yellow-600" : "text-yellow-400",
      orange: isSelected ? "text-orange-600" : "text-orange-400",
      red: isSelected ? "text-red-600" : "text-red-400"
    }[color];

    return `${baseStyles} ${colorStyles}`;
  };

  const handlePriorityClick = (value: string) => {
    if (isEditable) {
      onFormChange({ ...formData, priority: value });
    }
  };

  return (
    <section className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">2. Niveau de priorité</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {priorities.map(({ value, icon: Icon, title, description, color }) => (
          <div
            key={value}
            className={getPriorityStyles(value)}
            onClick={() => handlePriorityClick(value)}
          >
            <Icon className={getIconStyles(color, formData.priority === value)} />
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-center opacity-75">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PriorityLevel;