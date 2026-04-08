document.addEventListener("DOMContentLoaded", () => {
  initCreateRoomPage();
  initExistingRoomsPage();
});

const ROOM_DRAFT_KEY = "mozgalica_room_draft";

function getRoomDraft() {
  try {
    return JSON.parse(localStorage.getItem(ROOM_DRAFT_KEY)) || {
      imeSobe: "",
      temaSobe: "",
      roomCode: "",
      selectedCategories: []
    };
  } catch (e) {
    return {
      imeSobe: "",
      temaSobe: "",
      roomCode: "",
      selectedCategories: []
    };
  }
}

function saveRoomDraft(draft) {
  localStorage.setItem(ROOM_DRAFT_KEY, JSON.stringify(draft));
}

function clearRoomDraft() {
  localStorage.removeItem(ROOM_DRAFT_KEY);
}

function initCreateRoomPage() {
  const generateBtn = document.querySelector(".btn--code");
  const roomCodeInput = document.getElementById("roomCode");
  const imeSobeInput = document.getElementById("imeSobe");
  const temaSobeInput = document.getElementById("temaSobe");
  const btnNapraviSobu = document.getElementById("btnNapraviSobu");
  const btnDodajPitanje = document.getElementById("btnDodajPitanje");
  const addButtons = document.querySelectorAll(".btn--add");
  const editLinks = document.querySelectorAll(".category-edit-link");

  if (!generateBtn && !btnNapraviSobu && addButtons.length === 0) {
    return;
  }

  const draft = getRoomDraft();
  const selectedCategories = new Set((draft.selectedCategories || []).map(Number));

  function syncDraftFromInputs() {
    saveRoomDraft({
      imeSobe: imeSobeInput?.value.trim() || "",
      temaSobe: temaSobeInput?.value.trim() || "",
      roomCode: roomCodeInput?.value.trim() || "",
      selectedCategories: Array.from(selectedCategories)
    });
  }

  function updateCategoryUI() {
    addButtons.forEach((btn) => {
      const kategorijaId = Number(btn.dataset.kategorijaId);
      const isSelected = selectedCategories.has(kategorijaId);

      btn.classList.toggle("active", isSelected);
      btn.textContent = isSelected ? "Dodano" : "Dodaj";
    });

    editLinks.forEach((link) => {
      const kategorijaId = Number(link.dataset.kategorijaId);
      const isSelected = selectedCategories.has(kategorijaId);
      link.classList.toggle("is-hidden", !isSelected);
    });

    syncDraftFromInputs();
  }

  function generisiKod() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    if (roomCodeInput) {
      roomCodeInput.value = code;
    }

    syncDraftFromInputs();
  }

  if (imeSobeInput) imeSobeInput.value = draft.imeSobe || "";
  if (temaSobeInput) temaSobeInput.value = draft.temaSobe || "";
  if (roomCodeInput) roomCodeInput.value = draft.roomCode || "";

  updateCategoryUI();

  if (imeSobeInput) {
    imeSobeInput.addEventListener("input", syncDraftFromInputs);
  }

  if (temaSobeInput) {
    temaSobeInput.addEventListener("input", syncDraftFromInputs);
  }

  if (roomCodeInput) {
    roomCodeInput.addEventListener("input", syncDraftFromInputs);
  }

  if (generateBtn && roomCodeInput) {
    generateBtn.addEventListener("click", generisiKod);
  }

  addButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const kategorijaId = Number(btn.dataset.kategorijaId);

      if (selectedCategories.has(kategorijaId)) {
        selectedCategories.delete(kategorijaId);
      } else {
        selectedCategories.add(kategorijaId);
      }

      updateCategoryUI();
    });
  });

  editLinks.forEach((link) => {
    link.addEventListener("click", () => {
      syncDraftFromInputs();
    });
  });

  if (btnDodajPitanje) {
    btnDodajPitanje.addEventListener("click", () => {
      // za sada nema funkciju
    });
  }

  if (btnNapraviSobu) {
    btnNapraviSobu.addEventListener("click", async () => {
      const naziv = imeSobeInput?.value.trim() || "";
      const tema = temaSobeInput?.value.trim() || "";
      const kod = roomCodeInput?.value.trim() || "";
      const kategorije = Array.from(selectedCategories);

      if (!naziv || !tema || !kod) {
        alert("Popuni ime sobe, temu sobe i generiši kod.");
        return;
      }

      if (kategorije.length === 0) {
        alert("Izaberi bar jednu kategoriju.");
        return;
      }

      let selectedPitanja = [];

      try {
        for (const kategorijaId of kategorije) {
          const storageKey = `mozgalica_selected_questions_${kategorijaId}`;
          const saved = localStorage.getItem(storageKey);

          if (saved) {
            const ids = JSON.parse(saved) || [];
            ids.forEach((id) => selectedPitanja.push(Number(id)));
          } else {
            const res = await fetch(`api/pitanja_kategorije.php?kategorija_id=${encodeURIComponent(kategorijaId)}`);
            const data = await res.json();

            if (res.ok && data.success && Array.isArray(data.pitanja)) {
              data.pitanja.forEach((p) => selectedPitanja.push(Number(p.pitanje_id)));
            }
          }
        }

        selectedPitanja = Array.from(new Set(selectedPitanja.filter((id) => Number(id) > 0)));
      } catch (e) {
        console.error(e);
        alert("Greška pri pripremi pitanja za sobu.");
        return;
      }

      if (selectedPitanja.length === 0) {
        alert("Nema čekiranih pitanja za izabrane kategorije.");
        return;
      }

      try {
        const res = await fetch("api/kreiraj_sobu.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            naziv,
            tema,
            kod_za_pristup: kod,
            kategorije,
            selected_pitanja: selectedPitanja
          })
        });

        const text = await res.text();
        let data = {};

        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Neispravan JSON:", text);
          alert("Server nije vratio ispravan odgovor.");
          return;
        }

        if (res.ok && data.success) {
          kategorije.forEach((kategorijaId) => {
            localStorage.removeItem(`mozgalica_selected_questions_${kategorijaId}`);
          });

          clearRoomDraft();

          alert("Soba i pitanja su uspješno kreirani.");
          window.location.href = "vlasnikpostojecesobe.html";
        } else {
          alert(data.message || "Greška pri kreiranju sobe.");
        }
      } catch (err) {
        console.error(err);
        alert("Došlo je do greške pri komunikaciji sa serverom.");
      }
    });
  }
}

async function initExistingRoomsPage() {
  const roomList = document.getElementById("roomList");
  if (!roomList) return;

  roomList.innerHTML = `<div class="rooms-info">Učitavanje soba...</div>`;

  try {
    const res = await fetch("api/moje_sobe.php");
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Neispravan JSON:", text);
      roomList.innerHTML = `
        <div class="empty-state">
          <h3>Greška</h3>
          <p>Server nije vratio ispravan JSON odgovor.</p>
        </div>
      `;
      return;
    }

    if (!res.ok || !data.success) {
      roomList.innerHTML = `
        <div class="empty-state">
          <h3>Greška</h3>
          <p>${escapeHtml(data.message || "Nije moguće učitati sobe.")}</p>
        </div>
      `;
      return;
    }

    if (!data.sobe || data.sobe.length === 0) {
      roomList.innerHTML = `
        <div class="empty-state">
          <h3>Nemaš još kreiranih soba</h3>
          <p>Kada napraviš prvu sobu, pojaviće se ovdje.</p>
        </div>
      `;
      return;
    }

    roomList.innerHTML = data.sobe.map((soba) => {
      const naziv = escapeHtml(soba.naziv || "Bez naziva");
      const tema = escapeHtml(soba.tema || "Nije unesena tema");
      const kod = escapeHtml(soba.kod_za_pristup || "-");

      return `
        <div class="row-card room-card-db">
          <div class="room-card__content">
            <h3>${naziv}</h3>
            <p><strong>Tema:</strong> ${tema}</p>
            <p><strong>Kod:</strong> ${kod}</p>
          </div>

          <div class="row-actions">
            <a href="vl_s_lobby.html?soba_id=${encodeURIComponent(soba.soba_id)}" class="btn btn--primary btn--small">
              Pokreni
            </a>
            <button type="button" class="btn btn--edit btn--small">
              Izmijeni
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error(err);
    roomList.innerHTML = `
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