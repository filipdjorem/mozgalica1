document.addEventListener("DOMContentLoaded", () => {
  initKviz();
});

let pitanja = [];
let trenutnoPitanje = 0;
let rezultat = 0;
let sobaId = null;

let timerInterval = null;
let preostaloVrijeme = 5;

async function initKviz() {
  const params = new URLSearchParams(window.location.search);
  sobaId = params.get("soba_id");

  if (!sobaId) {
    prikaziGresku("Nije proslijeđen ID sobe.");
    return;
  }

  try {
    const res = await fetch(`api/kviz_podaci.php?soba_id=${encodeURIComponent(sobaId)}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      prikaziGresku(data.message || "Greška pri učitavanju kviza.");
      return;
    }

    pitanja = data.pitanja || [];

    if (pitanja.length === 0) {
      prikaziGresku("Ova soba nema pitanja.");
      return;
    }

    prikaziPitanje();
  } catch (err) {
    console.error(err);
    prikaziGresku("Došlo je do greške pri komunikaciji sa serverom.");
  }
}

function prikaziPitanje() {
  zaustaviTimer();

  const pitanje = pitanja[trenutnoPitanje];

  document.getElementById("questionNumber").textContent =
    `Pitanje ${trenutnoPitanje + 1}/${pitanja.length}`;

  document.getElementById("questionText").textContent = pitanje.tekst;

  const answersBox = document.getElementById("answersBox");
  answersBox.innerHTML = "";

  const oznake = ["A", "B", "C", "D"];

  pitanje.odgovori.forEach((odgovor, index) => {
    const btn = document.createElement("button");
    btn.className = "kviz-btn";
    btn.textContent = `${oznake[index]}. ${odgovor.tekst}`;

    btn.addEventListener("click", () => {
      zaustaviTimer();

      if (Number(odgovor.is_tacan) === 1) {
        rezultat++;
      }

      idiNaSljedecePitanje();
    });

    answersBox.appendChild(btn);
  });

  pokreniTimer();
}

function pokreniTimer() {
  const timerEl = document.getElementById("timerBox");
  if (!timerEl) return;

  preostaloVrijeme = 5;
  timerEl.textContent = `${preostaloVrijeme}s`;
  timerEl.classList.remove("timer-danger");

  timerInterval = setInterval(() => {
    preostaloVrijeme--;

    timerEl.textContent = `${preostaloVrijeme}s`;

    if (preostaloVrijeme <= 2) {
      timerEl.classList.add("timer-danger");
    }

    if (preostaloVrijeme <= 0) {
      zaustaviTimer();
      idiNaSljedecePitanje();
    }
  }, 1000);
}

function zaustaviTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function idiNaSljedecePitanje() {
  trenutnoPitanje++;

  if (trenutnoPitanje >= pitanja.length) {
    zavrsiKviz();
  } else {
    prikaziPitanje();
  }
}

async function zavrsiKviz() {
  zaustaviTimer();

  try {
    await fetch("api/zavrsi_kviz.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        soba_id: Number(sobaId),
        ukupan_rezultat: rezultat
      })
    });
  } catch (err) {
    console.error(err);
  }

  document.getElementById("quizPanel").innerHTML = `
    <div class="result-box">
      <p class="kviz-label">Kviz završen</p>
      <h2>Tvoj rezultat</h2>
      <div class="result-score">${rezultat}/${pitanja.length}</div>
      <p>Pogodio si ${rezultat} od ukupno ${pitanja.length} pitanja.</p>
      <a href="vlasnikpostojecesobe.html" class="btn btn--ghost result-btn">Nazad na sobe</a>
    </div>
  `;
}

function prikaziGresku(poruka) {
  const panel = document.getElementById("quizPanel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="result-box">
      <h2>Greška</h2>
      <p>${poruka}</p>
    </div>
  `;
}