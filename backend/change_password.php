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
    
    $currentPassword = $_POST['currentPassword'] ?? '';
    $newPassword = $_POST['newPassword'] ?? '';
    $confirmNewPassword = $_POST['confirmNewPassword'] ?? '';

    // 1. Basic validation
    if (empty($currentPassword) || empty($newPassword) || empty($confirmNewPassword)) {
        echo json_encode(['status' => 'error', 'message' => 'All password fields are required.']);
        exit();
    }

    if ($newPassword !== $confirmNewPassword) {
        echo json_encode(['status' => 'error', 'message' => 'New passwords do not match.']);
        exit();
    }

    if (strlen($newPassword) < 6) {
        echo json_encode(['status' => 'error', 'message' => 'New password must be at least 6 characters.']);
        exit();
    }

    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    try {
        // 2. Fetch the current hashed password from the database
        $sql = "SELECT password_hash FROM users WHERE user_id = :user_id";
        $stmt = $conn->prepare($sql);
        $stmt->execute(['user_id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            echo json_encode(['status' => 'error', 'message' => 'User not found in system.']);
            exit();
        }

        // 3. Verify the current password
        if (!password_verify($currentPassword, $user['password_hash'])) {
            echo json_encode(['status' => 'error', 'message' => 'Incorrect current password.']);
            exit();
        }

        // 4. Hash the new password for security
        $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);

        // 5. Update the password in the database
        $updateSql = "UPDATE users SET password_hash = :new_password_hash WHERE user_id = :user_id";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->execute([
            'new_password_hash' => $newPasswordHash,
            'user_id' => $userId
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Password changed successfully!']);

    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
}
?>