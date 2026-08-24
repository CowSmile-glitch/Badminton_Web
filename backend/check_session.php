<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    try {
        $db = new DatabaseConnection();
        $conn = $db->getConnection();
        
        // Query to retrieve Avatar and Name from the users table.
        $stmt = $conn->prepare("SELECT full_name, role_id, avatar_url FROM users WHERE user_id = :id");
        $stmt->execute(['id' => $_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode([
                'status' => 'success',
                'is_logged_in' => true,
                'user_id' => $_SESSION['user_id'],
                'role_id' => $user['role_id'],
                'full_name' => $user['full_name'],
                'avatar_url' => $user['avatar_url'] //  Return image path
            ]);
        } else {
            echo json_encode(['status' => 'error', 'is_logged_in' => false, 'message' => 'User not found.']);
        }
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'is_logged_in' => false, 'message' => 'Database Error.']);
    }
} else {
    echo json_encode(['status' => 'success', 'is_logged_in' => false]);
}
?>