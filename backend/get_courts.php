<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

$venueId = $_GET['venue_id'] ?? null;

if (!$venueId) {
    echo json_encode(['status' => 'error', 'message' => 'Venue ID is required.']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    $query = "SELECT court_id, court_name, price_per_hour FROM courts WHERE venue_id = :venue_id AND status = 'available'";
    $stmt = $conn->prepare($query);
    $stmt->execute(['venue_id' => $venueId]);
    $courts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $courts]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>