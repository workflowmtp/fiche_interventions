import React from 'react';
import { X, Download, Clock, AlertTriangle, AlertCircle, AlertOctagon, Check, Calendar, User,  FileText } from 'lucide-react';
import { formatDuration } from '../services/interventions';

interface InterventionReportProps {
  intervention: any;
  isOpen: boolean;
  onClose: () => void;
}

const InterventionReport: React.FC<InterventionReportProps> = ({ intervention, isOpen, onClose }) => {
  if (!isOpen) return null;

  const calculateEffectiveTime = (timeEntries: any[]) => {
    if (!timeEntries || timeEntries.length === 0) return 0;
    
    let effectiveTime = 0;
    let startTime: Date | null = null;
    
    timeEntries.forEach(entry => {
      if (entry.action === 'start' || entry.action === 'resume') {
        startTime = new Date(entry.timestamp);
      } else if ((entry.action === 'pause' || entry.action === 'stop') && startTime) {
        const endTime = new Date(entry.timestamp);
        effectiveTime += endTime.getTime() - startTime.getTime();
        startTime = null;
      }
    });
    
    return effectiveTime;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'yellow':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'orange':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'red':
        return <AlertOctagon className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'yellow':
        return 'Surveillance';
      case 'orange':
        return 'Risque élevé';
      case 'red':
        return 'Critique';
      default:
        return '';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'in_progress':
        return 'En cours';
      default:
        return status;
    }
  };

  const downloadReport = () => {
    // Cette fonction serait implémentée dans une version future
    // pour générer un PDF ou autre format pour téléchargement
    console.log('Téléchargement du rapport pour intervention #', intervention.interventionNumber);
    alert('Fonctionnalité de téléchargement en cours de développement');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Rapport d'intervention #{intervention.interventionNumber}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col">
              <div className="text-sm text-gray-500 mb-1">Date</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 font-medium">
                  {new Date(intervention.date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-sm text-gray-500 mb-1">Technicien</div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 font-medium">
                  {intervention.technicianName || '-'}
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-sm text-gray-500 mb-1">Temps effectif</div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 font-medium">
                  {formatDuration(calculateEffectiveTime(intervention.timeEntries))}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <div className="text-sm text-gray-500 mb-1">Machine principale</div>
              <div className="flex items-center gap-2">
               
                <span className="text-gray-900 font-medium">
                  {intervention.mainMachine || '-'}
                </span>
              </div>
              {intervention.secondaryMachine && (
                <div className="mt-2">
                  <div className="text-sm text-gray-500 mb-1">Machine secondaire</div>
                  <div className="flex items-center gap-2">
                    
                    <span className="text-gray-900 font-medium">
                      {intervention.secondaryMachine}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="text-sm text-gray-500 mb-1">Statut</div>
              <div className="flex gap-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(intervention.status)}`}>
                  {intervention.status === 'completed' ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Clock className="w-4 h-4 mr-1" />
                  )}
                  {getStatusText(intervention.status)}
                </span>

                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityClass(intervention.priority)}`}>
                  {getPriorityIcon(intervention.priority)}
                  <span className="ml-1">{getPriorityText(intervention.priority)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              Description de l'incident
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">
                {intervention.initialDescription || 'Aucune description fournie'}
              </p>
            </div>
          </div>

          {intervention.technicalDescription && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                Description technique
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {intervention.technicalDescription}
                </p>
              </div>
            </div>
          )}

          {/* Section des diagnostics */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              Diagnostic
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {intervention.electricalIssues?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Problèmes électriques</h4>
                    <ul className="list-disc list-inside">
                      {intervention.electricalIssues.map((issue: string, index: number) => (
                        <li key={`electrical-${index}`} className="text-gray-800">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {intervention.mechanicalIssues?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Problèmes mécaniques</h4>
                    <ul className="list-disc list-inside">
                      {intervention.mechanicalIssues.map((issue: string, index: number) => (
                        <li key={`mechanical-${index}`} className="text-gray-800">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {intervention.pneumaticHydraulicIssues?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Problèmes pneumatiques/hydrauliques</h4>
                    <ul className="list-disc list-inside">
                      {intervention.pneumaticHydraulicIssues.map((issue: string, index: number) => (
                        <li key={`pneumatic-${index}`} className="text-gray-800">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {intervention.electronicIssues?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Problèmes électroniques</h4>
                    <ul className="list-disc list-inside">
                      {intervention.electronicIssues.map((issue: string, index: number) => (
                        <li key={`electronic-${index}`} className="text-gray-800">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {intervention.softwareIssues?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Problèmes logiciels</h4>
                    <ul className="list-disc list-inside">
                      {intervention.softwareIssues.map((issue: string, index: number) => (
                        <li key={`software-${index}`} className="text-gray-800">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {intervention.otherIssues && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Autres problèmes</h4>
                    <p className="text-gray-800">{intervention.otherIssues}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section d'analyse des causes racines */}
          {intervention.rootCauseAnalysis?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                Analyse des causes racines
              </h3>
              {intervention.rootCauseAnalysis.map((analysis: any, index: number) => (
                <div key={`root-cause-${index}`} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Problème {index + 1}</h4>
                  <p className="text-gray-800 mb-3">{analysis.problem}</p>

                  {analysis.whys?.length > 0 && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-700 mb-2">5 Pourquoi</h5>
                      <ul className="list-decimal list-inside pl-4">
                        {analysis.whys.map((why: any, whyIndex: number) => (
                          <li key={why.id || `why-${whyIndex}`} className="text-gray-800 mb-1">
                            {why.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.rootCause && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-700 mb-1">Cause racine identifiée</h5>
                      <p className="text-gray-800">{analysis.rootCause}</p>
                    </div>
                  )}

                  {analysis.actions && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-700 mb-1">Actions entreprises</h5>
                      <p className="text-gray-800">{analysis.actions}</p>
                    </div>
                  )}

                  {analysis.results && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Résultats</h5>
                      <p className="text-gray-800">{analysis.results}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Section des pièces remplacées */}
          {intervention.replacedParts?.length > 0 && intervention.replacedParts[0].name && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                Pièces remplacées
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-50 rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom de la pièce
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type d'intervention
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix dernier achat
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fournisseur
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {intervention.replacedParts.map((part: any, index: number) => (
                      <tr key={`part-${index}`}>
                        <td className="px-4 py-2 text-sm text-gray-800">{part.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{part.interventionType}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{part.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{part.lastPurchasePrice} €</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{part.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section de validation du test */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              Validation et test
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="text-gray-700 font-medium">Test de vérification effectué:</div>
                <div className="ml-2">
                  {intervention.verificationTest ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Oui
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <X className="w-3 h-3 mr-1" />
                      Non
                    </span>
                  )}
                </div>
              </div>

              {intervention.verificationObservations && (
                <div>
                  <div className="text-gray-700 font-medium mb-1">Observations sur le test:</div>
                  <p className="text-gray-800 whitespace-pre-wrap">{intervention.verificationObservations}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section de conclusion finale */}
          {intervention.finalConclusion && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                Conclusion finale
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{intervention.finalConclusion}</p>
              </div>
            </div>
          )}

          {/* Section des signatures */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              Signatures
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {intervention.technicianSignatures?.length > 0 ? (
                <div className="mb-4">
                  <div className="text-gray-700 font-medium mb-2">Techniciens:</div>
                  <div className="flex flex-wrap gap-3">
                    {intervention.technicianSignatures.map((signature: any, index: number) => (
                      <div key={`signature-${index}`} className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 border border-blue-200">
                        <User className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-blue-800">{signature.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="text-gray-700 font-medium mb-2">Techniciens:</div>
                  <p className="text-gray-500 italic">Aucune signature</p>
                </div>
              )}

              {intervention.supervisorSignature ? (
                <div>
                  <div className="text-gray-700 font-medium mb-2">Superviseur:</div>
                  <div className="flex items-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-purple-50 border border-purple-200">
                      <User className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-purple-800">{intervention.supervisorSignature.name}</span>
                    </div>
                    
                    {intervention.supervisorSignature.validated && (
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        Validé
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-gray-700 font-medium mb-2">Superviseur:</div>
                  <p className="text-gray-500 italic">Aucune signature</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterventionReport;