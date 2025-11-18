<?php
/**
 * Script d'initialisation de la base de données SAMS
 * À exécuter une seule fois lors du premier déploiement en production
 */

require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');

// Vérifier que la connexion est possible
if (connectDB()) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Base de données SAMS initialisée avec succès',
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => $db->server_info ?? 'N/A'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec d\'initialisation de la base de données',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

// Fermer la connexion proprement
if ($db && $dbConnected) {
    $db->close();
}
?>
