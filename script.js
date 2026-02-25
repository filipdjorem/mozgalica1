

const API_BASE = "/mozgalica1/api";


function showMessage(text, isError = true) {
  const msg = document.getElementById("su-msg");
  if (!msg) return;

  msg.style.display = "block";
  msg.textContent = text;


  msg.style.color = isError ? "#ff6b6b" : "#4cd964";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); 

    const username = document.getElementById("su-username").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const password = document.getElementById("su-password").value;
    const confirmPassword = document.getElementById("su-confirm").value;
    const role = document.getElementById("su-role").value;

    
    if (!username || !email || !password || !confirmPassword) {
      showMessage("Popuni sva polja.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Šifre se ne poklapaju.");
      return;
    }

    if (!role) {
      showMessage("Izaberi ulogu.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/signup.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword,
          role
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showMessage(data.error || "Greška pri registraciji.");
        return;
      }

      showMessage("Registracija uspješna! Preusmjeravam...", false);


      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } catch (error) {
      showMessage("Ne mogu da kontaktiram server. Provjeri Apache i MySQL.");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  const msg = document.getElementById("li-msg");
  const show = (text) => {
    if (!msg) return;
    msg.style.display = "block";
    msg.textContent = text;
    msg.style.color = "#ff6b6b";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("li-email").value.trim();
    const password = document.getElementById("li-password").value;

    if (!email || !password) {
      show("Popuni email i šifru.");
      return;
    }

    try {
      const res = await fetch("/mozgalica1/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        show(data.error || "Greška pri prijavi.");
        return;
      }

     
      window.location.href = "index.html";
    } catch (err) {
      show("Ne mogu da kontaktiram server. Provjeri Apache/MySQL.");
    }
  });
});