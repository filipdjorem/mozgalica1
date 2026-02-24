<?php
$host = "localhost";
$db   = "mozg_db";
$user = "root";
$pass = "";

$conn = new mysqli($host, $user, $pass, $db);
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    die("DB connection failed: " . $conn->connect_error);
}