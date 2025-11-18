<?php
/**
 * Script pour corriger la structure de la table admin_config
 * Supprime et recrée la table avec la bonne structure
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
    $steps = [];
    
    // Étape 1: Vérifier si la table existe
    $result = $db->query("SHOW TABLES LIKE 'admin_config'");
    $table_exists = $result && $result->num_rows > 0;
    $steps[] = ['step' => 'Check table', 'exists' => $table_exists];
    
    if ($table_exists) {
        // Étape 2: Supprimer la table
        if ($db->query("DROP TABLE IF EXISTS admin_config")) {
            $steps[] = ['step' => 'Drop table', 'success' => true];
        } else {
            throw new Exception('Erreur suppression table: ' . $db->error);
        }
    }
    
    // Étape 3: Recréer la table avec la bonne structure
    $create_sql = "CREATE TABLE IF NOT EXISTS `admin_config` (
        `id` INT PRIMARY KEY AUTO_INCREMENT,
        `config_key` VARCHAR(100) NOT NULL UNIQUE,
        `config_value` TEXT,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($db->query($create_sql)) {
        $steps[] = ['step' => 'Create table with TEXT', 'success' => true];
    } else {
        throw new Exception('Erreur création table: ' . $db->error);
    }
    
    // Étape 4: Insérer les données par défaut
    $configs = [
        'password' => 'admin123',
        'lastChanged' => date('Y-m-d H:i:s'),
        'attempts' => '0',
        'lockoutUntil' => 'null'
    ];
    
    $inserted = 0;
    foreach ($configs as $k => $v) {
        $k_escaped = $db->real_escape_string($k);
        $v_escaped = $db->real_escape_string($v);
        
        $insert_sql = "INSERT INTO admin_config (config_key, config_value) VALUES ('$k_escaped', '$v_escaped')";
        if ($db->query($insert_sql)) {
            $inserted++;
        } else {
            throw new Exception('Erreur insertion ' . $k . ': ' . $db->error);
        }
    }
    
    $steps[] = ['step' => 'Insert defaults', 'count' => $inserted];
    
    // Étape 5: Vérifier les données
    $result = $db->query("SELECT config_key, config_value FROM admin_config");
    $final_data = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $final_data[] = $row;
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Table admin_config corrigée avec succès',
        'timestamp' => date('Y-m-d H:i:s'),
        'steps' => $steps,
        'final_data' => $final_data,
        'instructions' => 'Vous pouvez maintenant vous connecter avec mot de passe: admin123'
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    error_log('SAMS - Erreur correction table admin_config: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la correction',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

// Fermer la connexion
if ($db && $dbConnected) {
    $db->close();
}
?>
