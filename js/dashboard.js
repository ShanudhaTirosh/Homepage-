// =============================================================
// js/dashboard.js — Dashboard Data Management (Firestore)
// =============================================================
// Handles: sections/cards CRUD, Firestore sync, default layout
// Depends on: js/firebase.js
// Firestore structure: users/{userId} → { sections: [...] }
// =============================================================

const Dashboard = (() => {
  const db = window.firebaseDb;

  // ── In-memory state ──────────────────────────────────────────
  let _sections = [];
  let _userId   = null;

  // ── Unique ID generator ─────────────────────────────────────
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Default layout for first-time users ─────────────────────
  // Contains all shortcut categories from the original page
  function _buildDefaultSections() {
    const id = generateId;
    return [
      {
        id: id(), name: "⭐ Favorites", order: 0,
        cards: [
          { id: id(), title: "GitHub",       icon: "fab fa-github",      url: "https://github.com",            description: "Version Control",   order: 0 },
          { id: id(), title: "Gmail",        icon: "bi bi-envelope-fill",url: "https://mail.google.com",       description: "Email",             order: 1 },
          { id: id(), title: "Google Drive", icon: "bi bi-hdd-fill",     url: "https://drive.google.com",      description: "Cloud Storage",      order: 2 },
          { id: id(), title: "Claude AI",    icon: "fas fa-brain",       url: "https://claude.ai",             description: "Anthropic AI",       order: 3 },
          { id: id(), title: "ChatGPT",      icon: "fas fa-comments",    url: "https://chat.openai.com",       description: "OpenAI",             order: 4 },
        ],
      },
      {
        id: id(), name: "💻 Development", order: 1,
        cards: [
          { id: id(), title: "GitHub",       icon: "fab fa-github",          url: "https://github.com",           description: "Version Control",    order: 0 },
          { id: id(), title: "GitLab",       icon: "fab fa-gitlab",          url: "https://gitlab.com",           description: "DevOps Platform",    order: 1 },
          { id: id(), title: "Figma",        icon: "fab fa-figma",           url: "https://figma.com",            description: "Design Tool",        order: 2 },
          { id: id(), title: "HackerRank",   icon: "fas fa-code",            url: "https://hackerrank.com",       description: "Coding Practice",    order: 3 },
          { id: id(), title: "TryHackMe",    icon: "fas fa-shield-alt",      url: "https://tryhackme.com",        description: "Cyber Security",     order: 4 },
          { id: id(), title: "freeCodeCamp", icon: "fab fa-free-code-camp",  url: "https://freecodecamp.org",     description: "Learn to Code",      order: 5 },
          { id: id(), title: "CodePen",      icon: "fab fa-codepen",         url: "https://codepen.io",           description: "Code Playground",    order: 6 },
          { id: id(), title: "VS Code",      icon: "fas fa-code",            url: "vscode://vscode.github-authentication/did-authenticate", description: "Code Editor", order: 7 },
        ],
      },
      {
        id: id(), name: "🤖 AI & Cloud", order: 2,
        cards: [
          { id: id(), title: "AI Studio",    icon: "fab fa-google",      url: "https://aistudio.google.com",   description: "AI Development",     order: 0 },
          { id: id(), title: "Firebase",     icon: "fas fa-fire",        url: "https://firebase.google.com",   description: "Backend Platform",   order: 1 },
          { id: id(), title: "Gemini",       icon: "fas fa-gem",         url: "https://gemini.google.com",     description: "Google AI",          order: 2 },
          { id: id(), title: "ChatGPT",      icon: "fas fa-comments",    url: "https://chat.openai.com",       description: "OpenAI",             order: 3 },
          { id: id(), title: "Copilot",      icon: "fab fa-microsoft",   url: "https://copilot.microsoft.com", description: "Microsoft AI",       order: 4 },
          { id: id(), title: "Google Cloud", icon: "fab fa-google",      url: "https://cloud.google.com",      description: "Cloud Services",     order: 5 },
          { id: id(), title: "Claude",       icon: "fas fa-brain",       url: "https://claude.ai",             description: "Anthropic AI",       order: 6 },
        ],
      },
      {
        id: id(), name: "📱 Social", order: 3,
        cards: [
          { id: id(), title: "WhatsApp Web", icon: "fab fa-whatsapp",   url: "https://web.whatsapp.com",      description: "Messaging",          order: 0 },
          { id: id(), title: "Facebook",     icon: "fab fa-facebook",   url: "https://facebook.com",          description: "Social Network",     order: 1 },
          { id: id(), title: "Twitter / X",  icon: "fab fa-twitter",    url: "https://twitter.com",           description: "Social Media",       order: 2 },
          { id: id(), title: "Instagram",    icon: "fab fa-instagram",  url: "https://instagram.com",         description: "Photo Sharing",      order: 3 },
          { id: id(), title: "LinkedIn",     icon: "fab fa-linkedin",   url: "https://linkedin.com",          description: "Professional",       order: 4 },
          { id: id(), title: "Reddit",       icon: "fab fa-reddit",     url: "https://reddit.com",            description: "Communities",        order: 5 },
        ],
      },
      {
        id: id(), name: "🎬 Media & Finance", order: 4,
        cards: [
          { id: id(), title: "YouTube",      icon: "fab fa-youtube",    url: "https://youtube.com",           description: "Video Platform",     order: 0 },
          { id: id(), title: "Spotify",      icon: "fab fa-spotify",    url: "https://open.spotify.com",      description: "Music Streaming",    order: 1 },
          { id: id(), title: "Bybit",        icon: "fas fa-chart-line", url: "https://bybit.com",             description: "Crypto Trading",     order: 2 },
          { id: id(), title: "Google Pay",   icon: "fab fa-google-pay", url: "https://pay.google.com",        description: "Digital Payments",   order: 3 },
        ],
      },
      {
        id: id(), name: "🔑 Accounts", order: 5,
        cards: [
          { id: id(), title: "Google Acct",  icon: "fab fa-google",     url: "https://myaccount.google.com",  description: "Manage Settings",    order: 0 },
          { id: id(), title: "Microsoft",    icon: "fab fa-microsoft",  url: "https://account.microsoft.com", description: "Account Settings",   order: 1 },
          { id: id(), title: "M365",         icon: "fas fa-briefcase",  url: "https://www.office.com",        description: "Office Suite",       order: 2 },
          { id: id(), title: "OneDrive",     icon: "bi bi-cloud-fill",  url: "https://onedrive.live.com",     description: "Cloud Storage",      order: 3 },
          { id: id(), title: "iCloud",       icon: "bi bi-apple",       url: "https://www.icloud.com",        description: "Apple Cloud",        order: 4 },
        ],
      },
    ];
  }

  // ── Firestore reference for current user ────────────────────
  function _userRef(uid) {
    return db.collection("users").doc(uid || _userId);
  }

  // ── Persist _sections to Firestore ──────────────────────────
  async function _persist(extraData = {}) {
    if (!_userId) return { success: false, error: "Not authenticated" };
    try {
      await _userRef().set({
        sections:  _sections,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        ...extraData,
      }, { merge: true });
      return { success: true };
    } catch (err) {
      console.error("[Dashboard] Save error:", err);
      return { success: false, error: err.message };
    }
  }

  // ── Load layout on login ─────────────────────────────────────
  async function loadSections(userId) {
    _userId = userId;
    try {
      const snap = await _userRef(userId).get();
      if (snap.exists && snap.data().sections?.length) {
        _sections = snap.data().sections;
        return { success: true, sections: _sections, isNew: false };
      } else {
        // First-time user — seed defaults
        _sections = _buildDefaultSections();
        await _persist({
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          email: Auth.getCurrentUser()?.email || "",
        });
        return { success: true, sections: _sections, isNew: true };
      }
    } catch (err) {
      console.error("[Dashboard] Load error:", err);
      // Fallback to defaults if Firestore fails (e.g. offline first load)
      _sections = _buildDefaultSections();
      return { success: true, sections: _sections, isNew: true };
    }
  }

  // ── Sections CRUD ────────────────────────────────────────────
  async function addSection(name) {
    const section = {
      id:    generateId(),
      name,
      order: _sections.length,
      cards: [],
    };
    _sections.push(section);
    await _persist();
    return section;
  }

  async function updateSection(sectionId, name) {
    const s = _sections.find(x => x.id === sectionId);
    if (!s) return false;
    s.name = name;
    await _persist();
    return true;
  }

  async function deleteSection(sectionId) {
    _sections = _sections.filter(s => s.id !== sectionId);
    _sections.forEach((s, i) => (s.order = i));
    await _persist();
  }

  async function reorderSections(orderedIds) {
    const map = Object.fromEntries(_sections.map(s => [s.id, s]));
    _sections = orderedIds.map((id, i) => {
      const s = map[id];
      if (s) s.order = i;
      return s;
    }).filter(Boolean);
    await _persist();
  }

  // ── Cards CRUD ───────────────────────────────────────────────
  async function addCard(sectionId, data) {
    const s = _sections.find(x => x.id === sectionId);
    if (!s) return null;
    const card = {
      id:          generateId(),
      title:       data.title       || "New Card",
      icon:        data.icon        || "fas fa-link",
      url:         data.url         || "#",
      description: data.description || "",
      order:       s.cards.length,
    };
    s.cards.push(card);
    await _persist();
    return card;
  }

  async function updateCard(sectionId, cardId, data) {
    const s = _sections.find(x => x.id === sectionId);
    if (!s) return false;
    const c = s.cards.find(x => x.id === cardId);
    if (!c) return false;
    Object.assign(c, data);
    await _persist();
    return true;
  }

  async function deleteCard(sectionId, cardId) {
    const s = _sections.find(x => x.id === sectionId);
    if (!s) return false;
    s.cards = s.cards.filter(c => c.id !== cardId);
    s.cards.forEach((c, i) => (c.order = i));
    await _persist();
    return true;
  }

  async function reorderCards(sectionId, orderedIds) {
    const s = _sections.find(x => x.id === sectionId);
    if (!s) return false;
    const map = Object.fromEntries(s.cards.map(c => [c.id, c]));
    s.cards = orderedIds.map((id, i) => {
      const c = map[id];
      if (c) c.order = i;
      return c;
    }).filter(Boolean);
    await _persist();
    return true;
  }

  // Move a card from one section to another
  async function moveCard(fromSectionId, toSectionId, cardId, newIndex) {
    const from = _sections.find(x => x.id === fromSectionId);
    const to   = _sections.find(x => x.id === toSectionId);
    if (!from || !to) return false;

    const card = from.cards.find(c => c.id === cardId);
    if (!card) return false;

    // Remove from source
    from.cards = from.cards.filter(c => c.id !== cardId);
    from.cards.forEach((c, i) => (c.order = i));

    // Insert at destination index
    to.cards.splice(newIndex, 0, card);
    to.cards.forEach((c, i) => (c.order = i));

    await _persist();
    return true;
  }

  // ── Reset to defaults ────────────────────────────────────────
  async function resetLayout() {
    _sections = _buildDefaultSections();
    await _persist();
    return _sections;
  }

  // ── Getters ──────────────────────────────────────────────────
  const getSections   = ()    => _sections;
  const getSection    = (id)  => _sections.find(s => s.id === id);
  const getUserId     = ()    => _userId;

  return {
    loadSections, resetLayout,
    addSection, updateSection, deleteSection, reorderSections,
    addCard, updateCard, deleteCard, reorderCards, moveCard,
    getSections, getSection, getUserId,
    generateId,
  };
})();

window.Dashboard = Dashboard;
console.log("[Dashboard] Module loaded ✓");
