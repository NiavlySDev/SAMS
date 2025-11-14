<?php
// API simple pour la sauvegarde des données JSON
// Note: Ce fichier nécessite un serveur PHP pour fonctionner

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? '';

switch ($method) {
    case 'GET':
        handleGet($type);
        break;
    case 'POST':
        handlePost($type);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
}

function handleGet($type) {
    $file = getJsonFile($type);
    if (file_exists($file)) {
        $data = file_get_contents($file);
        echo $data;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Fichier non trouvé']);
    }
}

function handlePost($type) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Données JSON invalides']);
        return;
    }
    
    $file = getJsonFile($type);
    if (file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['success' => true, 'message' => 'Données sauvegardées']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la sauvegarde']);
    }
}

function getJsonFile($type) {
    switch ($type) {
        case 'manuels':
            return 'json/manuels.json';
        case 'grades':
            return 'json/grades.json';
        case 'specialites':
            return 'json/specialites.json';
        default:
            return null;
    }
}
?>
