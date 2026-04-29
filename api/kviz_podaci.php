<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require __DIR__ . "/db.php";

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Nisi prijavljen."]);
    exit;
}

$soba_id = isset($_GET["soba_id"]) ? (int)$_GET["soba_id"] : 0;

if ($soba_id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Nedostaje soba_id."]);
    exit;
}

$stmt = $conn->prepare("
    SELECT 
        sp.redni_broj,
        p.pitanje_id,
        p.tekst AS pitanje_tekst
    FROM soba_pitanje sp
    INNER JOIN pitanje p ON sp.pitanje_id = p.pitanje_id
    WHERE sp.soba_id = ? AND sp.aktivno = 1
    ORDER BY sp.redni_broj ASC, sp.soba_pitanje_id ASC
");

$stmt->bind_param("i", $soba_id);
$stmt->execute();
$result = $stmt->get_result();

$pitanja = [];

while ($row = $result->fetch_assoc()) {
    $pitanje_id = (int)$row["pitanje_id"];

    $stmtOdg = $conn->prepare("
        SELECT odgovor_id, tekst, is_tacan
        FROM odgovor
        WHERE pitanje_id = ?
        ORDER BY odgovor_id ASC
    ");
    $stmtOdg->bind_param("i", $pitanje_id);
    $stmtOdg->execute();
    $resOdg = $stmtOdg->get_result();

    $odgovori = [];

    while ($odg = $resOdg->fetch_assoc()) {
        $odgovori[] = [
            "odgovor_id" => (int)$odg["odgovor_id"],
            "tekst" => $odg["tekst"],
            "is_tacan" => (int)$odg["is_tacan"]
        ];
    }

    $stmtOdg->close();

    $pitanja[] = [
        "pitanje_id" => $pitanje_id,
        "tekst" => $row["pitanje_tekst"],
        "redni_broj" => (int)$row["redni_broj"],
        "odgovori" => $odgovori
    ];
}

$stmt->close();

echo json_encode([
    "success" => true,
    "pitanja" => $pitanja
], JSON_UNESCAPED_UNICODE);