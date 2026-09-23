<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

// 1. Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'unauthorized', 'message' => 'Please login first.']);
    exit();
}

$userId = $_SESSION['user_id'];

// 2. Check Role (Assuming role_id = 2 is Vendor/Owner)
// If they are a normal user (e.g., role_id = 3), block them immediately
if (!isset($_SESSION['role_id']) || $_SESSION['role_id'] != 2) {
    echo json_encode(['status' => 'forbidden', 'message' => 'Access denied. Only vendors can manage venues.']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 3. Check if this vendor has already created a venue
    // Using cover_image_url as per your database structure
    // Cập nhật câu lệnh SELECT
    $query = "SELECT name, address, opening_time, closing_time, cover_image_url, status, description, rules FROM venues WHERE owner_id = :user_id LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->execute(['user_id' => $userId]);
    
    $venue = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($venue) {
        // Condition A: Vendor already has a venue -> Send data to display
        $venue['opening_time'] = substr($venue['opening_time'], 0, 5);
        $venue['closing_time'] = substr($venue['closing_time'], 0, 5);
        echo json_encode(['status' => 'success', 'data' => $venue]);
    } else {
        // Condition B: Vendor exists but has NO venue -> Tell JS to redirect to create_venue.html
        echo json_encode(['status' => 'no_venue', 'message' => 'No venue found. Please create one.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>