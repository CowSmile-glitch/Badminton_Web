<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // Check if the user is logged in. If not, use 0 as a default fallback ID.
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 0;

    // Fetch venues and check if the current user has favorited them
    $query = "
        SELECT 
            v.venue_id, 
            v.name, 
            v.address, 
            v.opening_time, 
            v.closing_time, 
            v.cover_image_url, 
            v.status,
            u.avatar_url AS owner_avatar,
            (CASE WHEN fv.venue_id IS NOT NULL THEN 1 ELSE 0 END) AS is_favorited
        FROM venues v
        JOIN users u ON v.owner_id = u.user_id
        LEFT JOIN favorite_venues fv ON v.venue_id = fv.venue_id AND fv.user_id = :user_id
        ORDER BY v.created_at DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute(['user_id' => $userId]);
    $venues = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $venues]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>