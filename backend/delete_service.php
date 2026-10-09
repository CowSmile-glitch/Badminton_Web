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

if (empty($name) || empty($address) || empty($openingTime) || empty($closingTime)) {
    echo json_encode(['status' => 'error', 'message' => 'All mandatory text fields are required.']);
    exit();
}

try {
    $db = new DatabaseConnection();
    $conn = $db->getConnection();

    // 1. LẤY DỮ LIỆU CŨ ĐỂ DỰ PHÒNG NẾU NGƯỜI DÙNG ĐỂ TRỐNG
    $getCurrentQuery = "SELECT description, rules, time_slot_1, price_1, time_slot_2, price_2 FROM venues WHERE owner_id = :user_id";
    $getCurrentStmt = $conn->prepare($getCurrentQuery);
    $getCurrentStmt->execute(['user_id' => $userId]);
    $currentVenue = $getCurrentStmt->fetch(PDO::FETCH_ASSOC);

    // 2. GÁN DỮ LIỆU MỚI HOẶC GIỮ LẠI DỮ LIỆU CŨ
    $description = (!empty(trim($_POST['description'] ?? ''))) ? trim($_POST['description']) : $currentVenue['description'];
    $rules = (!empty(trim($_POST['rules'] ?? ''))) ? trim($_POST['rules']) : $currentVenue['rules'];
    
    $timeSlot1 = (!empty(trim($_POST['time_slot_1'] ?? ''))) ? trim($_POST['time_slot_1']) : $currentVenue['time_slot_1'];
    $price1 = (!empty(trim($_POST['price_1'] ?? ''))) ? trim($_POST['price_1']) : $currentVenue['price_1'];
    $timeSlot2 = (!empty(trim($_POST['time_slot_2'] ?? ''))) ? trim($_POST['time_slot_2']) : $currentVenue['time_slot_2'];
    $price2 = (!empty(trim($_POST['price_2'] ?? ''))) ? trim($_POST['price_2']) : $currentVenue['price_2'];

    // 3. XỬ LÝ ẢNH UPLOAD (NẾU CÓ)
    $imageUrl = null;
    if (isset($_FILES['venue_image']) && $_FILES['venue_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/venues/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $fileExtension = pathinfo($_FILES['venue_image']['name'], PATHINFO_EXTENSION);
        $fileName = 'venue_' . $userId . '_' . time() . '.' . $fileExtension;
        $targetFilePath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['venue_image']['tmp_name'], $targetFilePath)) {
            $imageUrl = 'uploads/venues/' . $fileName;
        }
    }

    // 4. LƯU VÀO DATABASE
    $params = [
        'name' => $name,
        'address' => $address,
        'opening_time' => $openingTime,
        'closing_time' => $closingTime,
        'description' => $description,
        'rules' => $rules,
        'time_slot_1' => $timeSlot1,
        'price_1' => $price1,
        'time_slot_2' => $timeSlot2,
        'price_2' => $price2,
        'user_id' => $userId
    ];

    if ($imageUrl) {
        $query = "UPDATE venues 
                  SET name = :name, address = :address, opening_time = :opening_time, closing_time = :closing_time, 
                      cover_image_url = :cover_image_url, description = :description, rules = :rules,
                      time_slot_1 = :time_slot_1, price_1 = :price_1, time_slot_2 = :time_slot_2, price_2 = :price_2
                  WHERE owner_id = :user_id";
        $params['cover_image_url'] = $imageUrl; 
    } else {
        $query = "UPDATE venues 
                  SET name = :name, address = :address, opening_time = :opening_time, closing_time = :closing_time, 
                      description = :description, rules = :rules,
                      time_slot_1 = :time_slot_1, price_1 = :price_1, time_slot_2 = :time_slot_2, price_2 = :price_2
                  WHERE owner_id = :user_id";
    }

    $stmt = $conn->prepare($query);
    $stmt->execute($params);

    echo json_encode(['status' => 'success', 'message' => 'Venue updated successfully.']);
    
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>