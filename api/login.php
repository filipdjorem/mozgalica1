<?php
session_start();
header("Content-Type: application/json; charset=utf-8");
require __DIR__ . "/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data["email"] ?? "");
$pass  = $data["password"] ?? "";

if ($email === "" || $pass === "") {
  http_response_code(400);
  echo json_encode(["error" => "Unesi email i šifru."]);
  exit;
}

$st = $conn->prepare("SELECT korisnik_id, ime_prezime, email, sifra_hash, uloga_id, aktivan
                      FROM korisnik WHERE email=?");
$st->bind_param("s", $email);
$st->execute();
$res  = $st->get_result();
$user = $res ? $res->fetch_assoc() : null;

if (!$user) {
  http_response_code(401);
  echo json_encode(["error" => "Pogrešan email ili šifra."]);
  exit;
}

if ((int)$user["aktivan"] !== 1) {
  http_response_code(403);
  echo json_encode(["error" => "Nalog nije aktivan."]);
  exit;
}

if (!password_verify($pass, $user["sifra_hash"])) {
  http_response_code(401);
  echo json_encode(["error" => "Pogrešan email ili šifra."]);
  exit;
}

$_SESSION["user"] = [
  "id" => (int)$user["korisnik_id"],
  "name" => $user["ime_prezime"],
  "email" => $user["email"],
  "roleId" => (int)$user["uloga_id"]
];

echo json_encode(["ok" => true, "user" => $_SESSION["user"]]);