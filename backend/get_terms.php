<?php
header('Content-Type: application/json');

$file_path = 'terms.txt';

if (file_exists($file_path)) {
    $content = file_get_contents($file_path);
    echo json_encode(['status' => 'success', 'content' => $content]);
} else {
    
    $default_content = "Welcome to CourtBooker. Please update your terms of service.";
    echo json_encode(['status' => 'success', 'content' => $default_content]);
}
?>