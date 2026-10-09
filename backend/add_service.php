<?php
session_start();
require_once 'config/DatabaseConnection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$serviceName = $_POST['service_name'] ?? '';
$price = $_POST['price'] ?? '';

if (empty($serviceName) || empty($price)) {
    echo json_encode(['status' => 'error', 'message' => 'Service name and price are required.']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 1. Get the current user's venue ID
    $stmt = $conn->prepare("SELECT venue_id FROM venues WHERE owner_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $_SESSION['user_id']]);
    $venue = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($venue) {
        // 2. Insert new service
        $insert = $conn->prepare("INSERT INTO venue_services (venue_id, service_name, price) VALUES (:venue_id, :name, :price)");
        $insert->execute([
            'venue_id' => $venue['venue_id'],
            'name' => trim($serviceName),
            'price' => trim($price)
        ]);
        echo json_encode(['status' => 'success', 'message' => 'Service added successfully.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Venue not found.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>