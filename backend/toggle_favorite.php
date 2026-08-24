<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

// 1. Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Please log in to save your favorite venues!']);
    exit();
}

$userId = $_SESSION['user_id'];
$venueId = $_POST['venue_id'] ?? null;

if (!$venueId) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid venue ID.']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 2. Check if this venue is already favorited by the user
    $checkStmt = $conn->prepare("SELECT * FROM favorite_venues WHERE user_id = :user_id AND venue_id = :venue_id");
    $checkStmt->execute(['user_id' => $userId, 'venue_id' => $venueId]);
    
    if ($checkStmt->rowCount() > 0) {
        // 3a. If it exists, remove it (Unlike)
        $deleteStmt = $conn->prepare("DELETE FROM favorite_venues WHERE user_id = :user_id AND venue_id = :venue_id");
        $deleteStmt->execute(['user_id' => $userId, 'venue_id' => $venueId]);
        
        echo json_encode(['status' => 'success', 'action' => 'removed', 'message' => 'Removed from favorites.']);
    } else {
        // 3b. If it does not exist, add it (Like)
        $insertStmt = $conn->prepare("INSERT INTO favorite_venues (user_id, venue_id) VALUES (:user_id, :venue_id)");
        $insertStmt->execute(['user_id' => $userId, 'venue_id' => $venueId]);
        
        echo json_encode(['status' => 'success', 'action' => 'added', 'message' => 'Added to favorites.']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>