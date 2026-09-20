<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Please log in first.']);
    exit();
}

$userId = $_SESSION['user_id'];

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 1. Fetch all bookings. 
    // IMPORTANT: We order by Date DESC, Court ASC, and Start Time ASC to make merging chronological slots possible.
    $query = "
        SELECT 
            b.booking_id, 
            b.court_id,
            v.name AS venue_name, 
            c.court_name, 
            b.booking_date, 
            b.start_time, 
            b.end_time, 
            b.total_price, 
            b.status,
            b.created_at
        FROM bookings b
        JOIN courts c ON b.court_id = c.court_id
        JOIN venues v ON c.venue_id = v.venue_id
        WHERE b.customer_id = :user_id
        ORDER BY b.booking_date DESC, b.court_id ASC, b.start_time ASC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute(['user_id' => $userId]);
    $rawBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Algorithm to merge continuous time slots
    $mergedBookings = [];
    $currentBooking = null;

    foreach ($rawBookings as $b) {
        // If it's the first iteration, set the current booking
        if ($currentBooking === null) {
            $currentBooking = $b;
            continue;
        }

        // Check if the current slot directly follows the previous slot
        // Must be exactly the same Date, same Court, same Status, and contiguous Time
        if (
            $b['booking_date'] === $currentBooking['booking_date'] &&
            $b['court_id'] === $currentBooking['court_id'] &&
            $b['status'] === $currentBooking['status'] &&
            $b['start_time'] === $currentBooking['end_time']
        ) {
            // MERGE: Extend the end time and sum up the total price
            $currentBooking['end_time'] = $b['end_time'];
            $currentBooking['total_price'] += $b['total_price'];
        } else {
            // PUSH & RESET: No longer contiguous, save the grouped booking and start a new one
            $mergedBookings[] = $currentBooking;
            $currentBooking = $b;
        }
    }

    // Push the very last grouped booking into the array
    if ($currentBooking !== null) {
        $mergedBookings[] = $currentBooking;
    }

    // 3. (Optional) Re-sort the final merged array so the absolute newest booking blocks are at the top
    usort($mergedBookings, function($a, $b) {
        if ($a['booking_date'] === $b['booking_date']) {
            return strcmp($b['start_time'], $a['start_time']); // Descending time
        }
        return strcmp($b['booking_date'], $a['booking_date']); // Descending date
    });

    echo json_encode(['status' => 'success', 'data' => $mergedBookings]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>