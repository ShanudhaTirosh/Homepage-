// =============================================================
// js/ui.js — UI Rendering, Modals & Notifications
// =============================================================
// Depends on: js/dashboard.js, js/dragdrop.js, js/auth.js
// =============================================================

const UI = (() => {

  // ════════════════════════════════════════════════════════════
  // UTILITY
  // ════════════════════════════════════════════════════════════

  // Safely escape HTML to prevent XSS
  function esc(str) {
    if (str == null) return "";
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // Debounce — prevent rapid repeated calls
  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  // ════════════════════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ════════════════════════════════════════════════════════════

  function showToast(message, type = "info", duration = 3000) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const icons = { success: "bi-check-circle-fill", error: "bi-x-octagon-fill", info: "bi-info-circle-fill", warn: "bi-exclamation-triangle-fill" };
    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `<i class="bi ${icons[type] || icons.info} me-2"></i>${esc(message)}`;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  // ════════════════════════════════════════════════════════════
  // AUTH OVERLAY
  // ════════════════════════════════════════════════════════════

  function showAuthOverlay() {
    _get("authOverlay").style.display    = "flex";
    _get("dashboardSection").style.display = "none";
    _get("userFloatingBtn").style.display  = "none";
    // Update hero title
    const title = document.querySelector(".hero-title");
    if (title) title.textContent = "Welcome Back";
  }

  function hideAuthOverlay() {
    // Animate out
    const overlay = _get("authOverlay");
    overlay.classList.add("fade-out");
    setTimeout(() => {
      overlay.style.display = "none";
      overlay.classList.remove("fade-out");
    }, 400);
    _get("dashboardSection").style.display  = "block";
    _get("userFloatingBtn").style.display   = "flex";
  }

  function setAuthError(message, formId = "loginForm") {
    const el = document.querySelector(`#${formId} .auth-error`);
    if (!el) return;
    el.textContent = message || "";
    el.style.display = message ? "flex" : "none";
  }

  // ════════════════════════════════════════════════════════════
  // USER INFO & FLOATING BUTTON
  // ════════════════════════════════════════════════════════════

  function updateUserInfo(user) {
    const name = user.displayName || user.email?.split("@")[0] || "User";
    const el_name  = _get("userDisplayName");
    const el_email = _get("userEmail");
    const el_title = document.querySelector(".hero-title");
    if (el_name)  el_name.textContent  = name;
    if (el_email) el_email.textContent = user.email;
    if (el_title) el_title.textContent = `Welcome, ${name.split(" ")[0]} 👋`;
  }

  function toggleUserMenu() {
    const menu = _get("userMenu");
    const open = menu.style.display !== "none";
    menu.style.display = open ? "none" : "block";
  }

  // Close user menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-fab")) {
      const menu = _get("userMenu");
      if (menu) menu.style.display = "none";
    }
  });

  // ════════════════════════════════════════════════════════════
  // DASHBOARD RENDERING
  // ════════════════════════════════════════════════════════════

  function renderDashboard(sections) {
    const container = _get("sectionsContainer");
    if (!container) return;

    container.innerHTML = "";

    const sorted = [...sections].sort((a, b) => a.order - b.order);

    if (sorted.length === 0) {
      container.innerHTML = `
        <div class="dashboard-empty">
          <i class="bi bi-grid-3x3-gap-fill"></i>
          <p>No sections yet.</p>
          <button class="glass-btn primary" onclick="UI.openAddSectionModal()">
            <i class="bi bi-plus-lg me-2"></i>Add First Section
          </button>
        </div>`;
      return;
    }

    sorted.forEach((section) => {
      container.appendChild(_createSectionEl(section));
    });

    // Staggered entrance animation
    container.querySelectorAll(".section-panel").forEach((el, i) => {
      el.style.animationDelay = `${i * 60}ms`;
      el.classList.add("section-enter");
    });

    // Re-initialize drag-and-drop after full re-render
    DragDrop.initializeDragDrop();
  }

  function _createSectionEl(section) {
    const div = document.createElement("div");
    div.className        = "section-panel glass";
    div.dataset.sectionId = section.id;

    const sortedCards = [...(section.cards || [])].sort((a, b) => a.order - b.order);

    div.innerHTML = `
      <div class="section-header">
        <div class="section-header-left">
          <span class="section-drag-handle" title="Drag to reorder sections">
            <i class="bi bi-grip-vertical"></i>
          </span>
          <span class="section-title">${esc(section.name)}</span>
          <span class="card-count">${sortedCards.length}</span>
        </div>
        <div class="section-actions">
          <button class="sec-btn add-card-inline" onclick="UI.openAddCardModal('${section.id}')" title="Add Card">
            <i class="bi bi-plus-lg"></i>
          </button>
          <button class="sec-btn edit-sec" onclick="UI.openEditSectionModal('${section.id}')" title="Rename">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="sec-btn delete-sec" onclick="UI.confirmDeleteSection('${section.id}')" title="Delete Section">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>

      <div class="cards-grid" data-section-id="${section.id}">
        ${sortedCards.map(c => _cardHtml(c, section.id)).join("")}
        <button class="add-card-tile" onclick="UI.openAddCardModal('${section.id}')" title="Add a new card">
          <i class="bi bi-plus-lg"></i>
          <span>Add</span>
        </button>
      </div>
    `;

    return div;
  }

  function _cardHtml(card, sectionId) {
    // Validate URL to avoid javascript: injection
    let href = esc(card.url || "#");

    return `
      <div class="dashboard-card" data-card-id="${card.id}" data-section-id="${sectionId}">
        <div class="drag-handle" title="Drag to move">
          <i class="bi bi-grip-vertical"></i>
        </div>
        <a href="${href}" target="_blank" class="card-inner" rel="noopener noreferrer">
          <div class="card-icon-wrap">
            <i class="${esc(card.icon || "fas fa-link")}"></i>
          </div>
          <div class="card-title">${esc(card.title)}</div>
          <div class="card-desc">${esc(card.description)}</div>
        </a>
        <div class="card-actions">
          <button class="card-btn edit" onclick="event.stopPropagation();UI.openEditCardModal('${sectionId}','${card.id}')" title="Edit">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="card-btn del" onclick="event.stopPropagation();UI.confirmDeleteCard('${sectionId}','${card.id}')" title="Delete">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      </div>`;
  }

  // ════════════════════════════════════════════════════════════
  // ICON PICKER
  // ════════════════════════════════════════════════════════════

  const ICONS = [
    { c:"fab fa-github",       l:"GitHub"     }, { c:"fab fa-google",       l:"Google"     },
    { c:"fas fa-link",         l:"Link"        }, { c:"fas fa-code",         l:"Code"        },
    { c:"fab fa-youtube",      l:"YouTube"     }, { c:"fab fa-twitter",      l:"Twitter"     },
    { c:"fab fa-linkedin",     l:"LinkedIn"    }, { c:"fab fa-reddit",       l:"Reddit"      },
    { c:"fab fa-instagram",    l:"Instagram"   }, { c:"fab fa-spotify",      l:"Spotify"     },
    { c:"fab fa-slack",        l:"Slack"       }, { c:"fab fa-figma",        l:"Figma"       },
    { c:"fas fa-brain",        l:"AI"          }, { c:"fas fa-fire",         l:"Firebase"    },
    { c:"fas fa-cloud",        l:"Cloud"       }, { c:"bi bi-envelope-fill", l:"Email"       },
    { c:"fas fa-music",        l:"Music"       }, { c:"fas fa-film",         l:"Video"       },
    { c:"fas fa-chart-line",   l:"Chart"       }, { c:"fas fa-shield-alt",   l:"Security"    },
    { c:"fas fa-comments",     l:"Chat"        }, { c:"fas fa-book",         l:"Docs"        },
    { c:"fas fa-gamepad",      l:"Gaming"      }, { c:"fas fa-briefcase",    l:"Work"        },
    { c:"fas fa-shopping-cart",l:"Shop"        }, { c:"fas fa-newspaper",    l:"News"        },
    { c:"fas fa-university",   l:"Finance"     }, { c:"fas fa-home",         l:"Home"        },
    { c:"fab fa-microsoft",    l:"Microsoft"   }, { c:"fab fa-apple",        l:"Apple"       },
    { c:"fab fa-discord",      l:"Discord"     }, { c:"fab fa-whatsapp",     l:"WhatsApp"    },
    { c:"fab fa-codepen",      l:"CodePen"     }, { c:"fab fa-gitlab",       l:"GitLab"      },
    { c:"fas fa-gem",          l:"Gemini"      }, { c:"fas fa-robot",        l:"Robot"       },
    { c:"fas fa-terminal",     l:"Terminal"    }, { c:"fas fa-database",     l:"Database"    },
    { c:"fas fa-lock",         l:"Lock"        }, { c:"fas fa-star",         l:"Star"        },
  ];

  function _renderIconPicker(selected) {
    return ICONS.map(({ c, l }) => `
      <div class="icon-opt${c === selected ? " selected" : ""}"
           data-icon="${c}" onclick="UI.selectIcon('${c}')" title="${l}">
        <i class="${c}"></i>
      </div>`).join("");
  }

  function selectIcon(cls) {
    _get("cardIconInput").value = cls;
    document.querySelectorAll(".icon-opt").forEach(el => {
      el.classList.toggle("selected", el.dataset.icon === cls);
    });
    const prev = _get("iconPreview");
    if (prev) prev.className = cls;
  }

  // Live preview as user types custom icon class
  function _bindIconInput() {
    _get("cardIconInput")?.addEventListener("input", (e) => {
      const prev = _get("iconPreview");
      if (prev) prev.className = e.target.value || "fas fa-link";
      // Deselect all picker items
      document.querySelectorAll(".icon-opt").forEach(el => el.classList.remove("selected"));
    });
  }

  // ════════════════════════════════════════════════════════════
  // SECTION MODAL
  // ════════════════════════════════════════════════════════════

  function openAddSectionModal() {
    _get("sectionModalTitle").textContent = "Add New Section";
    _get("sectionNameInput").value        = "";
    _get("sectionModalForm").dataset.mode      = "add";
    _get("sectionModalForm").dataset.sectionId = "";
    showModal("sectionModal");
    setTimeout(() => _get("sectionNameInput")?.focus(), 80);
  }

  function openEditSectionModal(sectionId) {
    const s = Dashboard.getSection(sectionId);
    if (!s) return;
    _get("sectionModalTitle").textContent = "Rename Section";
    _get("sectionNameInput").value        = s.name;
    _get("sectionModalForm").dataset.mode      = "edit";
    _get("sectionModalForm").dataset.sectionId = sectionId;
    showModal("sectionModal");
    setTimeout(() => _get("sectionNameInput")?.focus(), 80);
  }

  async function saveSectionModal() {
    const name = _get("sectionNameInput").value.trim();
    if (!name) { showToast("Please enter a section name", "error"); return; }

    const form      = _get("sectionModalForm");
    const mode      = form.dataset.mode;
    const sectionId = form.dataset.sectionId;

    if (mode === "add") {
      await Dashboard.addSection(name);
      showToast(`Section "${name}" created`, "success");
    } else {
      await Dashboard.updateSection(sectionId, name);
      // Update label in-place without full re-render
      const el = document.querySelector(
        `.section-panel[data-section-id="${sectionId}"] .section-title`
      );
      if (el) el.textContent = name;
      showToast("Section renamed", "success");
    }

    renderDashboard(Dashboard.getSections());
    closeModal("sectionModal");
  }

  function confirmDeleteSection(sectionId) {
    const s = Dashboard.getSection(sectionId);
    if (!s) return;
    _showConfirmModal(
      "Delete Section",
      `Delete "${s.name}" and all its cards? This cannot be undone.`,
      async () => {
        await Dashboard.deleteSection(sectionId);
        renderDashboard(Dashboard.getSections());
        showToast("Section deleted", "success");
      }
    );
  }

  // ════════════════════════════════════════════════════════════
  // CARD MODAL
  // ════════════════════════════════════════════════════════════

  function openAddCardModal(sectionId) {
    _get("cardModalTitle").textContent     = "Add New Card";
    _get("cardTitleInput").value           = "";
    _get("cardDescInput").value            = "";
    _get("cardUrlInput").value             = "";
    _get("cardIconInput").value            = "fas fa-link";
    _get("iconPreview").className          = "fas fa-link";
    _get("iconPickerGrid").innerHTML       = _renderIconPicker("fas fa-link");
    _get("cardModalForm").dataset.mode     = "add";
    _get("cardModalForm").dataset.sectionId = sectionId;
    _get("cardModalForm").dataset.cardId   = "";
    showModal("cardModal");
    _bindIconInput();
    setTimeout(() => _get("cardTitleInput")?.focus(), 80);
  }

  function openEditCardModal(sectionId, cardId) {
    const s = Dashboard.getSection(sectionId);
    if (!s) return;
    const card = s.cards.find(c => c.id === cardId);
    if (!card) return;

    _get("cardModalTitle").textContent      = "Edit Card";
    _get("cardTitleInput").value            = card.title;
    _get("cardDescInput").value             = card.description;
    _get("cardUrlInput").value              = card.url;
    _get("cardIconInput").value             = card.icon;
    _get("iconPreview").className           = card.icon;
    _get("iconPickerGrid").innerHTML        = _renderIconPicker(card.icon);
    _get("cardModalForm").dataset.mode      = "edit";
    _get("cardModalForm").dataset.sectionId = sectionId;
    _get("cardModalForm").dataset.cardId    = cardId;
    showModal("cardModal");
    _bindIconInput();
    setTimeout(() => _get("cardTitleInput")?.focus(), 80);
  }

  async function saveCardModal() {
    const title = _get("cardTitleInput").value.trim();
    const url   = _get("cardUrlInput").value.trim();

    if (!title) { showToast("Title is required",   "error"); return; }
    if (!url)   { showToast("URL is required",     "error"); return; }

    const form      = _get("cardModalForm");
    const mode      = form.dataset.mode;
    const sectionId = form.dataset.sectionId;
    const cardId    = form.dataset.cardId;

    const data = {
      title,
      description: _get("cardDescInput").value.trim(),
      url,
      icon: _get("cardIconInput").value.trim() || "fas fa-link",
    };

    if (mode === "add") {
      await Dashboard.addCard(sectionId, data);
      showToast(`"${title}" added`, "success");
    } else {
      await Dashboard.updateCard(sectionId, cardId, data);
      showToast("Card updated", "success");
    }

    renderDashboard(Dashboard.getSections());
    closeModal("cardModal");
  }

  function confirmDeleteCard(sectionId, cardId) {
    const s = Dashboard.getSection(sectionId);
    if (!s) return;
    const card = s.cards.find(c => c.id === cardId);
    if (!card) return;

    _showConfirmModal(
      "Delete Card",
      `Delete "${card.title}"? This cannot be undone.`,
      async () => {
        await Dashboard.deleteCard(sectionId, cardId);
        renderDashboard(Dashboard.getSections());
        showToast("Card deleted", "success");
      }
    );
  }

  // ════════════════════════════════════════════════════════════
  // SETTINGS MODAL
  // ════════════════════════════════════════════════════════════

  function openSettingsModal() { showModal("settingsModal"); }

  function resetLayoutConfirm() {
    _showConfirmModal(
      "Reset Dashboard",
      "Reset to the default layout? All customizations will be lost.",
      async () => {
        showToast("Resetting…", "info");
        const sections = await Dashboard.resetLayout();
        renderDashboard(sections);
        closeModal("settingsModal");
        showToast("Layout reset to defaults", "success");
      }
    );
  }

  // ════════════════════════════════════════════════════════════
  // MODAL ENGINE
  // ════════════════════════════════════════════════════════════

  function showModal(id) {
    const overlay = _get(`${id}Overlay`);
    if (!overlay) return;
    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("visible"));
  }

  function closeModal(id) {
    const overlay = _get(`${id}Overlay`);
    if (!overlay) return;
    overlay.classList.remove("visible");
    setTimeout(() => { overlay.style.display = "none"; }, 300);
  }

  function _showConfirmModal(title, message, onConfirm) {
    _get("confirmModalTitle").textContent   = title;
    _get("confirmModalMessage").textContent = message;
    _get("confirmModalBtn").onclick = () => { onConfirm(); closeModal("confirmModal"); };
    showModal("confirmModal");
  }

  // ── Close modal on Escape key ─────────────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    ["sectionModal","cardModal","settingsModal","confirmModal"].forEach(id => {
      const ov = _get(`${id}Overlay`);
      if (ov && ov.style.display !== "none") closeModal(id);
    });
  });

  // ════════════════════════════════════════════════════════════
  // LOADING STATE
  // ════════════════════════════════════════════════════════════

  function showDashboardLoading() {
    const c = _get("sectionsContainer");
    if (c) c.innerHTML = `
      <div class="dashboard-loading">
        <div class="spinner-ring"></div>
        <p>Loading your dashboard…</p>
      </div>`;
  }

  // ════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ════════════════════════════════════════════════════════════

  function _get(id) { return document.getElementById(id); }

  // ════════════════════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════════════════════

  return {
    // Notifications
    showToast,
    // Auth
    showAuthOverlay, hideAuthOverlay, setAuthError, updateUserInfo, toggleUserMenu,
    // Dashboard
    renderDashboard, showDashboardLoading,
    // Sections
    openAddSectionModal, openEditSectionModal, saveSectionModal, confirmDeleteSection,
    // Cards
    openAddCardModal, openEditCardModal, saveCardModal, confirmDeleteCard, selectIcon,
    // Settings
    openSettingsModal, resetLayoutConfirm,
    // Modals
    showModal, closeModal,
    // Utility
    esc,
  };
})();

window.UI = UI;
console.log("[UI] Module loaded ✓");
