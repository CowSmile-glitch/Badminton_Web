<?php
// Start the session to keep the user logged in across different pages
session_start();

// Include the database connection class
require_once 'config/DatabaseConnection.php';

// Set header to JSON to communicate with the frontend AJAX fetch
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    try {
        // 1. Prepare SQL to find the user by email
        $sql = "SELECT user_id, full_name, password_hash, role_id FROM users WHERE email = :email";
        $stmt = $conn->prepare($sql);
        $stmt->execute(['email' => $email]);
        
        // Fetch the user record
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // 2. Verify if user exists AND the password matches the hashed password
        if ($user && password_verify($password, $user['password_hash'])) {
            
            // 3. Password is correct. Store user data in Session variables
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['role_id'] = $user['role_id'];

            // Return success response to frontend
            echo json_encode([
                "status" => "success", 
                "message" => "Login successful!",
                "role_id" => $user['role_id'] // Passing role_id to redirect accordingly
            ]);

        } else {
            // Return error response if email or password is wrong
            echo json_encode([
                "status" => "error", 
                "message" => "Invalid email or password. Please try again."
            ]);
        }

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>