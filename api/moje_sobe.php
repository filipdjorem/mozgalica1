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

$vlasnik_id = (int)$_SESSION["user"]["id"];

$sql = "SELECT soba_id, naziv, tema, kod_za_pristup, aktivna, datum_kreiranja
        FROM soba
        WHERE vlasnik_id = ?
        ORDER BY datum_kreiranja DESC, soba_id DESC";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Greška pri pripremi upita."
    ]);
    exit;
}

$stmt->bind_param("i", $vlasnik_id);
$stmt->execute();
$result = $stmt->get_result();

$sobe = [];

while ($row = $result->fetch_assoc()) {
    $sobe[] = [
        "soba_id" => (int)$row["soba_id"],
        "naziv" => $row["naziv"],
        "tema" => $row["tema"],
        "kod_za_pristup" => $row["kod_za_pristup"],
        "aktivna" => (int)$row["aktivna"],
        "datum_kreiranja" => $row["datum_kreiranja"]
    ];
}

$stmt->close();

echo json_encode([
    "success" => true,
    "vlasnik_id" => $vlasnik_id,
    "broj_soba" => count($sobe),
    "sobe" => $sobe
]);