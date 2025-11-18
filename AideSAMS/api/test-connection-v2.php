<?php
// Headers stricts
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
ob_clean();

try {
    $tests = [];
    $errors = [];
    
    // Test 1: mysqli
    $tests[] = [
        'name' => 'Extension mysqli',
        'status' => extension_loaded('mysqli') ? 'OK' : 'FAIL',
        'value' => extension_loaded('mysqli') ? 'Disponible' : 'Non disponible'
    ];
    if (!extension_loaded('mysqli')) {
        $errors[] = 'Extension mysqli manquante - Contacter l\'hébergeur';
    }
    
    // Test 2: DNS
    $ip = @gethostbyname('we01io.myd.infomaniak.com');
    $dns_ok = ($ip !== 'we01io.myd.infomaniak.com');
    $tests[] = [
        'name' => 'Résolution DNS',
        'status' => $dns_ok ? 'OK' : 'FAIL',
        'value' => $dns_ok ? $ip : 'Impossible à résoudre'
    ];
    if (!$dns_ok) {
        $errors[] = 'DNS ne se résout pas - Vérifier la connexion Internet';
    }
    
    // Test 3: Connexion MySQL
    $mysqli = @new mysqli('we01io.myd.infomaniak.com', 'we01io_sams', 'RBM91210chat!', '', 3306);
    $conn_ok = !$mysqli->connect_error;
    $tests[] = [
        'name' => 'Connexion serveur MySQL',
        'status' => $conn_ok ? 'OK' : 'FAIL',
        'value' => $conn_ok ? 'Connecté' : $mysqli->connect_error
    ];
    if (!$conn_ok) {
        $errors[] = 'Impossible de se connecter à MySQL - Vérifier identifiants ou accès réseau';
    }
    
    // Test 4: Sélection base de données
    $db_ok = false;
    if ($conn_ok) {
        $db_ok = @$mysqli->select_db('we01io_sams');
        $tests[] = [
            'name' => 'Sélection base de données',
            'status' => $db_ok ? 'OK' : 'FAIL',
            'value' => $db_ok ? 'we01io_sams sélectionnée' : $mysqli->error
        ];
        if (!$db_ok) {
            $errors[] = 'Base de données non trouvée ou pas d\'accès - Vérifier les droits';
        }
    }
    
    // Test 5: Requête simple
    $query_ok = false;
    if ($conn_ok && $db_ok) {
        $result = @$mysqli->query('SELECT 1 as test');
        $query_ok = ($result !== false);
        $tests[] = [
            'name' => 'Requête SELECT 1',
            'status' => $query_ok ? 'OK' : 'FAIL',
            'value' => $query_ok ? 'Succès' : $mysqli->error
        ];
        if (!$query_ok) {
            $errors[] = 'Requête échouée - Vérifier les permissions';
        }
    }
    
    // Test 6: Tables
    $table_count = 0;
    if ($query_ok) {
        $tables_result = @$mysqli->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'we01io_sams'");
        if ($tables_result) {
            $table_count = $tables_result->num_rows;
            $tests[] = [
                'name' => 'Tables existantes',
                'status' => $table_count > 0 ? 'OK' : 'WARN',
                'value' => $table_count > 0 ? "$table_count table(s) trouvée(s)" : 'Aucune table'
            ];
        }
    }
    
    if ($conn_ok) {
        $mysqli->close();
    }
    
    // Générer recommandations
    if (count($errors) === 0 && $query_ok) {
        $recommendations[] = '✅ Tous les tests sont passés! Votre BDD est accessible.';
    } else {
        if (!extension_loaded('mysqli')) {
            $recommendations[] = '1️⃣ Contacter votre hébergeur pour activer l\'extension mysqli';
        }
        if (!$dns_ok) {
            $recommendations[] = '2️⃣ Vérifier votre connexion Internet (ping we01io.myd.infomaniak.com)';
        }
        if (!$conn_ok) {
            $recommendations[] = '3️⃣ Demander à Infomaniak d\'autoriser l\'accès remote MySQL';
            $recommendations[] = '   Ou installer MySQL localement sur votre serveur';
        }
        if ($conn_ok && !$db_ok) {
            $recommendations[] = '4️⃣ Vérifier que la base we01io_sams existe et que l\'utilisateur a les droits';
        }
    }
    
    $response = [
        'timestamp' => date('Y-m-d H:i:s'),
        'overall_status' => count($errors) === 0 && $query_ok ? 'SUCCESS' : 'FAILURE',
        'error_count' => count($errors),
        'tests' => $tests,
        'errors' => $errors,
        'recommendations' => $recommendations
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Exception PHP',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
