document.addEventListener("DOMContentLoaded", () => {

  const generateBtn = document.querySelector(".btn--code");
  const roomCodeInput = document.getElementById("roomCode");
  const btnNapraviSobu = document.getElementById("btnNapraviSobu");

  // GENERISANJE KODA
  function generisiKod() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    roomCodeInput.value = code;
  }

  generateBtn.addEventListener("click", generisiKod);

  // ADD dugmad
  document.querySelectorAll(".btn--add").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      btn.textContent = btn.classList.contains("active") ? "Added" : "Add";
    });
  });

  // KREIRANJE SOBE
  btnNapraviSobu.addEventListener("click", async () => {

    const naziv = document.getElementById("imeSobe").value.trim();
    const tema = document.getElementById("temaSobe").value.trim();
    const kod = document.getElementById("roomCode").value.trim();

    if (!naziv || !tema || !kod) {
      alert("Popuni sva polja i generiši kod.");
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
          kod_za_pristup: kod
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("Soba kreirana!");
        window.location.href = "vlasnikhome.html";
      } else {
        alert(data.message);
      }

    } catch (err) {
      console.error(err);
      alert("Greška!");
    }
  });

});