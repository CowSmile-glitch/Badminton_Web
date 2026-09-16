<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

$courtId = $_GET['court_id'] ?? null;
$date = $_GET['date'] ?? date('Y-m-d');

if (!$courtId) {
    echo json_encode(['status' => 'error', 'message' => 'Court ID is required.']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // Fetch active bookings for this specific court and date
    $query = "SELECT start_time FROM bookings WHERE court_id = :court_id AND booking_date = :date AND status != 'cancelled'";
    $stmt = $conn->prepare($query);
    $stmt->execute(['court_id' => $courtId, 'date' => $date]);
    
    $bookedSlots = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $bookedSlots[] = substr($row['start_time'], 0, 5);
    }

    echo json_encode(['status' => 'success', 'booked_slots' => $bookedSlots]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>