<?php
/**
 * API de synchronisation avec la base de données MySQL - Production
 * Gère les blippers, manuels, grades, spécialités et catégories
 */

// Configuration de production
error_reporting(E_ERROR | E_WARNING | E_PARSE);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('max_execution_time', 30);
ini_set('memory_limit', '128M');

// Démarrage de la session
session_start();

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Charger la configuration
$config_path = __DIR__ . '/../../config/config.json';
$config = null;

// Chemins possibles pour le fichier de configuration
if (!file_exists($config_path)) {
    $possible_paths = array(
        $_SERVER['DOCUMENT_ROOT'] . '/../config/config.json',
        dirname(dirname(dirname(__FILE__))) . '/config/config.json',
        realpath(__DIR__ . '/../../config/config.json')
    );
    
    foreach ($possible_paths as $path) {
        if ($path && file_exists($path)) {
            $config_path = $path;
            break;
        }
    }
}

if (file_exists($config_path)) {
    $json_content = file_get_contents($config_path);
    $config = json_decode($json_content, true);
    
    if ($config === null) {
        error_log("SAMS - Erreur décodage config JSON: " . json_last_error_msg());
        $config = array();
    }
} else {
    error_log("SAMS - Fichier config introuvable: " . $config_path);
    $config = array();
}

// Configuration de la base de données Infomaniak
define('DB_HOST', isset($config['db_host']) ? $config['db_host'] : 'we01io.myd.infomaniak.com');
define('DB_USER', isset($config['db_user']) ? $config['db_user'] : 'we01io_sams');
define('DB_PASS', isset($config['db_password']) ? $config['db_password'] : 'RBM91210chat!');
define('DB_NAME', isset($config['db_name']) ? $config['db_name'] : 'we01io_sams');
define('DB_PORT', 3306);

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
 * Connexion optimisée à la base de données Infomaniak
 */
function connectDB() {
    global $db, $dbConnected;
    
    // Éviter les connexions répétées
    if ($dbConnected && $db && $db->ping()) {
        return true;
    }
    
    try {
        // Configuration timeout optimisée pour Infomaniak
        ini_set('default_socket_timeout', 20);
        ini_set('mysql.connect_timeout', 20);
        
        // Connexion avec retry en cas d'échec temporaire
        $retry = 0;
        $maxRetries = 2;
        
        do {
            $db = new mysqli(
                DB_HOST, 
                DB_USER, 
                DB_PASS, 
                DB_NAME, 
                DB_PORT
            );
            
            if ($db->connect_error) {
                $retry++;
                if ($retry < $maxRetries) {
                    usleep(500000); // Attendre 0.5 seconde
                    continue;
                } else {
                    error_log('SAMS - Connexion MySQL échouée après ' . $maxRetries . ' tentatives: ' . $db->connect_error);
                    $dbConnected = false;
                    return false;
                }
            }
            break;
        } while ($retry < $maxRetries);
        
        // Configuration optimale pour la production
        $db->set_charset('utf8mb4');
        $db->autocommit(true);
        $db->options(MYSQLI_OPT_CONNECT_TIMEOUT, 20);
        
        // Test de connectivité
        $result = $db->query('SELECT 1');
        if (!$result) {
            error_log('SAMS - Test de connectivité échoué: ' . $db->error);
            $db->close();
            $dbConnected = false;
            return false;
        }
        
        $dbConnected = true;
        
        // Initialiser les tables une seule fois par session
        if (!isset($_SESSION['sams_tables_init'])) {
            createTables();
            $_SESSION['sams_tables_init'] = true;
        }
        
        return true;
    } catch (Exception $e) {
        error_log('SAMS - Exception connexion DB: ' . $e->getMessage());
        $dbConnected = false;
        return false;
    }
}

/**
 * Créer les tables nécessaires avec support des membres grades
 */
function createTables() {
    global $db;
    
    $tables = [
        // Table des blippers
        "CREATE TABLE IF NOT EXISTS `blippers` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `bliper_id` VARCHAR(50) UNIQUE NOT NULL,
            `label` VARCHAR(100) NOT NULL,
            `icon` VARCHAR(10) NOT NULL,
            `color` VARCHAR(7) NOT NULL,
            `description` TEXT,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        // Table des manuels
        "CREATE TABLE IF NOT EXISTS `manuels` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT,
            `link` VARCHAR(500),
            `importance` INT DEFAULT 5,
            `categorie` VARCHAR(100),
            `cat_color` VARCHAR(7),
            `auteur` VARCHAR(100),
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        // Table des grades
        "CREATE TABLE IF NOT EXISTS `grades` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `grade` VARCHAR(100) NOT NULL UNIQUE,
            `order` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        // Table des membres de grades
        "CREATE TABLE IF NOT EXISTS `membres_grades` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `grade_id` INT NOT NULL,
            `nom` VARCHAR(100) NOT NULL,
            `char_id` INT NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON DELETE CASCADE,
            UNIQUE KEY `unique_grade_member` (`grade_id`, `char_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        // Specialites
        "CREATE TABLE IF NOT EXISTS `specialites` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `name` VARCHAR(100) NOT NULL UNIQUE,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        // Membres de spécialités
        "CREATE TABLE IF NOT EXISTS `specialite_membres` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `specialite_id` INT NOT NULL,
            `nom` VARCHAR(100) NOT NULL,
            `char_id` INT NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`specialite_id`) REFERENCES `specialites`(`id`) ON DELETE CASCADE,
            UNIQUE KEY `unique_spec_member` (`specialite_id`, `char_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        // Table des catégories
        "CREATE TABLE IF NOT EXISTS `categories` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `name` VARCHAR(100) NOT NULL UNIQUE,
            `color` VARCHAR(7) NOT NULL,
            `visible` BOOLEAN DEFAULT 1,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        // Table des zones GTA5
        "CREATE TABLE IF NOT EXISTS `gta5_zones` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `name` VARCHAR(100) NOT NULL,
            `zone_data` JSON,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        // Blippers instances (créés sur la carte)
        "CREATE TABLE IF NOT EXISTS `gta5_blippers_instances` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `bliper_id` BIGINT NOT NULL,
            `type` VARCHAR(50) DEFAULT 'bliper',
            `x` FLOAT NOT NULL,
            `y` FLOAT NOT NULL,
            `bliperType` VARCHAR(50),
            `color` VARCHAR(7),
            `name` VARCHAR(255),
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_bliper_id (bliper_id),
            INDEX idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        // Configuration admin
        "CREATE TABLE IF NOT EXISTS `admin_config` (
            `id` INT PRIMARY KEY AUTO_INCREMENT,
            `config_key` VARCHAR(100) NOT NULL UNIQUE,
            `config_value` TEXT,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];
    
    foreach ($tables as $sql) {
        if (!$db->query($sql)) {
            error_log('SAMS - Erreur création table: ' . $db->error);
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
                // Récupérer les grades avec leurs membres
                $result = $db->query("SELECT g.id, g.grade, g.`order` FROM grades g ORDER BY g.`order`, g.grade");
                if (!$result) throw new Exception($db->error);
                
                $data = [];
                while ($row = $result->fetch_assoc()) {
                    $gradeId = $row['id'];
                    // Récupérer les membres de ce grade
                    $memberResult = $db->query("SELECT nom, char_id FROM membres_grades WHERE grade_id = $gradeId ORDER BY nom");
                    $membres = [];
                    if ($memberResult) {
                        while ($member = $memberResult->fetch_assoc()) {
                            $membres[] = $member['nom'] . ' | ' . $member['char_id'];
                        }
                    }
                    
                    $data[] = [
                        'id' => $row['id'],
                        'grade' => $row['grade'],
                        'membres' => $membres,
                        'order' => $row['order']
                    ];
                }
                return $data;
                
            case 'specialites':
                // Récupérer les spécialités avec leurs membres
                $result = $db->query("SELECT s.id, s.name FROM specialites s ORDER BY s.name");
                if (!$result) throw new Exception($db->error);
                
                $data = [];
                while ($row = $result->fetch_assoc()) {
                    $specId = $row['id'];
                    // Récupérer les membres de cette spécialité
                    $memberResult = $db->query("SELECT nom, char_id FROM specialite_membres WHERE specialite_id = $specId ORDER BY nom");
                    $membres = [];
                    if ($memberResult) {
                        while ($member = $memberResult->fetch_assoc()) {
                            $membres[] = $member['nom'] . ' | ' . $member['char_id'];
                        }
                    }
                    
                    $data[] = [
                        'id' => $row['id'],
                        'specialite' => $row['name'],
                        'name' => $row['name'],
                        'membres' => $membres
                    ];
                }
                return $data;
                
            case 'categories':
                $result = $db->query("SELECT id, name, color, visible FROM categories ORDER BY name");
                break;
                
            case 'gta5-zones':
                $result = $db->query("SELECT name, zone_data FROM gta5_zones ORDER BY name");
                if (!$result) throw new Exception($db->error);
                
                $data = [];
                while ($row = $result->fetch_assoc()) {
                    $zoneData = json_decode($row['zone_data'], true);
                    $data[$row['name']] = $zoneData ?: $row['zone_data'];
                }
                return $data;
                
            case 'gta5-blippers':
                // Charger les blippers instances depuis la table gta5_blippers_instances
                $result = $db->query("SELECT id, type, x, y, bliperType, color, name FROM gta5_blippers_instances ORDER BY created_at");
                if (!$result) {
                    return [];
                }
                
                $data = [];
                while ($row = $result->fetch_assoc()) {
                    // Garder 'id' pour compatibilité avec le frontend
                    $data[] = $row;
                }
                return $data;
                
            case 'admin-config':
                // Charger la configuration admin
                return loadAdminConfig();
                
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
        error_log('SAMS - Erreur lecture DB: ' . $e->getMessage());
        return null;
    }
}

/**
 * Charger la configuration admin
 */
function loadAdminConfig() {
    global $db, $dbConnected;
    
    if (!$dbConnected) {
        return null;
    }
    
    try {
        $result = $db->query("SELECT config_key, config_value FROM admin_config");
        if (!$result) {
            return null;
        }
        
        $config = [];
        while ($row = $result->fetch_assoc()) {
            $config[] = [
                'config_key' => $row['config_key'],
                'config_value' => $row['config_value']
            ];
        }
        
        return $config;
    } catch (Exception $e) {
        error_log('SAMS - Erreur lecture config admin: ' . $e->getMessage());
        return null;
    }
}

/**
 * Sauvegarder la configuration admin
 */
function saveAdminConfig($key, $value) {
    global $db, $dbConnected;
    
    if (!$dbConnected) {
        return false;
    }
    
    try {
        $key = $db->real_escape_string($key);
        $value_str = is_array($value) || is_object($value) ? json_encode($value) : $value;
        $value_str = $db->real_escape_string($value_str);
        
        // INSERT ... ON DUPLICATE KEY UPDATE pour upsert
        $sql = "INSERT INTO admin_config (config_key, config_value) 
                VALUES ('$key', '$value_str')
                ON DUPLICATE KEY UPDATE config_value = '$value_str', updated_at = NOW()";
        
        return $db->query($sql);
    } catch (Exception $e) {
        error_log('SAMS - Erreur sauvegarde config admin: ' . $e->getMessage());
        return false;
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
            case 'grades':
                // Gérer les grades avec leurs membres
                foreach ($data as $grade) {
                    $gradeName = $db->real_escape_string($grade['grade'] ?? '');
                    $order = intval($grade['order'] ?? 0);
                    
                    // Vérifier si le grade existe
                    $check = $db->query("SELECT id FROM grades WHERE grade = '$gradeName'");
                    if ($check && $check->num_rows > 0) {
                        // Mettre à jour
                        $db->query("UPDATE grades SET `order` = $order, updated_at = NOW() WHERE grade = '$gradeName'");
                        $gradeRow = $check->fetch_assoc();
                        $gradeId = $gradeRow['id'];
                    } else {
                        // Insérer
                        if (!$db->query("INSERT INTO grades (grade, `order`) VALUES ('$gradeName', $order)")) {
                            throw new Exception($db->error);
                        }
                        $gradeId = $db->insert_id;
                    }
                    
                    // Gérer les membres
                    if (isset($grade['membres']) && is_array($grade['membres'])) {
                        // Supprimer les anciens membres
                        $db->query("DELETE FROM membres_grades WHERE grade_id = $gradeId");
                        
                        // Ajouter les nouveaux
                        foreach ($grade['membres'] as $membre) {
                            preg_match('/(.+)\s*\|\s*(\d+)/', $membre, $matches);
                            if (count($matches) > 2) {
                                $nom = $db->real_escape_string(trim($matches[1]));
                                $charId = intval($matches[2]);
                                if (!$db->query("INSERT INTO membres_grades (grade_id, nom, char_id) VALUES ($gradeId, '$nom', $charId)")) {
                                    throw new Exception($db->error);
                                }
                            }
                        }
                    }
                }
                break;
                
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
                
            case 'gta5-zones':
                // Sauvegarder les zones GTA5
                if (!is_array($data)) {
                    error_log("SAMS - gta5-zones: data is not an array");
                    throw new Exception('gta5-zones data must be an array');
                }
                
                error_log("SAMS - gta5-zones: processing " . count($data) . " items");
                
                // Truncate et recharger les zones
                $db->query("TRUNCATE TABLE gta5_zones");
                $zonesSaved = 0;
                
                foreach ($data as $item) {
                    error_log("SAMS - Processing zone item, type: " . (isset($item['type']) ? $item['type'] : 'NO TYPE'));
                    
                    if ($item['type'] === 'zone') {
                        $name = $db->real_escape_string($item['name'] ?? 'Zone');
                        $zoneData = json_encode($item);
                        $zoneData = $db->real_escape_string($zoneData);
                        
                        $sql = "INSERT INTO gta5_zones (name, zone_data) VALUES ('$name', '$zoneData')";
                        if (!$db->query($sql)) {
                            error_log("SAMS - Zone save error: " . $db->error);
                            throw new Exception($db->error);
                        }
                        $zonesSaved++;
                    }
                }
                
                error_log("SAMS - gta5-zones: Successfully saved $zonesSaved zones");
                break;
                
            case 'gta5-blippers':
                // Sauvegarder les blippers instances (créées sur la carte) dans gta5_blippers_instances
                if (!is_array($data)) {
                    throw new Exception('gta5-blippers data must be an array');
                }
                
                // Vider et recharger les blippers instances
                $db->query("TRUNCATE TABLE gta5_blippers_instances");
                
                foreach ($data as $item) {
                    if (isset($item['type']) && $item['type'] === 'bliper') {
                        $bliper_id = intval($item['id'] ?? 0);
                        $type = $db->real_escape_string($item['type'] ?? 'bliper');
                        $x = floatval($item['x'] ?? 0);
                        $y = floatval($item['y'] ?? 0);
                        $bliperType = $db->real_escape_string($item['bliperType'] ?? '');
                        $color = $db->real_escape_string($item['color'] ?? '#000000');
                        $name = $db->real_escape_string($item['name'] ?? '');
                        
                        $sql = "INSERT INTO gta5_blippers_instances (bliper_id, type, x, y, bliperType, color, name) 
                                VALUES ($bliper_id, '$type', $x, $y, '$bliperType', '$color', '$name')";
                        
                        if (!$db->query($sql)) {
                            throw new Exception($db->error);
                        }
                    }
                }
                break;
        }
        
        $db->commit();
        return true;
    } catch (Exception $e) {
        $db->rollback();
        error_log('SAMS - Erreur sauvegarde DB: ' . $e->getMessage());
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
        // Si on vérifie le mot de passe admin
        if ($type === 'admin-password') {
            connectDB();
            $input = json_decode(file_get_contents('php://input'), true);
            $providedPassword = $input['password'] ?? '';
            
            // Charger le mot de passe admin depuis la BDD
            if ($dbConnected) {
                $result = $db->query("SELECT config_value FROM admin_config WHERE config_key = 'password' LIMIT 1");
                if ($result) {
                    $row = $result->fetch_assoc();
                    $storedPassword = $row ? $row['config_value'] : 'admin123';
                    
                    // Essayer de décoder si c'est du JSON
                    try {
                        $decoded = json_decode($storedPassword, true);
                        if ($decoded && isset($decoded['password'])) {
                            $storedPassword = $decoded['password'];
                        }
                    } catch (Exception $e) {
                        // Garder la valeur telle quelle si pas du JSON
                    }
                } else {
                    $storedPassword = 'admin123';
                }
            } else {
                $storedPassword = 'admin123';
            }
            
            if ($providedPassword === $storedPassword && !empty($providedPassword)) {
                echo json_encode(['success' => true, 'authenticated' => true, 'message' => 'Authentification réussie']);
            } else {
                echo json_encode(['success' => false, 'authenticated' => false, 'message' => 'Mot de passe incorrect']);
            }
            break;
        }
        
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
            // Toujours retourner 200 OK pour que le JavaScript puisse traiter la réponse
            $response['error'] = 'Base de données indisponible';
            $response['fallback_mode'] = true;
            $response['suggestions'] = [
                'Mode fallback actif',
                'Données chargées depuis JSON/LocalStorage'
            ];
        } else {
            $response['fallback_mode'] = false;
            $response['status'] = 'Base de données opérationnelle';
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
                echo json_encode(['success' => false, 'source' => 'database', 'error' => 'Erreur de chargement BDD']);
            }
        } else {
            // Mode fallback - retourner 200 avec indicateur d'échec
            echo json_encode(['success' => false, 'source' => 'fallback', 'error' => 'Base de données indisponible', 'fallback_mode' => true]);
        }
        break;
        
    case 'save':
        // Sauvegarder les données dans la BDD
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        error_log("SAMS - Save action for type: $type, data items: " . (is_array($data) ? count($data) : 'non-array'));
        error_log("SAMS - Save data preview: " . substr($input, 0, 500));
        
        connectDB();
        if ($dbConnected) {
            if (saveToDB($type, $data)) {
                echo json_encode(['success' => true, 'message' => 'Données sauvegardées en BDD', 'source' => 'database']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Erreur lors de la sauvegarde BDD', 'source' => 'database']);
            }
        } else {
            // Mode fallback - retourner 200 avec indicateur d'échec
            echo json_encode(['success' => false, 'error' => 'Base de données indisponible', 'source' => 'fallback', 'fallback_mode' => true]);
        }
        break;
        
    case 'save-admin-config':
        // Sauvegarder la configuration admin (mot de passe, etc.)
        $input = file_get_contents('php://input');
        $config = json_decode($input, true);
        
        connectDB();
        if ($dbConnected) {
            $success = true;
            foreach ($config as $key => $value) {
                if (!saveAdminConfig($key, $value)) {
                    $success = false;
                    break;
                }
            }
            
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Configuration admin sauvegardée', 'source' => 'database']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Erreur lors de la sauvegarde de la configuration', 'source' => 'database']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Base de données indisponible', 'source' => 'fallback', 'fallback_mode' => true]);
        }
        break;
        
    case 'clear':
        // Effacer toutes les données des tables gta5_zones et gta5_blippers_instances
        connectDB();
        if ($dbConnected) {
            try {
                // Commencer une transaction
                $db->begin_transaction();
                
                // Effacer les tables
                $db->query("TRUNCATE TABLE gta5_zones");
                if ($db->error) {
                    throw new Exception("Erreur TRUNCATE gta5_zones: " . $db->error);
                }
                
                $db->query("TRUNCATE TABLE gta5_blippers_instances");
                if ($db->error) {
                    throw new Exception("Erreur TRUNCATE gta5_blippers_instances: " . $db->error);
                }
                
                // Valider la transaction
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Toutes les données ont été effacées de la BDD',
                    'tables_cleared' => ['gta5_zones', 'gta5_blippers_instances']
                ]);
            } catch (Exception $e) {
                $db->rollback();
                error_log('SAMS - Erreur lors de l\'effacement BDD: ' . $e->getMessage());
                echo json_encode([
                    'success' => false,
                    'error' => 'Erreur lors de l\'effacement: ' . $e->getMessage()
                ]);
            }
        } else {
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
