<?php
/**
 * Test simple de connexion pour vérifier que la BDD fonctionne en production
 */

// Configuration de base
error_reporting(E_ERROR);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');

// Charger la configuration
$config_path = __DIR__ . '/../../config/config.json';
if (file_exists($config_path)) {
    $config = json_decode(file_get_contents($config_path), true);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Configuration introuvable']);
    exit;
}

// Paramètres de connexion
$host = $config['db_host'] ?? 'we01io.myd.infomaniak.com';
$user = $config['db_user'] ?? 'we01io_sams';
$pass = $config['db_password'] ?? 'RBM91210chat!';
$name = $config['db_name'] ?? 'we01io_sams';

try {
    // Test de connexion
    $mysqli = new mysqli($host, $user, $pass, $name, 3306);
    
    if ($mysqli->connect_error) {
        echo json_encode([
            'status' => 'error', 
            'message' => 'Échec de connexion',
            'details' => $mysqli->connect_error
        ]);
        exit;
    }
    
    // Test de requête
    $result = $mysqli->query('SELECT 1 as test');
    if (!$result) {
        echo json_encode([
            'status' => 'error', 
            'message' => 'Échec de requête',
            'details' => $mysqli->error
        ]);
        $mysqli->close();
        exit;
    }
    
    $mysqli->close();
    
    echo json_encode([
        'status' => 'success', 
        'message' => 'Connexion BDD opérationnelle',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Exception durant la connexion',
        'details' => $e->getMessage()
    ]);
}
?>
