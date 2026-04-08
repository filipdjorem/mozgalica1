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
$data = json_decode(file_get_contents("php://input"), true);

$sobaPitanjeId = (int)($data["soba_pitanje_id"] ?? 0);

if ($sobaPitanjeId <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Nedostaje soba_pitanje_id."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmtCheck = $conn->prepare("
        SELECT sp.soba_pitanje_id
        FROM soba_pitanje sp
        INNER JOIN soba s ON sp.soba_id = s.soba_id
        WHERE sp.soba_pitanje_id = ? AND s.vlasnik_id = ?
        LIMIT 1
    ");
    $stmtCheck->bind_param("ii", $sobaPitanjeId, $vlasnik_id);
    $stmtCheck->execute();
    $result = $stmtCheck->get_result();
    $postoji = $result->fetch_assoc();
    $stmtCheck->close();

    if (!$postoji) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Pitanje nije pronađeno u tvojoj sobi."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmtDelete = $conn->prepare("
        DELETE FROM soba_pitanje
        WHERE soba_pitanje_id = ?
    ");
    $stmtDelete->bind_param("i", $sobaPitanjeId);

    if (!$stmtDelete->execute()) {
        throw new Exception("Greška pri uklanjanju pitanja iz sobe.");
    }

    $stmtDelete->close();

    echo json_encode([
        "success" => true,
        "message" => "Pitanje je uklonjeno iz sobe."
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Greška na serveru."
    ], JSON_UNESCAPED_UNICODE);
}