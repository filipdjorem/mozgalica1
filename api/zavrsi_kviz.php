<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require __DIR__ . "/db.php";

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Nisi prijavljen."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$soba_id = (int)($data["soba_id"] ?? 0);
$ukupan_rezultat = (int)($data["ukupan_rezultat"] ?? 0);
$korisnik_id = (int)$_SESSION["user"]["id"];

if ($soba_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Nedostaje soba_id."]);
    exit;
}

$stmt = $conn->prepare("
    INSERT INTO ucesce (soba_id, korisnik_id, ukupan_rezultat, zavrsio)
    VALUES (?, ?, ?, 1)
");

$stmt->bind_param("iii", $soba_id, $korisnik_id, $ukupan_rezultat);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Greška pri čuvanju rezultata."]);
    exit;
}

$stmt->close();

echo json_encode([
    "success" => true,
    "message" => "Rezultat je sačuvan."
], JSON_UNESCAPED_UNICODE);