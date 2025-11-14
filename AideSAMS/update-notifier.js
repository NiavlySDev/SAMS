// Système de notification de mise à jour AideSAMS
class UpdateNotifier {
    constructor() {
        this.storageKey = 'aidesams_last_seen_version';
        this.changelogUrl = 'json/changelog.json';
        this.currentVersion = null;
        this.lastSeenVersion = localStorage.getItem(this.storageKey);
    }

    async init() {
        try {
            const response = await fetch(this.changelogUrl);
            const changelog = await response.json();
            
            if (changelog && changelog.length > 0) {
                this.currentVersion = changelog[0].version;
                
                // Vérifier si une mise à jour est disponible
                if (this.hasUpdate()) {
                    this.showUpdateNotification(changelog);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement du changelog:', error);
        }
    }

    hasUpdate() {
        return this.lastSeenVersion !== this.currentVersion;
    }

    showUpdateNotification(changelog) {
        // Récupérer les versions depuis la dernière vue
        const newVersions = this.getNewVersionsSince(changelog, this.lastSeenVersion);
        
        if (newVersions.length === 0) return;

        // Créer la notification
        const notification = this.createNotificationHTML(newVersions);
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }

    getNewVersionsSince(changelog, lastSeenVersion) {
        const newVersions = [];
        
        for (const version of changelog) {
            if (version.version === lastSeenVersion) break;
            newVersions.push(version);
        }
        
        return newVersions;
    }

    createNotificationHTML(versions) {
        const overlay = document.createElement('div');
        overlay.className = 'update-notification-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'update-notification-modal';
        
        // Compter les changements globaux
        const globalChanges = [];
        versions.forEach(version => {
            if (version.changes) {
                version.changes.forEach(change => {
                    if (typeof change === 'object' && change.type === 'global') {
                        globalChanges.push({
                            version: version.version,
                            text: change.text,
                            date: version.date
                        });
                    } else if (typeof change === 'string') {
                        // Pour les anciennes versions non annotées
                        if (this.isGlobalChange(change)) {
                            globalChanges.push({
                                version: version.version,
                                text: change,
                                date: version.date
                            });
                        }
                    }
                });
            }
        });

        modal.innerHTML = `
            <div class="update-header">
            <div class="update-icon">🚀</div>
            <h2>Nouvelles mises à jour disponibles !</h2>
            <div class="update-version-range">
                ${versions.length === 1 ? 
                `Version ${versions[0].version}` : 
                `${versions.length} nouvelles versions (${versions[versions.length-1].version} → ${versions[0].version})`
                }
            </div>
            </div>
            
            <div class="update-content">
            <h3>🌟 Changements principaux :</h3>
            <div class="global-changes">
                ${globalChanges.length > 0 ? 
                globalChanges.map(change => `
                    <div class="change-item global">
                    <span class="change-icon">💡</span>
                    <div class="change-content">
                        <div class="change-text">${change.text}</div>
                        <div class="change-meta">${change.version} - ${change.date}</div>
                    </div>
                    </div>
                `).join('') :
                '<div class="no-major-changes">Améliorations et corrections diverses</div>'
                }
            </div>
            
            <div class="update-footer">
                <p>📋 <strong>Consulter le changelog complet :</strong> Page Informations → Changelog</p>
                <p>🔄 N\'hésitez pas à faire Shift + F5 pour recharger la page si vous voyez encore les pages retirées</p>
            </div>
            </div>
            
            <div class="update-actions">
            <button class="btn-secondary" onclick="updateNotifier.dismissNotification(false)">Plus tard</button>
            <button class="btn-primary" onclick="updateNotifier.dismissNotification(true)">J'ai compris ✓</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        return overlay;
    }

    isGlobalChange(changeText) {
        const globalKeywords = [
            'nouvelle page', 'ajout majeur', 'refonte', 'intégration complète',
            'système', 'amélioration ux', 'première version', 'navigation',
            'design général', 'interface', 'expérience utilisateur'
        ];
        
        const lowerChange = changeText.toLowerCase();
        return globalKeywords.some(keyword => lowerChange.includes(keyword)) ||
               changeText.includes('🎉') || changeText.includes('🔇') ||
               changeText.includes('<b>');
    }

    dismissNotification(markAsSeen = true) {
        const notification = document.querySelector('.update-notification-overlay');
        if (notification) {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
            
            if (markAsSeen && this.currentVersion) {
                localStorage.setItem(this.storageKey, this.currentVersion);
            }
        }
    }
}

// Styles CSS pour les notifications
const notificationStyles = `
<style>
.update-notification-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.update-notification-overlay.show {
    opacity: 1;
}

.update-notification-overlay.hide {
    opacity: 0;
}

.update-notification-modal {
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.98));
    border: 1px solid rgba(74, 158, 255, 0.3);
    border-radius: 16px;
    padding: 32px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    color: white;
    position: relative;
    transform: translateY(20px);
    transition: transform 0.3s ease;
}

.update-notification-overlay.show .update-notification-modal {
    transform: translateY(0);
}

.update-header {
    text-align: center;
    margin-bottom: 24px;
    border-bottom: 1px solid rgba(74, 158, 255, 0.2);
    padding-bottom: 20px;
}

.update-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.update-header h2 {
    margin: 0 0 8px 0;
    color: #4a9eff;
    font-size: 24px;
    font-weight: 600;
}

.update-version-range {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
}

.update-content h3 {
    color: #4a9eff;
    margin: 0 0 16px 0;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.global-changes {
    margin-bottom: 24px;
}

.change-item {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 8px;
    background: rgba(74, 158, 255, 0.1);
    border-left: 3px solid #4a9eff;
}

.change-icon {
    font-size: 16px;
    flex-shrink: 0;
    margin-top: 2px;
}

.change-content {
    flex: 1;
}

.change-text {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 4px;
}

.change-meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
}

.no-major-changes {
    padding: 16px;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.update-footer {
    background: rgba(74, 158, 255, 0.1);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
}

.update-footer p {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
}

.update-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.update-actions button {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
}

.btn-primary {
    background: #4a9eff;
    color: white;
}

.btn-primary:hover {
    background: #357abd;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
}

@media (max-width: 768px) {
    .update-notification-modal {
        padding: 24px;
        max-width: 95%;
    }
    
    .update-actions {
        flex-direction: column;
    }
    
    .update-actions button {
        width: 100%;
    }
}
</style>
`;

// Injecter les styles
document.head.insertAdjacentHTML('beforeend', notificationStyles);

// Instance globale
const updateNotifier = new UpdateNotifier();

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => updateNotifier.init());
} else {
    updateNotifier.init();
}
