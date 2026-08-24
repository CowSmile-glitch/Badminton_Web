<?php
session_start();
require_once 'config/DatabaseConnection.php';

header('Content-Type: application/json');

// 1. Check if the user is logged in.
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Bạn chưa đăng nhập hoặc Session đã hết hạn.']);
    exit();
}

// 2. Check if the image file has been uploaded.
if (!isset($_FILES['avatar'])) {
    echo json_encode(['status' => 'error', 'message' => 'No file received: Ảnh quá lớn (vượt quá 2MB) hoặc sai định dạng. Vui lòng chọn ảnh nhỏ hơn!']);
    exit();
}

$userId = $_SESSION['user_id'];
$file = $_FILES['avatar'];

// 3. Check for internal PHP error codes.
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'Upload Error Code: ' . $file['error'] . ' (Nếu mã lỗi là 1, ảnh của bạn vượt quá giới hạn 2MB của máy chủ).']);
    exit();
}

// 4. Image storage processing
$uploadDir = '../frontend/asset/images/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];

if (!in_array($fileExt, $allowedTypes)) {
    echo json_encode(['status' => 'error', 'message' => 'Sai định dạng. Chỉ chấp nhận JPG, PNG, GIF, WEBP, AVIF.']);
    exit();
}

// Create random file names to avoid duplicates.
$fileName = 'avatar_user_' . $userId . '_' . time() . '.' . $fileExt;
$targetFilePath = $uploadDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
    $avatarUrl = 'asset/images/' . $fileName;

    try {
        $db = new DatabaseConnection();
        $conn = $db->getConnection();

        $stmt = $conn->prepare("UPDATE users SET avatar_url = :avatar_url WHERE user_id = :user_id");
        $stmt->execute([
            'avatar_url' => $avatarUrl, 
            'user_id' => $userId
        ]);

        echo json_encode([
            'status' => 'success', 
            'message' => 'Avatar updated successfully!', 
            'avatar_url' => $avatarUrl
        ]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Lỗi Database: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Không thể lưu file vào thư mục asset/images/. Vui lòng kiểm tra quyền truy cập thư mục.']);
}
?>