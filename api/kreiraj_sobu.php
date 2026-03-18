<?php
session_start();
header("Content-Type: application/json");

require __DIR__ . "/db.php";

// PROVJERA LOGIN-a
if (!isset($_SESSION["user"])) {
    echo json_encode(["success" => false, "message" => "Nisi prijavljen."]);
    exit;
}

$vlasnik_id = $_SESSION["user"]["id"];

$data = json_decode(file_get_contents("php://input"), true);

$naziv = trim($data["naziv"] ?? "");
$tema = trim($data["tema"] ?? "");
$kod = trim($data["kod_za_pristup"] ?? "");

if (!$naziv || !$tema || !$kod) {
    echo json_encode(["success" => false, "message" => "Sva polja su obavezna."]);
    exit;
}

// PROVJERA DA LI KOD POSTOJI
$check = $conn->prepare("SELECT COUNT(*) FROM soba WHERE kod_za_pristup=?");
$check->bind_param("s", $kod);
$check->execute();
$check->bind_result($count);
$check->fetch();
$check->close();

if ($count > 0) {
    echo json_encode(["success" => false, "message" => "Kod već postoji."]);
    exit;
}

// INSERT
$stmt = $conn->prepare("
  INSERT INTO soba (naziv, tema, vlasnik_id, kod_za_pristup, datum_kreiranja, aktivna)
  VALUES (?, ?, ?, ?, NOW(), 1)
");

$stmt->bind_param("ssis", $naziv, $tema, $vlasnik_id, $kod);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Greška u bazi."]);
}