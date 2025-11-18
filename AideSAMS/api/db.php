<?php
/**
 * API de synchronisation avec la base de données MySQL
 * Gère les blippers, manuels, grades, spécialités et catégories
 */

// Démarrer la session avant toute sortie
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Charger la configuration depuis le fichier externe
$config_path = '../../config/config.json';
$config = null;

if (file_exists($config_path)) {
    $config = json_decode(file_get_contents($config_path), true);
    define('DB_HOST', $config['db_host']);
    define('DB_USER', $config['db_user']);
    define('DB_PASS', $config['db_password']);
    define('DB_NAME', $config['db_name']);
    define('DB_PORT', 3306);
} else {
    // Fallback si config.json n'existe pas
    define('DB_HOST', 'we01io.myd.infomaniak.com');
    define('DB_USER', 'we01io_sams');
    define('DB_PASS', 'RBM91210chat!');
    define('DB_NAME', 'we01io_sams');
    define('DB_PORT', 3306);
}

// Gérer les requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? '';
$action = $_GET['action'] ?? '';

// Variable globale pour la connexion
$db = null;
$dbConnected = false;

/**
 * Tenter de se connecter à la base de données
 */
function connectDB() {
    global $db, $dbConnected;
    
    // Éviter les connexions répétées
    if ($dbConnected && $db) {
        return true;
    }
    
    try {
        // Augmenter le timeout de connexion
        ini_set('default_socket_timeout', 10);
        ini_set('mysql.connect_timeout', 10);
        
        $db = @new mysqli(
            DB_HOST, 
            DB_USER, 
            DB_PASS, 
            DB_NAME, 
            DB_PORT
        );
        
        if ($db->connect_error) {
            error_log('❌ Connexion MySQL échouée: ' . $db->connect_error);
            $dbConnected = false;
            return false;
        }
        
        // Définir le charset
        if (!$db->set_charset('utf8mb4')) {
            error_log('⚠️ Erreur charset: ' . $db->error);
        }
        
        // Vérifier que la BDD est vraiment accessible
        $result = @$db->query('SELECT 1');
        if (!$result) {
            error_log('❌ Test requête échouée: ' . $db->error);
            $db->close();
            $dbConnected = false;
            return false;
        }
        
        $dbConnected = true;
        
        // Créer les tables si elles n'existent pas (une seule fois)
        if (!isset($_SESSION['tables_created'])) {
            createTables();
            $_SESSION['tables_created'] = true;
        }
        
        return true;
    } catch (Exception $e) {
        error_log('❌ Exception DB Connection: ' . $e->getMessage());
        $dbConnected = false;
        return false;
    }
}

/**
 * Créer les tables nécessaires
 */
function createTables() {
    global $db;
    
    $tables = [
        // Table des blippers
        "CREATE TABLE IF NOT EXISTS blippers (
            id INT PRIMARY KEY AUTO_INCREMENT,
            bliper_id VARCHAR(50) UNIQUE NOT NULL,
            label VARCHAR(100) NOT NULL,
            icon VARCHAR(10) NOT NULL,
            color VARCHAR(7) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        
        // Table des manuels
        "CREATE TABLE IF NOT EXISTS manuels (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            link VARCHAR(500),
            importance INT DEFAULT 5,
            categorie VARCHAR(100),
            cat_color VARCHAR(7),
            auteur VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        
        // Table des grades
        "CREATE TABLE IF NOT EXISTS grades (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        
        // Table des spécialités
        "CREATE TABLE IF NOT EXISTS specialites (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        
        // Table des catégories
        "CREATE TABLE IF NOT EXISTS categories (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL UNIQUE,
            color VARCHAR(7) NOT NULL,
            visible BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        
        // Table des membres de spécialité
        "CREATE TABLE IF NOT EXISTS specialite_membres (
            id INT PRIMARY KEY AUTO_INCREMENT,
            specialite_id INT NOT NULL,
            nom VARCHAR(255) NOT NULL,
            discord_id VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (specialite_id) REFERENCES specialites(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ];
    
    foreach ($tables as $sql) {
        if (!$db->query($sql)) {
            error_log('Erreur création table: ' . $db->error);
        }
    }
}

/**
 * Charger les données depuis la BDD
 */
function loadFromDB($type) {
    global $db, $dbConnected;
    
    if (!$dbConnected) {
        return null;
    }
    
    try {
        switch ($type) {
            case 'blippers':
                $result = $db->query("SELECT bliper_id as id, label, icon, color, description FROM blippers ORDER BY id");
                break;
            case 'manuels':
                $result = $db->query("SELECT id, title, description as desc, link, importance, categorie, cat_color as catColor, auteur FROM manuels ORDER BY importance DESC, id");
                break;
            case 'grades':
                $result = $db->query("SELECT id, name FROM grades ORDER BY name");
                break;
            case 'specialites':
                $result = $db->query("SELECT id, name FROM specialites ORDER BY name");
                break;
            case 'categories':
                $result = $db->query("SELECT id, name, color, visible FROM categories ORDER BY name");
                break;
            default:
                return null;
        }
        
        if (!$result) {
            throw new Exception($db->error);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        return $data;
    } catch (Exception $e) {
        error_log('Erreur lecture DB: ' . $e->getMessage());
        return null;
    }
}

/**
 * Sauvegarder les données dans la BDD
 */
function saveToDB($type, $data) {
    global $db, $dbConnected;
    
    if (!$dbConnected) {
        return false;
    }
    
    try {
        // Commencer une transaction
        $db->begin_transaction();
        
        switch ($type) {
            case 'blippers':
                // Vider et recharger
                $db->query("TRUNCATE TABLE blippers");
                foreach ($data as $item) {
                    $id = $db->real_escape_string($item['id']);
                    $label = $db->real_escape_string($item['label']);
                    $icon = $db->real_escape_string($item['icon']);
                    $color = $db->real_escape_string($item['color']);
                    $description = $db->real_escape_string($item['description'] ?? '');
                    
                    $sql = "INSERT INTO blippers (bliper_id, label, icon, color, description) 
                            VALUES ('$id', '$label', '$icon', '$color', '$description')";
                    
                    if (!$db->query($sql)) {
                        throw new Exception($db->error);
                    }
                }
                break;
                
            case 'manuels':
                $db->query("TRUNCATE TABLE manuels");
                foreach ($data as $item) {
                    $title = $db->real_escape_string($item['title']);
                    $desc = $db->real_escape_string($item['desc'] ?? '');
                    $link = $db->real_escape_string($item['link'] ?? '');
                    $importance = (int)($item['importance'] ?? 5);
                    $categorie = $db->real_escape_string($item['categorie'] ?? '');
                    $catColor = $db->real_escape_string($item['catColor'] ?? '');
                    $auteur = $db->real_escape_string($item['auteur'] ?? '');
                    
                    $sql = "INSERT INTO manuels (title, description, link, importance, categorie, cat_color, auteur) 
                            VALUES ('$title', '$desc', '$link', $importance, '$categorie', '$catColor', '$auteur')";
                    
                    if (!$db->query($sql)) {
                        throw new Exception($db->error);
                    }
                }
                break;
                
            case 'grades':
                $db->query("TRUNCATE TABLE grades");
                foreach ($data as $item) {
                    $name = $db->real_escape_string($item['name']);
                    $sql = "INSERT INTO grades (name) VALUES ('$name')";
                    if (!$db->query($sql)) {
                        throw new Exception($db->error);
                    }
                }
                break;
                
            case 'specialites':
                $db->query("TRUNCATE TABLE specialites");
                foreach ($data as $item) {
                    $name = $db->real_escape_string($item['name']);
                    $sql = "INSERT INTO specialites (name) VALUES ('$name')";
                    if (!$db->query($sql)) {
                        throw new Exception($db->error);
                    }
                }
                break;
                
            case 'categories':
                $db->query("TRUNCATE TABLE categories");
                foreach ($data as $item) {
                    $name = $db->real_escape_string($item['name']);
                    $color = $db->real_escape_string($item['color']);
                    $visible = (int)($item['visible'] ?? 1);
                    $sql = "INSERT INTO categories (name, color, visible) VALUES ('$name', '$color', $visible)";
                    if (!$db->query($sql)) {
                        throw new Exception($db->error);
                    }
                }
                break;
        }
        
        $db->commit();
        return true;
    } catch (Exception $e) {
        $db->rollback();
        error_log('Erreur sauvegarde DB: ' . $e->getMessage());
        return false;
    }
}

/**
 * Vérifier la connexion à la BDD
 */
function checkConnection() {
    return connectDB();
}

// Routeur des requêtes
switch ($action) {
    case 'check':
        // Vérifier si on peut se connecter à la BDD
        $connected = connectDB();
        
        $response = [
            'connected' => $connected,
            'timestamp' => date('Y-m-d H:i:s'),
            'server' => DB_HOST,
            'database' => DB_NAME,
            'php_version' => phpversion(),
            'mysqli_version' => mysqli_get_client_version()
        ];
        
        if (!$connected) {
            http_response_code(503);
            $response['error'] = 'Impossible de se connecter à la base de données';
            $response['debug'] = [
                'host' => DB_HOST,
                'port' => DB_PORT,
                'suggestions' => [
                    'Vérifier les identifiants (user: ' . DB_USER . ', database: ' . DB_NAME . ')',
                    'Vérifier l\'accès réseau au serveur MySQL',
                    'Vérifier que le port 3306 est accessible',
                    'Vérifier les logs du serveur MySQL'
                ]
            ];
        }
        
        echo json_encode($response);
        break;
        
    case 'load':
        // Charger les données depuis la BDD
        connectDB();
        if ($dbConnected) {
            $data = loadFromDB($type);
            if ($data !== null) {
                echo json_encode(['success' => true, 'source' => 'database', 'data' => $data]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Erreur de chargement']);
            }
        } else {
            http_response_code(503);
            echo json_encode(['success' => false, 'error' => 'Base de données indisponible']);
        }
        break;
        
    case 'save':
        // Sauvegarder les données dans la BDD
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        connectDB();
        if ($dbConnected) {
            if (saveToDB($type, $data)) {
                echo json_encode(['success' => true, 'message' => 'Données sauvegardées en BDD']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Erreur lors de la sauvegarde']);
            }
        } else {
            http_response_code(503);
            echo json_encode(['success' => false, 'error' => 'Base de données indisponible']);
        }
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Action invalide']);
        break;
}

// Fermer la connexion
if ($db && $dbConnected) {
    $db->close();
}
?>
