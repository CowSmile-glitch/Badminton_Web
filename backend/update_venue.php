<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access.']);
    exit();
}

$userId = $_SESSION['user_id'];
$name = $_POST['name'] ?? '';
$address = $_POST['address'] ?? '';
$openingTime = $_POST['opening_time'] ?? '';
$closingTime = $_POST['closing_time'] ?? '';

// Check mandatory text fields
if (empty($name) || empty($address) || empty($openingTime) || empty($closingTime)) {
    echo json_encode(['status' => 'error', 'message' => 'All mandatory fields are required.']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // ================= 1. PRESERVE EXISTING DATA =================
    // Fetch current data to keep it safe if the user leaves inputs empty
    $getCurrentQuery = "SELECT description, rules FROM venues WHERE owner_id = :user_id";
    $getCurrentStmt = $conn->prepare($getCurrentQuery);
    $getCurrentStmt->execute(['user_id' => $userId]);
    $currentVenue = $getCurrentStmt->fetch(PDO::FETCH_ASSOC);

    // If POST is empty or just spaces, use the old data from database. Otherwise, use new data.
    $description = (!empty(trim($_POST['description'] ?? ''))) 
                   ? trim($_POST['description']) 
                   : $currentVenue['description'];

    $rules = (!empty(trim($_POST['rules'] ?? ''))) 
             ? trim($_POST['rules']) 
             : $currentVenue['rules'];

    // ================= 2. HANDLE IMAGE UPLOAD =================
    $imageUrl = null;
    if (isset($_FILES['venue_image']) && $_FILES['venue_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/venues/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileExtension = pathinfo($_FILES['venue_image']['name'], PATHINFO_EXTENSION);
        $fileName = 'venue_' . $userId . '_' . time() . '.' . $fileExtension;
        $targetFilePath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['venue_image']['tmp_name'], $targetFilePath)) {
            $imageUrl = 'uploads/venues/' . $fileName;
        }
    }

    // ================= 3. UPDATE DATABASE =================
    if ($imageUrl) {
        // FIXED: Now updates description and rules even when an image is uploaded
        $query = "UPDATE venues 
                  SET name = :name, 
                      address = :address, 
                      opening_time = :opening_time, 
                      closing_time = :closing_time, 
                      cover_image_url = :cover_image_url,
                      description = :description,
                      rules = :rules
                  WHERE owner_id = :user_id";
                  
        $stmt = $conn->prepare($query);
        $stmt->execute([
            'name' => $name,
            'address' => $address,
            'opening_time' => $openingTime,
            'closing_time' => $closingTime,
            'cover_image_url' => $imageUrl,
            'description' => $description,
            'rules' => $rules,
            'user_id' => $userId
        ]);
    } else {
        // Updates text fields only if no image is provided
        $query = "UPDATE venues 
                  SET name = :name, 
                      address = :address, 
                      opening_time = :opening_time, 
                      closing_time = :closing_time, 
                      description = :description, 
                      rules = :rules 
                  WHERE owner_id = :user_id";

        $stmt = $conn->prepare($query);
        $stmt->execute([
            'name' => $name,
            'address' => $address,
            'opening_time' => $openingTime,
            'closing_time' => $closingTime,
            'description' => $description,
            'rules' => $rules,
            'user_id' => $userId
        ]);
    }

    echo json_encode(['status' => 'success', 'message' => 'Venue updated successfully.']);
    
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>