<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['status' => 'ok', 'timestamp' => date('Y-m-d H:i:s'), 'php_version' => phpversion()]);
?>
