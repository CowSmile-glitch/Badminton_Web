<?php
session_start();
// Include the database connection class
require_once 'config/DatabaseConnection.php';

// Set header to JSON
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Please log in first.']);
    exit();
}

$userId = $_SESSION['user_id'];
$db = new DatabaseConnection();
$conn = $db->getConnection();

try {
    // Prepare SQL statement to fetch user details
    $sql = "SELECT full_name, email, phone_number as phone_number, gender, avatar_url FROM users WHERE user_id = :user_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute(['user_id' => $userId]);
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // Return user data to frontend
        echo json_encode([
            'status' => 'success', 
            'user' => $user
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'User record not found.']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>