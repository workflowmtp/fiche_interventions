import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, ChevronDown, History } from 'lucide-react';
import { getParts, Part } from '../../services/parts';

interface ReplacedPartsProps {
  formData: any;
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

const ReplacedParts: React.FC<ReplacedPartsProps> = ({ formData, onFormChange, isEditable }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadParts = async () => {
      try {
        const partsData = await getParts();
        setParts(partsData);
      } catch (error) {
        console.error('Error loading parts:', error);
      }
    };
    loadParts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReplacedPartChange = (index: number, field: string, value: string | number) => {
    if (!isEditable) return;

    const newParts = formData.replacedParts.map((part: any, i: number) => {
      if (i === index) {
        return { ...part, [field]: value };
      }
      return part;
    });
    onFormChange({ ...formData, replacedParts: newParts });
  };

  const handleSelectPart = (index: number, selectedPart: Part) => {
    if (!isEditable) return;

    // Get the last history entry if available
    const lastHistory = selectedPart.history?.[selectedPart.history.length - 1];

    const newParts = formData.replacedParts.map((part: any, i: number) => {
      if (i === index) {
        return {
          ...part,
          designation: selectedPart.designation,
          reference: selectedPart.reference,
          // Set current price and supplier to empty/zero
          purchasePrice: 0,
          supplier: '',
          // Set last price and supplier from history or current values
          lastPurchasePrice: lastHistory?.purchasePrice || selectedPart.purchasePrice,
          lastSupplier: lastHistory?.supplier || selectedPart.supplier
        };
      }
      return part;
    });
    onFormChange({ ...formData, replacedParts: newParts });
    setShowDropdown(null);
    setSearchTerm('');
  };

  const handleAddPart = () => {
    if (!isEditable) return;

    onFormChange({
      ...formData,
      replacedParts: [
        ...formData.replacedParts,
        {
          designation: '',
          reference: '',
          interventionType: '',
          quantity: 0,
          purchasePrice: 0,
          supplier: '',
          lastPurchasePrice: 0,
          lastSupplier: ''
        }
      ]
    });
  };

  const handleRemovePart = (index: number) => {
    if (!isEditable) return;

    // Prevent removing the last part
    if (formData.replacedParts.length <= 1) {
      return;
    }
    const newParts = formData.replacedParts.filter((_: any, i: number) => i !== index);
    onFormChange({ ...formData, replacedParts: newParts });
  };

  const filteredParts = (searchTerm: string) => {
    return parts.filter(part => 
      part.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getDisplayValue = (part: any) => {
    if (!part.designation) return '';
    if (!part.reference) return part.designation;
    return `${part.designation} (${part.reference})`;
  };

  const getPlaceholder = (part: any) => {
    if (part.designation) {
      return `${part.designation} (${part.reference})`;
    }
    return "Sélectionner une pièce...";
  };

  const inputClasses = `w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3 ${!isEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`;
  const readOnlyClasses = "w-full rounded-md border-gray-300 bg-gray-100 shadow-sm px-4 py-3 cursor-not-allowed";

  return (
    <section className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">7. Liste des Pièces Remplacées</h2>
        <button
          type="button"
          onClick={handleAddPart}
          disabled={!isEditable}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            isEditable 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          Ajouter une pièce
        </button>
      </div>

      <div className="space-y-6">
        {formData.replacedParts.map((part: any, index: number) => (
          <div key={index} className="border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Pièce #{index + 1}
              </h3>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemovePart(index)}
                  disabled={!isEditable}
                  className={`text-red-600 hover:text-red-800 ${!isEditable && 'opacity-50 cursor-not-allowed'}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Désignation de la pièce
                </label>
                <div className="relative">
                  <div
                    className={`relative flex items-center ${isEditable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onClick={() => {
                      if (isEditable) {
                        setShowDropdown(index);
                        setIsSearching(index);
                      }
                    }}
                  >
                    <input
                      type="text"
                      value={isSearching === index ? searchTerm : getDisplayValue(part)}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(index);
                      }}
                      className={`${inputClasses} pr-10`}
                      disabled={!isEditable}
                      placeholder={getPlaceholder(part)}
                      readOnly={isSearching !== index}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  {showDropdown === index && isEditable && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                      <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Rechercher..."
                            autoFocus
                          />
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </div>
                      {filteredParts(searchTerm).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                          onClick={() => handleSelectPart(index, option)}
                        >
                          <div className="font-medium">{getDisplayValue(option)}</div>
                          <div className="text-sm text-gray-500">
                            Prix: {option.purchasePrice.toFixed(2)} € | Fournisseur: {option.supplier}
                          </div>
                        </button>
                      ))}
                      {filteredParts(searchTerm).length === 0 && (
                        <div className="px-4 py-2 text-gray-500">
                          Aucune pièce trouvée
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {part.designation && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <History className="w-4 h-4" />
                      Dernier prix d'achat
                    </label>
                    <input
                      type="text"
                      value={part.lastPurchasePrice ? `${part.lastPurchasePrice.toFixed(2)} €` : '-'}
                      className={readOnlyClasses}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <History className="w-4 h-4" />
                      Dernier fournisseur
                    </label>
                    <input
                      type="text"
                      value={part.lastSupplier || '-'}
                      className={readOnlyClasses}
                      readOnly
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'intervention <span className="text-red-500">*</span>
                </label>
                <select
                  value={part.interventionType}
                  onChange={(e) => handleReplacedPartChange(index, 'interventionType', e.target.value)}
                  className={inputClasses}
                  required={index === 0}
                  disabled={!isEditable}
                >
                  <option value="">Sélectionner le type</option>
                  <option value="replacement">Remplacement</option>
                  <option value="repair">Réparation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={part.quantity}
                  onChange={(e) => handleReplacedPartChange(index, 'quantity', parseInt(e.target.value) || 0)}
                  className={inputClasses}
                  required={index === 0}
                  disabled={!isEditable}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix d'achat actuel <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={part.purchasePrice}
                  onChange={(e) => handleReplacedPartChange(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                  className={inputClasses}
                  required={index === 0}
                  disabled={!isEditable}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fournisseur actuel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={part.supplier}
                  onChange={(e) => handleReplacedPartChange(index, 'supplier', e.target.value)}
                  className={inputClasses}
                  required={index === 0}
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

export default ReplacedParts;