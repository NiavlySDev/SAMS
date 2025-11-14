// ===== DOCUMENT-MANAGER.JS - Gestion des Documents Médicaux =====

class DocumentManager {
    constructor() {
        this.currentDocument = null;
        this.documentType = null;
        this.signatureCanvas = null;
        this.signatureCtx = null;
        this.isDrawing = false;
        this.signatures = this.loadSignatures();
        this.autoSaveInterval = null;
        
        // Initialisation différée des paramètres URL
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initFromURL());
        } else {
            this.initFromURL();
        }
    }

    initFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const createType = urlParams.get('create');
        const draftId = urlParams.get('draft');
        
        if (createType) {
            this.showDocumentForm(createType);
            
            // Charger le brouillon si spécifié
            if (draftId) {
                setTimeout(() => this.loadDraft(draftId), 300);
            }
            
            // Démarrer la sauvegarde automatique
            this.startAutoSave();
        }
    }

    showDocumentForm(type) {
        this.documentType = type;
        let container = document.querySelector('.container');
        
        // Si le container n'existe pas, le créer
        if (!container) {
            container = document.createElement('div');
            container.className = 'container';
            
            // Trouver où l'insérer (après navbar ou au début du body)
            const navbar = document.getElementById('navbar-placeholder');
            if (navbar && navbar.nextSibling) {
                navbar.parentNode.insertBefore(container, navbar.nextSibling);
            } else {
                document.body.appendChild(container);
            }
        }
        
        switch(type) {
            case 'arret-travail':
                container.innerHTML = this.createArretTravailForm();
                break;
            case 'certificat-naissance':
                container.innerHTML = this.createCertificatNaissanceForm();
                break;
            case 'facture-hospitalisation':
                container.innerHTML = this.createFactureForm();
                break;
        }
        
        this.initFormEvents();
    }

    createArretTravailForm() {
        return `
            <div class="document-creator">
                <div class="document-header">
                    <div class="document-title">
                        <span style="font-size: 2em;">🩺</span>
                        <h2>Avis d'Arrêt de Travail</h2>
                        <div id="autosave-status" style="font-size: 0.8em; color: #666; margin-top: 5px;">
                            💾 Sauvegarde automatique activée (30s)
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="btn-back" onclick="documentManager.goBack()">◀ Retour</button>
                        <button class="btn-preview" onclick="documentManager.previewDocument()">👁 Aperçu</button>
                        <button class="btn-save-draft" onclick="documentManager.saveDraft()">💾 Sauvegarder</button>
                        <button class="btn-save" onclick="documentManager.finalizeDocument()">📄 Finaliser PDF</button>
                    </div>
                </div>

                <div class="form-section">
                    <h3>👤 Le Patient</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="patient-nom">Nom :</label>
                            <input type="text" id="patient-nom" placeholder="Nom du patient">
                        </div>
                        <div class="form-group">
                            <label for="patient-prenom">Prénom :</label>
                            <input type="text" id="patient-prenom" placeholder="Prénom du patient">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="patient-id">ID :</label>
                            <input type="text" id="patient-id" placeholder="Identifiant patient">
                        </div>
                        <div class="form-group">
                            <label for="patient-naissance">Date de naissance :</label>
                            <input type="date" id="patient-naissance">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="patient-age">Âge :</label>
                            <input type="number" id="patient-age" placeholder="Âge">
                        </div>
                        <div class="form-group">
                            <label for="patient-travail">Travail :</label>
                            <input type="text" id="patient-travail" placeholder="Profession">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="patient-adresse">Adresse :</label>
                        <textarea id="patient-adresse" placeholder="Adresse complète du patient"></textarea>
                    </div>
                </div>

                <div class="form-section">
                    <h3>👨‍⚕️ Le Médecin</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="medecin-nom">Nom :</label>
                            <input type="text" id="medecin-nom" placeholder="Nom du médecin">
                        </div>
                        <div class="form-group">
                            <label for="medecin-prenom">Prénom :</label>
                            <input type="text" id="medecin-prenom" placeholder="Prénom du médecin">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="medecin-id">ID :</label>
                            <input type="text" id="medecin-id" placeholder="Identifiant médecin">
                        </div>
                        <div class="form-group">
                            <label for="medecin-grade">Grade :</label>
                            <input type="text" id="medecin-grade" placeholder="Grade/Titre">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="arret-debut">Valable à partir du :</label>
                            <input type="date" id="arret-debut">
                        </div>
                        <div class="form-group">
                            <label for="arret-fin">Jusqu'au :</label>
                            <input type="date" id="arret-fin">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="travail-possible">Travail possible :</label>
                            <select id="travail-possible">
                                <option value="non">Non</option>
                                <option value="partiel">Partiellement</option>
                                <option value="oui">Oui</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="raison-arret">Raison de l'arrêt :</label>
                        <textarea id="raison-arret" placeholder="Détails médicaux justifiant l'arrêt de travail"></textarea>
                    </div>
                </div>

                ${this.createSignatureSection('medecin')}
            </div>

            <div id="arret-preview-container" class="document-preview-container" style="display: none;">
                <div class="document-preview" id="arret-preview">
                    <!-- Le contenu sera généré dynamiquement -->
                </div>
            </div>
        `;
    }

    createCertificatNaissanceForm() {
        return `
            <div class="document-creator">
                <div class="document-header">
                    <div class="document-title">
                        <span style="font-size: 2em;">👶</span>
                        <h2>Certificat de Naissance</h2>
                        <div id="autosave-status" style="font-size: 0.8em; color: #666; margin-top: 5px;">
                            💾 Sauvegarde automatique activée (30s)
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="btn-back" onclick="documentManager.goBack()">◀ Retour</button>
                        <button class="btn-preview" onclick="documentManager.previewDocument()">👁 Aperçu</button>
                        <button class="btn-save-draft" onclick="documentManager.saveDraft()">💾 Sauvegarder</button>
                        <button class="btn-save" onclick="documentManager.exportToPDF()">📄 Exporter PDF</button>
                    </div>
                </div>

                <div class="form-section">
                    <h3>👶 L'Enfant</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="enfant-nom">Nom :</label>
                            <input type="text" id="enfant-nom" placeholder="Nom de l'enfant">
                        </div>
                        <div class="form-group">
                            <label for="enfant-prenom">Prénom :</label>
                            <input type="text" id="enfant-prenom" placeholder="Prénom de l'enfant">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="enfant-id">ID :</label>
                            <input type="text" id="enfant-id" placeholder="Identifiant">
                        </div>
                        <div class="form-group">
                            <label for="enfant-naissance">Date de naissance :</label>
                            <input type="date" id="enfant-naissance">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="enfant-sexe">Sexe :</label>
                            <select id="enfant-sexe">
                                <option value="">Sélectionner</option>
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="enfant-heure">Heure de naissance :</label>
                            <input type="time" id="enfant-heure">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="enfant-taille">Taille :</label>
                            <input type="text" id="enfant-taille" placeholder="ex: 50 cm">
                        </div>
                        <div class="form-group">
                            <label for="enfant-poids">Poids :</label>
                            <input type="text" id="enfant-poids" placeholder="ex: 3.2 kg">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>👩 La Mère</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="mere-nom">Prénom et NOM :</label>
                            <input type="text" id="mere-nom" placeholder="Prénom et Nom de la mère">
                        </div>
                        <div class="form-group">
                            <label for="mere-naissance">Date de naissance :</label>
                            <input type="date" id="mere-naissance">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="mere-age">Âge :</label>
                            <input type="number" id="mere-age" placeholder="Âge">
                        </div>
                        <div class="form-group">
                            <label for="mere-nationalite">Nationalité :</label>
                            <input type="text" id="mere-nationalite" placeholder="Nationalité">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>👨 Le Père</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="pere-nom">Prénom et NOM :</label>
                            <input type="text" id="pere-nom" placeholder="Prénom et Nom du père">
                        </div>
                        <div class="form-group">
                            <label for="pere-naissance">Date de naissance :</label>
                            <input type="date" id="pere-naissance">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="pere-age">Âge :</label>
                            <input type="number" id="pere-age" placeholder="Âge">
                        </div>
                        <div class="form-group">
                            <label for="pere-nationalite">Nationalité :</label>
                            <input type="text" id="pere-nationalite" placeholder="Nationalité">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>👨‍⚕️ Le Médecin</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="medecin-certificat-nom">Prénom et NOM :</label>
                            <input type="text" id="medecin-certificat-nom" placeholder="Prénom et Nom du médecin">
                        </div>
                        <div class="form-group">
                            <label for="medecin-certificat-id">ID :</label>
                            <input type="text" id="medecin-certificat-id" placeholder="Identifiant médecin">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>✍️ Signatures</h3>
                    <div class="signature-container">
                        <div class="signature-section">
                            <h4>👨‍⚕️ Signature Médecin (automatique)</h4>
                            <div id="medecin-signature-preview" class="signature-preview-area">
                                ${this.getMedecinSignaturePreview()}
                            </div>
                            <p style="color: #666; font-size: 0.9em;">
                                💡 La signature est automatiquement récupérée depuis vos signatures sauvegardées
                            </p>
                        </div>
                        
                        <div class="signature-section">
                            <h4>👨‍👩‍👧‍👦 Signature des Parents</h4>
                            <div class="signature-upload-area" onclick="documentManager.uploadSignature('parents')">
                                <div class="upload-placeholder" id="parents-signature-placeholder">
                                    <span style="font-size: 3em;">📄</span>
                                    <p>Cliquez pour télécharger<br>la signature des parents</p>
                                </div>
                                <img id="parents-signature-img" style="display: none; max-width: 100%; height: 100px; object-fit: contain;">
                            </div>
                            <input type="file" id="parents-signature-input" accept="image/*" style="display: none;">
                        </div>
                    </div>
                </div>
            </div>

            <div id="certificat-preview-container" class="document-preview-container" style="display: none;">
                <div class="document-preview" id="certificat-preview">
                    <!-- Le contenu sera généré dynamiquement -->
                </div>
            </div>
        `;
    }

    createFactureForm() {
        return `
            <div class="document-creator">
                <div class="document-header">
                    <div class="document-title">
                        <span style="font-size: 2em;">🏥</span>
                        <h2>Facture d'Hospitalisation</h2>
                        <div id="autosave-status" style="font-size: 0.8em; color: #666; margin-top: 5px;">
                            💾 Sauvegarde automatique activée (30s)
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="btn-back" onclick="documentManager.goBack()">◀ Retour</button>
                        <button class="btn-preview" onclick="documentManager.previewDocument()">👁 Aperçu</button>
                        <button class="btn-save-draft" onclick="documentManager.saveDraft()">💾 Sauvegarder</button>
                        <button class="btn-save" onclick="documentManager.finalizeDocument()">📄 Finaliser PDF</button>
                    </div>
                </div>

                <div class="form-section">
                    <h3>🏥 Informations Patient</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="facture-patient">Patient :</label>
                            <input type="text" id="facture-patient" placeholder="Nom et prénom du patient">
                        </div>
                        <div class="form-group">
                            <label for="facture-medecin">Médecin traitant :</label>
                            <input type="text" id="facture-medecin" placeholder="Nom du médecin">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>💊 Détails des Frais Médicaux</h3>
                    <div id="frais-container">
                        <!-- Soins -->
                        <div class="frais-item">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Description des services :</label>
                                    <input type="text" class="frais-type-label" value="Soins" readonly>
                                </div>
                                <div class="form-group">
                                    <label>Quantité :</label>
                                    <input type="number" class="frais-quantite" placeholder="0" value="0" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Prix Unitaire ($) :</label>
                                    <input type="number" class="frais-prix" placeholder="0.00" value="0" step="0.01" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Total ($) :</label>
                                    <input type="text" class="frais-total" value="0.00 $" readonly>
                                </div>
                            </div>
                        </div>
                        <!-- Médicaments -->
                        <div class="frais-item">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Description des services :</label>
                                    <input type="text" class="frais-type-label" value="Médicaments" readonly>
                                </div>
                                <div class="form-group">
                                    <label>Quantité :</label>
                                    <input type="number" class="frais-quantite" placeholder="0" value="0" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Prix Unitaire ($) :</label>
                                    <input type="number" class="frais-prix" placeholder="0.00" value="0" step="0.01" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Total ($) :</label>
                                    <input type="text" class="frais-total" value="0.00 $" readonly>
                                </div>
                            </div>
                        </div>
                        <!-- Radiologie -->
                        <div class="frais-item">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Description des services :</label>
                                    <input type="text" class="frais-type-label" value="Radiologie / Imagerie médicale" readonly>
                                </div>
                                <div class="form-group">
                                    <label>Quantité :</label>
                                    <input type="number" class="frais-quantite" placeholder="0" value="0" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Prix Unitaire ($) :</label>
                                    <input type="number" class="frais-prix" placeholder="0.00" value="0" step="0.01" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Total ($) :</label>
                                    <input type="text" class="frais-total" value="0.00 $" readonly>
                                </div>
                            </div>
                        </div>
                        <!-- Chirurgie -->
                        <div class="frais-item">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Description des services :</label>
                                    <input type="text" class="frais-type-label" value="Chirurgie (si applicable)" readonly>
                                </div>
                                <div class="form-group">
                                    <label>Quantité :</label>
                                    <input type="number" class="frais-quantite" placeholder="0" value="0" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Prix Unitaire ($) :</label>
                                    <input type="number" class="frais-prix" placeholder="0.00" value="0" step="0.01" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Total ($) :</label>
                                    <input type="text" class="frais-total" value="0.00 $" readonly>
                                </div>
                            </div>
                        </div>
                        <!-- Autres frais -->
                        <div class="frais-item">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Description des services :</label>
                                    <input type="text" class="frais-type-label" value="Autres frais (précisez)" readonly>
                                </div>
                                <div class="form-group">
                                    <label>Quantité :</label>
                                    <input type="number" class="frais-quantite" placeholder="0" value="0" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Prix Unitaire ($) :</label>
                                    <input type="number" class="frais-prix" placeholder="0.00" value="0" step="0.01" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Total ($) :</label>
                                    <input type="text" class="frais-total" value="0.00 $" readonly>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="facture-totals">
                        <div class="total-line">
                            <strong>Total des frais d'hospitalisation : <span id="facture-total-general">0.00 $</span></strong>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>📍 Informations Complémentaires</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="facture-lieu">Fait à :</label>
                            <input type="text" id="facture-lieu" value="Los Santos" placeholder="Lieu">
                        </div>
                        <div class="form-group">
                            <label for="facture-date-signature">Le :</label>
                            <input type="text" id="facture-date-signature" placeholder="XX/XX/20XX">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="medecin-facture-nom">Nom, Prénom | ID :</label>
                            <input type="text" id="medecin-facture-nom" placeholder="[Nom Prénom | ID]">
                        </div>
                        <div class="form-group">
                            <label for="medecin-facture-grade">Grade :</label>
                            <input type="text" id="medecin-facture-grade" placeholder="[Grade]">
                        </div>
                    </div>
                </div>

                ${this.createSignatureSection('medecin-facture')}
            </div>

            <div id="facture-preview-container" class="document-preview-container" style="display: none;">
                <div class="document-preview" id="facture-preview">
                    <!-- Le contenu sera généré dynamiquement -->
                </div>
            </div>
        `;
    }

    createSignatureSection(type = 'medecin') {
        const savedSignature = this.getAutoSignature();
        
        return `
            <div class="signature-section">
                <h3>✍️ Signature du Médecin</h3>
                
                ${savedSignature ? `
                    <div class="auto-signature-display" style="border: 2px solid #22c55e; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #f0fff4;">
                        <h4 style="color: #22c55e; margin: 0 0 10px 0;">✅ Signature automatique détectée</h4>
                        <div class="signature-preview" style="min-height: 60px; display: flex; align-items: center; justify-content: center;">
                            ${savedSignature}
                        </div>
                        <p style="margin: 10px 0 0 0; color: #666; font-size: 0.9em;">
                            Cette signature sera automatiquement utilisée dans vos documents.
                            <a href="parametres.html#signatures" target="_blank">Modifier dans les paramètres</a>
                        </p>
                    </div>
                ` : `
                    <div class="no-signature-warning" style="border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #fffbf0;">
                        <h4 style="color: #f59e0b; margin: 0 0 10px 0;">⚠️ Aucune signature sauvegardée</h4>
                        <p style="margin: 0; color: #666;">
                            <a href="parametres.html#signatures" target="_blank">Créez votre signature</a> pour l'utiliser automatiquement dans tous vos documents.
                        </p>
                    </div>
                `}
                
                <div class="signature-tabs">
                    <button class="signature-tab active" onclick="documentManager.switchSignatureTab('${type}', 'draw')">
                        🖊️ Dessiner
                    </button>
                    <button class="signature-tab" onclick="documentManager.switchSignatureTab('${type}', 'text')">
                        📝 Texte
                    </button>
                    <button class="signature-tab" onclick="documentManager.switchSignatureTab('${type}', 'saved')">
                        💾 Signatures sauvées
                    </button>
                </div>
                
                <div class="signature-content">
                    <div id="${type}-signature-draw" class="signature-draw-content">
                        <canvas class="signature-canvas" id="${type}-signature-canvas" width="400" height="150"></canvas>
                        <div style="margin-top: 10px;">
                            <button class="btn-sm" onclick="documentManager.clearSignature('${type}')">🗑️ Effacer</button>
                            <button class="btn-sm" onclick="documentManager.saveSignature('${type}')">💾 Sauvegarder</button>
                        </div>
                    </div>
                    
                    <div id="${type}-signature-text" class="signature-text-options">
                        <div class="form-group">
                            <label for="${type}-signature-text-input">Votre nom :</label>
                            <input type="text" id="${type}-signature-text-input" placeholder="Tapez votre nom">
                        </div>
                        <div class="font-selector">
                            <div class="font-option" data-font="script" onclick="documentManager.selectFont('${type}', 'script')">
                                <div class="font-preview signature-font-script">Signature</div>
                                <div class="font-name">Script</div>
                            </div>
                            <div class="font-option" data-font="elegant" onclick="documentManager.selectFont('${type}', 'elegant')">
                                <div class="font-preview signature-font-elegant">Signature</div>
                                <div class="font-name">Élégant</div>
                            </div>
                            <div class="font-option" data-font="formal" onclick="documentManager.selectFont('${type}', 'formal')">
                                <div class="font-preview signature-font-formal">Signature</div>
                                <div class="font-name">Formel</div>
                            </div>
                            <div class="font-option" data-font="modern" onclick="documentManager.selectFont('${type}', 'modern')">
                                <div class="font-preview signature-font-modern">Signature</div>
                                <div class="font-name">Moderne</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="${type}-signature-saved" class="signature-saved-options" style="display: none;">
                        <div id="${type}-saved-signatures-list">
                            <!-- Signatures sauvegardées chargées dynamiquement -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createParentSignatureSection() {
        return `
            <div class="signature-section">
                <h3>✍️ Signatures des Parents</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h4>Signature du médecin</h4>
                        <div class="signature-upload-area" onclick="documentManager.uploadSignature('medecin')">
                            <div class="upload-placeholder" id="medecin-signature-placeholder">
                                <span style="font-size: 3em;">📝</span>
                                <p>Cliquez pour télécharger<br>la signature du médecin</p>
                            </div>
                            <img id="medecin-signature-img" style="display: none; max-width: 100%; height: 100px; object-fit: contain;">
                        </div>
                        <input type="file" id="medecin-signature-input" accept="image/*" style="display: none;">
                    </div>
                    
                    <div>
                        <h4>Signature des parents</h4>
                        <div class="signature-upload-area" onclick="documentManager.uploadSignature('parents')">
                            <div class="upload-placeholder" id="parents-signature-placeholder">
                                <span style="font-size: 3em;">✍️</span>
                                <p>Cliquez pour télécharger<br>la signature des parents</p>
                            </div>
                            <img id="parents-signature-img" style="display: none; max-width: 100%; height: 100px; object-fit: contain;">
                        </div>
                        <input type="file" id="parents-signature-input" accept="image/*" style="display: none;">
                    </div>
                </div>
            </div>
        `;
    }

    initFormEvents() {
        // Initialiser les événements du formulaire
        const signatureInputs = document.querySelectorAll('input[type="file"]');
        signatureInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileUpload(e);
            });
        });

        // Initialiser le calcul des frais pour la facture
        if (this.documentType === 'facture-hospitalisation') {
            // Petit délai pour s'assurer que le DOM est prêt
            setTimeout(() => {
                this.setupFraisCalculation();
            }, 100);
        }
    }

    goBack() {
        // Sauvegarder automatiquement avant de partir
        this.saveDraftSilently();
        
        // Arrêter la sauvegarde automatique
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        
        window.location.href = 'documents.html';
    }

    previewDocument() {
        // S'assurer que le type de document est défini
        if (!this.documentType) {
            const urlParams = new URLSearchParams(window.location.search);
            this.documentType = urlParams.get('create');
            console.log('🔄 Type de document récupéré depuis URL pour aperçu:', this.documentType);
        }
        
        console.log(`=== Génération aperçu pour: ${this.documentType} ===`);
        const formData = this.collectFormData();
        
        // Déterminer le conteneur selon le type de document
        let containerId = '';
        let previewId = '';
        let previewContent = '';
        
        switch(this.documentType) {
            case 'arret-travail':
                containerId = 'arret-preview-container';
                previewId = 'arret-preview';
                previewContent = this.generateArretTravailPreview(formData);
                break;
            case 'certificat-naissance':
                containerId = 'certificat-preview-container';
                previewId = 'certificat-preview';
                previewContent = this.generateCertificatNaissancePreview(formData);
                break;
            case 'facture-hospitalisation':
                containerId = 'facture-preview-container';
                previewId = 'facture-preview';
                previewContent = this.generateFacturePreview(formData);
                break;
            default:
                console.error(`Type de document non reconnu: ${this.documentType}`);
                return;
        }

        console.log(`Recherche conteneur: ${containerId}`);
        console.log(`Recherche div: ${previewId}`);
        
        const previewContainer = document.getElementById(containerId);
        const previewDiv = document.getElementById(previewId);
        
        if (!previewContainer) {
            console.error(`❌ Container d'aperçu non trouvé: ${containerId}`);
            console.log('Éléments disponibles:', Array.from(document.querySelectorAll('[id*="preview"]')).map(el => el.id));
            return;
        }
        
        if (!previewDiv) {
            console.error(`❌ Div d'aperçu non trouvé: ${previewId}`);
            return;
        }

        console.log(`✅ Conteneurs trouvés, génération de l'aperçu...`);
        previewDiv.innerHTML = previewContent;
        previewContainer.style.display = 'block';
        previewContainer.scrollIntoView({ behavior: 'smooth' });
        
        console.log(`✅ Aperçu généré avec succès pour: ${this.documentType}`);
    }

    exportToPDF() {
        console.log('🚀 exportToPDF() wrapper synchrone');
        this.exportToPDFAsync().catch(console.error);
    }

    async exportToPDFAsync() {
        console.log('🚀 DÉBUT exportToPDFAsync()');
        
        // S'assurer que le type de document est défini
        if (!this.documentType) {
            const urlParams = new URLSearchParams(window.location.search);
            this.documentType = urlParams.get('create');
            console.log('🔄 Type de document récupéré depuis URL:', this.documentType);
        }
        
        console.log(`=== Export PDF pour: ${this.documentType} ===`);
        const formData = this.collectFormData();
        
        console.log('🔄 Données collectées, poursuite export...');
        
        // Vérifier que jsPDF est chargé
        console.log('🔍 Début vérification jsPDF...');
        console.log('Vérification jsPDF:', {
            'window.jspdf': typeof window.jspdf,
            'window.jsPDF': typeof window.jsPDF,
            'window.jspdf.jsPDF': window.jspdf ? typeof window.jspdf.jsPDF : 'undefined'
        });
        
        let jsPDFClass = null;
        if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFClass = window.jspdf.jsPDF;
            console.log('✅ jsPDF trouvé via window.jspdf.jsPDF');
        } else if (window.jsPDF) {
            jsPDFClass = window.jsPDF;
            console.log('✅ jsPDF trouvé via window.jsPDF');
        } else {
            console.error('❌ jsPDF n\'est pas chargé');
            alert('Erreur: jsPDF non disponible. Vérifiez votre connexion internet et rechargez la page.');
            return;
        }

        console.log('📄 Création du document PDF...');
        try {
            const doc = new jsPDFClass();
            console.log('✅ Document PDF créé');
        
            // Générer le PDF selon le type de document
            console.log(`🔄 Génération contenu PDF pour: ${this.documentType}`);
            console.log('🔄 Données du formulaire:', formData);
            
            try {
                switch(this.documentType) {
                    case 'arret-travail':
                        console.log('🔄 Appel generateArretTravailPDF...');
                        await this.generateArretTravailPDF(doc, formData);
                        console.log('✅ generateArretTravailPDF terminé');
                        break;
                    case 'certificat-naissance':
                        console.log('🔄 Appel generateCertificatNaissancePDF...');
                        await this.generateCertificatNaissancePDF(doc, formData);
                        console.log('✅ generateCertificatNaissancePDF terminé');
                        break;
                    case 'facture-hospitalisation':
                        console.log('🔄 Appel generateFacturePDF...');
                        await this.generateFacturePDF(doc, formData);
                        console.log('✅ generateFacturePDF terminé');
                        break;
                    default:
                        console.error(`Type de document non supporté: ${this.documentType}`);
                        alert(`Erreur: Type de document non supporté: ${this.documentType}`);
                        return;
                }
            } catch (pdfGenError) {
                console.error('❌ Erreur dans la génération du contenu PDF:', pdfGenError);
                throw pdfGenError;
            }

            // Générer un nom de fichier descriptif
            let filename;
            if (this.documentType) {
                const typeNames = {
                    'arret-travail': 'Arret_de_travail',
                    'certificat-naissance': 'Certificat_naissance', 
                    'facture-hospitalisation': 'Facture_hospitalisation'
                };
                const typeName = typeNames[this.documentType] || this.documentType;
                
                // Ajouter des infos du patient si disponible
                const patientName = formData['patient-nom'] || formData['enfant-nom'] || '';
                const patientPrenom = formData['patient-prenom'] || formData['enfant-prenom'] || '';
                const patientInfo = patientName && patientPrenom ? `_${patientPrenom}_${patientName}` : '';
                
                filename = `${typeName}${patientInfo}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
            } else {
                filename = `Document_${new Date().getTime()}.pdf`;
            }
            
            console.log(`💾 Sauvegarde PDF: ${filename}`);
            doc.save(filename);
            
            // Sauvegarder dans l'historique
            this.saveToHistory(formData, filename);
            console.log('✅ Export PDF terminé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'export PDF:', error);
            alert(`Erreur lors de l'export PDF: ${error.message}`);
        }
    }

    collectFormData() {
        const formData = {};
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.type === 'file') {
                // Pour les fichiers, on stocke l'information qu'il y a un fichier
                if (input.files && input.files[0]) {
                    formData[input.id] = input.files[0].name;
                }
            } else if (input.id) { // S'assurer que l'input a un ID
                formData[input.id] = input.value;
            }
        });

        // Collecte spéciale des frais pour la facture
        if (this.documentType === 'facture-hospitalisation') {
            const fraisData = [];
            const fraisContainer = document.getElementById('frais-container');
            if (fraisContainer) {
                const fraisItems = fraisContainer.querySelectorAll('.frais-item');
                fraisItems.forEach(item => {
                    const description = item.querySelector('.frais-type-label')?.value || '';
                    const quantite = item.querySelector('.frais-quantite')?.value || '0';
                    const prix = item.querySelector('.frais-prix')?.value || '0';
                    const total = item.querySelector('.frais-total')?.value || '0.00 $';
                    
                    fraisData.push({
                        description,
                        quantite,
                        prix,
                        total
                    });
                });
            }
            formData['frais-data'] = fraisData;
        }

        // Collecte des signatures pour tous les types
        const signatures = this.loadSignatures();
        console.log('🖋️ Signatures chargées depuis localStorage:', signatures);
        if (signatures && Object.keys(signatures).length > 0) {
            formData['signatures-data'] = signatures;
            console.log('✅ Signatures ajoutées aux données du formulaire');
        } else {
            console.log('⚠️ Aucune signature trouvée dans localStorage');
        }
        
        console.log('Données collectées:', formData);
        return formData;
    }

    formatDate(dateString) {
        if (!dateString) return '........................';
        
        // Si c'est déjà au format JJ/MM/AAAA, le garder
        if (dateString.includes('/')) return dateString;
        
        // Si c'est au format AAAA-MM-JJ, le convertir
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
        
        return dateString;
    }

    addDottedLine(doc, ...args) {
        if (args.length === 3) {
            // Version simple: addDottedLine(doc, startX, y, endX)
            const [startX, y, endX] = args;
            doc.setDrawColor(180, 180, 180); // Gris plus clair
            doc.setLineWidth(0.3); // Plus fine
            doc.setLineDashPattern([0.8, 1.5], 0); // Points plus petits et espacés
            doc.line(startX, y, endX, y);
            doc.setLineDashPattern([], 0); // Reset
            doc.setLineWidth(0.5); // Reset épaisseur par défaut
        } else if (args.length >= 4) {
            // Version avec label: addDottedLine(doc, label, value, x, y, maxWidth)
            const [label, value, x, y, maxWidth = 160] = args;
            
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            
            // Afficher le label
            doc.text(`${label} :`, x, y);
            
            // Calculer la position de départ de la ligne
            const labelWidth = doc.getTextWidth(`${label} : `);
            const lineStartX = x + labelWidth + 2;
            const lineEndX = x + maxWidth;
            const lineY = y - 1;
            
            // Afficher la valeur si elle existe
            if (value && value.trim() !== '') {
                doc.text(value, lineStartX + 2, y);
                const valueWidth = doc.getTextWidth(value);
                
                // Ligne pointillée après la valeur (plus fine)
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.2);
                doc.setLineDashPattern([0.5, 1], 0);
                doc.line(lineStartX + valueWidth + 4, lineY, lineEndX, lineY);
                doc.setLineDashPattern([], 0);
            } else {
                // Ligne pointillée complète si pas de valeur (plus fine)
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.2);
                doc.setLineDashPattern([0.5, 1], 0);
                doc.line(lineStartX, lineY, lineEndX, lineY);
                doc.setLineDashPattern([], 0);
            }
        }
    }

    generateArretTravailPreview(data) {
        const signatures = this.loadSignatures();
        let doctorSignature = '';
        
        // Récupérer la signature du médecin
        if (signatures.personal && Object.keys(signatures.personal).length > 0) {
            const firstSignature = Object.values(signatures.personal)[0];
            if (firstSignature.type === 'draw') {
                doctorSignature = `<img src="${firstSignature.data}" style="max-width:200px;height:60px;">`;
            } else {
                doctorSignature = `<div class="signature-font-${firstSignature.font}" style="font-size:18px;">${firstSignature.text}</div>`;
            }
        }

        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: white; border: 1px solid #ccc;">
                <!-- En-tête avec logo -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="images/sams-logo.png" alt="SAMS Logo" style="width: 80px; height: 80px; margin-bottom: 10px;">
                    <div style="color: #dc3545; font-size: 14px; margin-bottom: 5px;">San Andreas Medical Services</div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px;">
                        <span>Hôpital Central</span>
                        <span style="text-decoration: underline;">Eclipse Medical Tower</span>
                    </div>
                    <h1 style="font-size: 18px; font-weight: bold; text-decoration: underline; margin: 20px 0;">Avis d'arrêt de travail</h1>
                </div>
                
                <!-- Section Patient -->
                <div style="background: #b3d4fc; padding: 8px; margin-bottom: 15px;">
                    <div style="text-align: center; font-weight: bold; color: #333;">Le patient</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
                    <tr>
                        <td style="width: 20%; text-align: right; padding: 3px;"><strong>NOM :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">${data['facture-patient'] || '........................'}</td>
                        <td style="width: 20%; text-align: right; padding: 3px;"><strong>Prénom :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">........................</td>
                    </tr>
                    <tr>
                        <td style="text-align: right; padding: 3px;"><strong>ID :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">........................</td>
                        <td style="text-align: right; padding: 3px;"><strong>Date de naissance :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">........................</td>
                    </tr>
                    <tr>
                        <td style="text-align: right; padding: 3px;"><strong>Âge :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">........................</td>
                        <td style="text-align: right; padding: 3px;"><strong>Travail :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">${data['patient-travail'] || '........................'}</td>
                    </tr>
                    <tr>
                        <td style="text-align: right; padding: 3px; vertical-align: top;"><strong>Adresse :</strong></td>
                        <td colspan="3" style="border-bottom: 1px dotted #000; padding: 3px;">${data['patient-adresse'] || '................................................................................................................................................................'}</td>
                    </tr>
                </table>

                <!-- Section Médecin -->
                <div style="background: #b3d4fc; padding: 8px; margin-bottom: 15px;">
                    <div style="text-align: center; font-weight: bold; color: #333;">Le médecin</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
                    <tr>
                        <td style="width: 20%; text-align: right; padding: 3px;"><strong>NOM :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px; width: 30%;">${data['facture-medecin'] || '........................'}</td>
                        <td style="width: 20%; text-align: right; padding: 3px;"><strong>Prénom :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">........................</td>
                    </tr>
                    <tr>
                        <td style="text-align: right; padding: 3px;"><strong>ID :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">........................</td>
                        <td style="text-align: right; padding: 3px;"><strong>Grade :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">........................</td>
                    </tr>
                </table>
                


                <!-- Signatures -->
                <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                    <div style="text-align: center; width: 45%;">
                        <div style="color: #1976d2; font-weight: bold; font-size: 12px; margin-bottom: 5px;">Signature du médecin :</div>
                        <div style="height: 60px; border-bottom: 1px solid #000; margin-bottom: 5px; display: flex; align-items: center; justify-content: center;">
                            ${doctorSignature}
                        </div>
                    </div>
                    <div style="width: 10px;"></div>
                    <div style="text-align: center; width: 45%;">
                        <div style="color: #1976d2; font-weight: bold; font-size: 12px; margin-bottom: 5px;">Date et heure :</div>
                        <div style="height: 60px; border-bottom: 1px solid #000; margin-bottom: 5px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 12px;">
                            <div>${new Date().toLocaleDateString('fr-FR')}</div>
                            <div>${new Date().toLocaleTimeString('fr-FR')}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateArretTravailPDF(doc, data) {
        // Configuration de base
        doc.setFont('helvetica');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Logo SAMS centré en haut
        await this.addSAMSLogo(doc, pageWidth/2 - 15, 15, 30, 30);
        
        // Titre "San Andreas Medical Services" en rouge
        doc.setFontSize(10);
        doc.setTextColor(220, 53, 69);
        doc.text('San Andreas Medical Services', pageWidth/2, 50, { align: 'center' });
        
        // En-tête hôpitaux (comme dans l'aperçu)
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text('Hôpital Central', 20, 20);
        doc.text('Eclipse Medical Tower', pageWidth - 20, 20, { align: 'right' });
        
        // Titre principal (comme dans l'aperçu)
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Avis d\'arrêt de travail', pageWidth/2, 65, { align: 'center' });
        doc.line(60, 67, pageWidth - 60, 67); // Ligne sous le titre
        
        // Section Patient (fond bleu comme dans l'aperçu)
        doc.setFillColor(173, 216, 230); // Bleu clair plus visible
        doc.rect(20, 75, pageWidth - 40, 12, 'F'); // Plus haute
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Le patient', pageWidth/2, 83, { align: 'center' });
        
        // Données patient en tableau
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        let yPos = 95; // Ajusté pour tenir compte du rectangle plus haut
        
        // Ligne 1: NOM et Prénom
        doc.text('NOM :', 25, yPos);
        doc.text(data['patient-nom'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Prénom :', 100, yPos);
        doc.text(data['patient-prenom'] || '', 125, yPos);
        this.addDottedLine(doc, 125, yPos + 1, pageWidth - 25);
        
        yPos += 12;
        
        // Ligne 2: ID et Date de naissance  
        doc.text('ID :', 25, yPos);
        doc.text(data['patient-id'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Date de naissance :', 100, yPos);
        doc.text(this.formatDate(data['patient-naissance']) || '', 140, yPos);
        this.addDottedLine(doc, 140, yPos + 1, pageWidth - 25);
        
        yPos += 12;
        
        // Ligne 3: Âge et Travail
        doc.text('Age :', 25, yPos);
        doc.text(data['patient-age'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Travail :', 100, yPos);
        doc.text(data['patient-travail'] || '', 125, yPos);
        this.addDottedLine(doc, 125, yPos + 1, pageWidth - 25);
        
        yPos += 12;
        
        // Adresse
        doc.text('Adresse :', 25, yPos);
        doc.text(data['patient-adresse'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, pageWidth - 25);
        
        yPos += 20;
        
        // Section Médecin (fond bleu comme dans l'aperçu)
        doc.setFillColor(173, 216, 230); // Bleu clair plus visible
        doc.rect(20, yPos, pageWidth - 40, 12, 'F'); // Plus haute
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Le médecin', pageWidth/2, yPos + 8, { align: 'center' });
        
        yPos += 18; // Ajusté pour tenir compte du rectangle plus haut
        
        // Données médecin
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // Ligne 1: NOM et Prénom médecin
        doc.text('NOM :', 25, yPos);
        doc.text(data['medecin-nom'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Prénom :', 100, yPos);
        doc.text(data['medecin-prenom'] || '', 125, yPos);
        this.addDottedLine(doc, 125, yPos + 1, pageWidth - 25);
        
        yPos += 12;
        
        // Ligne 2: ID et Grade médecin
        doc.text('ID :', 25, yPos);
        doc.text(data['medecin-id'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Grade :', 100, yPos);
        doc.text(data['medecin-grade'] || '', 125, yPos);
        this.addDottedLine(doc, 125, yPos + 1, pageWidth - 25);
        
        yPos += 20;
        
        // Informations arrêt
        doc.text('Valable à partir du :', 25, yPos);
        doc.text(this.formatDate(data['arret-debut']) || '', 70, yPos);
        this.addDottedLine(doc, 70, yPos + 1, pageWidth - 25);
        
        yPos += 12;
        
        doc.text('Jusqu\'au :', 25, yPos);
        doc.text(this.formatDate(data['arret-fin']) || '', 50, yPos);
        this.addDottedLine(doc, 50, yPos + 1, pageWidth - 25);
        
        yPos += 12;
        
        doc.text('Travail possible :', 25, yPos);
        const travailPossible = data['travail-possible'] === 'non' ? 'Non' : (data['travail-possible'] || '');
        doc.text(travailPossible, 70, yPos);
        this.addDottedLine(doc, 70, yPos + 1, pageWidth - 25);
        
        yPos += 12;
        
        doc.text('Raison de l\'arrêt :', 25, yPos);
        doc.text(data['raison-arret'] || '', 70, yPos);
        this.addDottedLine(doc, 70, yPos + 1, pageWidth - 25);
        
        yPos += 20;
        
        // Signatures
        doc.setTextColor(25, 118, 210); // Bleu
        doc.setFont('helvetica', 'bold');
        doc.text('Signature du médecin :', 30, yPos);
        doc.text('Date et heure :', pageWidth - 80, yPos);
        
        yPos += 15;
        
        // Lignes pour signatures
        doc.setDrawColor(0, 0, 0);
        doc.line(30, yPos, 90, yPos); // Ligne signature médecin
        doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos); // Ligne date
        
        // Afficher la date et l'heure actuelles
        const currentDate = new Date();
        const currentDateStr = currentDate.toLocaleDateString('fr-FR');
        const currentTimeStr = currentDate.toLocaleTimeString('fr-FR');
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(currentDateStr, pageWidth - 50, yPos - 3, { align: 'center' });
        doc.text(currentTimeStr, pageWidth - 50, yPos - 12, { align: 'center' });
        
        // Signature automatique si disponible
        const signatures = this.loadSignatures();
        if (signatures.personal && Object.keys(signatures.personal).length > 0) {
            const firstSignature = Object.values(signatures.personal)[0];
            if (firstSignature.type === 'text') {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(12);
                doc.text(firstSignature.text, 60, yPos - 3, { align: 'center' });
            }
        }
    }

    generateCertificatNaissancePreview(data) {
        const signatures = this.loadSignatures();
        let doctorSignature = '';
        let parentSignature = '';
        
        // Récupérer la signature du médecin
        if (signatures.personal && Object.keys(signatures.personal).length > 0) {
            const firstSignature = Object.values(signatures.personal)[0];
            if (firstSignature.type === 'draw') {
                doctorSignature = `<img src="${firstSignature.data}" style="max-width:200px;height:60px;">`;
            } else {
                doctorSignature = `<div class="signature-font-${firstSignature.font}" style="font-size:18px;">${firstSignature.text}</div>`;
            }
        }

        // Récupérer la signature des parents
        if (signatures.parents && Object.keys(signatures.parents).length > 0) {
            const firstParentSignature = Object.values(signatures.parents)[0];
            if (firstParentSignature.type === 'draw') {
                parentSignature = `<img src="${firstParentSignature.data}" style="max-width:200px;height:60px;">`;
            } else {
                parentSignature = `<div class="signature-font-${firstParentSignature.font}" style="font-size:18px;">${firstParentSignature.text}</div>`;
            }
        } else {
            // Afficher un message si pas de signature des parents
            parentSignature = `<div style="font-style: italic; color: #666; font-size: 12px; text-align: center; margin-top: 30px;">Aucune signature des parents<br><small><a href="parametres.html#signatures" target="_blank" style="color: #007bff;">Cliquez ici pour créer une signature des parents</a></small></div>`;
        }

        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; background: white;">
                <!-- En-tête avec logo SAMS -->
                <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2c5aa0; padding-bottom: 20px;">
                    <img src="./images/sams-logo.png" alt="SAMS Logo" style="width: 80px; height: 80px; margin: 0 auto 15px; display: block;">
                    <h2 style="color: #e74c3c; margin: 10px 0 0 0; font-size: 14px; font-weight: normal;">San Andreas Medical Services</h2>
                </div>

                <!-- En-tête hôpitaux -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px;">
                    <div><strong>Hôpital Central</strong></div>
                    <div><strong>Eclipse Medical Tower</strong></div>
                </div>

                <!-- Titre principal -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #000; margin: 0; font-size: 18px; font-weight: bold; text-decoration: underline;">Certificat de naissance</h1>
                </div>

                <!-- Section L'enfant -->
                <div style="background: #90EE90; padding: 8px; text-align: center; margin-bottom: 15px; font-weight: bold; font-size: 14px;">
                    L'enfant
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 5px; vertical-align: top; width: 25%;"><strong>NOM :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px; width: 25%;">${data['enfant-nom'] || '........................'}</td>
                        <td style="padding: 5px; vertical-align: top; width: 25%;"><strong>Prénom :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px; width: 25%;">${data['enfant-prenom'] || '........................'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; vertical-align: top;"><strong>ID :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${data['enfant-id'] || '........................'}</td>
                        <td style="padding: 5px; vertical-align: top;"><strong>Date de naissance :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${this.formatDate(data['enfant-naissance']) || '........................'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; vertical-align: top;"><strong>Sexe :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${data['enfant-sexe'] || '........................'}</td>
                        <td style="padding: 5px; vertical-align: top;"><strong>Heure de naissance :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${data['enfant-heure'] || '........................'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; vertical-align: top;"><strong>Taille :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${data['enfant-taille'] || '........................'}</td>
                        <td style="padding: 5px; vertical-align: top;"><strong>Poids :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${data['enfant-poids'] || '........................'}</td>
                    </tr>
                </table>

                <!-- Section La mère -->
                <div style="background: #90EE90; padding: 8px; text-align: center; margin-bottom: 15px; font-weight: bold; font-size: 14px;">
                    La mère
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 5px; vertical-align: top; width: 25%;"><strong>Prénom et NOM :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px; width: 25%;">${data['mere-nom'] || '........................'}</td>
                        <td style="padding: 5px; vertical-align: top; width: 25%;"><strong>Date de naissance :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px; width: 25%;">${this.formatDate(data['mere-naissance']) || '........................'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; vertical-align: top;"><strong>Âge :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${data['mere-age'] || '........................'}</td>
                        <td style="padding: 5px; vertical-align: top;"><strong>Nationalité :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${data['mere-nationalite'] || '........................'}</td>
                    </tr>
                </table>

                <!-- Section Le père -->
                <div style="background: #90EE90; padding: 8px; text-align: center; margin-bottom: 15px; font-weight: bold; font-size: 14px;">
                    Le père
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 5px; vertical-align: top; width: 25%;"><strong>Prénom et NOM :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px; width: 25%;">${data['pere-nom'] || '........................'}</td>
                        <td style="padding: 5px; vertical-align: top; width: 25%;"><strong>Date de naissance :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px; width: 25%;">${this.formatDate(data['pere-naissance']) || '........................'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; vertical-align: top;"><strong>Âge :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${data['pere-age'] || '........................'}</td>
                        <td style="padding: 5px; vertical-align: top;"><strong>Nationalité :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px;">${data['pere-nationalite'] || '........................'}</td>
                    </tr>
                </table>

                <!-- Section Le médecin -->
                <div style="background: #90EE90; padding: 8px; text-align: center; margin-bottom: 15px; font-weight: bold; font-size: 14px;">
                    Le médecin
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 5px; vertical-align: top; width: 50%;"><strong>Prénom et NOM :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px; width: 50%;">${data['medecin-certificat-nom'] || '........................'}</td>
                        <td style="padding: 5px; vertical-align: top; width: 25%;"><strong>ID :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 5px; width: 25%;">${data['medecin-certificat-id'] || '........................'}</td>
                    </tr>
                </table>

                <!-- Signatures -->
                <div style="display: flex; justify-content: space-between; margin-top: 40px; border-top: 1px solid #000; padding-top: 20px;">
                    <div style="text-align: center; width: 45%;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #008000;">Signature du médecin</div>
                        <div style="height: 100px; border-bottom: 1px solid #000; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;">
                            ${doctorSignature}
                        </div>
                    </div>
                    <div style="text-align: center; width: 2px; background: #000; margin: 0 20px;"></div>
                    <div style="text-align: center; width: 45%;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #008000;">Signature des parents</div>
                        <div style="height: 100px; border-bottom: 1px solid #000; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;">
                            ${parentSignature}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateCertificatNaissancePDF(doc, data) {
        // Configuration de base
        doc.setFont('helvetica');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Logo SAMS centré en haut (plus petit)
        await this.addSAMSLogo(doc, pageWidth/2 - 12, 12, 24, 24);
        
        // Titre "San Andreas Medical Services" en rouge
        doc.setFontSize(9);
        doc.setTextColor(220, 53, 69);
        doc.text('San Andreas Medical Services', pageWidth/2, 40, { align: 'center' });
        
        // En-tête hôpitaux (comme dans l'aperçu)
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text('Hôpital Central', 20, 18);
        doc.text('Eclipse Medical Tower', pageWidth - 20, 18, { align: 'right' });
        
        // Titre principal (comme dans l'aperçu)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Certificat de naissance', pageWidth/2, 50, { align: 'center' });
        doc.line(60, 52, pageWidth - 60, 52); // Ligne sous le titre

        let yPos = 65;

        // Section L'enfant (fond vert)
        doc.setFillColor(144, 238, 144); // Vert clair
        doc.rect(20, yPos, pageWidth - 40, 10, 'F'); 
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('L\'enfant', pageWidth/2, yPos + 6, { align: 'center' });

        // Données enfant
        yPos += 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Ligne 1: NOM et Prénom
        doc.text('NOM :', 25, yPos);
        doc.text(data['enfant-nom'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Prénom :', 100, yPos);
        doc.text(data['enfant-prenom'] || '', 125, yPos);
        this.addDottedLine(doc, 125, yPos + 1, pageWidth - 25);
        
        yPos += 10;
        
        // Ligne 2: ID et Date de naissance  
        doc.text('ID :', 25, yPos);
        doc.text(data['enfant-id'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Date de naissance :', 100, yPos);
        doc.text(this.formatDate(data['enfant-naissance']) || '', 140, yPos);
        this.addDottedLine(doc, 140, yPos + 1, pageWidth - 25);
        
        yPos += 10;
        
        // Ligne 3: Sexe et Heure de naissance
        doc.text('Sexe :', 25, yPos);
        doc.text(data['enfant-sexe'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Heure de naissance :', 100, yPos);
        doc.text(data['enfant-heure'] || '', 140, yPos);
        this.addDottedLine(doc, 140, yPos + 1, pageWidth - 25);
        
        yPos += 10;
        
        // Ligne 4: Taille et Poids
        doc.text('Taille :', 25, yPos);
        doc.text(data['enfant-taille'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Poids :', 100, yPos);
        doc.text(data['enfant-poids'] || '', 125, yPos);
        this.addDottedLine(doc, 125, yPos + 1, pageWidth - 25);
        
        yPos += 15;

        // Section La mère (fond vert)
        doc.setFillColor(144, 238, 144);
        doc.rect(20, yPos, pageWidth - 40, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('La mère', pageWidth/2, yPos + 6, { align: 'center' });

        yPos += 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Données mère
        doc.text('Prénom et NOM :', 25, yPos);
        doc.text(data['mere-nom'] || '', 70, yPos);
        this.addDottedLine(doc, 70, yPos + 1, 140);
        
        doc.text('Date de naissance :', 150, yPos);
        doc.text(this.formatDate(data['mere-naissance']) || '', 185, yPos);
        this.addDottedLine(doc, 185, yPos + 1, pageWidth - 25);
        
        yPos += 10;
        
        doc.text('Âge :', 25, yPos);
        doc.text(data['mere-age'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Nationalité :', 100, yPos);
        doc.text(data['mere-nationalite'] || '', 125, yPos);
        this.addDottedLine(doc, 125, yPos + 1, pageWidth - 25);
        
        yPos += 15;

        // Section Le père (fond vert)
        doc.setFillColor(144, 238, 144);
        doc.rect(20, yPos, pageWidth - 40, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Le père', pageWidth/2, yPos + 6, { align: 'center' });

        yPos += 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Données père
        doc.text('Prénom et NOM :', 25, yPos);
        doc.text(data['pere-nom'] || '', 70, yPos);
        this.addDottedLine(doc, 70, yPos + 1, 140);
        
        doc.text('Date de naissance :', 150, yPos);
        doc.text(this.formatDate(data['pere-naissance']) || '', 185, yPos);
        this.addDottedLine(doc, 185, yPos + 1, pageWidth - 25);
        
        yPos += 10;
        
        doc.text('Âge :', 25, yPos);
        doc.text(data['pere-age'] || '', 45, yPos);
        this.addDottedLine(doc, 45, yPos + 1, 90);
        
        doc.text('Nationalité :', 100, yPos);
        doc.text(data['pere-nationalite'] || '', 125, yPos);
        this.addDottedLine(doc, 125, yPos + 1, pageWidth - 25);
        
        yPos += 15;

        // Section Le médecin (fond vert)
        doc.setFillColor(144, 238, 144);
        doc.rect(20, yPos, pageWidth - 40, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Le médecin', pageWidth/2, yPos + 6, { align: 'center' });

        yPos += 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Données médecin
        doc.text('Prénom et NOM :', 25, yPos);
        doc.text(data['medecin-certificat-nom'] || '', 70, yPos);
        this.addDottedLine(doc, 70, yPos + 1, 140);
        
        doc.text('ID :', 150, yPos);
        doc.text(data['medecin-certificat-id'] || '', 165, yPos);
        this.addDottedLine(doc, 165, yPos + 1, pageWidth - 25);
        
        yPos += 15;

        // Signatures avec ligne de séparation
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.line(20, yPos, pageWidth - 20, yPos);
        
        yPos += 10;
        
        // Signatures (compact)
        doc.setTextColor(0, 128, 0); // Vert
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Signature du médecin', 30, yPos);
        doc.text('Signature des parents', pageWidth - 80, yPos);
        
        yPos += 12;
        
        // Lignes pour signatures
        doc.setDrawColor(0, 0, 0);
        doc.line(30, yPos, 90, yPos); // Ligne signature médecin
        doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos); // Ligne signature parents
        
        // Signature automatique du médecin si disponible
        const signatures = this.loadSignatures();
        if (signatures.personal && Object.keys(signatures.personal).length > 0) {
            const firstSignature = Object.values(signatures.personal)[0];
            if (firstSignature.type === 'text') {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(12);
                doc.text(firstSignature.text, 60, yPos - 3, { align: 'center' });
            }
        }
        
        // Signature des parents si disponible
        if (signatures.parents && Object.keys(signatures.parents).length > 0) {
            const parentSignature = Object.values(signatures.parents)[0];
            if (parentSignature.type === 'text') {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(12);
                doc.text(parentSignature.text, pageWidth - 50, yPos - 3, { align: 'center' });
            } else if (parentSignature.type === 'draw' && parentSignature.data) {
                // Pour les signatures dessinées, on afficherait l'image ici
                // mais jsPDF a des limitations avec les images base64 complexes
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                doc.text('(Signature numérique)', pageWidth - 50, yPos - 3, { align: 'center' });
            }
        }
        
        yPos += 10;
        
        // Noms sous les signatures
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Dr ${data['medecin-certificat-nom'] || 'SAMS'}`, 60, yPos, { align: 'center' });
        doc.text('Parents/Tuteurs légaux', pageWidth - 50, yPos, { align: 'center' });
    }

    generateFacturePreview(data) {
        const signatures = this.loadSignatures();
        let doctorSignature = '';
        
        // Récupérer la signature du médecin
        if (signatures.personal && Object.keys(signatures.personal).length > 0) {
            const firstSignature = Object.values(signatures.personal)[0];
            if (firstSignature.type === 'draw') {
                doctorSignature = `<img src="${firstSignature.data}" style="max-width:200px;height:60px;">`;
            } else {
                doctorSignature = `<div class="signature-font-${firstSignature.font}" style="font-size:18px;">${firstSignature.text}</div>`;
            }
        }

        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: white; border: 1px solid #ccc;">
                <!-- En-tête avec logo -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="images/sams-logo.png" alt="SAMS Logo" style="width: 80px; height: 80px; margin-bottom: 10px;">
                    <div style="color: #dc3545; font-size: 14px; margin-bottom: 5px;">San Andreas Medical Services</div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px;">
                        <span>Hôpital Central</span>
                        <span style="text-decoration: underline;">Eclipse Medical Tower</span>
                    </div>
                    <h1 style="font-size: 18px; font-weight: bold; text-decoration: underline; margin: 20px 0;">Facture d'hospitalisation</h1>
                </div>

                <!-- Section Informations patient -->
                <div style="background: #90ee90; padding: 8px; margin-bottom: 15px;">
                    <div style="text-align: center; font-weight: bold; color: #333;">Informations du patient</div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
                    <tr>
                        <td style="text-align: right; padding: 3px;"><strong>Patient :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">${data['facture-patient'] || '........................'}</td>
                        <td style="text-align: right; padding: 3px;"><strong>Médecin traitant :</strong></td>
                        <td style="border-bottom: 1px dotted #000; padding: 3px;">${data['facture-medecin'] || '........................'}</td>
                    </tr>
                </table>

                <!-- Section Détails des frais -->
                <div style="background: #90ee90; padding: 8px; margin-bottom: 15px;">
                    <div style="text-align: center; font-weight: bold; color: #333;">Détails des Frais Médicaux</div>
                </div>

                <!-- Tableau des prestations -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; border: 1px solid #000;">
                    <thead>
                        <tr style="background: #90ee90;">
                            <th style="border: 1px solid #000; padding: 5px; text-align: left;">Description des services</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: center;">Quantité</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: right;">Prix unitaire</th>
                            <th style="border: 1px solid #000; padding: 5px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(() => {
                            const fraisInfo = this.getFraisFromForm();
                            let rows = '';
                            
                            if (fraisInfo.fraisRows.length > 0) {
                                fraisInfo.fraisRows.forEach(frais => {
                                    rows += `
                                        <tr>
                                            <td style="border: 1px solid #000; padding: 5px;">${frais.description}</td>
                                            <td style="border: 1px solid #000; padding: 5px; text-align: center;">${frais.quantite}</td>
                                            <td style="border: 1px solid #000; padding: 5px; text-align: right;">${typeof frais.prixUnitaire === 'number' ? frais.prixUnitaire.toFixed(2) + ' $' : frais.prixUnitaire}</td>
                                            <td style="border: 1px solid #000; padding: 5px; text-align: right;">${typeof frais.total === 'number' ? frais.total.toFixed(2) + ' $' : frais.total}</td>
                                        </tr>`;
                                });
                            } else {
                                rows = `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 5px;">Services médicaux</td>
                                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">-</td>
                                        <td style="border: 1px solid #000; padding: 5px; text-align: right;">-</td>
                                        <td style="border: 1px solid #000; padding: 5px; text-align: right;">-</td>
                                    </tr>`;
                            }
                            
                            // Ligne de total
                            rows += `
                                <tr style="background: #f8f8f8; font-weight: bold;">
                                    <td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;">TOTAL GÉNÉRAL :</td>
                                    <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 14px; color: #d00;">${fraisInfo.totalGeneral.toFixed(2)} $</td>
                                </tr>`;
                            
                            return rows;
                        })()}
                    </tbody>
                </table>

                <!-- Section signature avec séparation -->
                <div style="border-top: 2px solid #000; margin-top: 30px; padding-top: 15px;">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="text-align: center; width: 45%;">
                            <div style="color: #090; font-weight: bold; margin-bottom: 10px;">Signature du médecin responsable</div>
                            <div style="border-bottom: 1px solid #000; height: 60px; margin-bottom: 5px; display: flex; align-items: end; justify-content: center; padding-bottom: 5px;">
                                ${doctorSignature}
                            </div>
                            <div style="font-size: 10px;">Dr ${data['medecin-facture-nom'] || 'SAMS'}</div>
                        </div>
                        
                        <div style="text-align: center; width: 45%;">
                            <div style="color: #090; font-weight: bold; margin-bottom: 10px;">Date et heure</div>
                            <div style="border-bottom: 1px solid #000; height: 60px; margin-bottom: 5px; display: flex; align-items: end; justify-content: center; padding-bottom: 5px;">
                                <span style="font-size: 14px;">${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                            </div>
                            <div style="font-size: 10px;">Los Santos</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateFacturePDF(doc, data) {
        // Configuration de base
        doc.setFont('helvetica');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Logo SAMS centré en haut (plus petit)
        await this.addSAMSLogo(doc, pageWidth/2 - 12, 12, 24, 24);
        
        // Titre "San Andreas Medical Services" en rouge
        doc.setFontSize(9);
        doc.setTextColor(220, 53, 69);
        doc.text('San Andreas Medical Services', pageWidth/2, 40, { align: 'center' });
        
        // En-tête hôpitaux (comme dans l'aperçu)
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text('Hôpital Central', 20, 18);
        doc.text('Eclipse Medical Tower', pageWidth - 20, 18, { align: 'right' });
        
        // Titre principal (comme dans l'aperçu)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Facture d\'hospitalisation', pageWidth/2, 50, { align: 'center' });
        doc.line(60, 52, pageWidth - 60, 52); // Ligne sous le titre

        let yPos = 65;

        // Section Informations du patient (fond vert)
        doc.setFillColor(144, 238, 144); // Vert clair
        doc.rect(20, yPos, pageWidth - 40, 10, 'F'); 
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Informations du patient', pageWidth/2, yPos + 6, { align: 'center' });

        // Données patient (identique à l'aperçu)
        yPos += 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Patient et Médecin traitant (comme dans l'aperçu)
        doc.text('Patient :', 25, yPos);
        doc.text(data['facture-patient'] || '', 50, yPos);
        this.addDottedLine(doc, 50, yPos + 1, 95);
        
        doc.text('Médecin traitant :', 100, yPos);
        doc.text(data['facture-medecin'] || '', 140, yPos);
        this.addDottedLine(doc, 140, yPos + 1, pageWidth - 25);
        
        yPos += 15;

        // Section Détails des Frais Médicaux (fond vert)
        doc.setFillColor(144, 238, 144);
        doc.rect(20, yPos, pageWidth - 40, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Détails des Frais Médicaux', pageWidth/2, yPos + 6, { align: 'center' });

        yPos += 15;

        // Tableau des prestations (optimisé pour A4 - plus d'espace)
        const tableStartX = 20;
        const tableWidth = pageWidth - 40;
        const colWidths = [tableWidth * 0.5, tableWidth * 0.15, tableWidth * 0.17, tableWidth * 0.18];
        const rowHeight = 8; // Augmenter la hauteur des lignes pour éviter l'écrasement
        
        // En-tête du tableau
        doc.setFillColor(240, 240, 240);
        doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'S');
        
        // Lignes verticales
        let xPos = tableStartX;
        for (let i = 0; i < colWidths.length - 1; i++) {
            xPos += colWidths[i];
            doc.line(xPos, yPos, xPos, yPos + rowHeight);
        }
        
        // Textes en-tête
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Description', tableStartX + 2, yPos + 6);
        doc.text('Quantité', tableStartX + colWidths[0] + 2, yPos + 6);
        doc.text('Prix unitaire', tableStartX + colWidths[0] + colWidths[1] + 2, yPos + 6);
        doc.text('Total', tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPos + 6);
        
        yPos += rowHeight;
        
        // Lignes de prestations dynamiques
        const fraisInfo = this.getFraisFromForm();
        let prestations = fraisInfo.fraisRows;
        
        // Si pas de frais remplis, afficher une ligne par défaut
        if (prestations.length === 0) {
            prestations = [{ description: 'Services médicaux', quantite: '-', prixUnitaire: '-', total: '-' }];
        }
        
        // Limiter à 5 prestations maximum pour tenir sur A4
        prestations = prestations.slice(0, 5);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8); // Augmenter la taille de police pour éviter l'écrasement
        
        prestations.forEach((prestation, index) => {
            // Rectangle de la ligne
            doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'S');
            
            // Lignes verticales
            xPos = tableStartX;
            for (let i = 0; i < colWidths.length - 1; i++) {
                xPos += colWidths[i];
                doc.line(xPos, yPos, xPos, yPos + rowHeight);
            }
            
            // Textes - limiter à une ligne avec ellipsis si trop long
            let description = prestation.description;
            if (description.length > 50) {
                description = description.substring(0, 47) + '...';
            }
            doc.text(description, tableStartX + 2, yPos + 6); // Augmenter l'espacement vertical
            doc.text(prestation.quantite.toString(), tableStartX + colWidths[0] + 10, yPos + 6, { align: 'center' });
            
            const prixText = (typeof prestation.prixUnitaire === 'number') ? 
                prestation.prixUnitaire.toFixed(2) + ' $' : prestation.prixUnitaire.toString();
            doc.text(prixText, tableStartX + colWidths[0] + colWidths[1] + colWidths[2] - 2, yPos + 6, { align: 'right' });
            
            const totalText = (typeof prestation.total === 'number') ? 
                prestation.total.toFixed(2) + ' $' : prestation.total.toString();
            doc.text(totalText, tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 2, yPos + 6, { align: 'right' });
            
            yPos += rowHeight;
        });
        
        // Ligne total général
        doc.setFillColor(248, 248, 248);
        doc.rect(tableStartX, yPos, tableWidth, rowHeight + 2, 'F');
        doc.rect(tableStartX, yPos, tableWidth, rowHeight + 2, 'S');
        
        // Lignes verticales pour le total
        xPos = tableStartX + colWidths[0] + colWidths[1] + colWidths[2];
        doc.line(xPos, yPos, xPos, yPos + rowHeight + 2);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('TOTAL GÉNÉRAL :', tableStartX + colWidths[0] + colWidths[1] + colWidths[2] - 2, yPos + 8, { align: 'right' });
        doc.setTextColor(221, 0, 0);
        doc.setFontSize(12);
        doc.text(fraisInfo.totalGeneral.toFixed(2) + ' $', tableStartX + tableWidth - 2, yPos + 8, { align: 'right' });
        
        yPos += rowHeight + 8; // Réduire l'espace avant signatures

        // Signatures avec ligne de séparation
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.line(20, yPos, pageWidth - 20, yPos);
        
        yPos += 8; // Réduire l'espace après la ligne
        
        // Signatures (compact)
        doc.setTextColor(0, 153, 0); // Vert
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Signature du médecin responsable', 35, yPos);
        doc.text('Date et heure', pageWidth - 70, yPos);
        
        yPos += 12;
        
        // Lignes pour signatures
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(30, yPos, 90, yPos); // Ligne signature médecin
        doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos); // Ligne date/heure
        
        // Signature automatique du médecin si disponible
        const signatures = this.loadSignatures();
        if (signatures.personal && Object.keys(signatures.personal).length > 0) {
            const firstSignature = Object.values(signatures.personal)[0];
            if (firstSignature.type === 'text') {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                doc.text(firstSignature.text, 60, yPos - 2, { align: 'center' });
            }
        }
        
        // Date et heure automatiques
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR');
        const timeStr = now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        doc.text(`${dateStr} - ${timeStr}`, pageWidth - 50, yPos - 2, { align: 'center' });
        
        yPos += 8;
        
        // Noms sous les signatures
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`Dr ${data['medecin-facture-nom'] || 'SAMS'}`, 60, yPos, { align: 'center' });
        doc.text('Los Santos', pageWidth - 50, yPos, { align: 'center' });
    }

    loadSignatures() {
        return JSON.parse(localStorage.getItem('savedSignatures') || '{}');
    }

    refreshSignatureDisplay() {
        console.log('🔄 Rafraîchissement affichage signatures...');
        const signatures = this.loadSignatures();
        
        // Rafraîchir les signatures parents si on est sur un certificat de naissance
        if (this.documentType === 'certificat-naissance' && signatures.parents) {
            const parentSignaturePlaceholder = document.getElementById('parents-signature-placeholder');
            const parentSignatureImg = document.getElementById('parents-signature-img');
            
            if (parentSignaturePlaceholder && parentSignatureImg) {
                const firstParentSignature = Object.values(signatures.parents)[0];
                if (firstParentSignature) {
                    if (firstParentSignature.type === 'image') {
                        parentSignatureImg.src = firstParentSignature.data;
                        parentSignatureImg.style.display = 'block';
                        parentSignaturePlaceholder.style.display = 'none';
                        console.log('✅ Signature parent (image) affichée');
                    } else if (firstParentSignature.type === 'text') {
                        parentSignaturePlaceholder.innerHTML = `<div class="signature-font-${firstParentSignature.font}" style="font-size:18px;color:#000;">${firstParentSignature.text}</div>`;
                        parentSignaturePlaceholder.style.display = 'block';
                        parentSignatureImg.style.display = 'none';
                        console.log('✅ Signature parent (texte) affichée');
                    }
                }
            }
        }
        
        // Générer à nouveau l'aperçu si nécessaire
        if (this.documentType && typeof this.generatePreview === 'function') {
            this.generatePreview();
        }
    }

    getFraisFromForm() {
        const fraisRows = [];
        let totalGeneral = 0;

        // Récupérer tous les frais depuis le formulaire (5 catégories fixes)
        const container = document.getElementById('frais-container');
        if (container) {
            const fraisElements = container.querySelectorAll('.frais-item');
            fraisElements.forEach((frais, index) => {
                // Récupérer la description depuis l'input readonly
                const typeLabel = frais.querySelector('.frais-type-label');
                const description = typeLabel ? typeLabel.value : '';
                
                // Récupérer la quantité et le prix
                const quantiteInput = frais.querySelector('.frais-quantite');
                const prixInput = frais.querySelector('.frais-prix');
                
                const quantite = parseFloat(quantiteInput?.value) || 0;
                const prixUnitaire = parseFloat(prixInput?.value) || 0;
                const total = quantite * prixUnitaire;
                
                // Toujours ajouter toutes les 5 catégories (même avec 0)
                totalGeneral += total;

                fraisRows.push({
                    description: description || `Catégorie ${index + 1}`,
                    quantite: quantite || 0,
                    prixUnitaire: prixUnitaire || 0,
                    total: total || 0
                });
            });
        }

        return { fraisRows, totalGeneral };
    }

    async loadLogoAsBase64() {
        try {
            const response = await fetch('./images/sams-logo.png');
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn('Impossible de charger le logo SAMS:', e);
            return null;
        }
    }

    // Cache pour le logo en base64
    logoBase64Cache = null;

    async getLogoBase64() {
        if (this.logoBase64Cache) {
            return this.logoBase64Cache;
        }
        
        try {
            this.logoBase64Cache = await this.loadLogoAsBase64();
            return this.logoBase64Cache;
        } catch (e) {
            console.warn('Erreur lors du chargement du logo:', e);
            return null;
        }
    }

    async addSAMSLogo(doc, x, y, width = 30, height = 30) {
        // Essayer d'abord de charger le vrai logo
        const logoBase64 = await this.getLogoBase64();
        
        if (logoBase64) {
            try {
                // Utiliser le vrai logo SAMS
                doc.addImage(logoBase64, 'PNG', x, y, width, height);
                return;
            } catch (e) {
                console.warn('Erreur lors de l\'ajout du logo:', e);
                // Continuer avec le fallback
            }
        }
        
        // Fallback : logo simplifié mais fidèle au design
        const centerX = x + width/2;
        const centerY = y + height/2;
        const radius = Math.min(width, height)/2;
        
        // Fond circulaire gris foncé (comme dans le vrai logo)
        doc.setFillColor(60, 60, 60);
        doc.circle(centerX, centerY, radius, 'F');
        
        // Bordure métallique
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(1);
        doc.circle(centerX, centerY, radius - 1, 'S');
        
        // Points décoratifs blancs sur le bord
        doc.setFillColor(255, 255, 255);
        const dotRadius = 0.8;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const dotX = centerX + Math.cos(angle) * (radius - 3);
            const dotY = centerY + Math.sin(angle) * (radius - 3);
            doc.circle(dotX, dotY, dotRadius, 'F');
        }
        
        // Étoile de vie rouge au centre
        doc.setFillColor(220, 53, 69);
        const starRadius = radius * 0.6;
        doc.circle(centerX, centerY, starRadius, 'F');
        
        // Caducée blanc simplifié
        doc.setFillColor(255, 255, 255);
        // Barre verticale
        doc.rect(centerX - 1, centerY - starRadius + 4, 2, (starRadius - 4) * 2, 'F');
        // Barre horizontale
        doc.rect(centerX - starRadius + 4, centerY - 1, (starRadius - 4) * 2, 2, 'F');
        
        // Texte autour (très petit)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(3);
        doc.setFont('helvetica', 'bold');
        doc.text('SAN ANDREAS', centerX, centerY - radius + 6, { align: 'center' });
        doc.text('MEDICAL SERVICE', centerX, centerY + radius - 3, { align: 'center' });
    }

    getAutoSignature() {
        const signatures = this.loadSignatures();
        if (signatures.personal && Object.keys(signatures.personal).length > 0) {
            // Prendre la première signature (ou la signature principale)
            const firstSignature = Object.values(signatures.personal)[0];
            if (firstSignature.type === 'draw') {
                return `<img src="${firstSignature.data}" style="max-width:200px;height:60px;object-fit:contain;">`;
            } else {
                return `<div class="signature-font-${firstSignature.font}" style="font-size:20px;">${firstSignature.text}</div>`;
            }
        }
        return null;
    }

    saveToHistory(formData, filename) {
        console.log('Sauvegarde dans historique:', {
            'this.documentType': this.documentType,
            'filename': filename
        });
        
        const history = JSON.parse(localStorage.getItem('documentHistory') || '[]');
        const document = {
            id: Date.now(),
            type: this.documentType,
            data: formData,
            filename: filename,
            createdAt: new Date().toISOString()
        };
        history.unshift(document);
        localStorage.setItem('documentHistory', JSON.stringify(history));
        
        console.log('Document sauvegardé:', document);
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById(event.target.id.replace('-input', '-img'));
                const placeholder = document.getElementById(event.target.id.replace('-input', '-placeholder'));
                
                if (img && placeholder) {
                    img.src = e.target.result;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        }
    }

    getMedecinSignaturePreview() {
        const signatures = this.loadSignatures();
        if (signatures.personal && Object.keys(signatures.personal).length > 0) {
            const firstSignature = Object.values(signatures.personal)[0];
            if (firstSignature.type === 'draw') {
                return `<img src="${firstSignature.data}" style="max-width:200px;height:80px;border:1px solid #ccc;border-radius:4px;">`;
            } else {
                return `<div class="signature-font-${firstSignature.font}" style="font-size:20px;border:1px solid #ccc;padding:10px;border-radius:4px;">${firstSignature.text}</div>`;
            }
        }
        return `<div style="border:1px dashed #ccc;padding:20px;text-align:center;color:#666;">
            Aucune signature sauvegardée<br>
            <a href="parametres.html#signatures" target="_blank">Créer une signature</a>
        </div>`;
    }

    getParentSignaturePreview() {
        const img = document.getElementById('parents-signature-img');
        if (img && img.src && img.style.display !== 'none') {
            return `<img src="${img.src}" style="max-width:100%;height:100%;object-fit:contain;">`;
        }
        return 'Signature parents à télécharger';
    }

    uploadSignature(type) {
        const input = document.getElementById(`${type}-signature-input`);
        if (input) {
            input.click();
        }
    }

    saveDraft() {
        const formData = this.collectFormData();
        const draft = this.saveDraftInternal(formData, false);
        alert('📄 Brouillon sauvegardé avec succès !');
        return draft;
    }

    generateDraftTitle(data) {
        switch(this.documentType) {
            case 'arret-travail':
                return `Arrêt de travail - ${data['patient-nom'] || 'Patient'} ${data['patient-prenom'] || ''}`.trim();
            case 'certificat-naissance':
                return `Certificat naissance - ${data['enfant-nom'] || 'Enfant'} ${data['enfant-prenom'] || ''}`.trim();
            case 'facture-hospitalisation':
                return `Facture hospitalisation - ${data['patient-nom'] || 'Patient'} ${data['patient-prenom'] || ''}`.trim();
            default:
                return `Document ${this.documentType}`;
        }
    }

    finalizeDocument() {
        console.log('🚀 finalizeDocument() appelée - wrapper synchrone');
        this.finalizeDocumentAsync().catch(console.error);
    }

    async finalizeDocumentAsync() {
        console.log('🚀 finalizeDocumentAsync() appelée');
        
        // Valider les champs requis
        console.log('🔍 Validation du formulaire...');
        const isValid = this.validateForm();
        console.log('✅ Validation terminée:', isValid);
        
        if (!isValid) {
            console.log('❌ Validation échouée - export annulé');
            return;
        }
        
        console.log('🎯 Lancement export PDF...');
        
        try {
            console.log('🔄 Appel this.exportToPDFAsync()...');
            await this.exportToPDFAsync();
            console.log('✅ exportToPDFAsync() terminé');
            
            // Le brouillon est maintenant conservé après l'export
            console.log('� Brouillon conservé pour modification ultérieure');
            
        } catch (exportError) {
            console.error('❌ Erreur dans exportToPDF():', exportError);
            alert(`Erreur lors de l'export PDF: ${exportError.message}`);
            return;
        }
    }

    validateForm() {
        const requiredFields = this.getRequiredFields();
        console.log('📋 Champs requis:', requiredFields);
        const missingFields = [];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const fieldValue = field ? field.value.trim() : null;
            console.log(`🔍 Champ ${fieldId}:`, { exists: !!field, value: fieldValue });
            
            if (!field || !fieldValue) {
                missingFields.push(fieldId);
            }
        });
        
        console.log('❌ Champs manquants:', missingFields);
        
        if (missingFields.length > 0) {
            alert(`❌ Veuillez remplir les champs obligatoires :\n${missingFields.map(f => `• ${f}`).join('\n')}`);
            return false;
        }
        
        return true;
    }

    getRequiredFields() {
        switch(this.documentType) {
            case 'arret-travail':
                return ['patient-nom', 'patient-prenom', 'medecin-nom', 'medecin-prenom', 'arret-debut', 'arret-fin'];
            case 'certificat-naissance':
                return ['enfant-nom', 'enfant-prenom', 'enfant-date-naissance', 'medecin-certificat-nom'];
            case 'facture-hospitalisation':
                return ['facture-patient', 'facture-medecin', 'medecin-facture-nom'];
            default:
                return [];
        }
    }

    removeDraftIfExists() {
        const drafts = JSON.parse(localStorage.getItem('documentDrafts') || '[]');
        const formData = this.collectFormData();
        const title = this.generateDraftTitle(formData);
        
        const updatedDrafts = drafts.filter(draft => draft.title !== title);
        localStorage.setItem('documentDrafts', JSON.stringify(updatedDrafts));
    }

    loadDraft(draftId) {
        const drafts = JSON.parse(localStorage.getItem('documentDrafts') || '[]');
        const draft = drafts.find(d => d.id == draftId);
        
        if (!draft) {
            console.error('Brouillon non trouvé:', draftId);
            return;
        }
        
        console.log('Chargement du brouillon:', draft);
        
        // Remplir les champs du formulaire classiques
        Object.entries(draft.data).forEach(([fieldId, value]) => {
            if (fieldId === 'frais-data' || fieldId === 'signatures-data') return; // Traités séparément
            
            const field = document.getElementById(fieldId);
            if (field && value) {
                // Éviter d'essayer de définir la value sur les inputs de type file
                if (field.type === 'file') {
                    console.log(`⚠️ Champ file ignoré: ${fieldId}`);
                    return;
                }
                field.value = value;
            }
        });

        // Restaurer les frais pour la facture
        if (draft.type === 'facture-hospitalisation' && draft.data['frais-data']) {
            const fraisContainer = document.getElementById('frais-container');
            if (fraisContainer) {
                const fraisItems = fraisContainer.querySelectorAll('.frais-item');
                draft.data['frais-data'].forEach((fraisData, index) => {
                    if (fraisItems[index]) {
                        const item = fraisItems[index];
                        const quantiteInput = item.querySelector('.frais-quantite');
                        const prixInput = item.querySelector('.frais-prix');
                        const totalInput = item.querySelector('.frais-total');
                        
                        if (quantiteInput) quantiteInput.value = fraisData.quantite;
                        if (prixInput) prixInput.value = fraisData.prix;
                        if (totalInput) totalInput.value = fraisData.total;
                    }
                });
            }
        }

        // Restaurer les signatures
        if (draft.data['signatures-data']) {
            console.log('🖋️ Restauration signatures depuis brouillon:', draft.data['signatures-data']);
            localStorage.setItem('savedSignatures', JSON.stringify(draft.data['signatures-data']));
            console.log('✅ Signatures restaurées dans localStorage');
            
            // Rafraîchir l'affichage des signatures dans l'interface
            this.refreshSignatureDisplay();
        } else {
            console.log('⚠️ Pas de signatures-data dans le brouillon');
        }
        
        alert(`📝 Brouillon "${draft.title}" chargé avec succès !`);
    }

    // Calcul automatique des totaux pour la facture
    setupFraisCalculation() {
        const container = document.getElementById('frais-container');
        if (!container) return;
        
        const fraisItems = container.querySelectorAll('.frais-item');
        fraisItems.forEach(item => {
            const quantiteInput = item.querySelector('.frais-quantite');
            const prixInput = item.querySelector('.frais-prix');
            const totalInput = item.querySelector('.frais-total');
            
            [quantiteInput, prixInput].forEach(input => {
                if (input) {
                    input.addEventListener('input', () => {
                        this.calculateFraisTotal(item);
                        this.updateTotalFacture();
                    });
                }
            });
        });
    }

    calculateFraisTotal(fraisItem) {
        const quantiteInput = fraisItem.querySelector('.frais-quantite');
        const prixInput = fraisItem.querySelector('.frais-prix');
        const totalInput = fraisItem.querySelector('.frais-total');
        
        if (quantiteInput && prixInput && totalInput) {
            const quantite = parseFloat(quantiteInput.value) || 0;
            const prix = parseFloat(prixInput.value) || 0;
            const total = quantite * prix;
            totalInput.value = total.toFixed(2) + ' $';
        }
    }

    // Méthode pour mettre à jour le total de la facture
    updateTotalFacture() {
        let total = 0;
        const fraisItems = document.querySelectorAll('.frais-item');
        
        fraisItems.forEach(item => {
            const prix = parseFloat(item.querySelector('.frais-prix')?.value || 0);
            const quantite = parseFloat(item.querySelector('.frais-quantite')?.value || 1);
            const sousTotal = prix * quantite;
            
            const totalField = item.querySelector('.frais-total');
            if (totalField) {
                totalField.value = sousTotal.toFixed(2);
            }
            
            total += sousTotal;
        });
        
        const totalGeneral = document.getElementById('facture-total-general');
        if (totalGeneral) {
            totalGeneral.textContent = `${total.toFixed(2)} $`;
        }
    }

    // Méthodes de sauvegarde automatique
    startAutoSave() {
        // Sauvegarder toutes les 30 secondes
        this.autoSaveInterval = setInterval(() => {
            this.saveDraftSilently();
        }, 30000); // 30 secondes
        
        console.log('📝 Sauvegarde automatique activée (toutes les 30s)');
    }

    saveDraftSilently() {
        try {
            const formData = this.collectFormData();
            
            // Vérifier s'il y a du contenu à sauvegarder
            if (this.hasFormContent(formData)) {
                this.saveDraftInternal(formData, true); // true = silencieux
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde automatique:', error);
        }
    }

    hasFormContent(formData) {
        // Vérifier s'il y a du contenu utile dans le formulaire
        const values = Object.values(formData).filter(value => {
            if (!value) return false;
            if (typeof value === 'string') return value.trim() !== '';
            if (typeof value === 'object') return Object.keys(value).length > 0;
            return true; // Pour les nombres, booleans, etc.
        });
        return values.length > 0;
    }

    saveDraftInternal(formData, silent = false) {
        if (!formData) {
            formData = this.collectFormData();
        }

        const draft = {
            id: Date.now(),
            type: this.documentType,
            title: this.generateDraftTitle(formData),
            data: formData,
            createdAt: new Date().toISOString(),
            autoSaved: silent
        };

        const drafts = JSON.parse(localStorage.getItem('documentDrafts') || '[]');
        
        // Supprimer les anciens brouillons du même type (garder seulement le plus récent)
        const filteredDrafts = drafts.filter(d => d.type !== this.documentType);
        filteredDrafts.push(draft);
        
        localStorage.setItem('documentDrafts', JSON.stringify(filteredDrafts));
        
        if (!silent) {
            console.log(`💾 Brouillon sauvegardé: ${draft.title}`);
        }
        
        return draft;
    }
}

// Instance globale
window.documentManager = new DocumentManager();
