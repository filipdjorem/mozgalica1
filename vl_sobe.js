document.addEventListener("DOMContentLoaded", () => {
  initCreateRoomPage();
  initExistingRoomsPage();
});

function initCreateRoomPage() {
  const generateBtn = document.querySelector(".btn--code");
  const roomCodeInput = document.getElementById("roomCode");
  const btnNapraviSobu = document.getElementById("btnNapraviSobu");
  const addButtons = document.querySelectorAll(".btn--add");

  if (!generateBtn && !btnNapraviSobu && addButtons.length === 0) {
    return;
  }

  const selectedCategories = new Set();

  function generisiKod() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    if (roomCodeInput) {
      roomCodeInput.value = code;
    }
  }

  if (generateBtn && roomCodeInput) {
    generateBtn.addEventListener("click", generisiKod);
  }

  addButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const kategorijaId = Number(btn.dataset.kategorijaId);

      btn.classList.toggle("active");

      if (btn.classList.contains("active")) {
        btn.textContent = "Added";
        selectedCategories.add(kategorijaId);
      } else {
        btn.textContent = "Add";
        selectedCategories.delete(kategorijaId);
      }
    });
  });

  if (btnNapraviSobu) {
    btnNapraviSobu.addEventListener("click", async () => {
      const naziv = document.getElementById("imeSobe")?.value.trim() || "";
      const tema = document.getElementById("temaSobe")?.value.trim() || "";
      const kod = document.getElementById("roomCode")?.value.trim() || "";
      const kategorije = Array.from(selectedCategories);

      if (!naziv || !tema || !kod) {
        alert("Popuni ime sobe, temu sobe i generiši kod.");
        return;
      }

      if (kategorije.length === 0) {
        alert("Izaberi bar jednu kategoriju.");
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
            kategorije
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