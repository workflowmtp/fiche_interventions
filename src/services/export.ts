import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { formatDuration } from './interventions';

export const exportToPDF = (interventions: any[]) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text('Liste des Interventions', 14, 20);

  interventions.forEach((intervention, index) => {
    const startY = index === 0 ? 30 : (doc as any).lastAutoTable.finalY + 15;

    // Add intervention number and date
    doc.setFontSize(14);
    doc.text(`Intervention #${intervention.interventionNumber}`, 14, startY);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(intervention.date).toLocaleDateString()}`, 14, startY + 7);

    // General Information
    (doc as any).autoTable({
      head: [['Informations Générales']],
      body: [
        ['Machine principale', intervention.mainMachine],
        ['Machine secondaire', intervention.secondaryMachine || '-'],
        ['Autre équipement', intervention.otherEquipment || '-'],
        ['Émetteur', intervention.emitter],
        ['Fonction', intervention.emitterRole],
        ['Priorité', getPriorityText(intervention.priority)],
        ['Status', intervention.status === 'completed' ? 'Terminée' : 'En cours'],
        ['Début', intervention.startTime ? new Date(intervention.startTime).toLocaleString() : '-'],
        ['Fin', intervention.endTime ? new Date(intervention.endTime).toLocaleString() : '-'],
        ['Temps effectif', intervention.timeStats?.effectiveTime ? formatDuration(intervention.timeStats.effectiveTime) : '-'],
        ['Temps total', intervention.timeStats?.totalTime ? formatDuration(intervention.timeStats.totalTime) : '-'],
        ['Nombre de pauses', intervention.timeStats?.pauseCount || 0],
        ['Durée moyenne des pauses', intervention.timeStats?.averagePauseDuration ? formatDuration(intervention.timeStats.averagePauseDuration) : '-']
      ],
      startY: startY + 10,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 130 }
      }
    });

    // Description and Technical Details
    (doc as any).autoTable({
      head: [['Description et Détails Techniques']],
      body: [
        ['Description initiale', intervention.initialDescription],
        ['Description technique', intervention.technicalDescription],
        ['Technicien', intervention.technicianName],
        ['Conclusion', intervention.finalConclusion]
      ],
      startY: (doc as any).lastAutoTable.finalY + 5,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 130 }
      }
    });

    // Replaced Parts
    if (intervention.replacedParts?.length > 0) {
      (doc as any).autoTable({
        head: [['Pièces Remplacées', 'Type', 'Quantité', 'Prix', 'Fournisseur']],
        body: intervention.replacedParts.map((part: any) => [
          part.designation,
          part.interventionType === 'replacement' ? 'Remplacement' : 'Réparation',
          part.quantity,
          `${part.purchasePrice?.toFixed(2) || '0.00'} €`,
          part.supplier
        ]),
        startY: (doc as any).lastAutoTable.finalY + 5,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });
    }

    // Add page if needed
    if (index < interventions.length - 1 && (doc as any).lastAutoTable.finalY > 250) {
      doc.addPage();
    }
  });

  // Save the PDF
  doc.save('interventions.pdf');
};

export const exportToCSV = (interventions: any[]) => {
  // Prepare data with all details
  const data = interventions.map(intervention => {
    // Base intervention data
    const baseData = {
      'Numéro': `#${intervention.interventionNumber}`,
      'Date': new Date(intervention.date).toLocaleDateString(),
      'Début intervention': intervention.startTime ? new Date(intervention.startTime).toLocaleString() : '-',
      'Fin intervention': intervention.endTime ? new Date(intervention.endTime).toLocaleString() : '-',
      'Temps effectif': intervention.timeStats?.effectiveTime ? formatDuration(intervention.timeStats.effectiveTime) : '-',
      'Temps total': intervention.timeStats?.totalTime ? formatDuration(intervention.timeStats.totalTime) : '-',
      'Nombre de pauses': intervention.timeStats?.pauseCount || 0,
      'Durée moyenne des pauses': intervention.timeStats?.averagePauseDuration ? formatDuration(intervention.timeStats.averagePauseDuration) : '-',
      'Machine principale': intervention.mainMachine,
      'Machine secondaire': intervention.secondaryMachine || '',
      'Autre équipement': intervention.otherEquipment || '',
      'Émetteur': intervention.emitter,
      'Fonction': intervention.emitterRole,
      'Priorité': getPriorityText(intervention.priority),
      'Status': intervention.status === 'completed' ? 'Terminée' : 'En cours',
      
      // Description and technical details
      'Description initiale': intervention.initialDescription,
      'Description technique': intervention.technicalDescription,
      'Technicien': intervention.technicianName,
      'Conclusion': intervention.finalConclusion,
      
      // Previous issues
      'Panne déjà rencontrée': intervention.previouslyEncountered ? 'Oui' : 'Non',
      'PCA informé': intervention.pcaInformed ? 'Oui' : 'Non',
      'Avis du PCA': intervention.pcaOpinion || '',
      
      // Test validation
      'Test de vérification effectué': intervention.verificationTest ? 'Oui' : 'Non',
      'Observations du test': intervention.verificationObservations || '',
      
      // Issues
      'Problèmes électriques': (intervention.electricalIssues || []).join(', '),
      'Problèmes mécaniques': (intervention.mechanicalIssues || []).join(', '),
      'Problèmes pneumatiques/hydrauliques': (intervention.pneumaticHydraulicIssues || []).join(', '),
      'Problèmes électroniques': (intervention.electronicIssues || []).join(', '),
      'Problèmes logiciels': (intervention.softwareIssues || []).join(', '),
      'Problèmes humains': (intervention.humanIssues || []).join(', '),
      'Problèmes environnementaux': (intervention.environmentalIssues || []).join(', '),
      'Problèmes de consommables': (intervention.consumableIssues || []).join(', '),
      'Problèmes de maintenance': (intervention.maintenanceIssues || []).join(', '),
      'Autres problèmes': intervention.otherIssues || ''
    };

    // Root cause analysis
    intervention.rootCauseAnalysis?.forEach((analysis: any, index: number) => {
      baseData[`Analyse ${index + 1} - Problème`] = analysis.problem;
      analysis.whys.forEach((why: any, whyIndex: number) => {
        baseData[`Analyse ${index + 1} - Pourquoi ${whyIndex + 1}`] = why.value;
      });
      baseData[`Analyse ${index + 1} - Cause racine`] = analysis.rootCause;
      baseData[`Analyse ${index + 1} - Actions`] = analysis.actions;
      baseData[`Analyse ${index + 1} - Résultats`] = analysis.results;
    });

    // Replaced parts
    intervention.replacedParts?.forEach((part: any, index: number) => {
      baseData[`Pièce ${index + 1} - Désignation`] = part.designation;
      baseData[`Pièce ${index + 1} - Type`] = part.interventionType === 'replacement' ? 'Remplacement' : 'Réparation';
      baseData[`Pièce ${index + 1} - Quantité`] = part.quantity;
      baseData[`Pièce ${index + 1} - Prix`] = `${part.purchasePrice?.toFixed(2) || '0.00'} €`;
      baseData[`Pièce ${index + 1} - Fournisseur`] = part.supplier;
    });

    // Signatures
    baseData['Signatures techniciens'] = (intervention.technicianSignatures || [])
      .map((sig: any) => `${sig.name} (${sig.validated ? 'Validé' : 'Non validé'})`)
      .join(', ');
    
    if (intervention.supervisorSignature) {
      baseData['Signature responsable'] = `${intervention.supervisorSignature.name} (${intervention.supervisorSignature.validated ? 'Validé' : 'Non validé'})`;
    }

    return baseData;
  });

  // Convert to CSV
  const csv = Papa.unparse(data);

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'interventions.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getPriorityText = (priority: string): string => {
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