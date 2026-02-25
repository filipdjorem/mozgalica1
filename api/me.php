<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

if (!isset($_SESSION["user"])) {
  http_response_code(401);
  echo json_encode(["loggedIn" => false]);
  exit;
}
echo json_encode(["loggedIn" => true, "user" => $_SESSION["user"]]);