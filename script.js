function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return document.querySelectorAll(selector);
}

function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.display = "block";
  el.textContent = message;
  el.style.color = isError ? "#ffd1d1" : "#d8ffe0";
}

function resetFormHard(form) {
  if (!form) return;

  form.reset();

  const fields = form.querySelectorAll("input, textarea, select");
  fields.forEach(field => {
    if (field.tagName === "SELECT") {
      field.selectedIndex = 0;
    } else {
      field.value = "";
    }
    field.setAttribute("autocomplete", "off");
  });
}

function initNoCacheForms() {
  const forms = qsa("form");
  forms.forEach(form => resetFormHard(form));

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      forms.forEach(form => resetFormHard(form));
    }
  });
}

function initPasswordToggles() {
  const toggleButtons = qsa(".password-toggle");

  toggleButtons.forEach(button => {
    button.addEventListener("click", function () {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "🙈" : "👁";
      button.setAttribute("aria-pressed", String(isPassword));
      button.setAttribute(
        "aria-label",
        isPassword ? "Sakrij password" : "Prikaži password"
      );
    });
  });
}

function initSignup() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("su-username").value.trim();
    const password = document.getElementById("su-password").value;
    const confirmPassword = document.getElementById("su-confirm").value;
    const email = document.getElementById("su-email").value.trim();
    const role = document.getElementById("su-role").value;

    if (!username || !password || !confirmPassword || !email || !role) {
      showMessage("su-msg", "Popuni sva polja.", true);
      return;
    }

    try {
      const res = await fetch("api/signup.php", {
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

      const data = await res.json();

      if (res.ok && data.ok) {
        showMessage("su-msg", "Registracija uspješna. Preusmjeravanje...", false);
        resetFormHard(form);

        setTimeout(() => {
          window.location.href = "login.html";
        }, 700);
      } else {
        showMessage("su-msg", data.error || "Greška pri registraciji.", true);
      }
    } catch (err) {
      console.error(err);
      showMessage("su-msg", "Greška pri konekciji sa serverom.", true);
    }
  });
}

function initLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("li-email").value.trim();
    const password = document.getElementById("li-password").value;

    if (!email || !password) {
      showMessage("li-msg", "Unesi email i password.", true);
      return;
    }

    try {
      const res = await fetch("api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        showMessage("li-msg", "Prijava uspješna. Preusmjeravanje...", false);
        resetFormHard(form);

        setTimeout(() => {
          if (data.user.roleId === 2) {
            window.location.href = "vlasnikhome.html";
          } else {
            window.location.href = "index.html";
          }
        }, 700);
      } else {
        showMessage("li-msg", data.error || "Pogrešan email ili password.", true);
      }
    } catch (err) {
      console.error(err);
      showMessage("li-msg", "Greška pri konekciji sa serverom.", true);
    }
  });
}

async function initIndexPage() {
  const nav = document.getElementById("nav-actions");
  if (!nav) return;

  try {
    const res = await fetch("api/me.php");
    const data = await res.json();

    if (!data.loggedIn || !data.user) return;

    nav.innerHTML = `
      <span class="welcome-user">Zdravo, ${data.user.name}</span>
      <button id="logoutBtn" class="btn btn--nav btn--dark">Logout</button>
    `;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await fetch("api/logout.php", { method: "GET" });
        } catch (e) {
          console.error(e);
        }
        window.location.href = "login.html";
      });
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initNoCacheForms();
  initPasswordToggles();
  initSignup();
  initLogin();
  initIndexPage();
});