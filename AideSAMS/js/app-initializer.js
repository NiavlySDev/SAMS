/**
 * Script d'initialisation de l'application
 * Charge toutes les données au démarrage avec le système de priorités
 */

class AppInitializer {
    constructor() {
        this.ready = false;
        this.data = {};
    }

    /**
     * Initialiser l'application complète
     */
    async init() {
        console.log('🚀 Initialisation de l\'application SAMS...');
        
        try {
            // 1. Attendre que le DataSyncManager soit prêt
            await this.waitForDataSync();
            
            // 2. Importer toutes les données
            const results = await dataSyncManager.importAllData();
            this.data = results;
            
            // 3. Vérifier l'intégrité des données
            this.validateData();
            
            // 4. Afficher le status
            this.displayStatus();
            
            this.ready = true;
            console.log('✅ Application prête');
            
            // Dispatcher un événement custom
            window.dispatchEvent(new CustomEvent('appReady', { detail: this.data }));
            
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
        }
    }

    /**
     * Attendre que DataSyncManager soit initialiser
     */
    async waitForDataSync(maxAttempts = 10) {
        let attempts = 0;
        
        while (!window.dataSyncManager || !window.dataSyncManager.dbAvailable === undefined) {
            if (attempts >= maxAttempts) {
                console.warn('⚠️ DataSyncManager non disponible après attente');
                return;
            }
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
    }

    /**
     * Valider l'intégrité des données
     */
    validateData() {
        const status = {
            manuels: this.data.manuels?.count || 0,
            grades: this.data.grades?.count || 0,
            specialites: this.data.specialites?.count || 0,
            categories: this.data.categories?.count || 0,
            blippers: this.data.blippers?.count || 0,
            'gta5-zones': this.data['gta5-zones']?.count || 0
        };

        console.log('📊 Données chargées:', status);
        
        // Vérifier les données critiques
        if (status.manuels === 0) console.warn('⚠️ Aucun manuel chargé');
        if (status.categories === 0) console.warn('⚠️ Aucune catégorie chargée');
        
        return status;
    }

    /**
     * Afficher le statut
     */
    displayStatus() {
        const dbStatus = dataSyncManager.dbAvailable ? '✅ BDD' : '❌ Fallback';
        const summary = Object.entries(this.data)
            .map(([type, result]) => `${type}: ${result.count}`)
            .join(' | ');
        
        console.log(`📍 Status Sync: ${dbStatus} | ${summary}`);
    }

    /**
     * Obtenir les données d'un type
     */
    getData(type) {
        return this.data[type]?.data || [];
    }

    /**
     * Obtenir le statut complet
     */
    getStatus() {
        return {
            ready: this.ready,
            dbAvailable: dataSyncManager.dbAvailable,
            data: this.data
        };
    }
}

// Instance globale
const appInitializer = new AppInitializer();

// Initialiser au chargement du document
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => appInitializer.init());
} else {
    appInitializer.init();
}
