<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require __DIR__ . "/db.php";

// Provjera da li je korisnik prijavljen
if (!isset($_SESSION["user"])) {
    echo json_encode([
        "success" => false,
        "message" => "Nisi prijavljen."
    ]);
    exit;
}

$vlasnik_id = (int)$_SESSION["user"]["id"];

$data = json_decode(file_get_contents("php://input"), true);

$naziv = trim($data["naziv"] ?? "");
$tema = trim($data["tema"] ?? "");
$kod  = trim($data["kod_za_pristup"] ?? "");
$kategorije = $data["kategorije"] ?? [];

if ($naziv === "" || $tema === "" || $kod === "") {
    echo json_encode([
        "success" => false,
        "message" => "Sva polja su obavezna."
    ]);
    exit;
}

if (!is_array($kategorije) || count($kategorije) === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Moraš izabrati bar jednu kategoriju."
    ]);
    exit;
}

// Očisti i pretvori kategorije u int
$kategorije = array_map("intval", $kategorije);
$kategorije = array_values(array_unique($kategorije));

try {
    $conn->begin_transaction();

    // Provjera da li kod već postoji
    $check = $conn->prepare("SELECT COUNT(*) FROM soba WHERE kod_za_pristup = ?");
    $check->bind_param("s", $kod);
    $check->execute();
    $check->bind_result($countKod);
    $check->fetch();
    $check->close();

    if ($countKod > 0) {
        $conn->rollback();
        echo json_encode([
            "success" => false,
            "message" => "Kod za pristup već postoji. Generiši novi kod."
        ]);
        exit;
    }

    // 1) INSERT u soba
    $stmtSoba = $conn->prepare("
        INSERT INTO soba (naziv, tema, vlasnik_id, kod_za_pristup, datum_kreiranja, aktivna)
        VALUES (?, ?, ?, ?, NOW(), 1)
    ");
    $stmtSoba->bind_param("ssis", $naziv, $tema, $vlasnik_id, $kod);

    if (!$stmtSoba->execute()) {
        throw new Exception("Greška pri kreiranju sobe.");
    }

    $soba_id = $conn->insert_id;
    $stmtSoba->close();

    // 2) Uzmi pitanja iz izabranih kategorija
    $placeholders = implode(",", array_fill(0, count($kategorije), "?"));
    $types = str_repeat("i", count($kategorije));

    $sqlPitanja = "SELECT pitanje_id FROM pitanje WHERE kategorija_id IN ($placeholders)";
    $stmtPitanja = $conn->prepare($sqlPitanja);

    $stmtPitanja->bind_param($types, ...$kategorije);
    $stmtPitanja->execute();

    $result = $stmtPitanja->get_result();

    $pitanjaIds = [];
    while ($row = $result->fetch_assoc()) {
        $pitanjaIds[] = (int)$row["pitanje_id"];
    }

    $stmtPitanja->close();

    if (count($pitanjaIds) === 0) {
        $conn->rollback();
        echo json_encode([
            "success" => false,
            "message" => "Nema pitanja u izabranim kategorijama."
        ]);
        exit;
    }

    // 3) Nasumično izmiješaj pitanja
    shuffle($pitanjaIds);

    // 4) INSERT u soba_pitanje
    $stmtSobaPitanje = $conn->prepare("
        INSERT INTO soba_pitanje (soba_id, pitanje_id, redni_broj, dodao_korisnik, aktivno)
        VALUES (?, ?, ?, 0, 1)
    ");

    $redni_broj = 1;

    foreach ($pitanjaIds as $pitanje_id) {
        $stmtSobaPitanje->bind_param("iii", $soba_id, $pitanje_id, $redni_broj);

        if (!$stmtSobaPitanje->execute()) {
            throw new Exception("Greška pri dodavanju pitanja u sobu.");
        }

        $redni_broj++;
    }

    $stmtSobaPitanje->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Soba i pitanja su uspješno kreirani.",
        "soba_id" => $soba_id,
        "broj_pitanja" => count($pitanjaIds)
    ]);

} catch (Exception $e) {
    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}