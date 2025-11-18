<?php
/**
 * Test complet de connexion MySQL
 * Ce fichier teste étape par étape la connectivité
 */

header('Content-Type: application/json; charset=utf-8');

$tests = [];
$errors = [];

// Test 1: Vérifier si mysqli est installé
$tests[] = [
    'name' => 'Extension mysqli',
    'status' => extension_loaded('mysqli') ? 'OK' : 'FAIL',
    'value' => extension_loaded('mysqli') ? 'mysqli disponible' : 'mysqli non disponible'
];

if (!extension_loaded('mysqli')) {
    $errors[] = 'L\'extension mysqli n\'est pas installée. Demander l\'activation au fournisseur d\'hébergement.';
}

// Test 2: Vérifier PDO MySQL
$tests[] = [
    'name' => 'PDO MySQL',
    'status' => extension_loaded('pdo_mysql') ? 'OK' : 'WARN',
    'value' => extension_loaded('pdo_mysql') ? 'pdo_mysql disponible' : 'pdo_mysql non disponible'
];

// Test 3: Configuration PHP
$tests[] = [
    'name' => 'PHP Version',
    'status' => 'INFO',
    'value' => phpversion()
];

$tests[] = [
    'name' => 'MySQL Client Version',
    'status' => 'INFO',
    'value' => mysqli_get_client_version()
];

// Test 4: Résolution DNS
$tests[] = [
    'name' => 'DNS Resolution',
    'status' => gethostbyname('we01io.myd.infomaniak.com') !== 'we01io.myd.infomaniak.com' ? 'OK' : 'FAIL',
    'value' => gethostbyname('we01io.myd.infomaniak.com')
];

if (gethostbyname('we01io.myd.infomaniak.com') === 'we01io.myd.infomaniak.com') {
    $errors[] = 'Impossible de résoudre le DNS de we01io.myd.infomaniak.com. Vérifier l\'accès Internet.';
}

// Test 5: Connexion simple (sans sélectionner la DB)
$test_conn = @mysqli_connect('we01io.myd.infomaniak.com', 'we01io_sams', 'RBM91210chat!', '', 3306);
if ($test_conn) {
    $tests[] = [
        'name' => 'Connexion au serveur MySQL',
        'status' => 'OK',
        'value' => 'Connecté au serveur (sans DB)'
    ];
    
    // Test 6: Sélection de la base de données
    if ($test_conn->select_db('we01io_sams')) {
        $tests[] = [
            'name' => 'Sélection de la base de données',
            'status' => 'OK',
            'value' => 'Base de données we01io_sams sélectionnée'
        ];
        
        // Test 7: Requête de test
        $result = $test_conn->query('SELECT 1 as test');
        if ($result) {
            $tests[] = [
                'name' => 'Requête de test',
                'status' => 'OK',
                'value' => 'SELECT 1 exécuté avec succès'
            ];
            
            // Test 8: Énumération des tables
            $tables_result = $test_conn->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'we01io_sams'");
            if ($tables_result) {
                $tables = [];
                while ($row = $tables_result->fetch_assoc()) {
                    $tables[] = $row['TABLE_NAME'];
                }
                $tests[] = [
                    'name' => 'Tables existantes',
                    'status' => count($tables) > 0 ? 'OK' : 'WARN',
                    'value' => count($tables) . ' table(s): ' . implode(', ', $tables)
                ];
            }
        } else {
            $tests[] = [
                'name' => 'Requête de test',
                'status' => 'FAIL',
                'value' => 'Erreur: ' . $test_conn->error
            ];
            $errors[] = 'La requête SELECT 1 a échoué: ' . $test_conn->error;
        }
    } else {
        $tests[] = [
            'name' => 'Sélection de la base de données',
            'status' => 'FAIL',
            'value' => 'Erreur: ' . $test_conn->error
        ];
        $errors[] = 'Impossible de sélectionner la base de données we01io_sams: ' . $test_conn->error;
    }
    
    $test_conn->close();
} else {
    $tests[] = [
        'name' => 'Connexion au serveur MySQL',
        'status' => 'FAIL',
        'value' => 'Erreur de connexion'
    ];
    $errors[] = 'Impossible de se connecter au serveur MySQL we01io.myd.infomaniak.com:3306. Vérifier: host, port, identifiants.';
}

// Test 9: Configuration timeouts
$tests[] = [
    'name' => 'default_socket_timeout',
    'status' => 'INFO',
    'value' => ini_get('default_socket_timeout') . ' secondes'
];

$tests[] = [
    'name' => 'mysql.connect_timeout',
    'status' => 'INFO',
    'value' => ini_get('mysql.connect_timeout') . ' secondes'
];

// Résumé
$summary = [
    'timestamp' => date('Y-m-d H:i:s'),
    'overall_status' => count($errors) === 0 ? 'SUCCESS' : 'FAILURE',
    'error_count' => count($errors),
    'tests' => $tests,
    'errors' => $errors,
    'recommendations' => generateRecommendations($errors)
];

echo json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

/**
 * Générer des recommandations basées sur les erreurs
 */
function generateRecommendations($errors) {
    $recommendations = [];
    
    foreach ($errors as $error) {
        if (strpos($error, 'mysqli') !== false) {
            $recommendations[] = '1️⃣ Contacter votre hébergeur pour activer l\'extension mysqli (il/elle doit ajouter l\'extension dans le PHP)';
        }
        if (strpos($error, 'DNS') !== false) {
            $recommendations[] = '2️⃣ Vérifier votre connexion Internet. Essayer: ping we01io.myd.infomaniak.com';
        }
        if (strpos($error, 'serveur MySQL') !== false) {
            $recommendations[] = '3️⃣ Vérifier auprès du fournisseur d\'hébergement (Infomaniak):';
            $recommendations[] = '   - Les identifiants (utilisateur, mot de passe)';
            $recommendations[] = '   - L\'accès remote au serveur MySQL (port 3306 ouvert ?)';
            $recommendations[] = '   - Le serveur MySQL est-il en ligne ?';
        }
        if (strpos($error, 'we01io_sams') !== false) {
            $recommendations[] = '4️⃣ Vérifier auprès de votre fournisseur d\'hébergement:';
            $recommendations[] = '   - La base de données "we01io_sams" existe-t-elle ?';
            $recommendations[] = '   - L\'utilisateur "we01io_sams" a-t-il les droits d\'accès ?';
        }
    }
    
    if (empty($recommendations)) {
        $recommendations[] = '✅ Tous les tests sont passés ! Votre BDD est accessible.';
    }
    
    return $recommendations;
}
?>
