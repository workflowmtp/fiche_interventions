import React, { useState } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

interface Part {
  id: string;
  designation: string;
  reference: string;
  supplier: string;
  purchasePrice: number;
  replacementFrequency: number;
  repairFrequency: number;
}

interface PartsListProps {
  parts: Part[];
  onNewPart: () => void;
  onEditPart?: (part: Part) => void;
  onDeletePart?: (partId: string) => void;
}

const PartsList: React.FC<PartsListProps> = ({ parts, onNewPart, onEditPart, onDeletePart }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParts = parts.filter(part => 
    part.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Liste des pièces</h2>
          <button
            onClick={onNewPart}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle pièce
          </button>
        </div>
        
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher une pièce..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Désignation
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix d'achat
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total réparations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total remplacements
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {part.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {part.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {part.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {part.purchasePrice.toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {part.repairFrequency || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {part.replacementFrequency || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditPart?.(part)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer cette pièce ?')) {
                            onDeletePart?.(part.id);
                          }
                        }}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredParts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucune pièce ne correspond à votre recherche
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartsList;