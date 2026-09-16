<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Please log in to complete your booking.']);
    exit();
}

// Map session user to the customer_id field defined in your schema
$customerId = $_SESSION['user_id'];
$courtId = $_POST['court_id'] ?? null;
$date = $_POST['date'] ?? null;
$selectedSlots = json_decode($_POST['slots'] ?? '[]'); 
$totalPrice = $_POST['total_price'] ?? 0;

if (!$courtId || !$date || empty($selectedSlots)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing booking details.']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();
    $conn->beginTransaction();

    foreach ($selectedSlots as $startTimeStr) {
        $startTime = $startTimeStr . ':00';
        $endTimeObj = DateTime::createFromFormat('H:i:s', $startTime);
        $endTimeObj->modify('+1 hour');
        $endTime = $endTimeObj->format('H:i:s');

        // Calculate proportionate price for each slot
        $pricePerSlot = $totalPrice / count($selectedSlots);

        // Insert into the bookings table matching your exact schema structure
        $insertQuery = "
            INSERT INTO bookings (customer_id, court_id, booking_date, start_time, end_time, total_price) 
            VALUES (:customer_id, :court_id, :date, :start_time, :end_time, :price)
        ";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->execute([
            'customer_id' => $customerId,
            'court_id' => $courtId,
            'date' => $date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'price' => $pricePerSlot
        ]);
    }

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Booking successful!']);
} catch (Exception $e) {
    if (isset($conn)) $conn->rollBack();
    // Catch unique constraint violations (Error Code 23000) for double-bookings
    if ($e->getCode() == 23000) {
        echo json_encode(['status' => 'error', 'message' => 'This slot was just booked by another user. Please refresh.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'System error: ' . $e->getMessage()]);
    }
}
?>