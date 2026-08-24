<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access. Please log in first.']);
    exit();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $userId = $_SESSION['user_id'];
    
    // Retrieve POST data safely
    $fullName = trim($_POST['fullName'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $gender = $_POST['gender'] ?? 'Other';

    // Basic validation
    if (empty($fullName)) {
        echo json_encode(['status' => 'error', 'message' => 'Full Name cannot be empty.']);
        exit();
    }

    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    try {
        // Prepare SQL statement to update user profile
        $sql = "UPDATE users SET full_name = :full_name, phone_number = :phone, gender = :gender WHERE user_id = :user_id";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            'full_name' => $fullName,
            'phone' => $phone,
            'gender' => $gender,
            'user_id' => $userId
        ]);

        // Update session variable so the Navbar reflects the new name immediately
        $_SESSION['full_name'] = $fullName;

        echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully!']);

    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
}
?>