/**
 * Gestionnaire de synchronisation des données
 * Priorité: BDD MySQL > LocalStorage > JSON
 */

class DataSyncManager {
    constructor() {
        this.dbAvailable = false;
        this.dbCheckUrl = 'api/db.php?action=check';
        this.cache = {};
        this.init();
    }

    async init() {
        // Vérifier la disponibilité de la BDD
        await this.checkDatabaseConnection();
    }

    /**
     * Vérifier la connexion à la base de données
     */
    async checkDatabaseConnection() {
        try {
            const response = await fetch(this.dbCheckUrl);
            const result = await response.json();
            this.dbAvailable = result.connected;
            
            if (this.dbAvailable) {
                console.log('✅ Connexion BDD établie');
            } else {
                console.warn('⚠️ BDD indisponible - utilisation du fallback');
            }
        } catch (error) {
            console.warn('⚠️ BDD inaccessible:', error);
            this.dbAvailable = false;
        }
    }

    /**
     * Charger les données avec priorité: BDD > LocalStorage > JSON
     */
    async load(type) {
        // 1. Essayer de charger depuis la BDD
        if (this.dbAvailable) {
            try {
                const data = await this.loadFromDB(type);
                if (data) {
                    console.log(`📊 ${type} chargé depuis la BDD`);
                    this.cache[type] = data;
                    return data;
                }
            } catch (error) {
                console.warn(`Erreur chargement BDD (${type}):`, error);
            }
        }

        // 2. Essayer de charger depuis localStorage
        const localData = this.loadFromLocalStorage(type);
        if (localData) {
            console.log(`💾 ${type} chargé depuis localStorage`);
            this.cache[type] = localData;
            return localData;
        }

        // 3. Charger depuis le fichier JSON
        try {
            const data = await this.loadFromJSON(type);
            console.log(`📄 ${type} chargé depuis le JSON`);
            this.cache[type] = data;
            return data;
        } catch (error) {
            console.error(`❌ Impossible de charger ${type}:`, error);
            return [];
        }
    }

    /**
     * Charger depuis la base de données
     */
    async loadFromDB(type) {
        const url = `api/db.php?action=load&type=${type}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        }
        
        throw new Error(result.error || 'Erreur inconnue');
    }

    /**
     * Charger depuis localStorage
     */
    loadFromLocalStorage(type) {
        try {
            const data = localStorage.getItem(`sams_${type}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Erreur localStorage (${type}):`, error);
            return null;
        }
    }

    /**
     * Charger depuis le fichier JSON
     */
    async loadFromJSON(type) {
        const url = `json/${type}.json`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Fichier ${type}.json non trouvé`);
        }
        
        return await response.json();
    }

    /**
     * Sauvegarder les données avec fallback
     */
    async save(type, data) {
        this.cache[type] = data;
        
        // 1. Essayer de sauvegarder en BDD
        if (this.dbAvailable) {
            try {
                const success = await this.saveToDB(type, data);
                if (success) {
                    console.log(`✅ ${type} sauvegardé en BDD`);
                    // Aussi sauvegarder en localStorage comme backup
                    this.saveToLocalStorage(type, data);
                    return { success: true, source: 'database' };
                }
            } catch (error) {
                console.warn(`Erreur sauvegarde BDD (${type}):`, error);
                // Continuer avec les autres méthodes
            }
        }

        // 2. Sauvegarder en localStorage
        this.saveToLocalStorage(type, data);
        console.log(`💾 ${type} sauvegardé en localStorage`);
        
        // 3. Sauvegarder en JSON (via API si disponible)
        try {
            await this.saveToJSON(type, data);
            console.log(`📄 ${type} sauvegardé en JSON`);
            return { success: true, source: 'localStorage+json' };
        } catch (error) {
            console.warn(`Erreur sauvegarde JSON (${type}):`, error);
            return { success: true, source: 'localStorage' };
        }
    }

    /**
     * Sauvegarder dans la base de données
     */
    async saveToDB(type, data) {
        const url = `api/db.php?action=save&type=${type}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        return result.success || false;
    }

    /**
     * Sauvegarder en localStorage
     */
    saveToLocalStorage(type, data) {
        try {
            localStorage.setItem(`sams_${type}`, JSON.stringify(data));
        } catch (error) {
            console.error(`Erreur sauvegarde localStorage (${type}):`, error);
        }
    }

    /**
     * Sauvegarder en JSON (via API)
     */
    async saveToJSON(type, data) {
        const url = `api/admin.php?type=${type}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return true;
    }

    /**
     * Obtenir le statut de la synchronisation
     */
    getStatus() {
        return {
            dbAvailable: this.dbAvailable,
            storage: 'localStorage',
            backup: 'JSON files'
        };
    }
}

// Instance globale
const dataSyncManager = new DataSyncManager();
