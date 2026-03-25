<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require __DIR__ . "/db.php";

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Nisi prijavljen."
    ]);
    exit;
}

$soba_id = isset($_GET["soba_id"]) ? (int)$_GET["soba_id"] : 0;

if ($soba_id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Nedostaje soba_id."
    ]);
    exit;
}

$user_id = (int)$_SESSION["user"]["id"];
$user_name = $_SESSION["user"]["name"] ?? "Nepoznati korisnik";

$stmt = $conn->prepare("
    SELECT soba_id, naziv, tema, kod_za_pristup, vlasnik_id, aktivna
    FROM soba
    WHERE soba_id = ?
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Greška pri pripremi upita."
    ]);
    exit;
}

$stmt->bind_param("i", $soba_id);
$stmt->execute();

$result = $stmt->get_result();
$soba = $result->fetch_assoc();

$stmt->close();

if (!$soba) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "Soba ne postoji."
    ]);
    exit;
}

if ((int)$soba["vlasnik_id"] !== $user_id) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Nemaš pristup ovoj sobi."
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "soba" => [
        "soba_id" => (int)$soba["soba_id"],
        "naziv" => $soba["naziv"],
        "tema" => $soba["tema"],
        "kod_za_pristup" => $soba["kod_za_pristup"],
        "aktivna" => (int)$soba["aktivna"]
    ],
    "vlasnik" => [
        "id" => $user_id,
        "ime" => $user_name
    ]
]);