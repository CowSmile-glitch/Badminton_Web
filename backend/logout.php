<?php
session_start();
// Remove all session variables and destroy the session
session_unset();
session_destroy();

header('Content-Type: application/json');
echo json_encode(["status" => "success", "message" => "Logged out successfully."]);
?>