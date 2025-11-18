<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$tests = array();
$errors = array();
$recommendations = array();

// Load config
$config_path = '../../config/config.json';
$config = null;

if (file_exists($config_path)) {
    $config = json_decode(file_get_contents($config_path), true);
    $tests[] = array(
        'name' => 'Config file found',
        'status' => 'OK'
    );
} else {
    $errors[] = 'Config file not found at ' . $config_path;
    $tests[] = array(
        'name' => 'Config file found',
        'status' => 'FAIL'
    );
}

// Test 1: mysqli
$mysqli_ok = extension_loaded('mysqli');
$tests[] = array(
    'name' => 'mysqli extension',
    'status' => $mysqli_ok ? 'OK' : 'FAIL'
);
if (!$mysqli_ok) {
    $errors[] = 'mysqli not available';
}

// Test 2: DNS
$ip = @gethostbyname('we01io.myd.infomaniak.com');
$dns_ok = ($ip && $ip !== 'we01io.myd.infomaniak.com');
$tests[] = array(
    'name' => 'DNS resolution',
    'status' => $dns_ok ? 'OK' : 'FAIL'
);
if (!$dns_ok) {
    $errors[] = 'DNS failed';
}

// Test 3-6: MySQL connection
$conn_ok = false;
$db_ok = false;
$query_ok = false;

if ($mysqli_ok && $config) {
    $mysqli = @new mysqli(
        $config['db_host'], 
        $config['db_user'], 
        $config['db_password'], 
        $config['db_name']
    );
    $conn_ok = !$mysqli->connect_error;
    
    $tests[] = array(
        'name' => 'MySQL connection',
        'status' => $conn_ok ? 'OK' : 'FAIL'
    );
    
    if (!$conn_ok) {
        $errors[] = 'MySQL connection failed';
    } else {
        $result = @$mysqli->query('SELECT 1');
        $query_ok = ($result !== false);
        $tests[] = array(
            'name' => 'SELECT query',
            'status' => $query_ok ? 'OK' : 'FAIL'
        );
        
        if ($query_ok) {
            $recommendations[] = 'All tests passed';
        } else {
            $errors[] = 'Query failed';
        }
        
        @$mysqli->close();
    }
}

// Recommendations
if (count($errors) === 0 && $query_ok) {
    $recommendations[] = 'BDD connection successful';
} else {
    if (!$mysqli_ok) {
        $recommendations[] = 'Enable mysqli extension';
    }
    if (!$dns_ok) {
        $recommendations[] = 'Check internet connection';
    }
    if (!$conn_ok) {
        $recommendations[] = 'Request remote MySQL access from Infomaniak';
    }
    if ($conn_ok && !$db_ok) {
        $recommendations[] = 'Check database exists';
    }
}

$output = array(
    'timestamp' => date('Y-m-d H:i:s'),
    'overall_status' => (count($errors) === 0 && $query_ok) ? 'SUCCESS' : 'FAILURE',
    'error_count' => count($errors),
    'tests' => $tests,
    'errors' => $errors,
    'recommendations' => $recommendations
);

echo json_encode($output);
?>
