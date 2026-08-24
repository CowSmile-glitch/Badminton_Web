<?php
/**
 * Class DatabaseConnection
 * Handles the connection to the MySQL database.
 */
class DatabaseConnection {
    // Database credentials
    private $host = "localhost";
    private $db_name = "badminton_booking_db";
    private $username = "root";
    private $password = "123456";
    
    // Connection instance
    public $conn;

    /**
     * Establishes and returns the database connection.
     * * @return PDO|null Returns the PDO connection object, or null if it fails.
     */
    public function getConnection() {
        $this->conn = null;

        try {
            // Create a new PDO instance
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            
            // Set error mode to exception to handle errors properly
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Set character set to UTF-8
            $this->conn->exec("set names utf8mb4");
            
        } catch(PDOException $exception) {
            // Output error message if connection fails
            echo "Database connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>