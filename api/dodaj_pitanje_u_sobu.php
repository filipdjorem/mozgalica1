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

$soba_id = (int)($data["soba_id"] ?? 0);
$kategorija_id = (int)($data["kategorija_id"] ?? 0);
$tekst = trim($data["tekst"] ?? "");
$odgovori = $data["odgovori"] ?? [];
$tacan_index = (int)($data["tacan_index"] ?? -1);

if ($soba_id <= 0 || $kategorija_id <= 0 || $tekst === "" || !is_array($odgovori) || count($odgovori) !== 4 || $tacan_index < 0 || $tacan_index > 3) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Neispravni podaci za novo pitanje."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

foreach ($odgovori as $odg) {
    if (trim($odg) === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Svi odgovori moraju biti popunjeni."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

try {
    $conn->begin_transaction();

    $stmtSoba = $conn->prepare("
        SELECT soba_id
        FROM soba
        WHERE soba_id = ? AND vlasnik_id = ?
        LIMIT 1
    ");
    $stmtSoba->bind_param("ii", $soba_id, $vlasnik_id);
    $stmtSoba->execute();
    $resultSoba = $stmtSoba->get_result();
    $soba = $resultSoba->fetch_assoc();
    $stmtSoba->close();

    if (!$soba) {
        $conn->rollback();
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Soba nije pronađena."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmtInsertPitanje = $conn->prepare("
        INSERT INTO pitanje (tekst, kategorija_id, nivo_id, autor_id, javno)
        VALUES (?, ?, 1, ?, 0)
    ");
    $stmtInsertPitanje->bind_param("sii", $tekst, $kategorija_id, $vlasnik_id);

    if (!$stmtInsertPitanje->execute()) {
        throw new Exception("Greška pri unosu pitanja.");
    }

    $pitanje_id = $conn->insert_id;
    $stmtInsertPitanje->close();

    $stmtInsertOdgovor = $conn->prepare("
        INSERT INTO odgovor (pitanje_id, tekst, is_tacan)
        VALUES (?, ?, ?)
    ");

    foreach ($odgovori as $index => $odgTekst) {
      $odgTekst = trim($odgTekst);
      $is_tacan = ($index === $tacan_index) ? 1 : 0;

      $stmtInsertOdgovor->bind_param("isi", $pitanje_id, $odgTekst, $is_tacan);

      if (!$stmtInsertOdgovor->execute()) {
          throw new Exception("Greška pri unosu odgovora.");
      }
    }

    $stmtInsertOdgovor->close();

    $stmtRedniBroj = $conn->prepare("
        SELECT COALESCE(MAX(redni_broj), 0) + 1 AS novi_redni_broj
        FROM soba_pitanje
        WHERE soba_id = ?
    ");
    $stmtRedniBroj->bind_param("i", $soba_id);
    $stmtRedniBroj->execute();
    $resultRedni = $stmtRedniBroj->get_result();
    $rowRedni = $resultRedni->fetch_assoc();
    $redni_broj = (int)$rowRedni["novi_redni_broj"];
    $stmtRedniBroj->close();

    $stmtInsertSobaPitanje = $conn->prepare("
        INSERT INTO soba_pitanje (soba_id, pitanje_id, redni_broj, dodao_korisnik, aktivno)
        VALUES (?, ?, ?, 1, 1)
    ");
    $stmtInsertSobaPitanje->bind_param("iii", $soba_id, $pitanje_id, $redni_broj);

    if (!$stmtInsertSobaPitanje->execute()) {
        throw new Exception("Greška pri povezivanju pitanja sa sobom.");
    }

    $stmtInsertSobaPitanje->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Pitanje je dodano u sobu.",
        "pitanje_id" => $pitanje_id
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}