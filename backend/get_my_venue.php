<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role_id'], [2, 3])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    $stmt = $conn->prepare("SELECT * FROM venues WHERE owner_id = :owner_id LIMIT 1");
    $stmt->execute(['owner_id' => $_SESSION['user_id']]);
    $venue = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($venue) {
        echo json_encode(['status' => 'success', 'data' => $venue]);
    } else {
        echo json_encode(['status' => 'not_found', 'message' => 'No venue found for this owner.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>