<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

$userId = $_SESSION['user_id'] ?? null;
$roleId = $_SESSION['role_id'] ?? null;
// Get venue ID from URL parameters (e.g., my_venue.html?id=5)
$requestedVenueId = $_GET['id'] ?? null;

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    $venue = null;
    $isOwner = false;

    if ($requestedVenueId) {
        // CASE 1: Guest or User viewing a specific venue via ID from venues.html
        $query = "SELECT venue_id, owner_id, name, address, opening_time, closing_time, cover_image_url, status, description, rules, time_slot_1, price_1, time_slot_2, price_2 
                  FROM venues 
                  WHERE venue_id = :venue_id LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->execute(['venue_id' => $requestedVenueId]);
        $venue = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if the current logged-in user is actually the owner of this requested venue
        if ($venue && $userId == $venue['owner_id']) {
            $isOwner = true;
        }
    } else {
        // CASE 2: Vendor accessing their own dashboard (original logic)
        if (!$userId) {
            echo json_encode(['status' => 'unauthorized', 'message' => 'Please login first.']);
            exit();
        }
        if ($roleId != 2) {
            echo json_encode(['status' => 'forbidden', 'message' => 'Access denied. Only vendors can manage venues.']);
            exit();
        }

        $query = "SELECT venue_id, owner_id, name, address, opening_time, closing_time, cover_image_url, status, description, rules, time_slot_1, price_1, time_slot_2, price_2 
                  FROM venues 
                  WHERE owner_id = :user_id LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        $venue = $stmt->fetch(PDO::FETCH_ASSOC);
        $isOwner = true;
    }

    if ($venue) {
        // Format time strings
        $venue['opening_time'] = substr($venue['opening_time'], 0, 5);
        $venue['closing_time'] = substr($venue['closing_time'], 0, 5);
        // Return data along with the is_owner flag to control frontend UI
        echo json_encode(['status' => 'success', 'data' => $venue, 'is_owner' => $isOwner]);
    } else {
        echo json_encode(['status' => 'no_venue', 'message' => 'No venue found. Please create one.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>