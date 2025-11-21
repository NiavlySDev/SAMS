/**
 * Gestionnaire de synchronisation des données
 * Priorité de chargement: BDD MySQL > LocalStorage > JSON
 * Priorité de sauvegarde: BDD + LocalStorage + JSON
 */

class DataSyncManager {
    constructor() {
        this.dbAvailable = false;
        this.dbCheckUrl = 'api/db.php?action=check';
        this.cache = {};
        this.defaultTypes = ['manuels', 'grades', 'specialites', 'categories', 'blippers', 'gta5-zones'];
        this.initPromise = this.init();  // Garder la promesse d'initialisation
    }

    async init() {
        // Vérifier la disponibilité de la BDD
        await this.checkDatabaseConnection();
        return true;  // Signal que l'initialisation est terminée
    }

    /**
     * Attendre que l'initialisation soit complète
     */
    async ensureInitialized() {
        if (!this.initPromise) {
            this.initPromise = this.init();
        }
        await this.initPromise;
    }

    /**
     * Vérifier la connexion à la base de données
     */
    async checkDatabaseConnection() {
        try {
            const response = await fetch(this.dbCheckUrl, { 
                timeout: 5000,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            this.dbAvailable = result.connected === true;
            
            if (this.dbAvailable) {
                console.log('✅ Connexion BDD établie - Synchronisation active');
                console.log(`📍 Serveur: ${result.server} | Base: ${result.database}`);
            } else {
                console.warn('⚠️ BDD indisponible - Mode fallback actif (LocalStorage/JSON)');
                if (result.error) {
                    console.warn(`📋 Raison: ${result.error}`);
                }
            }
        } catch (error) {
            console.warn('⚠️ API inaccessible - Mode fallback activé');
            console.warn(`📋 Erreur: ${error.message}`);
            this.dbAvailable = false;
        }
    }

    /**
     * Importer TOUTES les données au démarrage
     */
    async importAllData() {
        console.log('📥 Début de l\'importation des données...');
        const results = {};
        
        for (const type of this.defaultTypes) {
            try {
                const data = await this.load(type);
                results[type] = {
                    success: true,
                    count: Array.isArray(data) ? data.length : Object.keys(data).length,
                    data: data
                };
            } catch (error) {
                console.error(`❌ Erreur importation ${type}:`, error);
                results[type] = { success: false, error: error.message };
            }
        }
        
        console.log('✅ Importation terminée', results);
        return results;
    }

    /**
     * Charger UNIQUEMENT depuis la BDD - Pas de fallback !
     * Mode strict pour les pages principales (hierarchie, manuels, gta5-map, admin)
     */
    async loadOnlyFromDB(type) {
        // IMPORTANT: Attendre que l'initialisation de DataSyncManager soit terminée
        await this.ensureInitialized();

        // Si déjà en cache, retourner
        if (this.cache[type] && Array.isArray(this.cache[type])) {
            console.log(`🔄 ${type} récupéré depuis le cache (${this.cache[type].length} éléments)`);
            return this.cache[type];
        }

        // 1. OBLIGATOIRE: Charger depuis la BDD uniquement
        if (!this.dbAvailable) {
            console.error(`🚫 ERREUR CRITIQUE: BDD indisponible pour ${type} - Mode strict activé!`);
            throw new Error(`Impossible de charger ${type}: Base de données indisponible`);
        }

        try {
            console.log(`📡 Chargement STRICT depuis la BDD pour ${type}...`);
            const data = await this.loadFromDB(type);
            // Accepter même un array vide, tant que c'est un array ou un objet valide
            if (data !== null && data !== undefined && (Array.isArray(data) || typeof data === 'object')) {
                console.log(`✅ ${type} CHARGÉ DEPUIS LA BDD (${Array.isArray(data) ? data.length : 'objet'} éléments)`);
                this.cache[type] = data;
                return data;
            } else {
                throw new Error(`La BDD a retourné des données invalides pour ${type}`);
            }
        } catch (error) {
            console.error(`❌ ERREUR CRITIQUE BDD (${type}):`, error.message);
            throw error;  // Propager l'erreur, pas de fallback!
        }
    }

    /**
     * Charger les données avec priorité: BDD > LocalStorage > JSON
     * Utilise un système intelligent de fallback
     */
    async load(type) {
        // IMPORTANT: Attendre que l'initialisation de DataSyncManager soit terminée
        await this.ensureInitialized();

        // Si déjà en cache, retourner
        if (this.cache[type] && Array.isArray(this.cache[type])) {
            console.log(`🔄 ${type} récupéré depuis le cache (${this.cache[type].length} éléments)`);
            return this.cache[type];
        }

        // 1. Essayer de charger depuis la BDD en priorité
        if (this.dbAvailable) {
            try {
                console.log(`📡 Tentative de chargement ${type} depuis la BDD...`);
                const data = await this.loadFromDB(type);
                if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
                    console.log(`✅ ${type} CHARGÉ DEPUIS LA BDD (${Array.isArray(data) ? data.length : 'objet'} éléments)`);
                    this.cache[type] = data;
                    // Aussi sauvegarder en localStorage pour plus tard
                    this.saveToLocalStorage(type, data);
                    return data;
                } else {
                    console.warn(`⚠️ La BDD a retourné des données vides pour ${type}`);
                }
            } catch (error) {
                console.error(`❌ ERREUR chargement BDD (${type}):`, error.message);
                // Continuer avec les fallbacks
            }
        } else {
            console.warn(`⚠️ BDD indisponible - passage au fallback pour ${type}`);
        }

        // 2. Essayer de charger depuis localStorage (données locales)
        const localData = this.loadFromLocalStorage(type);
        if (localData && (Array.isArray(localData) ? localData.length > 0 : Object.keys(localData).length > 0)) {
            console.log(`💾 ${type} chargé depuis localStorage`);
            this.cache[type] = localData;
            return localData;
        }

        // 3. Charger depuis le fichier JSON (source d'origine)
        try {
            const data = await this.loadFromJSON(type);
            if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
                console.log(`📄 ${type} chargé depuis le JSON (${Array.isArray(data) ? data.length : 'objet'} éléments)`);
                this.cache[type] = data;
                // Sauvegarder en localStorage pour la prochaine fois
                this.saveToLocalStorage(type, data);
                // Si la BDD est disponible, la mettre à jour aussi
                if (this.dbAvailable) {
                    this.saveToDB(type, data).catch(e => console.warn('Erreur sync BDD:', e.message));
                }
                return data;
            }
        } catch (error) {
            console.error(`❌ Impossible de charger ${type} depuis JSON:`, error.message);
        }

        // 4. Aucune donnée trouvée
        console.error(`🚫 Aucune donnée disponible pour ${type}`);
        return [];
    }

    /**
     * Charger depuis la base de données
     */
    async loadFromDB(type) {
        const url = `api/db.php?action=load&type=${type}`;
        console.log(`🔗 Appel API: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`📦 Réponse API pour ${type}:`, result);
        
        if (result.success && result.data) {
            console.log(`✅ Données reçues: ${Array.isArray(result.data) ? result.data.length : '?'} éléments`);
            return result.data;
        }
        
        console.error(`⚠️ API retourne success=false:`, result.error || result);
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
     * Sauvegarder les données partout (BDD + LocalStorage + JSON)
     */
    async save(type, data) {
        if (!data) {
            console.error(`❌ Tentative de sauvegarde avec données vides pour ${type}`);
            return { success: false, error: 'Données vides' };
        }
        
        // SUPER IMPORTANT: Vérifier exactement ce qu'on va sauvegarder
        if (Array.isArray(data)) {
            console.log(`💾 save() called for ${type} with ${data.length} items`);
            if (data.length === 0) {
                console.warn(`⚠️ ⚠️ ⚠️ ATTENTION: save() called with EMPTY array for ${type}!`);
                console.warn('Cette opération va EFFACER les données précédentes dans la BDD!');
                console.warn('Stack trace:', new Error().stack);
            }
            // Afficher premier item pour vérifier la structure
            if (data.length > 0) {
                console.log(`First item: type=${data[0].type}`, data[0]);
            }
        } else {
            console.log(`💾 save() called for ${type} with non-array data:`, data);
        }

        this.cache[type] = data;
        const saveResults = [];

        // 1. Sauvegarder en BDD (priorité haute)
        if (this.dbAvailable) {
            try {
                console.log(`🔹 Attempting to save ${type} to database...`);
                const success = await this.saveToDB(type, data);
                if (success) {
                    console.log(`✅ ${type} sauvegardé en BDD`);
                    saveResults.push('database');
                } else {
                    console.warn(`⚠️ Erreur BDD pour ${type}`);
                }
            } catch (error) {
                console.warn(`⚠️ Erreur sauvegarde BDD (${type}):`, error.message);
            }
        }

        // 2. Sauvegarder en localStorage (toujours, comme backup)
        try {
            this.saveToLocalStorage(type, data);
            console.log(`💾 ${type} sauvegardé en localStorage`);
            saveResults.push('localStorage');
        } catch (error) {
            console.error(`❌ Erreur localStorage (${type}):`, error.message);
        }

        // 3. Sauvegarder en JSON (via API)
        try {
            const success = await this.saveToJSON(type, data);
            if (success) {
                console.log(`📄 ${type} sauvegardé en JSON`);
                saveResults.push('json');
            }
        } catch (error) {
            console.warn(`⚠️ Erreur sauvegarde JSON (${type}):`, error.message);
        }

        return {
            success: saveResults.length > 0,
            savedTo: saveResults,
            message: `${type} sauvegardé dans: ${saveResults.join(', ')}`
        };
    }

    /**
     * Sauvegarder dans la base de données
     */
    async saveToDB(type, data) {
        const url = `api/db.php?action=save&type=${type}`;
        console.log(`🌐 Sending to API: ${url}`, 'Data length:', Array.isArray(data) ? data.length : 'non-array');
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
        console.log(`📡 API response for ${type}:`, result);
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
window.dataSyncManager = dataSyncManager;
