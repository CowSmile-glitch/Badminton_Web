<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

// 1. Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access.']);
    exit();
}

$userId = $_SESSION['user_id'];

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 2. Fetch the venue image URL to delete the physical file (Optional but recommended)
    $stmt = $conn->prepare("SELECT cover_image_url FROM venues WHERE owner_id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $venue = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($venue) {
        // 3. Delete the venue from the database
        // Note: Make sure your database tables (like courts, bookings) have ON DELETE CASCADE
        // so that deleting a venue automatically deletes its related courts.
        $deleteQuery = "DELETE FROM venues WHERE owner_id = :user_id";
        $deleteStmt = $conn->prepare($deleteQuery);
        $deleteStmt->execute(['user_id' => $userId]);

        // 4. Delete the physical image file if it exists
        if (!empty($venue['cover_image_url']) && file_exists('../' . $venue['cover_image_url'])) {
            unlink('../' . $venue['cover_image_url']);
        }

        echo json_encode(['status' => 'success', 'message' => 'Venue deleted successfully.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Venue not found.']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>