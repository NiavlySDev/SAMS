// Système de notification de bienvenue pour les nouveaux utilisateurs AideSAMS
class WelcomeNotifier {
    constructor() {
        this.storageKey = 'aidesams_welcome_shown';
        this.isFirstVisit = !localStorage.getItem(this.storageKey);
        this.debug = false;
    }

    init() {
        if (this.isFirstVisit || this.debug) {
            this.showWelcomePopup();    
            localStorage.setItem(this.storageKey, 'true');
        }
    }

    showWelcomePopup() {
        const overlay = document.createElement('div');
        overlay.className = 'welcome-overlay';
        overlay.style.zIndex = '10000';
        
        const modal = document.createElement('div');
        modal.className = 'welcome-modal';
        modal.style.zIndex = '10001';
        modal.style.background = 'transparent';
        modal.style.boxShadow = 'none';
        modal.style.border = 'none';
        
        // Layer 1: Background image
        const bgLayer = document.createElement('div');
        bgLayer.style.position = 'absolute';
        bgLayer.style.top = '0';
        bgLayer.style.left = '0';
        bgLayer.style.right = '0';
        bgLayer.style.bottom = '0';
        bgLayer.style.backgroundImage = 'url("images/urgence.png")';
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        bgLayer.style.backgroundRepeat = 'no-repeat';
        bgLayer.style.borderRadius = '20px';
        bgLayer.style.zIndex = '0';
        
        // Layer 2: Semi-transparent overlay
        const overlayLayer = document.createElement('div');
        overlayLayer.style.position = 'absolute';
        overlayLayer.style.top = '0';
        overlayLayer.style.left = '0';
        overlayLayer.style.right = '0';
        overlayLayer.style.bottom = '0';
        overlayLayer.style.background = 'rgba(24, 24, 24, 0.72)';
        overlayLayer.style.borderRadius = '20px';
        overlayLayer.style.zIndex = '0.5';
        
        modal.appendChild(bgLayer);
        modal.appendChild(overlayLayer);
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'welcome-content';
        contentWrapper.style.position = 'relative';
        contentWrapper.style.zIndex = '1';
        contentWrapper.style.background = 'transparent';
        contentWrapper.style.padding = '40px 35px';
        contentWrapper.style.display = 'flex';
        contentWrapper.style.flexDirection = 'column';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'welcome-close';
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = () => overlay.remove();
        contentWrapper.appendChild(closeBtn);
        
        const header = document.createElement('div');
        header.className = 'welcome-header';
        header.innerHTML = '<div class="welcome-icon">👋</div><h1>Bienvenue sur AideSAMS!</h1>';
        contentWrapper.appendChild(header);
        
        const body = document.createElement('div');
        body.className = 'welcome-body';
        body.innerHTML = `
            <p class="welcome-intro">Bienvenue dans votre assistant pour la SAMS !</p>
            <div class="welcome-features">
                <div class="feature">
                    <span class="feature-icon">📚</span>
                    <div><strong>Manuels & Ressources</strong><p>Trouvez tous les manuels et ressources organisés par catégorie</p></div>
                </div>
                <div class="feature">
                    <span class="feature-icon">📋</span>
                    <div><strong>Hiérarchie & Grades</strong><p>Consultez la structure hiérarchique complète</p></div>
                </div>
                <div class="feature">
                    <span class="feature-icon">🗺️</span>
                    <div><strong>Carte Interactive</strong><p>Explorez la carte GTA5 et tous les points d'intérêt</p></div>
                </div>
                <div class="feature">
                    <span class="feature-icon">⚙️</span>
                    <div><strong>Paramètres</strong><p>Gérez vos préférences et accédez aux paramètres</p></div>
                </div>
            </div>
            <div class="welcome-cta">
                <p><strong>Besoin d'aide pour bien démarrer ?</strong></p>
                <a href="tuto.html" class="welcome-button welcome-button-primary">📖 Consulter le tutoriel complet</a>
            </div>
        `;
        contentWrapper.appendChild(body);
        
        const footer = document.createElement('div');
        footer.className = 'welcome-footer';
        footer.innerHTML = '<p>Cliquez n\'importe où pour fermer cette fenêtre</p>';
        contentWrapper.appendChild(footer);
        
        modal.appendChild(contentWrapper);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        setTimeout(() => {
            overlay.classList.add('show');
        }, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const welcomeNotifier = new WelcomeNotifier();
    
    // Ajouter un petit délai pour s'assurer que le welcome notifier s'affiche APRÈS les autres popups
    setTimeout(() => {
        welcomeNotifier.init();
    }, 300);
});
