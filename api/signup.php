<?php
header("Content-Type: application/json; charset=utf-8");
require __DIR__ . "/db.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data["username"] ?? "");
$email    = trim($data["email"] ?? "");
$pass     = $data["password"] ?? "";
$pass2    = $data["confirmPassword"] ?? "";
$role     = $data["role"] ?? "IGRAC"; // "VLASNIK" ili "IGRAC"

if ($username === "" || $email === "" || $pass === "" || $pass2 === "") {
  http_response_code(400);
  echo json_encode(["error" => "Popuni sva polja."]);
  exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(["error" => "Neispravan email."]);
  exit;
}
if ($pass !== $pass2) {
  http_response_code(400);
  echo json_encode(["error" => "Šifre se ne poklapaju."]);
  exit;
}

// mapiranje uloga -> uloga_id (prilagodi ako su ti drugačiji ID-evi)
$roleToId = ["VLASNIK" => 2, "IGRAC" => 3];
$uloga_id = $roleToId[$role] ?? 3;

$hash = password_hash($pass, PASSWORD_BCRYPT);

// provjera email-a
$st = $conn->prepare("SELECT korisnik_id FROM korisnik WHERE email=?");
$st->bind_param("s", $email);
$st->execute();
$res = $st->get_result();
if ($res && $res->num_rows > 0) {
  http_response_code(409);
  echo json_encode(["error" => "Email već postoji."]);
  exit;
}

// insert
$ins = $conn->prepare("INSERT INTO korisnik (ime_prezime, email, sifra_hash, uloga_id) VALUES (?,?,?,?)");
$ins->bind_param("sssi", $username, $email, $hash, $uloga_id);

if ($ins->execute()) {
  echo json_encode(["ok" => true]);
} else {
  http_response_code(500);
  echo json_encode(["error" => "Greška pri upisu u bazu."]);
}