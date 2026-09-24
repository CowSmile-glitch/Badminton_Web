<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$userId = $_SESSION['user_id'];

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 1. Get the venue_id for this owner
    $stmt = $conn->prepare("SELECT venue_id FROM venues WHERE owner_id = :user_id LIMIT 1");
    $stmt->execute(['user_id' => $userId]);
    $venue = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$venue) {
        echo json_encode(['status' => 'error', 'message' => 'Venue not found.']);
        exit();
    }
    
    $venueId = $venue['venue_id'];
    $uploadDir = '../uploads/gallery/';
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $uploadedCount = 0;

    // 2. Process multiple files
    if (isset($_FILES['gallery_images'])) {
        $fileCount = count($_FILES['gallery_images']['name']);
        
        for ($i = 0; $i < $fileCount; $i++) {
            if ($_FILES['gallery_images']['error'][$i] === UPLOAD_ERR_OK) {
                $fileExt = pathinfo($_FILES['gallery_images']['name'][$i], PATHINFO_EXTENSION);
                $fileName = 'gal_' . $venueId . '_' . time() . '_' . $i . '.' . $fileExt;
                $targetPath = $uploadDir . $fileName;

                if (move_uploaded_file($_FILES['gallery_images']['tmp_name'][$i], $targetPath)) {
                    $imageUrl = 'uploads/gallery/' . $fileName;
                    
                    // Insert into gallery table
                    $insertStmt = $conn->prepare("INSERT INTO venue_gallery (venue_id, image_url) VALUES (:venue_id, :image_url)");
                    $insertStmt->execute(['venue_id' => $venueId, 'image_url' => $imageUrl]);
                    $uploadedCount++;
                }
            }
        }
    }

    echo json_encode(['status' => 'success', 'message' => "$uploadedCount images uploaded successfully."]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>