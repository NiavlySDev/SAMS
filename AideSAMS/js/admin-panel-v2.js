// Panel d'administration v2 - Version complète avec authentification et gestion avancée
class AdminPanelV2 {
    constructor() {
        this.manuels = [];
        this.grades = [];
        this.specialites = [];
        this.categories = [];
        this.adminConfig = {};
        this.isAuthenticated = false;
        this.currentTab = 'manuels';
        
        this.init();
    }

    async init() {
        try {
            await this.loadAdminConfig();
            // Vérifier s'il y a une session active
            if (this.checkActiveSession(false)) {
                this.isAuthenticated = true;
                this.showAdminInterface();
            } else {
                this.showLoginScreen();
            }
            this.setupEventListeners();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.showNotification('Erreur lors de l\'initialisation', 'error');
        }
    }

    // === AUTHENTIFICATION ===
    async loadAdminConfig() {
        try {
            const response = await fetch('json/admin-config.json');
            this.adminConfig = await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
            // Configuration par défaut si le fichier n'existe pas
            this.adminConfig = {
                password: 'admin123',
                lastChanged: new Date().toISOString(),
                attempts: 0,
                lockoutUntil: null
            };
        }
    }

    // === GESTION DE SESSION ===
    checkActiveSession(autoRenew = false) {
        try {
            const sessionData = localStorage.getItem('sams_admin_session');
            if (!sessionData) return false;
            
            const session = JSON.parse(sessionData);
            const now = new Date().getTime();
            
            // Vérifier si la session a expiré (5 minutes = 300000 ms)
            if (now - session.timestamp > 300000) {
                localStorage.removeItem('sams_admin_session');
                return false;
            }
            
            // Prolonger la session seulement si demandé explicitement
            if (autoRenew) {
                this.saveSession();
            }
            return true;
        } catch (error) {
            console.error('Erreur lors de la vérification de session:', error);
            localStorage.removeItem('sams_admin_session');
            return false;
        }
    }

    saveSession() {
        try {
            const sessionData = {
                timestamp: new Date().getTime(),
                authenticated: true
            };
            localStorage.setItem('sams_admin_session', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de session:', error);
        }
    }

    clearSession() {
        try {
            localStorage.removeItem('sams_admin_session');
        } catch (error) {
            console.error('Erreur lors de la suppression de session:', error);
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-interface').style.display = 'none';
        
        // Masquer l'indicateur de session
        const indicator = document.getElementById('session-indicator');
        if (indicator) indicator.style.display = 'none';
    }

    showAdminInterface() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-interface').style.display = 'block';
        this.updateSessionIndicator(); // Afficher immédiatement l'indicateur de session
        this.loadAllData();
    }

    async handleLogin(password) {
        if (this.adminConfig.lockoutUntil && new Date() < new Date(this.adminConfig.lockoutUntil)) {
            this.showLoginError('Compte verrouillé. Veuillez réessayer plus tard.');
            return false;
        }

        if (password === this.adminConfig.password) {
            this.isAuthenticated = true;
            this.adminConfig.attempts = 0;
            this.saveSession(); // Sauvegarder la nouvelle session
            await this.saveAdminConfig();
            this.showAdminInterface();
            return true;
        } else {
            this.adminConfig.attempts = (this.adminConfig.attempts || 0) + 1;
            
            if (this.adminConfig.attempts >= 3) {
                this.adminConfig.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
                this.showLoginError('Trop de tentatives incorrectes. Compte verrouillé pendant 15 minutes.');
            } else {
                this.showLoginError(`Mot de passe incorrect. ${3 - this.adminConfig.attempts} tentative(s) restante(s).`);
            }
            
            await this.saveAdminConfig();
            return false;
        }
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    logout() {
        this.isAuthenticated = false;
        this.clearSession(); // Supprimer la session
        this.showLoginScreen();
    }

    async saveAdminConfig() {
        try {
            localStorage.setItem('sams_admin_config_backup', JSON.stringify(this.adminConfig));
            
            // Tentative de sauvegarde sur le serveur
            try {
                const response = await fetch('api/admin.php?type=admin-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.adminConfig)
                });
                
                if (response.ok) {
                    console.log('Configuration admin sauvegardée sur le serveur');
                }
            } catch (serverError) {
                console.warn('Serveur non disponible, sauvegarde locale uniquement');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la configuration:', error);
        }
    }

    // === CHARGEMENT DES DONNÉES ===
    async loadAllData() {
        try {
            await Promise.all([
                this.loadManuels(),
                this.loadGrades(),
                this.loadSpecialites(),
                this.loadCategories()
            ]);
            
            this.renderAll();
            this.updateSelects();
            this.updateStats();
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            this.showNotification('Erreur lors du chargement des données', 'error');
        }
    }

    async loadManuels() {
        const response = await fetch('json/manuels.json');
        this.manuels = await response.json();
    }

    async loadGrades() {
        const response = await fetch('json/grades.json');
        this.grades = await response.json();
    }

    async loadSpecialites() {
        const response = await fetch('json/specialites.json');
        this.specialites = await response.json();
    }

    async loadCategories() {
        const response = await fetch('json/categories.json');
        this.categories = await response.json();
    }

    // === CONFIGURATION DES EVENT LISTENERS ===
    setupEventListeners() {
        // Login
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('admin-password').value;
            await this.handleLogin(password);
        });

        // Formulaires principaux
        document.getElementById('manuel-form').addEventListener('submit', (e) => this.handleManuelSubmit(e));
        document.getElementById('categorie-form').addEventListener('submit', (e) => this.handleCategorieSubmit(e));
        document.getElementById('grade-form').addEventListener('submit', (e) => this.handleGradeSubmit(e));
        document.getElementById('membre-form').addEventListener('submit', (e) => this.handleMembreSubmit(e));
        document.getElementById('specialite-form').addEventListener('submit', (e) => this.handleSpecialiteSubmit(e));
        document.getElementById('specialite-membre-form').addEventListener('submit', (e) => this.handleSpecialiteMembreSubmit(e));
        document.getElementById('password-form').addEventListener('submit', (e) => this.handlePasswordChange(e));

        // Formulaires d'édition
        document.getElementById('edit-manuel-form').addEventListener('submit', (e) => this.handleEditManuelSubmit(e));
        document.getElementById('edit-categorie-form').addEventListener('submit', (e) => this.handleEditCategorieSubmit(e));
        document.getElementById('edit-grade-form').addEventListener('submit', (e) => this.handleEditGradeSubmit(e));
        document.getElementById('edit-specialite-form').addEventListener('submit', (e) => this.handleEditSpecialiteSubmit(e));

        // Badges d'importance
        this.setupImportanceBadges();
        
        // Sélecteurs de couleur
        this.setupColorPickers();

        // Fermeture des modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Surveillance de session et renouvellement automatique sur activité
        this.setupSessionMonitoring();
    }

    setupSessionMonitoring() {
        // Mettre à jour l'affichage du timer toutes les secondes
        setInterval(() => {
            if (this.isAuthenticated) {
                this.updateSessionIndicator();
            }
        }, 1000);

        // Vérifier la validité de la session toutes les 5 secondes (sans renouvellement automatique)
        setInterval(() => {
            if (this.isAuthenticated && !this.checkActiveSession(false)) {
                this.showNotification('Session expirée. Veuillez vous reconnecter.', 'error');
                this.logout();
            }
        }, 5000);

        // Variable pour éviter les renouvellements trop fréquents
        let lastRenewal = 0;

        // Renouveler la session sur activité utilisateur réelle uniquement
        const renewSessionOnActivity = (event) => {
            if (!this.isAuthenticated) return;

            const now = Date.now();
            // Éviter les renouvellements trop fréquents (max 1 par seconde)
            if (now - lastRenewal < 1000) return;

            // Ignorer les événements générés par notre propre code
            if (event.target && event.target.id === 'session-time') return;
            if (event.target && event.target.id === 'session-indicator') return;

            this.saveSession();
            lastRenewal = now;
        };

        // Écouter seulement les activités utilisateur réelles
        ['click', 'keypress', 'input', 'change'].forEach(eventType => {
            document.addEventListener(eventType, renewSessionOnActivity, { passive: true });
        });
    }

    updateSessionIndicator() {
        const indicator = document.getElementById('session-indicator');
        const timeSpan = document.getElementById('session-time');
        
        if (!indicator || !timeSpan) return;

        const remainingSeconds = this.getSessionTimeRemaining();
        
        if (remainingSeconds > 0) {
            timeSpan.textContent = this.formatSessionTime(remainingSeconds);
            indicator.style.display = 'block';
            
            // Changer la couleur selon le temps restant
            if (remainingSeconds < 60) { // Moins d'une minute
                indicator.style.background = '#ef4444';
                indicator.style.color = 'white';
            } else if (remainingSeconds < 120) { // Moins de 2 minutes
                indicator.style.background = '#f59e0b';
                indicator.style.color = 'white';
            } else {
                indicator.style.background = '#404044';
                indicator.style.color = '#e5e5e5';
            }
        } else {
            indicator.style.display = 'none';
        }
    }

    setupImportanceBadges() {
        document.querySelectorAll('.importance-badges').forEach(container => {
            container.addEventListener('click', (e) => {
                if (e.target.classList.contains('importance-badge')) {
                    // Retirer la sélection des autres badges
                    container.querySelectorAll('.importance-badge').forEach(badge => {
                        badge.classList.remove('selected');
                    });
                    
                    // Ajouter la sélection au badge cliqué
                    e.target.classList.add('selected');
                    
                    // Mettre à jour le champ caché correspondant
                    const value = e.target.dataset.value;
                    if (container.closest('#edit-manuel-modal')) {
                        document.getElementById('edit-manuel-importance').value = value;
                    } else {
                        document.getElementById('manuel-importance').value = value;
                    }
                }
            });
        });
    }

    setupColorPickers() {
        document.querySelectorAll('.color-picker').forEach(picker => {
            picker.addEventListener('click', (e) => {
                if (e.target.classList.contains('color-option')) {
                    picker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                    e.target.classList.add('selected');
                    
                    const color = e.target.dataset.color;
                    if (picker.id === 'edit-categorie-color-picker') {
                        document.getElementById('edit-categorie-color').value = color;
                    } else if (picker.closest('#edit-categorie-modal')) {
                        document.getElementById('edit-categorie-color').value = color;
                    } else {
                        document.getElementById('categorie-color').value = color;
                    }
                }
            });
        });
    }

    // === GESTION DES MANUELS ===
    async handleManuelSubmit(e) {
        e.preventDefault();
        
        const categoryId = parseInt(document.getElementById('manuel-categorie').value);
        const category = this.categories.find(c => c.id === categoryId);
        
        if (!category) {
            this.showNotification('Catégorie invalide', 'error');
            return;
        }

        const manuel = {
            title: document.getElementById('manuel-title').value.trim(),
            desc: document.getElementById('manuel-desc').value.trim(),
            link: document.getElementById('manuel-link').value.trim(),
            importance: parseInt(document.getElementById('manuel-importance').value),
            categorie: category.name,
            catColor: category.color,
            auteur: document.getElementById('manuel-auteur').value.trim()
        };

        if (!this.validateManuel(manuel)) return;

        this.manuels.push(manuel);
        await this.saveManuels();
        this.renderManuels();
        this.clearManuelForm();
        this.updateStats();
        this.showNotification('Manuel ajouté avec succès!');
    }

    async handleEditManuelSubmit(e) {
        e.preventDefault();
        
        const index = parseInt(document.getElementById('edit-manuel-index').value);
        const categoryId = parseInt(document.getElementById('edit-manuel-categorie').value);
        const category = this.categories.find(c => c.id === categoryId);
        
        if (!category) {
            this.showNotification('Catégorie invalide', 'error');
            return;
        }

        const manuel = {
            title: document.getElementById('edit-manuel-title').value.trim(),
            desc: document.getElementById('edit-manuel-desc').value.trim(),
            link: document.getElementById('edit-manuel-link').value.trim(),
            importance: parseInt(document.getElementById('edit-manuel-importance').value),
            categorie: category.name,
            catColor: category.color,
            auteur: document.getElementById('edit-manuel-auteur').value.trim()
        };

        if (!this.validateManuel(manuel)) return;

        this.manuels[index] = manuel;
        await this.saveManuels();
        this.renderManuels();
        this.closeModal('edit-manuel-modal');
        this.updateStats();
        this.showNotification('Manuel modifié avec succès!');
    }

    validateManuel(manuel) {
        if (!manuel.title || !manuel.desc || !manuel.link || !manuel.categorie || !manuel.auteur) {
            this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return false;
        }
        if (manuel.importance < 1 || manuel.importance > 10) {
            this.showNotification('L\'importance doit être entre 1 et 10', 'error');
            return false;
        }
        return true;
    }

    editManuel(index) {
        const manuel = this.manuels[index];
        const category = this.categories.find(c => c.name === manuel.categorie);
        
        document.getElementById('edit-manuel-index').value = index;
        document.getElementById('edit-manuel-title').value = manuel.title;
        document.getElementById('edit-manuel-desc').value = manuel.desc;
        document.getElementById('edit-manuel-link').value = manuel.link;
        document.getElementById('edit-manuel-importance').value = manuel.importance;
        document.getElementById('edit-manuel-categorie').value = category ? category.id : '';
        document.getElementById('edit-manuel-auteur').value = manuel.auteur;

        // Sélectionner le badge d'importance
        document.querySelectorAll('#edit-importance-badges .importance-badge').forEach(badge => {
            badge.classList.toggle('selected', parseInt(badge.dataset.value) === manuel.importance);
        });

        // Mettre à jour les options de catégories
        this.updateCategorySelect('edit-manuel-categorie');

        this.openModal('edit-manuel-modal');
    }

    async deleteManuel(index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce manuel ?')) {
            this.manuels.splice(index, 1);
            await this.saveManuels();
            this.renderManuels();
            this.updateStats();
            this.showNotification('Manuel supprimé avec succès!');
        }
    }

    renderManuels() {
        const container = document.getElementById('manuels-list');
        
        if (this.manuels.length === 0) {
            container.innerHTML = '<p>Aucun manuel disponible</p>';
            return;
        }

        // Grouper les manuels par catégorie
        const manuelsByCategory = {};
        this.manuels.forEach((manuel, index) => {
            const categoryName = manuel.categorie || 'Sans catégorie';
            if (!manuelsByCategory[categoryName]) {
                manuelsByCategory[categoryName] = [];
            }
            manuelsByCategory[categoryName].push({ ...manuel, originalIndex: index });
        });

        // Trier les manuels par importance (décroissant) dans chaque catégorie
        Object.keys(manuelsByCategory).forEach(categoryName => {
            manuelsByCategory[categoryName].sort((a, b) => b.importance - a.importance);
        });

        container.innerHTML = Object.keys(manuelsByCategory).map(categoryName => {
            const manuels = manuelsByCategory[categoryName];
            const categoryColor = manuels[0].catColor || '#22c55e';
            
            return `
                <div class="manuel-category-item">
                    <div class="manuel-category-header">
                        <div class="manuel-category-title">
                            <h4 style="color: ${categoryColor}">🏷️ ${categoryName}</h4>
                            <div class="member-count">${manuels.length}</div>
                        </div>
                        <div class="manuel-category-actions">
                            <button class="btn-admin btn-info" onclick="adminPanel.toggleManuelsCategory('${categoryName}')">👁️ Afficher/Masquer</button>
                        </div>
                    </div>
                    <div class="manuels-container" id="manuels-${categoryName.replace(/[^a-zA-Z0-9]/g, '')}" style="display: block;">
                        <div class="manuel-list">
                            ${manuels.map(manuel => `
                                <div class="manuel-item">
                                    <div class="manuel-info">
                                        <div class="manuel-header">
                                            <div class="manuel-name">${manuel.title}</div>
                                            <div class="manuel-importance" style="background: ${this.getImportanceColor(manuel.importance)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">
                                                ${manuel.importance}/10
                                            </div>
                                        </div>
                                        <div class="manuel-desc">${manuel.desc}</div>
                                        <div class="manuel-meta">
                                            <span><strong>Auteur:</strong> ${manuel.auteur}</span>
                                            <a href="${manuel.link}" target="_blank" style="color: #22c55e; text-decoration: none;">🔗 Ouvrir</a>
                                        </div>
                                    </div>
                                    <div class="manuel-actions">
                                        <button class="btn-admin btn-warning" style="padding: 5px 8px; font-size: 11px;" onclick="adminPanel.editManuel(${manuel.originalIndex})">✏️</button>
                                        <button class="btn-admin btn-danger" style="padding: 5px 8px; font-size: 11px;" onclick="adminPanel.deleteManuel(${manuel.originalIndex})">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getImportanceColor(importance) {
        // Couleur basée sur l'importance (rouge = urgent, vert = faible)
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
            '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1'
        ];
        return colors[Math.min(9, Math.max(0, importance - 1))];
    }

    toggleManuelsCategory(categoryName) {
        const containerId = `manuels-${categoryName.replace(/[^a-zA-Z0-9]/g, '')}`;
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
        }
    }

    clearManuelForm() {
        document.getElementById('manuel-form').reset();
        document.getElementById('manuel-importance').value = '5';
        document.querySelectorAll('.importance-badges .importance-badge').forEach(badge => {
            badge.classList.toggle('selected', badge.dataset.value === '5');
        });
    }

    async saveManuels() {
        try {
            localStorage.setItem('sams_manuels_backup', JSON.stringify(this.manuels));
            
            try {
                const response = await fetch('api/admin.php?type=manuels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.manuels)
                });
                
                if (response.ok) {
                    console.log('Manuels sauvegardés sur le serveur');
                }
            } catch (serverError) {
                console.warn('Serveur non disponible, sauvegarde locale uniquement');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    // === GESTION DES CATÉGORIES ===
    async handleCategorieSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('categorie-name').value.trim();
        const color = document.getElementById('categorie-color').value;
        const visible = document.getElementById('categorie-visibility').classList.contains('active');
        
        if (!name) {
            this.showNotification('Veuillez entrer un nom de catégorie', 'error');
            return;
        }

        if (this.categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
            this.showNotification('Cette catégorie existe déjà', 'error');
            return;
        }

        const newId = this.categories.length > 0 ? Math.max(...this.categories.map(c => c.id)) + 1 : 1;
        
        this.categories.push({
            id: newId,
            name: name,
            color: color,
            visible: visible
        });

        await this.saveCategories();
        this.renderCategories();
        this.updateSelects();
        this.clearCategorieForm();
        this.showNotification('Catégorie ajoutée avec succès!');
    }

    async handleEditCategorieSubmit(e) {
        e.preventDefault();
        
        const index = parseInt(document.getElementById('edit-categorie-index').value);
        const name = document.getElementById('edit-categorie-name').value.trim();
        const color = document.getElementById('edit-categorie-color').value;
        const visible = document.getElementById('edit-categorie-visibility').classList.contains('active');
        
        if (!name) {
            this.showNotification('Veuillez entrer un nom de catégorie', 'error');
            return;
        }

        // Vérifier si le nom existe déjà (sauf pour la catégorie actuelle)
        const existingCategory = this.categories.find((c, i) => c.name.toLowerCase() === name.toLowerCase() && i !== index);
        if (existingCategory) {
            this.showNotification('Ce nom de catégorie existe déjà', 'error');
            return;
        }

        const oldName = this.categories[index].name;
        this.categories[index] = {
            ...this.categories[index],
            name: name,
            color: color,
            visible: visible
        };

        // Mettre à jour les manuels qui utilisent cette catégorie
        this.manuels.forEach(manuel => {
            if (manuel.categorie === oldName) {
                manuel.categorie = name;
                manuel.catColor = color;
            }
        });

        await this.saveCategories();
        await this.saveManuels();
        this.renderAll();
        this.updateSelects();
        this.closeModal('edit-categorie-modal');
        this.showNotification('Catégorie modifiée avec succès!');
    }

    editCategorie(index) {
        const categorie = this.categories[index];
        
        document.getElementById('edit-categorie-index').value = index;
        document.getElementById('edit-categorie-name').value = categorie.name;
        document.getElementById('edit-categorie-color').value = categorie.color;
        
        // Sélectionner la couleur appropriée
        document.querySelectorAll('#edit-categorie-color-picker .color-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.color === categorie.color);
        });

        // Mettre à jour le toggle de visibilité
        const visibilityToggle = document.getElementById('edit-categorie-visibility');
        if (categorie.visible) {
            visibilityToggle.classList.add('active');
        } else {
            visibilityToggle.classList.remove('active');
        }

        this.openModal('edit-categorie-modal');
    }

    async deleteCategorie(index) {
        const categorie = this.categories[index];
        const manuelsUsingCategory = this.manuels.filter(m => m.categorie === categorie.name);
        
        if (manuelsUsingCategory.length > 0) {
            const confirmMsg = `Cette catégorie est utilisée par ${manuelsUsingCategory.length} manuel(s). Êtes-vous sûr de vouloir la supprimer ? Les manuels devront être reconfigurés.`;
            if (!confirm(confirmMsg)) return;
        }

        this.categories.splice(index, 1);
        await this.saveCategories();
        this.renderCategories();
        this.updateSelects();
        this.showNotification('Catégorie supprimée avec succès!');
    }

    renderCategories() {
        const container = document.getElementById('categories-list');
        
        if (this.categories.length === 0) {
            container.innerHTML = '<div class="item"><p>Aucune catégorie disponible</p></div>';
            return;
        }

        container.innerHTML = this.categories.map((categorie, index) => `
            <div class="item">
                <div class="item-info">
                    <h4 style="color: ${categorie.color}">🏷️ ${categorie.name}</h4>
                    <p><strong>Couleur:</strong> <span style="color: ${categorie.color}">${categorie.color}</span></p>
                    <p><strong>Statut:</strong> ${categorie.visible ? '👁️ Visible' : '🚫 Masquée'}</p>
                    <p><strong>Manuels utilisant cette catégorie:</strong> ${this.manuels.filter(m => m.categorie === categorie.name).length}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-admin btn-warning" onclick="adminPanel.editCategorie(${index})">Modifier</button>
                    <button class="btn-admin btn-danger" onclick="adminPanel.deleteCategorie(${index})">Supprimer</button>
                </div>
            </div>
        `).join('');
    }

    clearCategorieForm() {
        document.getElementById('categorie-form').reset();
        document.getElementById('categorie-color').value = '#ef4444';
        document.querySelectorAll('.color-picker .color-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('.color-picker .color-option[data-color="#ef4444"]').classList.add('selected');
        document.getElementById('categorie-visibility').classList.add('active');
    }

    async saveCategories() {
        try {
            localStorage.setItem('sams_categories_backup', JSON.stringify(this.categories));
            
            try {
                const response = await fetch('api/admin.php?type=categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.categories)
                });
                
                if (response.ok) {
                    console.log('Catégories sauvegardées sur le serveur');
                }
            } catch (serverError) {
                console.warn('Serveur non disponible, sauvegarde locale uniquement');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    // === GESTION DES GRADES ===
    async handleGradeSubmit(e) {
        e.preventDefault();
        
        const gradeName = document.getElementById('grade-name').value.trim();
        
        if (!gradeName) {
            this.showNotification('Veuillez entrer un nom de grade', 'error');
            return;
        }

        if (this.grades.find(g => g.grade === gradeName)) {
            this.showNotification('Ce grade existe déjà', 'error');
            return;
        }

        this.grades.push({
            grade: gradeName,
            membres: []
        });

        await this.saveGrades();
        this.renderGrades();
        this.updateSelects();
        this.clearGradeForm();
        this.updateStats();
        this.showNotification('Grade ajouté avec succès!');
    }

    async handleMembreSubmit(e) {
        e.preventDefault();
        
        const gradeValue = document.getElementById('membre-grade').value;
        const nom = document.getElementById('membre-nom').value.trim();
        const id = document.getElementById('membre-id').value.trim();
        
        if (!gradeValue || !nom || !id) {
            this.showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        const membre = `${nom} | ${id}`;
        const grade = this.grades.find(g => g.grade === gradeValue);
        
        if (!grade) {
            this.showNotification('Grade non trouvé', 'error');
            return;
        }

        if (grade.membres.includes(membre)) {
            this.showNotification('Ce membre existe déjà dans ce grade', 'error');
            return;
        }

        grade.membres.push(membre);
        await this.saveGrades();
        this.renderGrades();
        this.clearMembreForm();
        this.updateStats();
        this.showNotification('Membre ajouté avec succès!');
    }

    renderGrades() {
        const container = document.getElementById('grades-list');
        
        if (this.grades.length === 0) {
            container.innerHTML = '<p>Aucun grade disponible</p>';
            return;
        }

        container.innerHTML = this.grades.map((grade, gradeIndex) => `
            <div class="grade-item">
                <div class="grade-header">
                    <div class="grade-title">
                        <h4>🏆 ${grade.grade}</h4>
                        <div class="member-count">${grade.membres.length}</div>
                    </div>
                    <div class="grade-actions">
                        <button class="btn-admin btn-warning" onclick="adminPanel.editGrade(${gradeIndex})">Modifier</button>
                        <button class="btn-admin btn-danger" onclick="adminPanel.deleteGrade(${gradeIndex})">Supprimer</button>
                    </div>
                </div>
                ${grade.membres.length > 0 ? `
                    <div class="members-container">
                        <div class="member-list">
                            ${grade.membres.map((membre, membreIndex) => {
                                const [nom, id] = membre.split(' | ');
                                return `
                                    <div class="member-item">
                                        <div class="member-info">
                                            <div class="member-name">${nom}</div>
                                            <div class="member-id">ID: ${id}</div>
                                        </div>
                                        <button class="btn-admin btn-danger" style="padding: 5px 8px; font-size: 11px;" onclick="adminPanel.deleteMembre(${gradeIndex}, ${membreIndex})">🗑️</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : '<p style="padding: 15px; color: #aaa; font-style: italic; margin: 0;">Aucun membre assigné</p>'}
            </div>
        `).join('');
    }

    // Continuer avec les autres méthodes pour grades, spécialités, etc...
    async saveGrades() {
        try {
            localStorage.setItem('sams_grades_backup', JSON.stringify(this.grades));
            
            try {
                const response = await fetch('api/admin.php?type=grades', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.grades)
                });
                
                if (response.ok) {
                    console.log('Grades sauvegardés sur le serveur');
                }
            } catch (serverError) {
                console.warn('Serveur non disponible, sauvegarde locale uniquement');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    // === GESTION DES SPÉCIALITÉS ===
    async handleSpecialiteSubmit(e) {
        e.preventDefault();
        
        const specialiteName = document.getElementById('specialite-name').value.trim();
        
        if (!specialiteName) {
            this.showNotification('Veuillez entrer un nom de spécialité', 'error');
            return;
        }

        if (this.specialites.find(s => s.specialite === specialiteName)) {
            this.showNotification('Cette spécialité existe déjà', 'error');
            return;
        }

        this.specialites.push({
            specialite: specialiteName,
            membres: []
        });

        await this.saveSpecialites();
        this.renderSpecialites();
        this.updateSelects();
        this.clearSpecialiteForm();
        this.updateStats();
        this.showNotification('Spécialité ajoutée avec succès!');
    }

    renderSpecialites() {
        const container = document.getElementById('specialites-list');
        
        if (this.specialites.length === 0) {
            container.innerHTML = '<p>Aucune spécialité disponible</p>';
            return;
        }

        container.innerHTML = this.specialites.map((specialite, specialiteIndex) => `
            <div class="specialite-item">
                <div class="specialite-header">
                    <div class="specialite-title">
                        <h4>⭐ ${specialite.specialite}</h4>
                        <div class="member-count">${specialite.membres.length}</div>
                    </div>
                    <div class="specialite-actions">
                        <button class="btn-admin btn-warning" onclick="adminPanel.editSpecialite(${specialiteIndex})">Modifier</button>
                        <button class="btn-admin btn-danger" onclick="adminPanel.deleteSpecialite(${specialiteIndex})">Supprimer</button>
                    </div>
                </div>
                ${specialite.membres.length > 0 ? `
                    <div class="members-container">
                        <div class="member-list">
                            ${specialite.membres.map((membre, membreIndex) => {
                                const [nom, id] = membre.split(' | ');
                                return `
                                    <div class="member-item">
                                        <div class="member-info">
                                            <div class="member-name">${nom}</div>
                                            <div class="member-id">ID: ${id}</div>
                                        </div>
                                        <button class="btn-admin btn-danger" style="padding: 5px 8px; font-size: 11px;" onclick="adminPanel.deleteSpecialiteMembre(${specialiteIndex}, ${membreIndex})">🗑️</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : '<p style="padding: 15px; color: #aaa; font-style: italic; margin: 0;">Aucun membre assigné</p>'}
            </div>
        `).join('');
    }

    async saveSpecialites() {
        try {
            localStorage.setItem('sams_specialites_backup', JSON.stringify(this.specialites));
            
            try {
                const response = await fetch('api/admin.php?type=specialites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.specialites)
                });
                
                if (response.ok) {
                    console.log('Spécialités sauvegardées sur le serveur');
                }
            } catch (serverError) {
                console.warn('Serveur non disponible, sauvegarde locale uniquement');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    // === CHANGEMENT DE MOT DE PASSE ===
    async handlePasswordChange(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (currentPassword !== this.adminConfig.password) {
            this.showNotification('Mot de passe actuel incorrect', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showNotification('Les nouveaux mots de passe ne correspondent pas', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showNotification('Le nouveau mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }
        
        this.adminConfig.password = newPassword;
        this.adminConfig.lastChanged = new Date().toISOString();
        
        await this.saveAdminConfig();
        document.getElementById('password-form').reset();
        this.showNotification('Mot de passe modifié avec succès!');
    }

    // === UTILITAIRES ===
    updateSelects() {
        // Mettre à jour le select des catégories pour les manuels
        this.updateCategorySelect('manuel-categorie');
        this.updateCategorySelect('edit-manuel-categorie');

        // Mettre à jour le select des grades
        const gradeSelect = document.getElementById('membre-grade');
        gradeSelect.innerHTML = '<option value="">Sélectionner un grade</option>' +
            this.grades.map(grade => `<option value="${grade.grade}">${grade.grade}</option>`).join('');

        // Mettre à jour le select des spécialités
        const specialiteSelect = document.getElementById('specialite-membre-spec');
        specialiteSelect.innerHTML = '<option value="">Sélectionner une spécialité</option>' +
            this.specialites.map(spec => `<option value="${spec.specialite}">${spec.specialite}</option>`).join('');
    }

    updateCategorySelect(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Sélectionner une catégorie</option>' +
            this.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        
        if (currentValue) {
            select.value = currentValue;
        }
    }

    updateStats() {
        const statsContainer = document.getElementById('stats-container');
        if (!statsContainer) return;
        
        const totalMembresGrades = this.grades.reduce((total, grade) => total + (grade.membres?.length || 0), 0);
        const totalMembresSpecialites = this.specialites.reduce((total, spec) => total + (spec.membres?.length || 0), 0);
        const categoriesVisibles = this.categories.filter(c => c.visible).length;
        
        statsContainer.innerHTML = `
            <p>📚 Manuels: <strong>${this.manuels.length}</strong></p>
            <p>🏷️ Catégories: <strong>${this.categories.length}</strong> (${categoriesVisibles} visibles)</p>
            <p>🏆 Grades: <strong>${this.grades.length}</strong></p>
            <p>⭐ Spécialités: <strong>${this.specialites.length}</strong></p>
            <p>👥 Total membres dans grades: <strong>${totalMembresGrades}</strong></p>
            <p>👥 Total membres dans spécialités: <strong>${totalMembresSpecialites}</strong></p>
        `;
    }

    renderAll() {
        this.renderManuels();
        this.renderCategories();
        this.renderGrades();
        this.renderSpecialites();
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    getSessionTimeRemaining() {
        try {
            const sessionData = localStorage.getItem('sams_admin_session');
            if (!sessionData) return 0;
            
            const session = JSON.parse(sessionData);
            const now = new Date().getTime();
            const elapsed = now - session.timestamp;
            const remaining = Math.max(0, 300000 - elapsed); // 5 minutes - temps écoulé
            
            return Math.floor(remaining / 1000); // Retourner en secondes
        } catch (error) {
            return 0;
        }
    }

    formatSessionTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Méthodes manquantes pour compléter l'interface
    editGrade(index) {
        const grade = this.grades[index];
        document.getElementById('edit-grade-index').value = index;
        document.getElementById('edit-grade-name').value = grade.grade;
        this.openModal('edit-grade-modal');
    }

    async handleEditGradeSubmit(e) {
        e.preventDefault();
        const index = parseInt(document.getElementById('edit-grade-index').value);
        const newName = document.getElementById('edit-grade-name').value.trim();
        
        if (!newName) {
            this.showNotification('Veuillez entrer un nom de grade', 'error');
            return;
        }

        const existingGrade = this.grades.find((g, i) => g.grade === newName && i !== index);
        if (existingGrade) {
            this.showNotification('Ce nom de grade existe déjà', 'error');
            return;
        }

        this.grades[index].grade = newName;
        await this.saveGrades();
        this.renderGrades();
        this.updateSelects();
        this.closeModal('edit-grade-modal');
        this.showNotification('Grade modifié avec succès!');
    }

    async deleteGrade(index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce grade et tous ses membres ?')) {
            this.grades.splice(index, 1);
            await this.saveGrades();
            this.renderGrades();
            this.updateSelects();
            this.updateStats();
            this.showNotification('Grade supprimé avec succès!');
        }
    }

    async deleteMembre(gradeIndex, membreIndex) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
            this.grades[gradeIndex].membres.splice(membreIndex, 1);
            await this.saveGrades();
            this.renderGrades();
            this.updateStats();
            this.showNotification('Membre supprimé avec succès!');
        }
    }

    clearGradeForm() {
        document.getElementById('grade-form').reset();
    }

    clearMembreForm() {
        document.getElementById('membre-form').reset();
    }

    clearSpecialiteForm() {
        document.getElementById('specialite-form').reset();
    }

    clearSpecialiteMembreForm() {
        document.getElementById('specialite-membre-form').reset();
    }

    // Méthodes pour les spécialités (similaires aux grades)
    async handleSpecialiteMembreSubmit(e) {
        e.preventDefault();
        
        const specialiteValue = document.getElementById('specialite-membre-spec').value;
        const nom = document.getElementById('specialite-membre-nom').value.trim();
        const id = document.getElementById('specialite-membre-id').value.trim();
        
        if (!specialiteValue || !nom || !id) {
            this.showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        const membre = `${nom} | ${id}`;
        const specialite = this.specialites.find(s => s.specialite === specialiteValue);
        
        if (!specialite) {
            this.showNotification('Spécialité non trouvée', 'error');
            return;
        }

        if (specialite.membres.includes(membre)) {
            this.showNotification('Ce membre existe déjà dans cette spécialité', 'error');
            return;
        }

        specialite.membres.push(membre);
        await this.saveSpecialites();
        this.renderSpecialites();
        this.clearSpecialiteMembreForm();
        this.updateStats();
        this.showNotification('Membre ajouté avec succès!');
    }

    editSpecialite(index) {
        const specialite = this.specialites[index];
        document.getElementById('edit-specialite-index').value = index;
        document.getElementById('edit-specialite-name').value = specialite.specialite;
        this.openModal('edit-specialite-modal');
    }

    async handleEditSpecialiteSubmit(e) {
        e.preventDefault();
        const index = parseInt(document.getElementById('edit-specialite-index').value);
        const newName = document.getElementById('edit-specialite-name').value.trim();
        
        if (!newName) {
            this.showNotification('Veuillez entrer un nom de spécialité', 'error');
            return;
        }

        const existingSpecialite = this.specialites.find((s, i) => s.specialite === newName && i !== index);
        if (existingSpecialite) {
            this.showNotification('Ce nom de spécialité existe déjà', 'error');
            return;
        }

        this.specialites[index].specialite = newName;
        await this.saveSpecialites();
        this.renderSpecialites();
        this.updateSelects();
        this.closeModal('edit-specialite-modal');
        this.showNotification('Spécialité modifiée avec succès!');
    }

    async deleteSpecialite(index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette spécialité et tous ses membres ?')) {
            this.specialites.splice(index, 1);
            await this.saveSpecialites();
            this.renderSpecialites();
            this.updateSelects();
            this.updateStats();
            this.showNotification('Spécialité supprimée avec succès!');
        }
    }

    async deleteSpecialiteMembre(specialiteIndex, membreIndex) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
            this.specialites[specialiteIndex].membres.splice(membreIndex, 1);
            await this.saveSpecialites();
            this.renderSpecialites();
            this.updateStats();
            this.showNotification('Membre supprimé avec succès!');
        }
    }
}

// Fonctions globales
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    if (window.adminPanel) {
        adminPanel.currentTab = tabName;
    }
}

function toggleVisibility(toggle) {
    toggle.classList.toggle('active');
}

function logout() {
    if (window.adminPanel) {
        adminPanel.logout();
    }
}

function clearManuelForm() {
    if (window.adminPanel) adminPanel.clearManuelForm();
}

function clearCategorieForm() {
    if (window.adminPanel) adminPanel.clearCategorieForm();
}

function clearGradeForm() {
    if (window.adminPanel) adminPanel.clearGradeForm();
}

function clearMembreForm() {
    if (window.adminPanel) adminPanel.clearMembreForm();
}

function clearSpecialiteForm() {
    if (window.adminPanel) adminPanel.clearSpecialiteForm();
}

function clearSpecialiteMembreForm() {
    if (window.adminPanel) adminPanel.clearSpecialiteMembreForm();
}

function closeModal(modalId) {
    if (window.adminPanel) adminPanel.closeModal(modalId);
}

function exportBackup() {
    if (!window.adminPanel) return;
    
    const backup = {
        manuels: adminPanel.manuels,
        categories: adminPanel.categories,
        grades: adminPanel.grades,
        specialites: adminPanel.specialites,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `sams_backup_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    adminPanel.showNotification('Sauvegarde exportée avec succès!');
}

function runDiagnostic() {
    console.log('🔍 Diagnostic du système administrateur...');
    if (window.adminDiagnostic && window.adminDiagnostic.runDiagnostic) {
        window.adminDiagnostic.runDiagnostic();
    } else {
        console.log('⚠️ Outil de diagnostic non disponible');
    }
}

function clearAllData() {
    if (!window.adminPanel) return;
    
    const confirmed = confirm('⚠️ ATTENTION: Cette action supprimera TOUTES les données (manuels, grades, spécialités, catégories). Cette action est IRRÉVERSIBLE. Êtes-vous absolument sûr ?');
    
    if (confirmed) {
        const doubleConfirm = confirm('Êtes-vous VRAIMENT sûr ? Tapez "SUPPRIMER TOUT" pour confirmer.');
        
        if (doubleConfirm) {
            // Vider toutes les données
            adminPanel.manuels = [];
            adminPanel.grades = [];
            adminPanel.specialites = [];
            adminPanel.categories = [];
            
            // Sauvegarder les données vides
            Promise.all([
                adminPanel.saveManuels(),
                adminPanel.saveGrades(),
                adminPanel.saveSpecialites(),
                adminPanel.saveCategories()
            ]).then(() => {
                adminPanel.renderAll();
                adminPanel.updateSelects();
                adminPanel.updateStats();
                adminPanel.showNotification('Toutes les données ont été supprimées', 'error');
            });
        }
    }
}

// Initialiser le panel d'administration
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanelV2();
});
