<?php
@error_reporting(0);
@ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$tests = array();
$errors = array();
$recommendations = array();

// Test 1: mysqli
$mysqli_ok = extension_loaded('mysqli');
$tests[] = array(
    'name' => 'Extension mysqli',
    'status' => $mysqli_ok ? 'OK' : 'FAIL',
    'value' => $mysqli_ok ? 'Disponible' : 'Non disponible'
);
if (!$mysqli_ok) {
    $errors[] = 'Extension mysqli manquante - Contacter l\'hébergeur';
}

// Test 2: DNS
$ip = @gethostbyname('we01io.myd.infomaniak.com');
$dns_ok = ($ip !== 'we01io.myd.infomaniak.com');
$tests[] = array(
    'name' => 'Résolution DNS',
    'status' => $dns_ok ? 'OK' : 'FAIL',
    'value' => $dns_ok ? $ip : 'Impossible à résoudre'
);
if (!$dns_ok) {
    $errors[] = 'DNS ne se résout pas - Vérifier la connexion Internet';
}

// Test 3-6: Connexion MySQL (seulement si mysqli ok)
$conn_ok = false;
$db_ok = false;
$query_ok = false;

if ($mysqli_ok) {
    $mysqli = @new mysqli('we01io.myd.infomaniak.com', 'we01io_sams', 'RBM91210chat!', '', 3306);
    $conn_ok = !$mysqli->connect_error;
    
    $tests[] = array(
        'name' => 'Connexion serveur MySQL',
        'status' => $conn_ok ? 'OK' : 'FAIL',
        'value' => $conn_ok ? 'Connecté' : (isset($mysqli->connect_error) ? $mysqli->connect_error : 'Erreur connexion')
    );
    
    if (!$conn_ok) {
        $errors[] = 'Impossible de se connecter à MySQL - Vérifier identifiants ou accès réseau';
    } else {
        // Test 4
        $db_ok = @$mysqli->select_db('we01io_sams');
        $tests[] = array(
            'name' => 'Sélection base de données',
            'status' => $db_ok ? 'OK' : 'FAIL',
            'value' => $db_ok ? 'we01io_sams sélectionnée' : $mysqli->error
        );
        
        if (!$db_ok) {
            $errors[] = 'Base de données non trouvée ou pas d\'accès - Vérifier les droits';
        } else {
            // Test 5
            $result = @$mysqli->query('SELECT 1 as test');
            $query_ok = ($result !== false);
            $tests[] = array(
                'name' => 'Requête SELECT 1',
                'status' => $query_ok ? 'OK' : 'FAIL',
                'value' => $query_ok ? 'Succès' : $mysqli->error
            );
            
            if ($query_ok) {
                // Test 6
                $tables_result = @$mysqli->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'we01io_sams'");
                $table_count = 0;
                if ($tables_result) {
                    $table_count = $tables_result->num_rows;
                }
                
                $tests[] = array(
                    'name' => 'Tables existantes',
                    'status' => $table_count > 0 ? 'OK' : 'WARN',
                    'value' => $table_count > 0 ? $table_count . ' table(s)' : 'Aucune table'
                );
            }
        }
        
        @$mysqli->close();
    }
}

// Recommandations
if (count($errors) === 0 && $query_ok) {
    $recommendations[] = '✅ Tous les tests sont passés! Votre BDD est accessible.';
} else {
    if (!$mysqli_ok) {
        $recommendations[] = '1️⃣ Contacter votre hébergeur pour activer l\'extension mysqli';
    }
    if (!$dns_ok) {
        $recommendations[] = '2️⃣ Vérifier votre connexion Internet';
    }
    if (!$conn_ok) {
        $recommendations[] = '3️⃣ Demander à Infomaniak d\'autoriser l\'accès remote MySQL';
    }
    if ($conn_ok && !$db_ok) {
        $recommendations[] = '4️⃣ Vérifier que la base we01io_sams existe';
    }
}

$response = array(
    'timestamp' => date('Y-m-d H:i:s'),
    'overall_status' => (count($errors) === 0 && $query_ok) ? 'SUCCESS' : 'FAILURE',
    'error_count' => count($errors),
    'tests' => $tests,
    'errors' => $errors,
    'recommendations' => empty($recommendations) ? array('Statut inconnu') : $recommendations
);

echo json_encode($response);
?>
