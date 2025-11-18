<?php
/**
 * Diagnostic de Connexion BDD - SAMS v1.15.0
 * Outil de debug pour vérifier l'accès à la base de données
 */

header('Content-Type: application/json; charset=utf-8');

// Charger la configuration
$config_path = __DIR__ . '/../../config/config.json';
$config = null;

if (file_exists($config_path)) {
    $config = json_decode(file_get_contents($config_path), true);
} else {
    // Fallback
    $config = [
        'db_host' => 'we01io.myd.infomaniak.com',
        'db_user' => 'we01io_sams',
        'db_password' => 'RBM91210chat!',
        'db_name' => 'we01io_sams'
    ];
}

$diagnostics = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'mysqli_available' => extension_loaded('mysqli'),
    'config_file' => file_exists($config_path) ? 'FOUND' : 'NOT_FOUND',
    'tests' => []
];

// Test 1: Vérifier extensions
$diagnostics['tests']['extensions'] = [
    'mysqli' => extension_loaded('mysqli'),
    'pdo_mysql' => extension_loaded('pdo_mysql')
];

// Test 2: Résolution DNS
$diagnostics['tests']['dns'] = gethostbyname($config['db_host']) !== $config['db_host'];

// Test 3: Connexion sans sélectionner DB
$test3 = ['status' => 'pending'];
$conn_test = @mysqli_connect($config['db_host'], $config['db_user'], $config['db_password'], '', 3306);
if ($conn_test) {
    $test3['status'] = 'success';
    $test3['info'] = 'Connexion au serveur reussie';
    @mysqli_close($conn_test);
} else {
    $test3['status'] = 'error';
    $test3['error'] = mysqli_connect_error();
}
$diagnostics['tests']['connect_no_db'] = $test3;

// Test 4: Connexion complète
$test4 = ['status' => 'pending'];
$conn = @mysqli_connect(
    $config['db_host'],
    $config['db_user'],
    $config['db_password'],
    $config['db_name'],
    3306
);

if ($conn) {
    $test4['status'] = 'success';
    $test4['info'] = 'Connexion complete reussie';
    
    // Test 5: Query simple
    $test5 = [];
    $result = @mysqli_query($conn, 'SELECT 1');
    if ($result) {
        $test5['status'] = 'success';
        $test5['info'] = 'Query test reussie';
    } else {
        $test5['status'] = 'error';
        $test5['error'] = mysqli_error($conn);
    }
    $diagnostics['tests']['query'] = $test5;
    
    // Test 6: Verifier les tables
    $test6 = [];
    $tables_query = "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '" . $config['db_name'] . "'";
    $tables_result = @mysqli_query($conn, $tables_query);
    
    if ($tables_result) {
        $tables = [];
        while ($row = mysqli_fetch_assoc($tables_result)) {
            $tables[] = $row['TABLE_NAME'];
        }
        $test6['status'] = 'success';
        $test6['tables'] = $tables;
        $test6['count'] = count($tables);
    } else {
        $test6['status'] = 'error';
        $test6['error'] = mysqli_error($conn);
    }
    $diagnostics['tests']['tables'] = $test6;
    
    // Test 7: Verifier les donnees
    $test7 = [];
    $count_query = "SELECT 'manuels' as table_name, COUNT(*) as count FROM manuels UNION ALL 
                    SELECT 'grades', COUNT(*) FROM grades UNION ALL
                    SELECT 'categories', COUNT(*) FROM categories";
    $count_result = @mysqli_query($conn, $count_query);
    
    if ($count_result) {
        $counts = [];
        while ($row = mysqli_fetch_assoc($count_result)) {
            $counts[$row['table_name']] = (int)$row['count'];
        }
        $test7['status'] = 'success';
        $test7['data'] = $counts;
    } else {
        $test7['status'] = 'warning';
        $test7['info'] = 'Tables pas encore creees';
    }
    $diagnostics['tests']['data_count'] = $test7;
    
    @mysqli_close($conn);
} else {
    $test4['status'] = 'error';
    $test4['error'] = mysqli_connect_error();
    $test4['config'] = $config;
}
$diagnostics['tests']['connect_full'] = $test4;

// Resume
$diagnostics['summary'] = [
    'db_accessible' => $diagnostics['tests']['connect_full']['status'] === 'success',
    'tables_exist' => isset($diagnostics['tests']['tables']) && $diagnostics['tests']['tables']['count'] > 0,
    'data_available' => isset($diagnostics['tests']['data_count']) && $diagnostics['tests']['data_count']['status'] === 'success'
];

// Recommandations
$recommendations = [];
if (!$diagnostics['tests']['extensions']['mysqli']) {
    $recommendations[] = 'Extension mysqli non disponible - Contacter hebergeur';
}
if (!$diagnostics['tests']['dns']) {
    $recommendations[] = 'Probleme DNS - Verifier hostname';
}
if ($diagnostics['tests']['connect_no_db']['status'] !== 'success') {
    $recommendations[] = 'Connexion serveur echouee - Verifier hostname, port, firewall';
}
if ($diagnostics['tests']['connect_full']['status'] !== 'success') {
    $recommendations[] = 'Connexion DB echouee - Verifier user, password, database';
}
if (isset($diagnostics['tests']['tables']) && $diagnostics['tests']['tables']['count'] === 0) {
    $recommendations[] = 'Aucune table trouvee - Executer import_data.sql';
}

$diagnostics['recommendations'] = $recommendations;

// Affichage
http_response_code($diagnostics['summary']['db_accessible'] ? 200 : 503);
echo json_encode($diagnostics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
