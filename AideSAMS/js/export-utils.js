// ===== EXPORT-UTILS.JS - Export PDF pour Documents Médicaux =====

// Chargement de jsPDF
if (!window.jsPDF) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
}

DocumentManager.prototype.exportToPDF = function() {
    // Attendre que jsPDF soit chargé
    if (!window.jsPDF) {
        setTimeout(() => this.exportToPDF(), 500);
        return;
    }

    const { jsPDF } = window.jsPDF;
    
    switch(this.documentType) {
        case 'arret-travail':
            this.exportArretTravailPDF(jsPDF);
            break;
        case 'certificat-naissance':
            this.exportCertificatNaissancePDF(jsPDF);
            break;
        case 'facture-hospitalisation':
            this.exportFacturePDF(jsPDF);
            break;
    }
};

DocumentManager.prototype.exportArretTravailPDF = function(jsPDF) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Récupérer les données
    const data = this.getArretTravailData();
    
    // Header SAMS
    this.addSAMSHeader(doc, pageWidth);
    
    // Titre principal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Avis d\'arrêt de travail', pageWidth/2, 60, { align: 'center' });
    
    // Section Patient
    let yPos = 80;
    yPos = this.addPatientSection(doc, data, yPos, pageWidth);
    
    // Section Médecin
    yPos = this.addMedecinSection(doc, data, yPos, pageWidth);
    
    // Section signatures
    this.addSignatureSection(doc, yPos, pageWidth, 'medecin');
    
    // Sauvegarder
    const filename = `arret_travail_${data.patient.nom}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    this.saveToHistory('arret-travail', `Arrêt de travail - ${data.patient.nom} ${data.patient.prenom}`, data);
};

DocumentManager.prototype.exportCertificatNaissancePDF = function(jsPDF) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const data = this.getCertificatNaissanceData();
    
    // Header SAMS
    this.addSAMSHeader(doc, pageWidth);
    
    // Titre
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Certificat de naissance', pageWidth/2, 60, { align: 'center' });
    
    let yPos = 80;
    
    // L'enfant
    yPos = this.addEnfantSection(doc, data, yPos, pageWidth);
    
    // Les parents
    yPos = this.addParentsSection(doc, data, yPos, pageWidth);
    
    // Le médecin
    yPos = this.addMedecinCertificatSection(doc, data, yPos, pageWidth);
    
    // Signatures (médecin et parents)
    this.addCertificatSignatureSection(doc, yPos, pageWidth);
    
    const filename = `certificat_naissance_${data.enfant.nom}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    this.saveToHistory('certificat-naissance', `Certificat de naissance - ${data.enfant.nom} ${data.enfant.prenom}`, data);
};

DocumentManager.prototype.exportFacturePDF = function(jsPDF) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const data = this.getFactureData();
    
    // Header SAMS
    this.addSAMSHeader(doc, pageWidth);
    
    // Titre
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Facture de Frais d\'Hospitalisation', pageWidth/2, 60, { align: 'center' });
    
    let yPos = 80;
    
    // Informations facture
    yPos = this.addFactureInfoSection(doc, data, yPos, pageWidth);
    
    // Détails des frais
    yPos = this.addFactureDetailsSection(doc, data, yPos, pageWidth);
    
    // Total et signature
    this.addFactureSignatureSection(doc, data, yPos, pageWidth);
    
    const filename = `facture_${data.patient}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    this.saveToHistory('facture-hospitalisation', `Facture - ${data.patient}`, data);
};

// Méthodes utilitaires pour récupérer les données
DocumentManager.prototype.getArretTravailData = function() {
    return {
        patient: {
            nom: document.getElementById('patient-nom').value || '',
            prenom: document.getElementById('patient-prenom').value || '',
            id: document.getElementById('patient-id').value || '',
            naissance: document.getElementById('patient-naissance').value || '',
            age: document.getElementById('patient-age').value || '',
            travail: document.getElementById('patient-travail').value || '',
            adresse: document.getElementById('patient-adresse').value || ''
        },
        medecin: {
            nom: document.getElementById('medecin-nom').value || '',
            prenom: document.getElementById('medecin-prenom').value || '',
            id: document.getElementById('medecin-id').value || '',
            grade: document.getElementById('medecin-grade').value || ''
        },
        arret: {
            debut: document.getElementById('arret-debut').value || '',
            fin: document.getElementById('arret-fin').value || '',
            travailPossible: document.getElementById('travail-possible').value || 'non',
            raison: document.getElementById('raison-arret').value || ''
        }
    };
};

DocumentManager.prototype.getCertificatNaissanceData = function() {
    return {
        enfant: {
            nom: document.getElementById('enfant-nom').value || '',
            prenom: document.getElementById('enfant-prenom').value || '',
            id: document.getElementById('enfant-id').value || '',
            naissance: document.getElementById('enfant-naissance').value || '',
            sexe: document.getElementById('enfant-sexe').value || '',
            heure: document.getElementById('enfant-heure').value || '',
            taille: document.getElementById('enfant-taille').value || '',
            poids: document.getElementById('enfant-poids').value || ''
        },
        mere: {
            nom: document.getElementById('mere-nom').value || '',
            naissance: document.getElementById('mere-naissance').value || '',
            age: document.getElementById('mere-age').value || '',
            nationalite: document.getElementById('mere-nationalite').value || ''
        },
        pere: {
            nom: document.getElementById('pere-nom').value || '',
            naissance: document.getElementById('pere-naissance').value || '',
            age: document.getElementById('pere-age').value || '',
            nationalite: document.getElementById('pere-nationalite').value || ''
        },
        medecin: {
            nom: document.getElementById('medecin-certificat-nom').value || '',
            id: document.getElementById('medecin-certificat-id').value || ''
        }
    };
};

DocumentManager.prototype.getFactureData = function() {
    const fraisItems = Array.from(document.querySelectorAll('.frais-item')).map(item => ({
        type: item.querySelector('.frais-type').value,
        quantite: item.querySelector('.frais-quantite').value,
        prix: parseFloat(item.querySelector('.frais-prix').value) || 0,
        total: parseFloat(item.querySelector('.frais-total').value) || 0
    }));
    
    return {
        date: document.getElementById('facture-date').value || '',
        numero: document.getElementById('facture-numero').value || '',
        patient: document.getElementById('facture-patient').value || '',
        medecin: document.getElementById('facture-medecin').value || '',
        frais: fraisItems,
        totalGeneral: document.getElementById('facture-total-general').textContent || '0.00 $',
        lieu: document.getElementById('facture-lieu').value || 'Los Santos',
        dateSignature: document.getElementById('facture-date-signature').value || '',
        medecinNom: document.getElementById('medecin-facture-nom').value || '',
        medecinGrade: document.getElementById('medecin-facture-grade').value || ''
    };
};

// Méthodes de construction des sections PDF
DocumentManager.prototype.addSAMSHeader = function(doc, pageWidth) {
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text('San Andreas Medical Services', pageWidth/2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Hôpital Central', 20, 35);
    doc.text('Eclipse Medical Tower', pageWidth - 20, 35, { align: 'right' });
};

DocumentManager.prototype.addPatientSection = function(doc, data, yPos, pageWidth) {
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text('Le patient', 20, yPos);
    
    doc.setFillColor(227, 242, 253);
    doc.rect(15, yPos + 5, pageWidth - 30, 60, 'F');
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`NOM : ${data.patient.nom}`, 20, yPos);
    doc.text(`Prénom : ${data.patient.prenom}`, pageWidth/2, yPos);
    
    yPos += 10;
    doc.text(`ID : ${data.patient.id}`, 20, yPos);
    doc.text(`Date de naissance : ${data.patient.naissance}`, pageWidth/2, yPos);
    
    yPos += 10;
    doc.text(`Âge : ${data.patient.age}`, 20, yPos);
    doc.text(`Travail : ${data.patient.travail}`, pageWidth/2, yPos);
    
    yPos += 10;
    doc.text(`Adresse : ${data.patient.adresse}`, 20, yPos);
    
    return yPos + 25;
};

DocumentManager.prototype.addMedecinSection = function(doc, data, yPos, pageWidth) {
    doc.setFontSize(14);
    doc.setTextColor(56, 142, 60);
    doc.text('Le médecin', 20, yPos);
    
    doc.setFillColor(232, 245, 232);
    doc.rect(15, yPos + 5, pageWidth - 30, 70, 'F');
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`NOM : ${data.medecin.nom}`, 20, yPos);
    doc.text(`Prénom : ${data.medecin.prenom}`, pageWidth/2, yPos);
    
    yPos += 10;
    doc.text(`ID : ${data.medecin.id}`, 20, yPos);
    doc.text(`Grade : ${data.medecin.grade}`, pageWidth/2, yPos);
    
    yPos += 15;
    doc.text(`Valable à partir du : ${data.arret.debut}`, 20, yPos);
    yPos += 8;
    doc.text(`Jusqu'au : ${data.arret.fin}`, 20, yPos);
    yPos += 8;
    doc.text(`Travail possible : ${data.arret.travailPossible === 'non' ? 'Non' : data.arret.travailPossible}`, 20, yPos);
    
    yPos += 12;
    doc.text('Raison de l\'arrêt :', 20, yPos);
    yPos += 8;
    const splitRaison = doc.splitTextToSize(data.arret.raison, pageWidth - 40);
    doc.text(splitRaison, 20, yPos);
    
    return yPos + splitRaison.length * 5 + 20;
};

DocumentManager.prototype.addSignatureSection = function(doc, yPos, pageWidth, type) {
    yPos = Math.max(yPos, 220);
    
    doc.setFontSize(12);
    doc.setTextColor(25, 118, 210);
    doc.text('Signature du médecin :', 30, yPos);
    doc.text('Date et heure :', pageWidth - 80, yPos);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(20, yPos + 20, 90, yPos + 20);
    doc.line(pageWidth - 90, yPos + 20, pageWidth - 20, yPos + 20);
    
    this.addSignatureToPDF(doc, type, 20, yPos + 5, 70, 15);
};

DocumentManager.prototype.addSignatureToPDF = function(doc, type, x, y, width, height) {
    const canvas = document.getElementById(`${type}-signature-canvas`);
    const textInput = document.getElementById(`${type}-signature-text-input`);
    
    if (canvas && !this.isCanvasEmpty(canvas)) {
        try {
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', x, y, width, height);
        } catch (error) {
            console.log('Erreur ajout signature canvas:', error);
        }
    } else if (textInput && textInput.value) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'italic');
        doc.text(textInput.value, x + width/2, y + height/2, { align: 'center' });
    }
};

DocumentManager.prototype.saveToHistory = function(type, name, data) {
    const history = JSON.parse(localStorage.getItem('documentHistory') || '[]');
    const recentDocs = JSON.parse(localStorage.getItem('recentDocuments') || '[]');
    
    const docRecord = {
        id: Date.now().toString(),
        type: type,
        name: name,
        date: new Date().toLocaleString('fr-FR'),
        data: data
    };
    
    history.unshift(docRecord);
    recentDocs.unshift(docRecord);
    
    if (history.length > 50) history.pop();
    if (recentDocs.length > 10) recentDocs.pop();
    
    localStorage.setItem('documentHistory', JSON.stringify(history));
    localStorage.setItem('recentDocuments', JSON.stringify(recentDocs));
};
