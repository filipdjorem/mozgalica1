<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/db.php";

$kategorijaId = isset($_GET["kategorija_id"]) ? (int)$_GET["kategorija_id"] : 0;

if ($kategorijaId <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Nedostaje kategorija_id."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT pitanje_id, tekst
        FROM pitanje
        WHERE kategorija_id = ?
        ORDER BY pitanje_id ASC
    ");

    $stmt->bind_param("i", $kategorijaId);
    $stmt->execute();

    $result = $stmt->get_result();
    $pitanja = [];

    while ($row = $result->fetch_assoc()) {
        $pitanja[] = [
            "pitanje_id" => $row["pitanje_id"],
            "tekst" => $row["tekst"]
        ];
    }

    echo json_encode([
        "success" => true,
        "pitanja" => $pitanja
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Greška na serveru."
    ], JSON_UNESCAPED_UNICODE);
}