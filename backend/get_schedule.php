<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

$venueId = $_GET['venue_id'] ?? 1; 
$date = $_GET['date'] ?? date('Y-m-d');

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 1. Fetch all available courts for this venue
    $stmtCourts = $conn->prepare("SELECT court_id, court_name, price_per_hour FROM courts WHERE venue_id = :venue_id AND status = 'available'");
    $stmtCourts->execute(['venue_id' => $venueId]);
    $courts = $stmtCourts->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch all active bookings for these courts on the selected date
    $stmtBookings = $conn->prepare("
        SELECT b.court_id, b.start_time, b.end_time 
        FROM bookings b 
        JOIN courts c ON b.court_id = c.court_id 
        WHERE c.venue_id = :venue_id AND b.booking_date = :date AND b.status != 'cancelled'
    ");
    $stmtBookings->execute(['venue_id' => $venueId, 'date' => $date]);
    $bookings = $stmtBookings->fetchAll(PDO::FETCH_ASSOC);

    // 3. Process bookings into 30-minute block strings (e.g., "1_07:30")
    $bookedSlots = [];
    foreach ($bookings as $b) {
        $current = strtotime($b['start_time']);
        $end = strtotime($b['end_time']);
        
        while ($current < $end) {
            $timeStr = date('H:i', $current);
            $bookedSlots[] = $b['court_id'] . '_' . $timeStr;
            $current += 1800; // Add 30 minutes (1800 seconds)
        }
    }

    echo json_encode([
        'status' => 'success', 
        'courts' => $courts,
        'booked_slots' => $bookedSlots
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>