// Système de gestion des includes communs et fonctionnalités partagées
class SAMSCommon {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    async init() {
        try {
            await this.loadIncludes();
            this.setupCommonFeatures();
            this.updateVersion();
            this.updateSpecialityTabs();
            this.setActiveTab();
            this.setupRealTimeSyncOnFocus();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation SAMS Common:', error);
        }
    }

    /**
     * Système de sync en temps réel: recharger les données quand la page reprend le focus
     * (après un switch depuis l'admin qui a modifié les données)
     * NOTE: Ne pas recharger pour gta5-map car c'est une page éditable!
     */
    setupRealTimeSyncOnFocus() {
        window.addEventListener('focus', () => {
            console.log(`🔄 Page reprend le focus - Sync BDD pour: ${this.currentPage}`);
            
            // gta5-map: NE PAS recharger automatiquement (page éditable)
            // L'utilisateur peut cliquer sur le bouton "Recharger BDD" s'il veut
            
            if (this.currentPage === 'hierarchie' && window.performHierarchyRefresh) {
                window.performHierarchyRefresh();
            }
            
            if (this.currentPage === 'manuels' && window.performManuelsRefresh) {
                window.performManuelsRefresh();
            }
            
            // Admin panel se rafraîchit automatiquement au focus
            if (this.currentPage === 'admin' && window.adminPanel) {
                window.adminPanel.waitForAppReady();
            }
        });
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1);
        const pageName = filename.replace('.html', '') || 'index';
        
        // Si on est sur index.html, considérer que c'est la page service 
        // car index.html redirige automatiquement vers service.html
        return pageName === 'index' ? 'service' : pageName;
    }

    async loadIncludes() {
        try {
            // Charger le header
            const headerResponse = await fetch('includes/header.html');
            const headerHTML = await headerResponse.text();
            
            // Charger la navbar
            const navbarResponse = await fetch('includes/navbar.html');
            const navbarHTML = await navbarResponse.text();
            
            // Injecter le header au début du body
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
            
            // Injecter la navbar après le header
            const header = document.querySelector('.header');
            if (header) {
                header.insertAdjacentHTML('afterend', navbarHTML);
            }
            
            console.log('✅ Includes chargés avec succès');
        } catch (error) {
            console.error('❌ Erreur lors du chargement des includes:', error);
        }
    }

    setupCommonFeatures() {
        // Gestion spécifique à la page admin
        if (this.currentPage === 'admin') {
            this.setupAdminFeatures();
        }
    }

    setupAdminFeatures() {
        // Afficher les éléments spécifiques au panel admin
        const sessionIndicator = document.getElementById('session-indicator');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (sessionIndicator) sessionIndicator.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
    }

    async updateVersion() {
        try {
            const response = await fetch('json/changelog.json');
            const changelog = await response.json();
            
            if (Array.isArray(changelog) && changelog.length > 0) {
                const versionElement = document.getElementById('version-display');
                if (versionElement) {
                    versionElement.textContent = changelog[0].version;
                }
            }
        } catch (error) {
            console.warn('Impossible de charger la version:', error);
        }
    }

    updateSpecialityTabs() {
        try {
            const params = JSON.parse(localStorage.getItem('sams_params') || '{}');
            
            const hasPH = params.specialities && params.specialities.includes('Pilote Héliporté');
            const hasProf = params.specialities && params.specialities.includes('Professeur');
            
            const phTab = document.getElementById('ph-tab');
            const profTab = document.getElementById('prof-tab');
            
            if (phTab) phTab.style.display = hasPH ? 'block' : 'none';
            if (profTab) profTab.style.display = hasProf ? 'block' : 'none';
        } catch (error) {
            console.warn('Erreur lors de la mise à jour des onglets spécialisés:', error);
        }
    }

    setActiveTab() {
        // Retirer la classe active de tous les onglets
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Ajouter la classe active à l'onglet correspondant
        const currentTab = document.querySelector(`[data-page="${this.currentPage}"]`);
        if (currentTab) {
            currentTab.classList.add('active');
        }
    }

    // Méthodes utilitaires communes
    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'error' ? 'background: #ef4444;' : ''}
            ${type === 'success' ? 'background: #22c55e;' : ''}
            ${type === 'warning' ? 'background: #f59e0b;' : ''}
            ${type === 'info' ? 'background: #3b82f6;' : ''}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Méthode pour recharger les includes (utile pour le développement)
    static async reload() {
        window.location.reload();
    }
}

// Fonction globale pour la déconnexion admin (si nécessaire)
function logout() {
    if (window.adminPanel && window.adminPanel.logout) {
        window.adminPanel.logout();
    }
}

// Initialiser le système commun quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.samsCommon = new SAMSCommon();
});

// Exporter pour utilisation globale
window.SAMSCommon = SAMSCommon;
