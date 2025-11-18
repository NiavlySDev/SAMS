<?php
/**
 * Script d'initialisation directe de la base de données depuis les fichiers JSON
 * À appeler une seule fois pour initialiser la production
 * 
 * Usage: https://votre-domaine.com/AideSAMS/api/init-from-json.php
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

// Charger les fichiers JSON
$jsonDir = __DIR__ . '/../json/';
$results = [];

try {
    // Désactiver les vérifications de contraintes étrangères
    $db->query("SET FOREIGN_KEY_CHECKS = 0");
    
    // Récréer toutes les tables pour s'assurer de la bonne structure
    $db->query("DROP TABLE IF EXISTS `membres_grades`");
    $db->query("DROP TABLE IF EXISTS `specialite_membres`");
    $db->query("DROP TABLE IF EXISTS `manuels`");
    $db->query("DROP TABLE IF EXISTS `grades`");
    $db->query("DROP TABLE IF EXISTS `specialites`");
    $db->query("DROP TABLE IF EXISTS `categories`");
    $db->query("DROP TABLE IF EXISTS `gta5_zones`");
    $db->query("DROP TABLE IF EXISTS `blippers`");
    
    // Recréer les tables avec la bonne structure
    createTables();
    
    // BLIPPERS
    if (file_exists($jsonDir . 'blippers.json')) {
        $blippers = json_decode(file_get_contents($jsonDir . 'blippers.json'), true);
        $db->query("TRUNCATE TABLE `blippers`");
        
        foreach ($blippers as $blipper) {
            $id = $db->real_escape_string($blipper['id'] ?? 'unknown');
            $label = $db->real_escape_string($blipper['label'] ?? '');
            $icon = $db->real_escape_string($blipper['icon'] ?? '');
            $color = $db->real_escape_string($blipper['color'] ?? '#000000');
            $desc = $db->real_escape_string($blipper['description'] ?? '');
            
            $db->query("INSERT INTO `blippers` (`bliper_id`, `label`, `icon`, `color`, `description`) 
                       VALUES ('$id', '$label', '$icon', '$color', '$desc')");
        }
        $results['blippers'] = count($blippers) . ' blippers importés';
    }
    
    // CATEGORIES
    if (file_exists($jsonDir . 'categories.json')) {
        $categories = json_decode(file_get_contents($jsonDir . 'categories.json'), true);
        $db->query("TRUNCATE TABLE `categories`");
        
        foreach ($categories as $cat) {
            $name = $db->real_escape_string($cat['name'] ?? '');
            $color = $db->real_escape_string($cat['color'] ?? '#000000');
            $visible = ($cat['visible'] ?? true) ? 1 : 0;
            
            $db->query("INSERT INTO `categories` (`name`, `color`, `visible`) 
                       VALUES ('$name', '$color', $visible)");
        }
        $results['categories'] = count($categories) . ' catégories importées';
    }
    
    // SPECIALITES (avec support des membres)
    if (file_exists($jsonDir . 'specialites.json')) {
        $specialites = json_decode(file_get_contents($jsonDir . 'specialites.json'), true);
        $db->query("TRUNCATE TABLE `specialite_membres`");
        $db->query("TRUNCATE TABLE `specialites`");
        
        $specCount = 0;
        $specMemberCount = 0;
        
        foreach ($specialites as $spec) {
            // La structure est: specialite, membres
            $name = $db->real_escape_string($spec['specialite'] ?? $spec['name'] ?? '');
            
            if (!$db->query("INSERT INTO `specialites` (`name`) VALUES ('$name')")) {
                throw new Exception($db->error);
            }
            $specId = $db->insert_id;
            $specCount++;
            
            // Ajouter les membres de la spécialité
            if (isset($spec['membres']) && is_array($spec['membres'])) {
                foreach ($spec['membres'] as $membre) {
                    if (preg_match('/(.+)\s*\|\s*(\d+)/', $membre, $matches)) {
                        $nom = $db->real_escape_string(trim($matches[1]));
                        $charId = intval($matches[2]);
                        
                        if (!$db->query("INSERT INTO `specialite_membres` (`specialite_id`, `nom`, `char_id`) 
                                       VALUES ($specId, '$nom', $charId)")) {
                            // Continuer même si erreur de doublon
                        }
                        $specMemberCount++;
                    }
                }
            }
        }
        $results['specialites'] = "$specCount spécialités et $specMemberCount membres importés";
    }
    
    // GRADES ET MEMBRES
    if (file_exists($jsonDir . 'grades.json')) {
        $grades = json_decode(file_get_contents($jsonDir . 'grades.json'), true);
        $db->query("TRUNCATE TABLE `membres_grades`");
        $db->query("TRUNCATE TABLE `grades`");
        
        $gradeCount = 0;
        $memberCount = 0;
        
        foreach ($grades as $gradeIdx => $grade) {
            $gradeName = $db->real_escape_string($grade['grade'] ?? $grade['name'] ?? '');
            $order = $grade['order'] ?? ($gradeIdx + 1);
            
            $db->query("INSERT INTO `grades` (`grade`, `order`) VALUES ('$gradeName', $order)");
            $gradeCount++;
            
            // Ajouter les membres
            if (isset($grade['membres']) && is_array($grade['membres'])) {
                foreach ($grade['membres'] as $membre) {
                    if (preg_match('/(.+)\s*\|\s*(\d+)/', $membre, $matches)) {
                        $nom = $db->real_escape_string(trim($matches[1]));
                        $charId = intval($matches[2]);
                        
                        $db->query("INSERT INTO `membres_grades` (`grade_id`, `nom`, `char_id`) 
                                   SELECT `id`, '$nom', $charId FROM `grades` WHERE `grade` = '$gradeName'");
                        $memberCount++;
                    }
                }
            }
        }
        $results['grades'] = "$gradeCount grades et $memberCount membres importés";
    }
    
    // MANUELS
    if (file_exists($jsonDir . 'manuels.json')) {
        $manuels = json_decode(file_get_contents($jsonDir . 'manuels.json'), true);
        $db->query("TRUNCATE TABLE `manuels`");
        
        foreach ($manuels as $manuel) {
            $title = $db->real_escape_string($manuel['title'] ?? '');
            $desc = $db->real_escape_string($manuel['desc'] ?? $manuel['description'] ?? '');
            $link = $db->real_escape_string($manuel['link'] ?? '');
            $importance = intval($manuel['importance'] ?? 5);
            $categorie = $db->real_escape_string($manuel['categorie'] ?? '');
            $catColor = $db->real_escape_string($manuel['catColor'] ?? $manuel['cat_color'] ?? '');
            $auteur = $db->real_escape_string($manuel['auteur'] ?? '');
            
            $db->query("INSERT INTO `manuels` (`title`, `description`, `link`, `importance`, `categorie`, `cat_color`, `auteur`) 
                       VALUES ('$title', '$desc', '$link', $importance, '$categorie', '$catColor', '$auteur')");
        }
        $results['manuels'] = count($manuels) . ' manuels importés';
    }
    
    // GTA5 ZONES
    if (file_exists($jsonDir . 'gta5-zones.json')) {
        $zonesData = json_decode(file_get_contents($jsonDir . 'gta5-zones.json'), true);
        $db->query("TRUNCATE TABLE `gta5_zones`");
        
        $zoneCount = 0;
        
        // Format: { "zones": [...] }
        if (isset($zonesData['zones']) && is_array($zonesData['zones'])) {
            foreach ($zonesData['zones'] as $zone) {
                $name = $db->real_escape_string($zone['name'] ?? 'Zone');
                $zone_json = $db->real_escape_string(json_encode($zone));
                
                $db->query("INSERT INTO `gta5_zones` (`name`, `zone_data`) VALUES ('$name', '$zone_json')");
                $zoneCount++;
            }
        } else if (is_array($zonesData)) {
            // Si c'est directement un tableau
            foreach ($zonesData as $zone) {
                $name = $db->real_escape_string($zone['name'] ?? 'Zone');
                $zone_json = $db->real_escape_string(json_encode($zone));
                
                $db->query("INSERT INTO `gta5_zones` (`name`, `zone_data`) VALUES ('$name', '$zone_json')");
                $zoneCount++;
            }
        }
        $results['gta5_zones'] = "$zoneCount zones importées";
    }
    
    // Réactiver les vérifications de contraintes étrangères
    $db->query("SET FOREIGN_KEY_CHECKS = 1");
    
    // Fermer la connexion
    if ($db && $dbConnected) {
        $db->close();
    }
    
    // Réponse succès
    echo json_encode([
        'status' => 'success',
        'message' => 'Base de données initialisée avec succès depuis les JSON',
        'timestamp' => date('Y-m-d H:i:s'),
        'results' => $results,
        'server' => DB_HOST,
        'database' => DB_NAME
    ]);
    
} catch (Exception $e) {
    // Réactiver les contraintes en cas d'erreur
    if ($db && isset($db)) {
        @$db->query("SET FOREIGN_KEY_CHECKS = 1");
    }
    
    error_log('SAMS - Erreur initialisation: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de l\'initialisation',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
