<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require __DIR__ . "/db.php";

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
$selected_pitanja = $data["selected_pitanja"] ?? [];
$custom_questions = $data["custom_questions"] ?? [];

if ($naziv === "" || $tema === "" || $kod === "") {
    echo json_encode([
        "success" => false,
        "message" => "Sva polja su obavezna."
    ]);
    exit;
}

if ((!is_array($kategorije) || count($kategorije) === 0) && (!is_array($custom_questions) || count($custom_questions) === 0)) {
    echo json_encode([
        "success" => false,
        "message" => "Moraš izabrati kategoriju ili dodati bar jedno novo pitanje."
    ]);
    exit;
}

$kategorije = array_map("intval", $kategorije);
$kategorije = array_values(array_unique($kategorije));

try {
    $conn->begin_transaction();

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

    $pitanjaIds = [];

    if (is_array($selected_pitanja) && count($selected_pitanja) > 0) {
        $selected_pitanja = array_map("intval", $selected_pitanja);
        $selected_pitanja = array_values(array_unique(array_filter($selected_pitanja, fn($id) => $id > 0)));

        if (count($selected_pitanja) > 0) {
            $placeholders = implode(",", array_fill(0, count($selected_pitanja), "?"));
            $types = str_repeat("i", count($selected_pitanja));

            $sqlPitanja = "SELECT pitanje_id FROM pitanje WHERE pitanje_id IN ($placeholders)";
            $stmtPitanja = $conn->prepare($sqlPitanja);
            $stmtPitanja->bind_param($types, ...$selected_pitanja);
            $stmtPitanja->execute();

            $result = $stmtPitanja->get_result();

            while ($row = $result->fetch_assoc()) {
                $pitanjaIds[] = (int)$row["pitanje_id"];
            }

            $stmtPitanja->close();
        }
    }

    if (is_array($custom_questions) && count($custom_questions) > 0) {
        $stmtInsertPitanje = $conn->prepare("
            INSERT INTO pitanje (tekst, kategorija_id, nivo_id, autor_id, javno)
            VALUES (?, ?, 1, ?, 0)
        ");

        $stmtInsertOdgovor = $conn->prepare("
            INSERT INTO odgovor (pitanje_id, tekst, is_tacan)
            VALUES (?, ?, ?)
        ");

        foreach ($custom_questions as $custom) {
            $tekst = trim($custom["tekst"] ?? "");
            $kategorija_id = (int)($custom["kategorija_id"] ?? 0);
            $odgovori = $custom["odgovori"] ?? [];
            $tacan_index = (int)($custom["tacan_index"] ?? -1);

            if ($tekst === "" || $kategorija_id <= 0 || !is_array($odgovori) || count($odgovori) !== 4 || $tacan_index < 0 || $tacan_index > 3) {
                throw new Exception("Neispravno novo pitanje.");
            }

            $stmtInsertPitanje->bind_param("sii", $tekst, $kategorija_id, $vlasnik_id);

            if (!$stmtInsertPitanje->execute()) {
                throw new Exception("Greška pri upisu novog pitanja.");
            }

            $novo_pitanje_id = $conn->insert_id;
            $pitanjaIds[] = $novo_pitanje_id;

            foreach ($odgovori as $index => $odgTekst) {
                $odgTekst = trim($odgTekst);
                if ($odgTekst === "") {
                    throw new Exception("Svi odgovori moraju biti popunjeni.");
                }

                $is_tacan = ($index === $tacan_index) ? 1 : 0;
                $stmtInsertOdgovor->bind_param("isi", $novo_pitanje_id, $odgTekst, $is_tacan);

                if (!$stmtInsertOdgovor->execute()) {
                    throw new Exception("Greška pri upisu odgovora.");
                }
            }
        }

        $stmtInsertPitanje->close();
        $stmtInsertOdgovor->close();
    }

    $pitanjaIds = array_values(array_unique(array_map("intval", $pitanjaIds)));

    if (count($pitanjaIds) === 0) {
        $conn->rollback();
        echo json_encode([
            "success" => false,
            "message" => "Nema pitanja za unos u sobu."
        ]);
        exit;
    }

    shuffle($pitanjaIds);

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