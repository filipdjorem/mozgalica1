// =========================
// MOZGALICA - script.js
// =========================

const STORAGE_KEYS = {
  USERS: "mozgalica_users",
  CURRENT_USER: "mozgalica_current_user",
  ROOMS: "mozgalica_rooms",
  CATEGORY_QUESTIONS: "mozgalica_category_questions"
};

// -------------------------
// POMOCNE FUNKCIJE
// -------------------------
function getData(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return getData(STORAGE_KEYS.USERS, []);
}

function setUsers(users) {
  setData(STORAGE_KEYS.USERS, users);
}

function getCurrentUser() {
  return getData(STORAGE_KEYS.CURRENT_USER, null);
}

function setCurrentUser(user) {
  setData(STORAGE_KEYS.CURRENT_USER, user);
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

function getRooms() {
  return getData(STORAGE_KEYS.ROOMS, []);
}

function setRooms(rooms) {
  setData(STORAGE_KEYS.ROOMS, rooms);
}

function getCategoryQuestions() {
  return getData(STORAGE_KEYS.CATEGORY_QUESTIONS, {});
}

function setCategoryQuestions(data) {
  setData(STORAGE_KEYS.CATEGORY_QUESTIONS, data);
}

function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.display = "block";
  el.textContent = message;
  el.style.color = isError ? "#ffd1d1" : "#d8ffe0";
}

function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

function getPageName() {
  return window.location.pathname.split("/").pop();
}

function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replaceAll("č", "c")
    .replaceAll("ć", "c")
    .replaceAll("š", "s")
    .replaceAll("ž", "z")
    .replaceAll("đ", "dj")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function resetFormHard(form) {
  if (!form) return;

  form.reset();

  const fields = qsa("input, textarea, select", form);
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
  forms.forEach(form => {
    resetFormHard(form);
  });

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      forms.forEach(form => resetFormHard(form));
    }
  });
}

// -------------------------
// DEFAULT PODACI
// -------------------------
function seedInitialData() {
  const existingRooms = getRooms();
  const existingCategories = getCategoryQuestions();

  if (!Object.keys(existingCategories).length) {
    const defaults = {
      istorija: [
        {
          question: "Koji je glavni grad Srbije?",
          a: "Novi Sad",
          b: "Beograd",
          c: "Niš",
          correct: "Beograd"
        },
        {
          question: "Ko je bio prvi srpski arhiepiskop?",
          a: "Sveti Sava",
          b: "Dositej Obradović",
          c: "Vuk Karadžić",
          correct: "Sveti Sava"
        }
      ],
      geografija: [
        {
          question: "Koja je najveća država na svijetu?",
          a: "Kanada",
          b: "Kina",
          c: "Rusija",
          correct: "Rusija"
        }
      ],
      sport: [
        {
          question: "Koliko igrača ima fudbalski tim na terenu?",
          a: "11",
          b: "10",
          c: "9",
          correct: "11"
        }
      ],
      "film-i-serije": [
        {
          question: "Koji film je osvojio više Oscara?",
          a: "Titanic",
          b: "Shrek",
          c: "Inception",
          correct: "Titanic"
        }
      ],
      nauka: [
        {
          question: "Koja planeta je najbliža Suncu?",
          a: "Venera",
          b: "Merkur",
          c: "Mars",
          correct: "Merkur"
        }
      ]
    };

    setCategoryQuestions(defaults);
  }

  if (!existingRooms.length) {
    const sampleRooms = [
      {
        id: generateId(),
        title: "Soba 1 - Opšti kviz",
        categories: ["istorija", "geografija", "sport"],
        questions: [
          {
            question: "Koji je glavni grad Francuske?",
            a: "Berlin",
            b: "Madrid",
            c: "Pariz",
            correct: "Pariz"
          },
          {
            question: "Ko je napisao roman Na Drini ćuprija?",
            a: "Ivo Andrić",
            b: "Meša Selimović",
            c: "Branko Ćopić",
            correct: "Ivo Andrić"
          }
        ]
      },
      {
        id: generateId(),
        title: "Soba 2 - Školski kviz",
        categories: ["nauka", "istorija"],
        questions: [
          {
            question: "Koliko kontinenata postoji?",
            a: "5",
            b: "6",
            c: "7",
            correct: "7"
          }
        ]
      }
    ];

    setRooms(sampleRooms);
  }
}

// -------------------------
// HOME KAROSEL
// -------------------------
function initHomeCarousel() {
  const track = document.getElementById("carousel-track");
  const carousel = document.getElementById("home-carousel");

  if (!track || !carousel) return;

  const cards = [
    { title: "Brza registracija", text: "Korisnik pravi nalog za nekoliko sekundi.", step: "Kartica 01" },
    { title: "Izbor uloge", text: "Biraj da li si vlasnik sobe ili igrač.", step: "Kartica 02" },
    { title: "Moderan dizajn", text: "Čist i pregledan interfejs za lakše korištenje.", step: "Kartica 03" },
    { title: "Kreiranje sobe", text: "Vlasnik sobe može brzo otvoriti novi kviz.", step: "Kartica 04" },
    { title: "Teme i kategorije", text: "Pitanja se mogu organizovati po različitim oblastima.", step: "Kartica 05" },
    { title: "Uređivanje pitanja", text: "Pitanja i odgovori mogu se mijenjati u nekoliko klikova.", step: "Kartica 06" },
    { title: "Pristup igrača", text: "Igrači se jednostavno priključuju aktivnoj sobi.", step: "Kartica 07" },
    { title: "Kviz uživo", text: "Sve funkcioniše pregledno u realnom vremenu.", step: "Kartica 08" },
    { title: "Više soba", text: "Moguće je sačuvati i ponovo koristiti postojeće sobe.", step: "Kartica 09" },
    { title: "Jednostavna navigacija", text: "Korisnik lako prelazi između stranica i opcija.", step: "Kartica 10" }
  ];

  const doubled = [...cards, ...cards];

  track.innerHTML = doubled.map(card => `
    <article class="carousel__card">
      <span class="carousel__badge">${card.step}</span>
      <h3>${card.title}</h3>
      <p>${card.text}</p>
    </article>
  `).join("");

  let paused = false;

  carousel.addEventListener("mouseenter", () => paused = true);
  carousel.addEventListener("mouseleave", () => paused = false);

  function animateCarousel() {
    if (!paused) {
      carousel.scrollLeft += 1;

      const halfway = track.scrollWidth / 2;
      if (carousel.scrollLeft >= halfway) {
        carousel.scrollLeft = 0;
      }
    }

    requestAnimationFrame(animateCarousel);
  }

  requestAnimationFrame(animateCarousel);
}

// -------------------------
// PRIKAZ / SAKRIVANJE SIFRE
// -------------------------
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

// -------------------------
// LOGO ANIMACIJA + PRAVILA KVIZA
// -------------------------
function initLogoRulesModal() {
  const brands = qsa(".brand, .mini-brand");
  if (!brands.length) return;

  if (!document.getElementById("mozgalica-rules-style")) {
    const style = document.createElement("style");
    style.id = "mozgalica-rules-style";
    style.textContent = `
      .logo-bounce {
        animation: mozLogoBounce .7s ease;
      }

      @keyframes mozLogoBounce {
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.08) rotate(-3deg); }
        50% { transform: scale(.98) rotate(3deg); }
        75% { transform: scale(1.05) rotate(-2deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
    `;
    document.head.appendChild(style);
  }

  function createModal() {
    const old = document.getElementById("rules-modal");
    if (old) old.remove();

    const modal = document.createElement("div");
    modal.id = "rules-modal";
    modal.className = "rules-modal";
    modal.innerHTML = `
      <div class="rules-modal__box" role="dialog" aria-modal="true" aria-labelledby="rules-title">
        <button class="rules-modal__close" type="button" aria-label="Zatvori">×</button>
        <h2 id="rules-title" class="rules-modal__title">Pravila kviza</h2>
        <p class="rules-modal__text">
          Dobro došao u Mozgalicu. Kviz je osmišljen tako da bude brz, jasan i zabavan za sve učesnike.
        </p>
        <ul class="rules-modal__list">
          <li>Vlasnik sobe kreira kviz i bira pitanja po kategorijama.</li>
          <li>Igrači se pridružuju sobi i odgovaraju na pitanja tokom kviza.</li>
          <li>Svako pitanje ima tačan odgovor i unaprijed definisan redoslijed.</li>
          <li>Poželjno je odgovarati pažljivo i u okviru predviđenog toka igre.</li>
          <li>Cilj je osvojiti što više bodova i ostvariti najbolji rezultat.</li>
        </ul>
        <div class="rules-modal__footer">
          <button class="rules-modal__btn" type="button">Zatvori</button>
        </div>
      </div>
    `;

    const closeButtons = [
      modal.querySelector(".rules-modal__close"),
      modal.querySelector(".rules-modal__btn")
    ];

    closeButtons.forEach(btn => {
      btn.addEventListener("click", () => modal.remove());
    });

    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.remove();
    });

    document.addEventListener("keydown", function escHandler(e) {
      if (e.key === "Escape") {
        modal.remove();
        document.removeEventListener("keydown", escHandler);
      }
    });

    document.body.appendChild(modal);
  }

  brands.forEach(brand => {
    const img = qs("img", brand);
    if (img) img.classList.add("logo-glow");

    brand.addEventListener("click", function (e) {
      e.preventDefault();

      if (img) {
        img.classList.remove("logo-bounce");
        void img.offsetWidth;
        img.classList.add("logo-bounce");
      }

      createModal();
    });
  });
}

// -------------------------
// SIGNUP
// -------------------------
function initSignup() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("su-username").value.trim();
    const password = document.getElementById("su-password").value.trim();
    const confirm = document.getElementById("su-confirm").value.trim();
    const email = document.getElementById("su-email").value.trim().toLowerCase();
    const role = document.getElementById("su-role").value;

    if (!username || !password || !confirm || !email || !role) {
      showMessage("su-msg", "Popuni sva polja.", true);
      return;
    }

    if (password !== confirm) {
      showMessage("su-msg", "Password i potvrda passworda se ne poklapaju.", true);
      return;
    }

    const users = getUsers();
    const exists = users.some(user => user.email === email);

    if (exists) {
      showMessage("su-msg", "Korisnik sa tim emailom već postoji.", true);
      return;
    }

    const newUser = {
      id: generateId(),
      username,
      password,
      email,
      role
    };

    users.push(newUser);
    setUsers(users);

    showMessage("su-msg", "Registracija uspješna. Preusmjeravanje...", false);
    resetFormHard(form);

    setTimeout(() => {
      if (role === "VLASNIK") {
        window.location.href = "vlasnikhome.html";
      } else {
        window.location.href = "login.html";
      }
    }, 700);
  });
}

// -------------------------
// LOGIN
// -------------------------
function initLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("li-email").value.trim().toLowerCase();
    const password = document.getElementById("li-password").value.trim();

    if (!email || !password) {
      showMessage("li-msg", "Unesi email i password.", true);
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      showMessage("li-msg", "Pogrešan email ili password.", true);
      return;
    }

    setCurrentUser(user);
    showMessage("li-msg", "Prijava uspješna. Preusmjeravanje...", false);
    resetFormHard(form);

    setTimeout(() => {
      if (user.role === "VLASNIK") {
        window.location.href = "vlasnikhome.html";
      } else {
        window.location.href = "index.html";
      }
    }, 700);
  });
}

// -------------------------
// INDEX / NAV / LOGOUT
// -------------------------
function initIndexPage() {
  const nav = document.getElementById("nav-actions");
  if (!nav) return;

  const user = getCurrentUser();
  if (!user) return;

  nav.innerHTML = `
    <span class="welcome-user">Zdravo, ${user.username}</span>
    <button id="logoutBtn" class="btn btn--nav btn--dark">Logout</button>
  `;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearCurrentUser();
      window.location.href = "login.html";
    });
  }
}

// -------------------------
// OWNER PROVJERA
// -------------------------
function protectOwnerPages() {
  const ownerPages = [
    "vlasnikhome.html",
    "vlasniknapravisobu.html",
    "vlasnikpostojecesobe.html",
    "vlasnikeditsobe.html"
  ];

  const page = getPageName();
  if (!ownerPages.includes(page)) return;

  const user = getCurrentUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (user.role !== "VLASNIK") {
    window.location.href = "index.html";
  }
}

// -------------------------
// OWNER TOPBAR
// -------------------------
function initOwnerTopbar() {
  const topbarActions = qs(".topbar__actions");
  if (!topbarActions) return;

  const links = qsa("a", topbarActions);
  links.forEach(link => {
    if (link.textContent.trim().toLowerCase() === "logout") {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        clearCurrentUser();
        window.location.href = "login.html";
      });
    }
  });
}

// -------------------------
// KREIRAJ SOBU - KATEGORIJE
// -------------------------
function initCreateRoomPage() {
  const page = getPageName();
  if (page !== "vlasniknapravisobu.html") return;

  const categoryRows = qsa(".category-list .row-card");
  const actionButtons = qsa(".bottom-actions .btn");

  categoryRows.forEach(row => {
    const titleEl = qs("h3", row);
    const editBtn = qs(".btn--edit", row);

    if (!titleEl || !editBtn) return;

    const categoryName = titleEl.textContent.trim();
    const categorySlug = slugify(categoryName);

    row.dataset.category = categorySlug;

    editBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = `vlasnikeditsobe.html?mode=category&category=${encodeURIComponent(categorySlug)}`;
    });
  });

  const addQuestionsBtn = actionButtons.find(btn =>
    btn.textContent.trim().toLowerCase().includes("dodaj pitanja")
  );

  if (addQuestionsBtn) {
    addQuestionsBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "vlasnikeditsobe.html?mode=new";
    });
  }

  const createRoomBtn = actionButtons.find(btn =>
    btn.textContent.trim().toLowerCase().includes("napravi sobu")
  );

  if (createRoomBtn) {
    createRoomBtn.addEventListener("click", function (e) {
      e.preventDefault();

      const categoryEls = qsa(".category-list .row-card");
      const selectedCategories = categoryEls.map(row => row.dataset.category).filter(Boolean);

      const categoryQuestions = getCategoryQuestions();
      let allQuestions = [];

      selectedCategories.forEach(cat => {
        if (categoryQuestions[cat]) {
          allQuestions = allQuestions.concat(categoryQuestions[cat]);
        }
      });

      const rooms = getRooms();
      const roomNumber = rooms.length + 1;

      const newRoom = {
        id: generateId(),
        title: `Soba ${roomNumber} - Nova soba`,
        categories: selectedCategories,
        questions: allQuestions
      };

      rooms.push(newRoom);
      setRooms(rooms);

      alert("Soba je uspješno napravljena.");
      window.location.href = "vlasnikpostojecesobe.html";
    });
  }
}

// -------------------------
// POSTOJEĆE SOBE
// -------------------------
function initExistingRoomsPage() {
  const page = getPageName();
  if (page !== "vlasnikpostojecesobe.html") return;

  const roomList = qs(".room-list");
  if (!roomList) return;

  const rooms = getRooms();

  roomList.innerHTML = "";

  if (!rooms.length) {
    roomList.innerHTML = `
      <div class="row-card">
        <div>
          <h3>Nema soba</h3>
          <p>Još nema prethodno napravljenih soba.</p>
        </div>
      </div>
    `;
    return;
  }

  rooms.forEach(room => {
    const div = document.createElement("div");
    div.className = "row-card";
    div.innerHTML = `
      <div>
        <h3>${room.title}</h3>
        <p>Kategorije: ${room.categories.length ? room.categories.join(", ") : "Bez kategorija"}</p>
      </div>
      <a href="vlasnikeditsobe.html?mode=room&id=${room.id}" class="btn btn--edit">Edit</a>
    `;
    roomList.appendChild(div);
  });
}

// -------------------------
// EDIT STRANICA
// -------------------------
function createQuestionBlock(question = {}, index = null) {
  const block = document.createElement("div");
  block.className = "question-block";

  const labelText = index !== null ? `Pitanje ${index + 1}` : "Novo pitanje";

  block.innerHTML = `
    <label>${labelText}</label>
    <input type="text" class="input q-question" value="${question.question || ""}" placeholder="Unesite pitanje" />

    <label>Odgovor A</label>
    <input type="text" class="input q-a" value="${question.a || ""}" placeholder="Unesite odgovor A" />

    <label>Odgovor B</label>
    <input type="text" class="input q-b" value="${question.b || ""}" placeholder="Unesite odgovor B" />

    <label>Odgovor C</label>
    <input type="text" class="input q-c" value="${question.c || ""}" placeholder="Unesite odgovor C" />

    <label>Tačan odgovor</label>
    <input type="text" class="input q-correct" value="${question.correct || ""}" placeholder="Unesite tačan odgovor" />
  `;

  return block;
}

function collectQuestionsFromDOM() {
  const blocks = qsa(".question-block");
  return blocks
    .map(block => {
      const question = qs(".q-question", block)?.value.trim() || "";
      const a = qs(".q-a", block)?.value.trim() || "";
      const b = qs(".q-b", block)?.value.trim() || "";
      const c = qs(".q-c", block)?.value.trim() || "";
      const correct = qs(".q-correct", block)?.value.trim() || "";

      if (!question && !a && !b && !c && !correct) return null;

      return { question, a, b, c, correct };
    })
    .filter(Boolean);
}

function initEditPage() {
  const page = getPageName();
  if (page !== "vlasnikeditsobe.html") return;

  const panel = qs(".panel");
  if (!panel) return;

  const mode = getParam("mode");
  const category = getParam("category");
  const roomId = getParam("id");

  const oldBlocks = qsa(".question-block", panel);
  oldBlocks.forEach(block => block.remove());

  const actionContainer = qs(".bottom-actions", panel);

  let dataTitle = "Pitanja";
  let existingQuestions = [];

  if (mode === "category" && category) {
    const categoryQuestions = getCategoryQuestions();
    existingQuestions = categoryQuestions[category] || [];
    dataTitle = `Kategorija: ${category}`;
  } else if (mode === "room" && roomId) {
    const rooms = getRooms();
    const room = rooms.find(r => String(r.id) === String(roomId));
    existingQuestions = room?.questions || [];
    dataTitle = room?.title || "Soba";
  } else {
    existingQuestions = [];
    dataTitle = "Nova pitanja";
  }

  const heroTitle = qs(".page-hero__title");
  if (heroTitle) {
    heroTitle.textContent = dataTitle;
  }

  if (!existingQuestions.length) {
    panel.insertBefore(createQuestionBlock({}, 0), actionContainer);
  } else {
    existingQuestions.forEach((q, i) => {
      panel.insertBefore(createQuestionBlock(q, i), actionContainer);
    });
  }

  const buttons = qsa(".bottom-actions .btn", panel);
  const addBtn = buttons.find(btn =>
    btn.textContent.trim().toLowerCase().includes("dodaj novo pitanje")
  );
  const saveBtn = buttons.find(btn =>
    btn.textContent.trim().toLowerCase().includes("sačuvaj") ||
    btn.textContent.trim().toLowerCase().includes("sacuvaj")
  );

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      const questionBlocks = qsa(".question-block", panel);
      const newBlock = createQuestionBlock({}, questionBlocks.length);
      panel.insertBefore(newBlock, actionContainer);
      newBlock.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      const newQuestions = collectQuestionsFromDOM();

      if (!newQuestions.length) {
        alert("Dodaj bar jedno pitanje.");
        return;
      }

      if (mode === "category" && category) {
        const categoryQuestions = getCategoryQuestions();
        categoryQuestions[category] = newQuestions;
        setCategoryQuestions(categoryQuestions);
        alert("Pitanja kategorije su sačuvana.");
      } else if (mode === "room" && roomId) {
        const rooms = getRooms();
        const roomIndex = rooms.findIndex(r => String(r.id) === String(roomId));

        if (roomIndex !== -1) {
          rooms[roomIndex].questions = newQuestions;
          setRooms(rooms);
          alert("Pitanja sobe su sačuvana.");
        }
      } else {
        const categoryQuestions = getCategoryQuestions();
        const customKey = `custom-${generateId()}`;
        categoryQuestions[customKey] = newQuestions;
        setCategoryQuestions(categoryQuestions);
        alert("Nova pitanja su sačuvana.");
      }
    });
  }
}

// -------------------------
// START
// -------------------------
document.addEventListener("DOMContentLoaded", function () {
  seedInitialData();
  initNoCacheForms();

  protectOwnerPages();

  initPasswordToggles();
  initLogoRulesModal();

  initSignup();
  initLogin();
  initIndexPage();
  initHomeCarousel();

  initOwnerTopbar();
  initCreateRoomPage();
  initExistingRoomsPage();
  initEditPage();
});