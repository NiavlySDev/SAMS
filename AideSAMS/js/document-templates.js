// ===== DOCUMENT-TEMPLATES.JS - Templates et Génération PDF =====

// Extension de la classe DocumentManager pour les templates et PDF
DocumentManager.prototype.initFormEvents = function() {
    // Initialiser les canvas de signature
    this.initSignatureCanvases();
    
    // Écouteurs pour les calculs automatiques
    this.setupCalculations();
    
    // Auto-sauvegarde
    this.setupAutoSave();
};

DocumentManager.prototype.initSignatureCanvases = function() {
    const canvases = document.querySelectorAll('.signature-canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e, canvas));
        canvas.addEventListener('mousemove', (e) => this.draw(e, canvas));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Support tactile
        canvas.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0], canvas));
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0], canvas);
        });
        canvas.addEventListener('touchend', () => this.stopDrawing());
    });
};

DocumentManager.prototype.startDrawing = function(e, canvas) {
    this.isDrawing = true;
    this.signatureCanvas = canvas;
    this.signatureCtx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.signatureCtx.beginPath();
    this.signatureCtx.moveTo(x, y);
};

DocumentManager.prototype.draw = function(e, canvas) {
    if (!this.isDrawing || this.signatureCanvas !== canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.signatureCtx.lineWidth = 2;
    this.signatureCtx.lineCap = 'round';
    this.signatureCtx.strokeStyle = '#000';
    this.signatureCtx.lineTo(x, y);
    this.signatureCtx.stroke();
};

DocumentManager.prototype.stopDrawing = function() {
    this.isDrawing = false;
    this.signatureCanvas = null;
    this.signatureCtx = null;
};

DocumentManager.prototype.clearSignature = function(type) {
    const canvas = document.getElementById(`${type}-signature-canvas`);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
};

DocumentManager.prototype.switchSignatureTab = function(type, mode) {
    // Mettre à jour les onglets
    const tabs = document.querySelectorAll('.signature-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Afficher le bon contenu
    const drawContent = document.getElementById(`${type}-signature-draw`);
    const textContent = document.getElementById(`${type}-signature-text`);
    const savedContent = document.getElementById(`${type}-signature-saved`);
    
    if (drawContent) drawContent.style.display = mode === 'draw' ? 'block' : 'none';
    if (textContent) textContent.style.display = mode === 'text' ? 'block' : 'none';
    if (savedContent) savedContent.style.display = mode === 'saved' ? 'block' : 'none';
    
    if (mode === 'saved') {
        this.loadSavedSignatures(type);
    }
};

DocumentManager.prototype.selectFont = function(type, fontClass) {
    // Mettre à jour la sélection
    const options = document.querySelectorAll('.font-option');
    options.forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.font-option').classList.add('selected');
    
    // Sauvegarder le choix
    const textInput = document.getElementById(`${type}-signature-text-input`);
    if (textInput) {
        textInput.dataset.font = fontClass;
    }
};

DocumentManager.prototype.uploadSignature = function(signatureType) {
    const input = document.getElementById(`${signatureType}-signature-input`);
    input.click();
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById(`${signatureType}-signature-img`);
                const placeholder = document.getElementById(`${signatureType}-signature-placeholder`);
                
                img.src = e.target.result;
                img.style.display = 'block';
                placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    };
};

DocumentManager.prototype.setupCalculations = function() {
    // Pour les factures
    const fraisInputs = document.querySelectorAll('.frais-quantite, .frais-prix');
    fraisInputs.forEach(input => {
        input.addEventListener('input', () => this.calculateFactureTotal());
    });
};

DocumentManager.prototype.addFraisRow = function() {
    const container = document.getElementById('frais-container');
    const newRow = document.createElement('div');
    newRow.className = 'frais-item';
    newRow.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Description des services :</label>
                <select class="frais-type">
                    <option value="soins">Soins</option>
                    <option value="medicaments">Médicaments</option>
                    <option value="radiologie">Radiologie / Imagerie médicale</option>
                    <option value="chirurgie">Chirurgie (si applicable)</option>
                    <option value="autres">Autres frais (précisez)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Quantité :</label>
                <input type="text" class="frais-quantite" placeholder="Nombre/type">
            </div>
            <div class="form-group">
                <label>Prix Unitaire ($) :</label>
                <input type="number" class="frais-prix" placeholder="0.00" step="0.01">
            </div>
            <div class="form-group">
                <label>Total ($) :</label>
                <input type="text" class="frais-total" placeholder="0.00" readonly>
            </div>
        </div>
        <button type="button" class="btn-remove-frais" onclick="this.parentElement.remove(); documentManager.calculateFactureTotal();">❌ Supprimer</button>
    `;
    
    container.appendChild(newRow);
    
    // Ajouter les écouteurs pour les calculs
    const quantiteInput = newRow.querySelector('.frais-quantite');
    const prixInput = newRow.querySelector('.frais-prix');
    
    [quantiteInput, prixInput].forEach(input => {
        input.addEventListener('input', () => this.calculateFactureTotal());
    });
};

DocumentManager.prototype.calculateFactureTotal = function() {
    const fraisItems = document.querySelectorAll('.frais-item');
    let totalGeneral = 0;
    
    fraisItems.forEach(item => {
        const quantite = parseFloat(item.querySelector('.frais-quantite').value) || 0;
        const prix = parseFloat(item.querySelector('.frais-prix').value) || 0;
        const total = quantite * prix;
        
        item.querySelector('.frais-total').value = total.toFixed(2);
        totalGeneral += total;
    });
    
    document.getElementById('facture-total-general').textContent = `${totalGeneral.toFixed(2)} $`;
};

// previewDocument supprimé - utilise la version dans document-manager.js

// generateArretTravailPreview supprimé - utilise la version dans document-manager.js

DocumentManager.prototype.addSignatureToPreview = function(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const canvas = document.getElementById(`${type}-signature-canvas`);
    const textInput = document.getElementById(`${type}-signature-text-input`);
    
    if (canvas && !this.isCanvasEmpty(canvas)) {
        // Signature dessinée
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        container.appendChild(img);
    } else if (textInput && textInput.value) {
        // Signature texte
        const font = textInput.dataset.font || 'script';
        const signatureDiv = document.createElement('div');
        signatureDiv.textContent = textInput.value;
        signatureDiv.className = `signature-font-${font}`;
        signatureDiv.style.fontSize = '24px';
        signatureDiv.style.paddingTop = '20px';
        container.appendChild(signatureDiv);
    }
};

DocumentManager.prototype.isCanvasEmpty = function(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i + 3] !== 0) return false;
    }
    return true;
};

DocumentManager.prototype.goBack = function() {
    window.location.href = 'documents.html';
};

DocumentManager.prototype.loadSignatures = function() {
    return JSON.parse(localStorage.getItem('savedSignatures') || '{}');
};

DocumentManager.prototype.saveSignature = function(type) {
    const canvas = document.getElementById(`${type}-signature-canvas`);
    if (!canvas || this.isCanvasEmpty(canvas)) {
        alert('Veuillez dessiner une signature avant de la sauvegarder.');
        return;
    }
    
    const name = prompt('Nom pour cette signature:');
    if (!name) return;
    
    const signatures = this.loadSignatures();
    if (!signatures[type]) signatures[type] = {};
    
    signatures[type][name] = canvas.toDataURL();
    localStorage.setItem('savedSignatures', JSON.stringify(signatures));
    
    alert('Signature sauvegardée avec succès !');
};

DocumentManager.prototype.setupAutoSave = function() {
    // Auto-sauvegarde toutes les 30 secondes
    setInterval(() => {
        this.autoSaveForm();
    }, 30000);
    
    // Sauvegarde avant de quitter la page
    window.addEventListener('beforeunload', () => {
        this.autoSaveForm();
    });
};

DocumentManager.prototype.autoSaveForm = function() {
    if (!this.documentType) return;
    
    const formData = {};
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        if (input.id) {
            formData[input.id] = input.value;
        }
    });
    
    localStorage.setItem(`autosave_${this.documentType}`, JSON.stringify({
        data: formData,
        timestamp: Date.now()
    }));
};
