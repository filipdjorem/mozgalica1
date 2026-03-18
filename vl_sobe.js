document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.querySelector(".btn--code");
  const roomCodeInput = document.getElementById("roomCode");
  const btnNapraviSobu = document.getElementById("btnNapraviSobu");
  const addButtons = document.querySelectorAll(".btn--add");

  const selectedCategories = new Set();

  function generisiKod() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    roomCodeInput.value = code;
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", generisiKod);
  }

  addButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const kategorijaId = btn.dataset.kategorijaId;

      btn.classList.toggle("active");

      if (btn.classList.contains("active")) {
        btn.textContent = "Added";
        selectedCategories.add(Number(kategorijaId));
      } else {
        btn.textContent = "Add";
        selectedCategories.delete(Number(kategorijaId));
      }
    });
  });

  if (btnNapraviSobu) {
    btnNapraviSobu.addEventListener("click", async () => {
      const naziv = document.getElementById("imeSobe").value.trim();
      const tema = document.getElementById("temaSobe").value.trim();
      const kod = document.getElementById("roomCode").value.trim();
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
            naziv: naziv,
            tema: tema,
            kod_za_pristup: kod,
            kategorije: kategorije
          })
        });

        const data = await res.json();

        if (data.success) {
          alert("Soba i pitanja su uspješno kreirani.");
          window.location.href = "vlasnikhome.html";
        } else {
          alert(data.message || "Greška pri kreiranju sobe.");
        }
      } catch (err) {
        console.error(err);
        alert("Došlo je do greške.");
      }
    });
  }
});