<?php
session_start();
header('Content-Type: application/json');


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $content = isset($_POST['terms_content']) ? $_POST['terms_content'] : '';
    $file_path = 'terms.txt';

    if (file_put_contents($file_path, $content) !== false) {
        echo json_encode(['status' => 'success', 'message' => 'Terms updated successfully.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to save terms. Please check folder permissions.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request.']);
}
?>