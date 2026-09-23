<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

// 1. Ensure the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Please log in first.']);
    exit();
}

$userId = $_SESSION['user_id'];

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 2. Query to get only the venues favorited by the current user
    $query = "
        SELECT 
            v.venue_id, 
            v.name, 
            v.address, 
            v.opening_time, 
            v.closing_time, 
            v.cover_image_url, 
            v.status,
            u.avatar_url AS owner_avatar 
        FROM favorite_venues fv
        JOIN venues v ON fv.venue_id = v.venue_id
        JOIN users u ON v.owner_id = u.user_id
        WHERE fv.user_id = :user_id 
        ORDER BY fv.created_at DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute(['user_id' => $userId]);
    $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $favorites]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>