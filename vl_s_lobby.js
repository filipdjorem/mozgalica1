document.addEventListener("DOMContentLoaded", () => {
  initLobbyPage();
});

async function initLobbyPage() {
  const codeEl = document.getElementById("lobbyRoomCode");
  const participantsEl = document.getElementById("participantsList");

  if (!codeEl || !participantsEl) return;

  const params = new URLSearchParams(window.location.search);
  const sobaId = params.get("soba_id");

  if (!sobaId) {
    codeEl.textContent = "------";
    participantsEl.innerHTML = `
      <div class="empty-state">
        <h3>Greška</h3>
        <p>Nije proslijeđen ID sobe.</p>
      </div>
    `;
    return;
  }

  try {
    const res = await fetch(`api/lobby_podaci.php?soba_id=${encodeURIComponent(sobaId)}`);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Server nije vratio JSON:", text);
      codeEl.textContent = "------";
      participantsEl.innerHTML = `
        <div class="empty-state">
          <h3>Greška</h3>
          <p>Server nije vratio ispravan JSON odgovor.</p>
        </div>
      `;
      return;
    }

    if (!res.ok || !data.success) {
      codeEl.textContent = "------";
      participantsEl.innerHTML = `
        <div class="empty-state">
          <h3>Greška</h3>
          <p>${escapeHtml(data.message || "Nije moguće učitati lobby.")}</p>
        </div>
      `;
      return;
    }

    codeEl.textContent = data.soba.kod_za_pristup || "------";

    participantsEl.innerHTML = `
      <div class="participant-card participant-card--owner">
        <div class="participant-info">
          <h3>${escapeHtml(data.vlasnik.ime)}</h3>
          <p>Vlasnik sobe</p>
        </div>
        <span class="participant-badge">Vlasnik</span>
      </div>
    `;
  } catch (err) {
    console.error("Greška pri fetch-u:", err);
    codeEl.textContent = "------";
    participantsEl.innerHTML = `
      <div class="empty-state">
        <h3>Greška</h3>
        <p>Došlo je do greške pri komunikaciji sa serverom.</p>
      </div>
    `;
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}