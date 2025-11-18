<?php
/**
 * Script de diagnostic et nettoyage de la table admin_config
 * Vérifie et répare les données mal formées
 * 
 * Usage: https://votre-domaine.com/AideSAMS/api/admin-config-repair.php
 */

header('Content-Type: application/json; charset=utf-8');

// Charger la configuration et la BD
require_once 'db.php';

// Faire la connexion
if (!connectDB()) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Impossible de se connecter à la base de données',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

global $db, $dbConnected;

try {
    // Étape 1: Voir ce qui est actuellement dans la table
    $result = $db->query("SELECT config_key, config_value FROM admin_config");
    $current_data = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $current_data[] = $row;
        }
    }
    
    $diagnostics = [
        'current_state' => $current_data,
        'issues_found' => [],
        'fixed' => false
    ];
    
    // Étape 2: Détecter les problèmes
    foreach ($current_data as $item) {
        $key = $item['config_key'];
        $value = $item['config_value'];
        
        // Si la clé contient du JSON ou la valeur commence par { c'est mal
        if (strpos($key, '{') === 0 || strpos($value, '{') === 0) {
            $diagnostics['issues_found'][] = [
                'issue' => 'Données JSON mal formées',
                'key' => $key,
                'value' => $value
            ];
        }
    }
    
    // Étape 3: Si problèmes détectés, réparer
    if (!empty($diagnostics['issues_found'])) {
        // Vider et recréer
        $db->query("TRUNCATE TABLE admin_config");
        
        // Valeurs par défaut
        $configs = [
            'password' => 'admin123',
            'lastChanged' => date('Y-m-d H:i:s'),
            'attempts' => '0',
            'lockoutUntil' => 'null'
        ];
        
        foreach ($configs as $k => $v) {
            $k_escaped = $db->real_escape_string($k);
            $v_escaped = $db->real_escape_string($v);
            $db->query("INSERT INTO admin_config (config_key, config_value) VALUES ('$k_escaped', '$v_escaped')");
        }
        
        $diagnostics['fixed'] = true;
        $diagnostics['action'] = 'Données réparées';
    } else {
        $diagnostics['action'] = 'Aucun problème détecté';
    }
    
    // Étape 4: Vérifier l'état final
    $result = $db->query("SELECT config_key, config_value FROM admin_config");
    $final_data = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $final_data[] = $row;
        }
    }
    $diagnostics['final_state'] = $final_data;
    
    echo json_encode([
        'status' => 'success',
        'timestamp' => date('Y-m-d H:i:s'),
        'diagnostics' => $diagnostics
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    error_log('SAMS - Erreur réparation config admin: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la réparation',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

// Fermer la connexion
if ($db && $dbConnected) {
    $db->close();
}
?>
