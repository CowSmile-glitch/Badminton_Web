<?php
session_start();
require_once 'config/DatabaseConnection.php';
header('Content-Type: application/json');

// Get venue ID from URL if provided
$venueId = $_GET['venue_id'] ?? null;

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    if ($venueId) {
        // Fetch services for a specific venue (Guest View)
        $query = "SELECT id, service_name, price FROM venue_services WHERE venue_id = :venue_id ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute(['venue_id' => $venueId]);
    } else {
        // Original logic: Fetch services for the logged-in vendor
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
            exit();
        }
        $query = "SELECT vs.id, vs.service_name, vs.price 
                  FROM venue_services vs
                  JOIN venues v ON vs.venue_id = v.venue_id
                  WHERE v.owner_id = :user_id
                  ORDER BY vs.created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute(['user_id' => $_SESSION['user_id']]);
    }
    
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'data' => $services]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>