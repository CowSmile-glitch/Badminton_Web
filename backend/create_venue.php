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

// 1. Kiểm tra các trường văn bản
if (empty($name) || empty($address) || empty($openingTime) || empty($closingTime)) {
    echo json_encode(['status' => 'error', 'message' => 'All text fields are required.']);
    exit();
}

// 2. KIỂM TRA BẮT BUỘC PHẢI CÓ ẢNH TRUYỀN LÊN TỪ FORM
if (!isset($_FILES['venue_image']) || $_FILES['venue_image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'Upload failed! Please make sure your file input has name="venue_image".']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 3. Xử lý lưu ảnh vào thư mục uploads/venues/
    $uploadDir = '../uploads/venues/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileExtension = pathinfo($_FILES['venue_image']['name'], PATHINFO_EXTENSION);
    $fileName = 'venue_' . $userId . '_' . time() . '.' . $fileExtension;
    $targetFilePath = $uploadDir . $fileName;

    $imageUrl = null;
    if (move_uploaded_file($_FILES['venue_image']['tmp_name'], $targetFilePath)) {
        // Lưu đường dẫn chuẩn vào biến
        $imageUrl = 'uploads/venues/' . $fileName;
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to save the uploaded image to the server folder.']);
        exit();
    }

    // 4. Lưu toàn bộ dữ liệu (cùng đường dẫn ảnh) vào Database
    $query = "INSERT INTO venues (owner_id, name, address, opening_time, closing_time, cover_image_url, status) 
              VALUES (:user_id, :name, :address, :opening_time, :closing_time, :cover_image_url, 'active')";
              
    $stmt = $conn->prepare($query);
    $stmt->execute([
        'user_id' => $userId,
        'name' => $name,
        'address' => $address,
        'opening_time' => $openingTime,
        'closing_time' => $closingTime,
        'cover_image_url' => $imageUrl
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Venue created successfully with image!']);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>