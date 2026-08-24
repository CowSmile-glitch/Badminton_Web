<?php
// Include the database connection class
require_once 'config/DatabaseConnection.php';

// Set header to JSON because we will communicate with AJAX
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $fullName = $_POST['fullName'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $password = $_POST['password'];
    $roleName = $_POST['role']; // 'customer' or 'owner'

    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    try {
        // 1. Get role_id based on role_name (assuming you have roles in the table)
        $roleSql = "SELECT role_id FROM roles WHERE role_name = :role_name";
        $stmtRole = $conn->prepare($roleSql);
        $stmtRole->execute(['role_name' => $roleName]);
        $role = $stmtRole->fetch(PDO::FETCH_ASSOC);

        // 2. Hash the password for security
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // 3. Insert user into users table
        $sql = "INSERT INTO users (role_id, full_name, email, phone_number, password_hash) 
                VALUES (:role_id, :full_name, :email, :phone, :password_hash)";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            'role_id' => $role['role_id'],
            'full_name' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'password_hash' => $passwordHash
        ]);

        echo json_encode(["status" => "success", "message" => "Registration successful!"]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
}
?>