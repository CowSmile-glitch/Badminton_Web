<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // Get images for the current user's venue
    $query = "SELECT vg.gallery_id, vg.image_url 
              FROM venue_gallery vg
              JOIN venues v ON vg.venue_id = v.venue_id
              WHERE v.owner_id = :user_id
              ORDER BY vg.created_at DESC";
              
    $stmt = $conn->prepare($query);
    $stmt->execute(['user_id' => $_SESSION['user_id']]);
    
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $images]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>