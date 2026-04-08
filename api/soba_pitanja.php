<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/db.php";

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Nisi prijavljen."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$vlasnik_id = (int)$_SESSION["user"]["id"];
$sobaId = isset($_GET["soba_id"]) ? (int)$_GET["soba_id"] : 0;

if ($sobaId <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Nedostaje soba_id."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmtSoba = $conn->prepare("
        SELECT soba_id, naziv, tema, kod_za_pristup
        FROM soba
        WHERE soba_id = ? AND vlasnik_id = ?
        LIMIT 1
    ");
    $stmtSoba->bind_param("ii", $sobaId, $vlasnik_id);
    $stmtSoba->execute();
    $resultSoba = $stmtSoba->get_result();
    $soba = $resultSoba->fetch_assoc();
    $stmtSoba->close();

    if (!$soba) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Soba nije pronađena."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT 
            sp.soba_pitanje_id,
            sp.redni_broj,
            p.pitanje_id,
            p.tekst,
            k.naziv AS kategorija_naziv
        FROM soba_pitanje sp
        INNER JOIN pitanje p ON sp.pitanje_id = p.pitanje_id
        INNER JOIN kategorija k ON p.kategorija_id = k.kategorija_id
        WHERE sp.soba_id = ?
        ORDER BY sp.redni_broj ASC, sp.soba_pitanje_id ASC
    ");
    $stmt->bind_param("i", $sobaId);
    $stmt->execute();
    $result = $stmt->get_result();

    $pitanja = [];

    while ($row = $result->fetch_assoc()) {
        $pitanja[] = [
            "soba_pitanje_id" => (int)$row["soba_pitanje_id"],
            "redni_broj" => (int)$row["redni_broj"],
            "pitanje_id" => (int)$row["pitanje_id"],
            "tekst" => $row["tekst"],
            "kategorija_naziv" => $row["kategorija_naziv"]
        ];
    }

    $stmt->close();

    echo json_encode([
        "success" => true,
        "soba" => [
            "soba_id" => (int)$soba["soba_id"],
            "naziv" => $soba["naziv"],
            "tema" => $soba["tema"],
            "kod_za_pristup" => $soba["kod_za_pristup"]
        ],
        "pitanja" => $pitanja
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Greška na serveru."
    ], JSON_UNESCAPED_UNICODE);
}