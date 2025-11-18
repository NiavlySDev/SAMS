<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$diagnostics = array();

// Test 1: Vérifier le config.json
$config_path = __DIR__ . '/../../config/config.json';
$diagnostics['config_file_path'] = $config_path;
$diagnostics['config_file_exists'] = file_exists($config_path);
$diagnostics['current_dir'] = __DIR__;
$diagnostics['realpath'] = realpath(__DIR__ . '/../../config');

// Test 2: Vérifier les permissions
if (file_exists($config_path)) {
    $diagnostics['config_readable'] = is_readable($config_path);
    $content = file_get_contents($config_path);
    $diagnostics['config_size'] = strlen($content);
    
    $config = json_decode($content, true);
    $diagnostics['json_valid'] = ($config !== null);
    if ($config === null) {
        $diagnostics['json_error'] = json_last_error_msg();
    } else {
        $diagnostics['config_keys'] = array_keys($config);
    }
}

// Test 3: Vérifier les constantes
$diagnostics['php_version'] = phpversion();
$diagnostics['mysqli_available'] = extension_loaded('mysqli');
$diagnostics['realpath_works'] = (realpath('.') !== false);

// Test 4: Lister les fichiers du dossier config
$config_dir = __DIR__ . '/../../config';
if (is_dir($config_dir)) {
    $diagnostics['config_dir_files'] = scandir($config_dir);
}

// Test 5: Vérifier le parent directory
$parent_dir = __DIR__ . '/../..';
if (is_dir($parent_dir)) {
    $diagnostics['parent_dir_files'] = scandir($parent_dir);
}

echo json_encode($diagnostics, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
