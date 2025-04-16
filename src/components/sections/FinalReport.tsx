import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface FinalReportProps {
  formData: any;
  onFormChange: (formData: any) => void;
  isEditable: boolean;
}

interface Technician {
  name: string;
  validated: boolean;
  timestamp: string;
  uid: string;
}

const FinalReport: React.FC<FinalReportProps> = ({ formData, onFormChange, isEditable }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTechnician, setNewTechnician] = useState('');
  const [expandedSection, setExpandedSection] = useState(true);
  const { user } = useAuth();

  const handleAddTechnician = () => {
    if (!isEditable) return;

    if (newTechnician.trim()) {
      const newSignature: Technician = {
        name: newTechnician,
        validated: false,
        timestamp: new Date().toISOString(),
        uid: user.uid
      };

      onFormChange({
        ...formData,
        technicianSignatures: [...(formData.technicianSignatures || []), newSignature]
      });

      setNewTechnician('');
      setIsModalOpen(false);
    }
  };

  const handleValidateSignature = (index: number) => {
    if (!isEditable) return;

    const signature = formData.technicianSignatures[index];
    if (!user || !signature.uid || signature.uid !== user.uid) {
      toast.error('Vous ne pouvez valider que votre propre signature');
      return;
    }

    const updatedSignatures = formData.technicianSignatures.map((sig: Technician, i: number) => 
      i === index ? { ...sig, validated: !sig.validated } : sig
    );

    onFormChange({
      ...formData,
      technicianSignatures: updatedSignatures
    });
  };

  const handleValidateSupervisorSignature = () => {
    if (!isEditable || !formData.supervisorSignature?.name) return;
    
    onFormChange({
      ...formData,
      supervisorSignature: {
        ...formData.supervisorSignature,
        validated: !formData.supervisorSignature.validated
      }
    });
  };

  const handleSupervisorNameChange = (name: string) => {
    if (!isEditable) return;

    onFormChange({
      ...formData,
      supervisorSignature: {
        name,
        validated: false,
        timestamp: new Date().toISOString()
      }
    });
  };

  const inputClasses = `mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${!isEditable ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  return (
    <section className="border rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">9. Rapport Final</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Conclusion du technicien <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.finalConclusion}
            onChange={(e) => onFormChange({ ...formData, finalConclusion: e.target.value })}
            className={inputClasses}
            rows={4}
            placeholder="Entrez votre conclusion finale..."
            required
            disabled={!isEditable}
          />
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center p-6 bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedSection(!expandedSection)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <h3 className="text-lg font-medium">
                  Signatures des techniciens <span className="text-red-500">*</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={!isEditable}
                className={`flex items-center gap-2 px-6 py-3 rounded ${
                  isEditable 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                Ajouter une signature
              </button>
            </div>

            <Transition.Root show={expandedSection}>
              <div className="p-6 space-y-3">
                {formData.technicianSignatures?.map((signature: Technician, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-5 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div>
                      <div className="font-medium">{signature.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(signature.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleValidateSignature(index)}
                      disabled={!isEditable}
                      className={`flex items-center gap-2 px-5 py-2 rounded ${
                        signature.validated
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      } ${!isEditable && 'opacity-50 cursor-not-allowed'}`}
                    >
                      {signature.validated ? (
                        <>
                          <Check className="w-4 h-4" />
                          Validé
                        </>
                      ) : (
                        'Valider'
                      )}
                    </button>
                  </div>
                ))}
                {(!formData.technicianSignatures || formData.technicianSignatures.length === 0) && (
                  <div className="text-center text-gray-500 py-6">
                    Aucune signature ajoutée
                  </div>
                )}
              </div>
            </Transition.Root>
          </div>

          <div className="border border-gray-200 rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">
                Signature du responsable <span className="text-red-500">*</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <input
                      type="text"
                      value={formData.supervisorSignature?.name || ''}
                      onChange={(e) => handleSupervisorNameChange(e.target.value)}
                      placeholder="Nom du responsable"
                      className={`font-medium bg-transparent border-none focus:ring-0 px-4 py-3 ${!isEditable && 'cursor-not-allowed'}`}
                      required
                      disabled={!isEditable}
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {formData.supervisorSignature?.timestamp
                        ? new Date(formData.supervisorSignature.timestamp).toLocaleString()
                        : new Date().toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleValidateSupervisorSignature}
                    disabled={!isEditable || !formData.supervisorSignature?.name}
                    className={`flex items-center gap-2 px-5 py-2 rounded ${
                      formData.supervisorSignature?.validated
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    } ${(!isEditable || !formData.supervisorSignature?.name) && 'opacity-50 cursor-not-allowed'}`}
                  >
                    {formData.supervisorSignature?.validated ? (
                      <>
                        <Check className="w-4 h-4" />
                        Validé
                      </>
                    ) : (
                      'Valider'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Transition.Root show={isModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsModalOpen(false)}
        >
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-6 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                      Ajouter une signature
                    </Dialog.Title>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={newTechnician}
                        onChange={(e) => setNewTechnician(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-6 py-3"
                        placeholder="Nom du technicien"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleAddTechnician}
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </section>
  );
};

export default FinalReport;