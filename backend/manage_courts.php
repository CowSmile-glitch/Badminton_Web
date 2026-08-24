<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

class CourtManager {
    private $conn;
    private $ownerId;
    private $venueId;

    public function __construct($db, $ownerId) {
        $this->conn = $db->getConnection();
        $this->ownerId = $ownerId;
        $this->setVenueId();
    }

    private function setVenueId() {
        $stmt = $this->conn->prepare("SELECT venue_id FROM venues WHERE owner_id = :owner_id LIMIT 1");
        $stmt->execute(['owner_id' => $this->ownerId]);
        $venue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$venue) {
            echo json_encode(['status' => 'error', 'message' => 'No venue registered for this owner account.']);
            exit();
        }
        $this->venueId = $venue['venue_id'];
    }

    // Image upload processing function
    public function handleFileUpload($fileInputName) {
        if (isset($_FILES[$fileInputName]) && $_FILES[$fileInputName]['error'] === UPLOAD_ERR_OK) {
            // The actual file save path on the server
            $uploadDir = '../frontend/asset/images/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileName = time() . '_' . basename($_FILES[$fileInputName]['name']);
            $targetFilePath = $uploadDir . $fileName;
            $fileType = pathinfo($targetFilePath, PATHINFO_EXTENSION);
            
            // Allowed formats
            $allowTypes = array('jpg', 'png', 'jpeg', 'gif', 'avif', 'webp');
            
            if (in_array(strtolower($fileType), $allowTypes)) {
                if (move_uploaded_file($_FILES[$fileInputName]['tmp_name'], $targetFilePath)) {
                    // Returns a relative path to save to the database (For frontend use)
                    return 'asset/images/' . $fileName; 
                }
            }
        }
        return null;
    }

    public function fetchCourts() {
        $stmt = $this->conn->prepare("SELECT * FROM courts WHERE venue_id = :venue_id ORDER BY court_id DESC");
        $stmt->execute(['venue_id' => $this->venueId]);
        $courts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $courts]);
    }

    public function addCourt($name, $price, $imageUrl) {
        $stmt = $this->conn->prepare("INSERT INTO courts (venue_id, court_name, price_per_hour, status, image_url) VALUES (:venue_id, :name, :price, 'available', :image_url)");
        $stmt->execute([
            'venue_id' => $this->venueId, 
            'name' => $name, 
            'price' => $price,
            'image_url' => $imageUrl
        ]);
        echo json_encode(['status' => 'success', 'message' => 'Court added successfully!']);
    }

    public function updateCourt($courtId, $name, $price, $status, $imageUrl) {
        // If the user uploads a new photo, update the photo; otherwise, keep the old photo.
        if ($imageUrl) {
            $stmt = $this->conn->prepare("UPDATE courts SET court_name = :name, price_per_hour = :price, status = :status, image_url = :image_url WHERE court_id = :court_id AND venue_id = :venue_id");
            $stmt->execute([
                'name' => $name, 'price' => $price, 'status' => $status, 'image_url' => $imageUrl,
                'court_id' => $courtId, 'venue_id' => $this->venueId
            ]);
        } else {
            $stmt = $this->conn->prepare("UPDATE courts SET court_name = :name, price_per_hour = :price, status = :status WHERE court_id = :court_id AND venue_id = :venue_id");
            $stmt->execute([
                'name' => $name, 'price' => $price, 'status' => $status, 
                'court_id' => $courtId, 'venue_id' => $this->venueId
            ]);
        }
        
        echo json_encode(['status' => 'success', 'message' => 'Court updated successfully!']);
    }

    public function deleteCourt($courtId) {
        $stmt = $this->conn->prepare("DELETE FROM courts WHERE court_id = :court_id AND venue_id = :venue_id");
        $stmt->execute(['court_id' => $courtId, 'venue_id' => $this->venueId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['status' => 'success', 'message' => 'Court deleted successfully!']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Delete failed. Permission denied.']);
        }
    }
}

// 1. Check access permissions.
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 2) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized Access. Owners only.']);
    exit();
}

$db = new DatabaseConnection();
$manager = new CourtManager($db, $_SESSION['user_id']);

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// 2. Functional Navigation
try {
    switch ($action) {
        case 'fetch':
            $manager->fetchCourts();
            break;
        case 'add':
            $imageUrl = $manager->handleFileUpload('court_image');
            $manager->addCourt(trim($_POST['court_name']), floatval($_POST['price_per_hour']), $imageUrl);
            break;
        case 'edit':
            $imageUrl = $manager->handleFileUpload('court_image');
            $manager->updateCourt(intval($_POST['court_id']), trim($_POST['court_name']), floatval($_POST['price_per_hour']), $_POST['status'], $imageUrl);
            break;
        case 'delete':
            $manager->deleteCourt(intval($_POST['court_id']));
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>