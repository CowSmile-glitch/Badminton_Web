<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Please log in to complete your booking.']);
    exit();
}

// Decode JSON payload from JavaScript
$data = json_decode(file_get_contents('php://input'), true);
$customerId = $_SESSION['user_id'];
$date = $data['date'] ?? null;
$selectedSlots = $data['slots'] ?? [];

if (!$date || empty($selectedSlots)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing booking details.']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();
    
    // Start database transaction
    $conn->beginTransaction();

    $insertQuery = "
        INSERT INTO bookings (customer_id, court_id, booking_date, start_time, end_time, total_price) 
        VALUES (:customer_id, :court_id, :date, :start_time, :end_time, :price)
    ";
    $insertStmt = $conn->prepare($insertQuery);

    foreach ($selectedSlots as $slot) {
        $courtId = $slot['courtId'];
        $startTime = $slot['time'] . ':00';
        $price = $slot['price']; 
        
        // Add 30 minutes to determine end_time
        $endTimeObj = DateTime::createFromFormat('H:i:s', $startTime);
        $endTimeObj->modify('+30 minutes');
        $endTime = $endTimeObj->format('H:i:s');

        $insertStmt->execute([
            'customer_id' => $customerId,
            'court_id' => $courtId,
            'date' => $date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'price' => $price
        ]);
    }

    // Commit transaction if all inserts succeed
    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Booking successful!']);
} catch (Exception $e) {
    if (isset($conn)) $conn->rollBack();
    
    // Handle specific MySQL constraint violation (Error Code 23000) for double booking
    if ($e->getCode() == 23000) {
        echo json_encode(['status' => 'error', 'message' => 'One of the selected slots was just booked by another user. Please refresh and try again.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'System error: ' . $e->getMessage()]);
    }
}
?>