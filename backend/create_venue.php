<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

class VenueManager {
    private $conn;
    private $userId;

    public function __construct($db, $userId) {
        $this->conn = $db->getConnection();
        $this->userId = $userId;
    }

    // The upload handling function represents the image for the database.
    public function handleFileUpload($fileInputName) {
        if (isset($_FILES[$fileInputName]) && $_FILES[$fileInputName]['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../frontend/asset/images/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileName = time() . '_venue_' . basename($_FILES[$fileInputName]['name']);
            $targetFilePath = $uploadDir . $fileName;
            $fileType = pathinfo($targetFilePath, PATHINFO_EXTENSION);
            
            $allowTypes = array('jpg', 'png', 'jpeg', 'gif', 'avif', 'webp');
            if (in_array(strtolower($fileType), $allowTypes)) {
                if (move_uploaded_file($_FILES[$fileInputName]['tmp_name'], $targetFilePath)) {
                    return 'asset/images/' . $fileName; 
                }
            }
        }
        return null;
    }

    public function createVenue($name, $address, $openTime, $closeTime, $coverImage) {
        try {
            // Check if the owner of this property has already established any facilities.
            $checkStmt = $this->conn->prepare("SELECT venue_id FROM venues WHERE owner_id = :owner_id");
            $checkStmt->execute(['owner_id' => $this->userId]);
            
            if ($checkStmt->rowCount() > 0) {
                echo json_encode(['status' => 'error', 'message' => 'You already have a registered venue!']);
                return;
            }

            // Add a new facility.
            $stmt = $this->conn->prepare("INSERT INTO venues (owner_id, name, address, opening_time, closing_time, cover_image_url, status) VALUES (:owner_id, :name, :address, :opening_time, :closing_time, :cover_image_url, 'active')");
            $stmt->execute([
                'owner_id' => $this->userId,
                'name' => $name,
                'address' => $address,
                'opening_time' => $openTime,
                'closing_time' => $closeTime,
                'cover_image_url' => $coverImage
            ]);
            
            echo json_encode(['status' => 'success', 'message' => 'Venue created successfully! Redirecting to dashboard...']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
        }
    }
}

// Permission check: Only Owner (2) or Admin (3) can be created
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role_id'], [2, 3])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized Access. Only Owners can create venues.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $db = new DatabaseConnection();
    $manager = new VenueManager($db, $_SESSION['user_id']);

    $name = trim($_POST['venue_name'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $openTime = $_POST['opening_time'] ?? '05:00';
    $closeTime = $_POST['closing_time'] ?? '22:00';
    
    if (empty($name) || empty($address)) {
        echo json_encode(['status' => 'error', 'message' => 'Venue Name and Address are required.']);
        exit();
    }

    $coverImage = $manager->handleFileUpload('cover_image');
    $manager->createVenue($name, $address, $openTime, $closeTime, $coverImage);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
}
?>