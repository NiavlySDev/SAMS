<?php
/**
 * Script PHP pour générer le SQL d'initialisation à partir des fichiers JSON
 * À exécuter une fois pour initialiser la base de données
 * 
 * Usage: php init-db-from-json.php > init-data.sql
 */

// Charger les fichiers JSON
$jsonDir = __DIR__ . '/../json/';
$data = [];

// Charger tous les JSON
$jsonFiles = [
    'blippers' => 'blippers.json',
    'categories' => 'categories.json',
    'specialites' => 'specialites.json',
    'grades' => 'grades.json',
    'manuels' => 'manuels.json',
    'gta5-zones' => 'gta5-zones.json'
];

foreach ($jsonFiles as $key => $file) {
    $path = $jsonDir . $file;
    if (file_exists($path)) {
        $content = file_get_contents($path);
        $data[$key] = json_decode($content, true);
        if ($data[$key] === null) {
            error_log("Erreur lecture JSON: $file");
        }
    }
}

// Fonction pour échapper les données SQL
function escapeSql($str) {
    return str_replace("'", "''", $str);
}

// Générer le SQL
echo "-- ===================================================================\n";
echo "-- SAMS - Script d'initialisation depuis JSON\n";
echo "-- Généré le: " . date('Y-m-d H:i:s') . "\n";
echo "-- ===================================================================\n\n";

// BLIPPERS
if (isset($data['blippers']) && is_array($data['blippers'])) {
    echo "-- BLIPPERS\n";
    echo "TRUNCATE TABLE `blippers`;\n";
    foreach ($data['blippers'] as $blipper) {
        $id = escapeSql($blipper['id'] ?? 'unknown');
        $label = escapeSql($blipper['label'] ?? '');
        $icon = escapeSql($blipper['icon'] ?? '');
        $color = escapeSql($blipper['color'] ?? '#000000');
        $desc = escapeSql($blipper['description'] ?? '');
        
        echo "INSERT INTO `blippers` (`bliper_id`, `label`, `icon`, `color`, `description`) ";
        echo "VALUES ('$id', '$label', '$icon', '$color', '$desc');\n";
    }
    echo "\n";
}

// CATEGORIES
if (isset($data['categories']) && is_array($data['categories'])) {
    echo "-- CATEGORIES\n";
    echo "TRUNCATE TABLE `categories`;\n";
    foreach ($data['categories'] as $cat) {
        $name = escapeSql($cat['name'] ?? '');
        $color = escapeSql($cat['color'] ?? '#000000');
        $visible = $cat['visible'] ? 1 : 0;
        
        echo "INSERT INTO `categories` (`name`, `color`, `visible`) ";
        echo "VALUES ('$name', '$color', $visible);\n";
    }
    echo "\n";
}

// SPECIALITES
if (isset($data['specialites']) && is_array($data['specialites'])) {
    echo "-- SPECIALITES\n";
    echo "TRUNCATE TABLE `specialites`;\n";
    foreach ($data['specialites'] as $spec) {
        $name = escapeSql($spec['name'] ?? $spec ?? '');
        
        echo "INSERT INTO `specialites` (`name`) ";
        echo "VALUES ('$name');\n";
    }
    echo "\n";
}

// GRADES ET MEMBRES
if (isset($data['grades']) && is_array($data['grades'])) {
    echo "-- GRADES\n";
    echo "TRUNCATE TABLE `membres_grades`;\n";
    echo "TRUNCATE TABLE `grades`;\n";
    
    $gradeOrder = 0;
    foreach ($data['grades'] as $grade) {
        $gradeName = escapeSql($grade['grade'] ?? $grade['name'] ?? '');
        $order = $grade['order'] ?? ++$gradeOrder;
        
        echo "INSERT INTO `grades` (`grade`, `order`) ";
        echo "VALUES ('$gradeName', $order);\n";
        
        // Ajouter les membres
        if (isset($grade['membres']) && is_array($grade['membres'])) {
            foreach ($grade['membres'] as $membre) {
                // Parser "Nom | ID"
                if (preg_match('/(.+)\s*\|\s*(\d+)/', $membre, $matches)) {
                    $nom = escapeSql(trim($matches[1]));
                    $charId = intval($matches[2]);
                    
                    echo "INSERT INTO `membres_grades` (`grade_id`, `nom`, `char_id`) ";
                    echo "SELECT `id`, '$nom', $charId FROM `grades` WHERE `grade` = '$gradeName';\n";
                }
            }
        }
    }
    echo "\n";
}

// MANUELS
if (isset($data['manuels']) && is_array($data['manuels'])) {
    echo "-- MANUELS\n";
    echo "TRUNCATE TABLE `manuels`;\n";
    foreach ($data['manuels'] as $manuel) {
        $title = escapeSql($manuel['title'] ?? '');
        $desc = escapeSql($manuel['desc'] ?? $manuel['description'] ?? '');
        $link = escapeSql($manuel['link'] ?? '');
        $importance = intval($manuel['importance'] ?? 5);
        $categorie = escapeSql($manuel['categorie'] ?? '');
        $catColor = escapeSql($manuel['catColor'] ?? $manuel['cat_color'] ?? '');
        $auteur = escapeSql($manuel['auteur'] ?? '');
        
        echo "INSERT INTO `manuels` (`title`, `description`, `link`, `importance`, `categorie`, `cat_color`, `auteur`) ";
        echo "VALUES ('$title', '$desc', '$link', $importance, '$categorie', '$catColor', '$auteur');\n";
    }
    echo "\n";
}

// GTA5 ZONES
if (isset($data['gta5-zones']) && is_array($data['gta5-zones'])) {
    echo "-- GTA5 ZONES\n";
    echo "TRUNCATE TABLE `gta5_zones`;\n";
    
    // Si c'est un objet avec clés (format objet)
    if (!isset($data['gta5-zones'][0])) {
        foreach ($data['gta5-zones'] as $name => $zone) {
            $name_esc = escapeSql($name);
            $zone_json = json_encode($zone);
            $zone_json_esc = escapeSql($zone_json);
            
            echo "INSERT INTO `gta5_zones` (`name`, `zone_data`) ";
            echo "VALUES ('$name_esc', '$zone_json_esc');\n";
        }
    } else {
        // Si c'est un tableau
        foreach ($data['gta5-zones'] as $zone) {
            $name = escapeSql($zone['name'] ?? 'Zone');
            $zone_json = json_encode($zone);
            $zone_json_esc = escapeSql($zone_json);
            
            echo "INSERT INTO `gta5_zones` (`name`, `zone_data`) ";
            echo "VALUES ('$name', '$zone_json_esc');\n";
        }
    }
    echo "\n";
}

echo "-- ===================================================================\n";
echo "-- Initialisation terminée\n";
echo "-- ===================================================================\n";
?>
