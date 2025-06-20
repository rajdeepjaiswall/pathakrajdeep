<?php
/**
 * Database Configuration for Pathak Bhandar PHP API
 */

class Database {
    private $host = "localhost";
    private $db_name = "pathak_bhandar_db";
    private $username = "your_mysql_username";
    private $password = "your_mysql_password";
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>