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

    if (password !== confirmPassword) {
      showMessage("su-msg", "Password i potvrda passworda nisu isti.", true);
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
          if (Number(data.user.roleId) === 2) {
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
      <span class="welcome-user">Zdravo, ${escapeHtml(data.user.name)}</span>
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

function initOwnerLogoutLinks() {
  const logoutLinks = qsa(".logout-link");
  logoutLinks.forEach(link => {
    link.addEventListener("click", async function (e) {
      e.preventDefault();
      try {
        await fetch("api/logout.php", { method: "GET" });
      } catch (err) {
        console.error(err);
      }
      window.location.href = "login.html";
    });
  });
}

function initCarousel() {
  const track = document.getElementById("carousel-track");
  if (!track) return;

  const cards = [
    { badge: "LIVE", title: "Kviz sobe", text: "Vlasnik sobe brzo kreira novu sobu i priprema pitanja za igru." },
    { badge: "IGRAČI", title: "Pridruživanje", text: "Igrači ulaze pomoću koda za pristup i učestvuju u kvizu." },
    { badge: "PITANJA", title: "Više kategorija", text: "Istorija, sport, IT i druge kategorije mogu biti dio jednog kviza." },
    { badge: "DIZAJN", title: "Moderan izgled", text: "Jednostavan interfejs omogućava lako korištenje na svakoj stranici." },
    { badge: "VLASNIK", title: "Upravljanje sobom", text: "Vlasnik može pregledati postojeće sobe i ponovo ih koristiti." },
    { badge: "KOD", title: "Pristupni kod", text: "Svaka soba ima jedinstven kod za pridruživanje učesnika." }
  ];

  const full = [...cards, ...cards];
  track.innerHTML = full.map(card => `
    <article class="carousel__card">
      <span class="carousel__badge">${card.badge}</span>
      <h3>${card.title}</h3>
      <p>${card.text}</p>
    </article>
  `).join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
  initNoCacheForms();
  initPasswordToggles();
  initSignup();
  initLogin();
  initIndexPage();
  initOwnerLogoutLinks();
  initCarousel();
  initEditCategoryPage();
});
function getCategoryNameById(id) {
  const map = {
    1: "Istorija",
    2: "Sport",
    3: "IT",
    4: "Geografija",
    5: "Film i serije"
  };

  return map[Number(id)] || "Nepoznata kategorija";
}

function updateEditCheckedCount() {
  const all = document.querySelectorAll(".edit-question-checkbox");
  const checked = document.querySelectorAll(".edit-question-checkbox:checked");

  const ukupnoEl = document.getElementById("ukupnoPitanja");
  const oznacenoEl = document.getElementById("oznacenaPitanja");

  if (ukupnoEl) ukupnoEl.textContent = all.length;
  if (oznacenoEl) oznacenoEl.textContent = checked.length;
}
async function initEditCategoryPage() {
  const questionsContainer = document.getElementById("questionsContainer");
  if (!questionsContainer) return;

  const params = new URLSearchParams(window.location.search);
  const kategorijaId = params.get("kategorija_id");

  const titleEl = document.getElementById("editCategoryTitle");
  const textEl = document.getElementById("editCategoryText");
  const badgeEl = document.getElementById("editCategoryBadge");
  const saveBtn = document.getElementById("btnSacuvajIzmjene");

  if (!kategorijaId) {
    questionsContainer.innerHTML = `
      <div class="empty-state">
        <h3>Nije odabrana kategorija</h3>
        <p>Vrati se nazad i klikni na dugme Edit pored željene kategorije.</p>
      </div>
    `;
    return;
  }

  const categoryName = getCategoryNameById(kategorijaId);
  const storageKey = `mozgalica_selected_questions_${kategorijaId}`;

  if (titleEl) titleEl.textContent = `Pitanja kategorije: ${categoryName}`;
  if (textEl) textEl.textContent = `Ovdje su prikazana sva pitanja iz kategorije ${categoryName}.`;
  if (badgeEl) badgeEl.textContent = categoryName;

  try {
    const res = await fetch(`api/pitanja_kategorije.php?kategorija_id=${encodeURIComponent(kategorijaId)}`);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Neispravan JSON:", text);
      questionsContainer.innerHTML = `
        <div class="empty-state">
          <h3>Greška</h3>
          <p>Server nije vratio ispravan JSON odgovor.</p>
        </div>
      `;
      return;
    }

    if (!res.ok || !data.success) {
      questionsContainer.innerHTML = `
        <div class="empty-state">
          <h3>Greška</h3>
          <p>${escapeHtml(data.message || "Nije moguće učitati pitanja.")}</p>
        </div>
      `;
      return;
    }

    if (!data.pitanja || data.pitanja.length === 0) {
      questionsContainer.innerHTML = `
        <div class="empty-state">
          <h3>Nema pitanja</h3>
          <p>Za ovu kategoriju trenutno nema unesenih pitanja.</p>
        </div>
      `;
      updateEditCheckedCount();
      return;
    }

    let savedIds = [];
    try {
      savedIds = JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (e) {
      savedIds = [];
    }

    const hasSavedState = Array.isArray(savedIds) && savedIds.length > 0;

    questionsContainer.innerHTML = data.pitanja.map((pitanje, index) => {
      const pitanjeId = Number(pitanje.pitanje_id);
      const checked = hasSavedState ? savedIds.includes(pitanjeId) : true;

      return `
        <div class="edit-question-card">
          <label class="edit-question-check">
            <input
              type="checkbox"
              class="edit-question-checkbox"
              ${checked ? "checked" : ""}
              data-pitanje-id="${escapeHtml(pitanje.pitanje_id)}"
            >
            <span class="edit-question-checkmark"></span>
          </label>

          <div class="edit-question-content">
            <div class="edit-question-meta">
              <span class="edit-question-order">Pitanje ${index + 1}</span>
              <span class="edit-question-id">ID: ${escapeHtml(pitanje.pitanje_id)}</span>
            </div>

            <p class="edit-question-text">${escapeHtml(pitanje.tekst)}</p>
          </div>
        </div>
      `;
    }).join("");

    const checkboxes = document.querySelectorAll(".edit-question-checkbox");
    checkboxes.forEach(cb => {
      cb.addEventListener("change", updateEditCheckedCount);
    });

    updateEditCheckedCount();
  } catch (err) {
    console.error(err);
    questionsContainer.innerHTML = `
      <div class="empty-state">
        <h3>Greška</h3>
        <p>Došlo je do greške pri komunikaciji sa serverom.</p>
      </div>
    `;
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const checkedIds = Array.from(document.querySelectorAll(".edit-question-checkbox:checked"))
        .map(cb => Number(cb.dataset.pitanjeId));

      localStorage.setItem(storageKey, JSON.stringify(checkedIds));
      window.location.href = "vlasniknapravisobu.html";
    });
  }
}