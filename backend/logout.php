<?php
// backend/logout.php
session_start();

// Unset all of the session variables
$_SESSION = array();

// Destroy the session completely
session_destroy();

// Redirect the user back to the homepage in the frontend folder
header("Location: ../frontend/index.html");
exit();
?>