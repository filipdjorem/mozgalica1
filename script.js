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
    { title: "Edit pitanja", text: "Svaka kategorija se može posebno uređivati.", step: "Kartica 06" },
    { title: "Dodavanje pitanja", text: "Lako dodavanje novih pitanja i odgovora.", step: "Kartica 07" },
    { title: "Postojeće sobe", text: "Ranije sobe se mogu opet koristiti i mijenjati.", step: "Kartica 08" },
    { title: "Jednostavna navigacija", text: "Prelazak između stranica je brz i logičan.", step: "Kartica 09" },
    { title: "Pristup preko loga", text: "Klik na logo te vraća na početnu stranicu.", step: "Kartica 10" },
    { title: "Pregled kategorija", text: "Istorija, sport, geografija i druge oblasti.", step: "Kartica 11" },
    { title: "Kviz uživo", text: "Pitanja i igra mogu ići u realnom vremenu.", step: "Kartica 12" },
    { title: "Fokus na preglednost", text: "Bitne informacije su jasno odvojene.", step: "Kartica 13" },
    { title: "Hover efekti", text: "Dugmad i kartice imaju modernije reakcije na hover.", step: "Kartica 14" },
    { title: "Prilagođeno vlasniku", text: "Owner interfejs ima posebne opcije za upravljanje.", step: "Kartica 15" },
    { title: "Prilagođeno igraču", text: "Igrač vidi jednostavan i jasan tok korištenja.", step: "Kartica 16" },
    { title: "Brz povratak", text: "Logo uvijek vodi na početnu bez logouta.", step: "Kartica 17" },
    { title: "Sigurnije forme", text: "Polja se brišu nakon prijave i registracije.", step: "Kartica 18" },
    { title: "Automatsko kretanje", text: "Karosel se stalno pomjera bez klika korisnika.", step: "Kartica 19" },
    { title: "Pauza na hover", text: "Kad pređeš mišem preko kartice, kretanje staje.", step: "Kartica 20" }
  ];

  const duplicated = [...cards, ...cards];

  track.innerHTML = duplicated.map(card => `
    <article class="carousel-card">
      <img src="logo1.png" alt="Mozgalica prikaz" class="carousel-card__img">
      <span class="carousel-card__step">${card.step}</span>
      <h3>${card.title}</h3>
      <p>${card.text}</p>
    </article>
  `).join("");

  let paused = false;

  carousel.addEventListener("mouseenter", () => {
    paused = true;
  });

  carousel.addEventListener("mouseleave", () => {
    paused = false;
  });

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
// REGISTRACIJA
// -------------------------
function initSignup() {
  const signupForm = document.getElementById("signup-form");
  if (!signupForm) return;

  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("su-username")?.value.trim();
    const password = document.getElementById("su-password")?.value;
    const confirm = document.getElementById("su-confirm")?.value;
    const email = document.getElementById("su-email")?.value.trim().toLowerCase();
    const role = document.getElementById("su-role")?.value;

    if (!username || !password || !confirm || !email || !role) {
      showMessage("su-msg", "Popuni sva polja.", true);
      return;
    }

    if (password.length < 4) {
      showMessage("su-msg", "Password mora imati najmanje 4 karaktera.", true);
      return;
    }

    if (password !== confirm) {
      showMessage("su-msg", "Passwordi se ne poklapaju.", true);
      return;
    }

    const users = getUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      showMessage("su-msg", "Korisnik sa tim emailom već postoji.", true);
      return;
    }

    const newUser = {
      id: generateId(),
      username,
      email,
      password,
      role
    };

    users.push(newUser);
    setUsers(users);
    setCurrentUser(newUser);

    showMessage("su-msg", "Registracija uspješna.");

    resetFormHard(signupForm);

    setTimeout(() => {
      if (role === "VLASNIK") {
        window.location.href = "vlasnikhome.html";
      } else {
        window.location.href = "index.html";
      }
    }, 800);
  });
}

// -------------------------
// PRIJAVA
// -------------------------
function initLogin() {
  const loginForm = document.getElementById("login-form");
  if (!loginForm) return;

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("li-email")?.value.trim().toLowerCase();
    const password = document.getElementById("li-password")?.value;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      showMessage("li-msg", "Pogrešan email ili password.", true);
      return;
    }

    setCurrentUser(user);
    showMessage("li-msg", "Prijava uspješna.");

    resetFormHard(loginForm);

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

  initSignup();
  initLogin();
  initIndexPage();
  initHomeCarousel();

  initOwnerTopbar();
  initCreateRoomPage();
  initExistingRoomsPage();
  initEditPage();
});