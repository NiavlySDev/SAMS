// Script utilitaire pour tester et déboguer le panel admin
console.log('🔧 Admin Panel - Utilitaires de diagnostic');

// Fonction pour tester le chargement des données
async function testDataLoading() {
    console.log('🔍 Test du chargement des données...');
    
    try {
        // Test manuels
        const manuelsResponse = await fetch('json/manuels.json');
        const manuels = await manuelsResponse.json();
        console.log(`✅ Manuels chargés: ${manuels.length} éléments`);
        
        // Test grades
        const gradesResponse = await fetch('json/grades.json');
        const grades = await gradesResponse.json();
        console.log(`✅ Grades chargés: ${grades.length} éléments`);
        
        // Test spécialités
        const specialitesResponse = await fetch('json/specialites.json');
        const specialites = await specialitesResponse.json();
        console.log(`✅ Spécialités chargées: ${specialites.length} éléments`);
        
        return { manuels, grades, specialites };
        
    } catch (error) {
        console.error('❌ Erreur lors du test de chargement:', error);
        return null;
    }
}

// Fonction pour vérifier les sauvegardes locales
function checkLocalBackups() {
    console.log('💾 Vérification des sauvegardes locales...');
    
    const manuelsBackup = localStorage.getItem('sams_manuels_backup');
    const gradesBackup = localStorage.getItem('sams_grades_backup');
    const specialitesBackup = localStorage.getItem('sams_specialites_backup');
    
    console.log(manuelsBackup ? '✅ Backup manuels trouvé' : '⚠️ Pas de backup manuels');
    console.log(gradesBackup ? '✅ Backup grades trouvé' : '⚠️ Pas de backup grades');
    console.log(specialitesBackup ? '✅ Backup spécialités trouvé' : '⚠️ Pas de backup spécialités');
    
    return {
        manuels: manuelsBackup ? JSON.parse(manuelsBackup) : null,
        grades: gradesBackup ? JSON.parse(gradesBackup) : null,
        specialites: specialitesBackup ? JSON.parse(specialitesBackup) : null
    };
}

// Fonction pour tester l'API (si disponible)
async function testAPI() {
    console.log('🌐 Test de l\'API...');
    
    try {
        const response = await fetch('api/admin.php?type=manuels');
        if (response.ok) {
            console.log('✅ API disponible et fonctionnelle');
            return true;
        } else {
            console.log('⚠️ API disponible mais erreur de réponse');
            return false;
        }
    } catch (error) {
        console.log('❌ API non disponible (mode localStorage uniquement)');
        return false;
    }
}

// Fonction pour afficher les statistiques
function showStats(data) {
    if (!data) return;
    
    console.log('\n📊 Statistiques:');
    console.log(`- Manuels: ${data.manuels?.length || 0}`);
    console.log(`- Grades: ${data.grades?.length || 0}`);
    console.log(`- Spécialités: ${data.specialites?.length || 0}`);
    
    // Compter les membres
    const totalMembresGrades = data.grades?.reduce((total, grade) => total + (grade.membres?.length || 0), 0) || 0;
    const totalMembresSpecialites = data.specialites?.reduce((total, spec) => total + (spec.membres?.length || 0), 0) || 0;
    
    console.log(`- Total membres dans grades: ${totalMembresGrades}`);
    console.log(`- Total membres dans spécialités: ${totalMembresSpecialites}`);
}

// Fonction principale de diagnostic
async function runDiagnostic() {
    console.clear();
    console.log('🔧 DIAGNOSTIC DU PANEL ADMIN');
    console.log('==============================\n');
    
    // Test du chargement
    const data = await testDataLoading();
    
    // Test des sauvegardes locales
    console.log('\n');
    checkLocalBackups();
    
    // Test de l'API
    console.log('\n');
    await testAPI();
    
    // Affichage des statistiques
    console.log('\n');
    showStats(data);
    
    console.log('\n✅ Diagnostic terminé');
}

// Fonction pour restaurer depuis une sauvegarde locale
function restoreFromLocalBackup(type) {
    const backupKey = `sams_${type}_backup`;
    const backup = localStorage.getItem(backupKey);
    
    if (!backup) {
        console.error(`❌ Pas de sauvegarde locale trouvée pour ${type}`);
        return false;
    }
    
    try {
        const data = JSON.parse(backup);
        console.log(`🔄 Restauration de ${type} depuis la sauvegarde locale...`);
        console.log(`Données: ${data.length} éléments`);
        
        // Ici, vous pourriez ajouter la logique pour restaurer les données
        // vers le serveur ou vers l'interface
        return data;
    } catch (error) {
        console.error(`❌ Erreur lors de la restauration de ${type}:`, error);
        return false;
    }
}

// Exporter les fonctions pour utilisation dans la console
window.adminDiagnostic = {
    runDiagnostic,
    testDataLoading,
    checkLocalBackups,
    testAPI,
    restoreFromLocalBackup,
    showStats
};

// Message d'aide
console.log('💡 Utilisation:');
console.log('- adminDiagnostic.runDiagnostic() : Lance un diagnostic complet');
console.log('- adminDiagnostic.testDataLoading() : Test le chargement des JSON');
console.log('- adminDiagnostic.checkLocalBackups() : Vérifie les sauvegardes locales');
console.log('- adminDiagnostic.testAPI() : Test la disponibilité de l\'API');
console.log('- adminDiagnostic.restoreFromLocalBackup("manuels") : Restaure depuis backup local');
