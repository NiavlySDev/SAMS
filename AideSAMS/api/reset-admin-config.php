<?php
/**
 * Script pour réinitialiser la configuration admin
 * À appeler pour nettoyer les données admin_config mal formées
 * 
 * Usage: https://votre-domaine.com/AideSAMS/api/reset-admin-config.php
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
    // Étape 1: Vider la table
    $db->query("TRUNCATE TABLE admin_config");
    
    // Étape 2: Insérer les valeurs par défaut correctes
    $default_password = 'admin123';
    $default_lastChanged = date('Y-m-d H:i:s');
    
    $password_escaped = $db->real_escape_string($default_password);
    $lastChanged_escaped = $db->real_escape_string($default_lastChanged);
    
    $db->query("INSERT INTO admin_config (config_key, config_value) VALUES ('password', '$password_escaped')");
    $db->query("INSERT INTO admin_config (config_key, config_value) VALUES ('lastChanged', '$lastChanged_escaped')");
    $db->query("INSERT INTO admin_config (config_key, config_value) VALUES ('attempts', '0')");
    $db->query("INSERT INTO admin_config (config_key, config_value) VALUES ('lockoutUntil', 'null')");
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Configuration admin réinitialisée avec succès',
        'timestamp' => date('Y-m-d H:i:s'),
        'data' => [
            'password' => $default_password,
            'lastChanged' => $default_lastChanged,
            'attempts' => 0,
            'lockoutUntil' => null
        ]
    ]);
    
} catch (Exception $e) {
    error_log('SAMS - Erreur réinitialisation config admin: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la réinitialisation',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

// Fermer la connexion
if ($db && $dbConnected) {
    $db->close();
}
?>
