<?php
/**
 * Test complet du système SAMS
 * Vérifier que tout fonctionne correctement après déploiement
 * 
 * Usage: https://votre-domaine.com/AideSAMS/api/test-system.php
 */

header('Content-Type: application/json; charset=utf-8');

$tests = [];
$allPassed = true;

// Test 1: Connexion à la BDD
$test1 = ['name' => 'Connexion BDD', 'status' => 'pending'];
try {
    require_once 'db.php';
    if (connectDB()) {
        global $db, $dbConnected;
        $test1['status'] = 'success';
        $test1['details'] = 'Connecté à ' . DB_HOST;
    } else {
        $test1['status'] = 'error';
        $test1['details'] = 'Impossible de se connecter';
        $allPassed = false;
    }
} catch (Exception $e) {
    $test1['status'] = 'error';
    $test1['details'] = $e->getMessage();
    $allPassed = false;
}
$tests[] = $test1;

// Test 2: Tables existantes
$test2 = ['name' => 'Tables BDD', 'status' => 'pending'];
try {
    global $db, $dbConnected;
    if ($dbConnected) {
        $result = $db->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '" . DB_NAME . "'");
        $tables = [];
        while ($row = $result->fetch_assoc()) {
            $tables[] = $row['TABLE_NAME'];
        }
        
        $requiredTables = ['blippers', 'categories', 'specialites', 'grades', 'membres_grades', 'manuels', 'gta5_zones'];
        $missingTables = array_diff($requiredTables, $tables);
        
        if (empty($missingTables)) {
            $test2['status'] = 'success';
            $test2['details'] = 'Toutes les tables existent (' . count($tables) . ' tables)';
        } else {
            $test2['status'] = 'warning';
            $test2['details'] = 'Tables manquantes: ' . implode(', ', $missingTables);
        }
    }
} catch (Exception $e) {
    $test2['status'] = 'error';
    $test2['details'] = $e->getMessage();
}
$tests[] = $test2;

// Test 3: Données
$test3 = ['name' => 'Données', 'status' => 'pending'];
try {
    global $db, $dbConnected;
    if ($dbConnected) {
        $counts = [];
        $tables = ['blippers', 'categories', 'specialites', 'grades', 'manuels', 'gta5_zones'];
        
        foreach ($tables as $table) {
            $result = $db->query("SELECT COUNT(*) as count FROM `$table`");
            $row = $result->fetch_assoc();
            $counts[$table] = $row['count'];
        }
        
        $test3['status'] = 'success';
        $test3['details'] = $counts;
        
        // Vérification des minima
        if ($counts['grades'] < 1) {
            $test3['status'] = 'warning';
            $test3['details']['warning'] = 'Pas de grades importés';
        }
    }
} catch (Exception $e) {
    $test3['status'] = 'error';
    $test3['details'] = $e->getMessage();
}
$tests[] = $test3;

// Test 4: Fichiers JSON
$test4 = ['name' => 'Fichiers JSON', 'status' => 'pending'];
try {
    $jsonDir = __DIR__ . '/../json/';
    $jsonFiles = ['blippers.json', 'categories.json', 'specialites.json', 'grades.json', 'manuels.json', 'gta5-zones.json'];
    $missingFiles = [];
    
    foreach ($jsonFiles as $file) {
        if (!file_exists($jsonDir . $file)) {
            $missingFiles[] = $file;
        }
    }
    
    if (empty($missingFiles)) {
        $test4['status'] = 'success';
        $test4['details'] = 'Tous les fichiers JSON existent';
    } else {
        $test4['status'] = 'warning';
        $test4['details'] = 'Fichiers manquants: ' . implode(', ', $missingFiles);
    }
} catch (Exception $e) {
    $test4['status'] = 'error';
    $test4['details'] = $e->getMessage();
}
$tests[] = $test4;

// Test 5: Configuration
$test5 = ['name' => 'Configuration', 'status' => 'pending'];
try {
    $configPath = __DIR__ . '/../../config/config.json';
    if (file_exists($configPath)) {
        $config = json_decode(file_get_contents($configPath), true);
        if ($config && isset($config['db_host']) && isset($config['db_user'])) {
            $test5['status'] = 'success';
            $test5['details'] = 'Configuration valide (' . $config['db_host'] . ')';
        } else {
            $test5['status'] = 'error';
            $test5['details'] = 'Configuration invalide ou incomplète';
            $allPassed = false;
        }
    } else {
        $test5['status'] = 'error';
        $test5['details'] = 'Fichier config.json manquant';
        $allPassed = false;
    }
} catch (Exception $e) {
    $test5['status'] = 'error';
    $test5['details'] = $e->getMessage();
}
$tests[] = $test5;

// Fermer la connexion
global $db, $dbConnected;
if ($db && $dbConnected) {
    $db->close();
}

// Réponse
http_response_code($allPassed ? 200 : 206);
echo json_encode([
    'status' => $allPassed ? 'success' : 'warning',
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => $tests,
    'summary' => 'Système ' . ($allPassed ? 'PRÊT pour la production ✅' : 'à vérifier ⚠️')
], JSON_PRETTY_PRINT);
?>
