<?php
session_start();
require_once 'config/DatabaseConnection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}
$userId = $_SESSION['user_id'];

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 1. Get current status
    $stmt = $conn->prepare("SELECT status FROM venues WHERE owner_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $userId]);
    $venue = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($venue) {
        // 2. Toggle status
        $newStatus = ($venue['status'] === 'active') ? 'inactive' : 'active';
        
        $update = $conn->prepare("UPDATE venues SET status = :status WHERE owner_id = :user_id");
        $update->execute(['status' => $newStatus, 'user_id' => $userId]);
        
        echo json_encode(['status' => 'success', 'new_status' => $newStatus]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Venue not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>