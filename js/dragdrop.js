// =============================================================
// js/dragdrop.js — Drag & Drop (SortableJS)
// =============================================================
// Enables: card reordering within sections, moving between sections,
//          and section reordering by header handle.
// Depends on: SortableJS CDN, js/dashboard.js, js/ui.js
// =============================================================

const DragDrop = (() => {
  const _instances = []; // Track all Sortable instances for cleanup

  // ── Initialize all drag zones ────────────────────────────────
  function initializeDragDrop() {
    destroyAll(); // clean up stale instances before re-init

    // ── Card grids (within and between sections) ───────────────
    document.querySelectorAll(".cards-grid").forEach((grid) => {
      const sectionId = grid.dataset.sectionId;

      const sortable = Sortable.create(grid, {
        group:      "dashboard-cards",     // same group = cross-section drag
        animation:  180,
        easing:     "cubic-bezier(0.4, 0, 0.2, 1)",
        ghostClass: "card-ghost",          // CSS class on placeholder
        chosenClass:"card-chosen",         // CSS class on dragged item
        dragClass:  "card-dragging",       // CSS class while dragging
        handle:     ".drag-handle",        // only drag by grip icon
        delay:      80,                    // slight delay to distinguish from click
        delayOnTouchOnly: true,

        onStart() {
          document.body.classList.add("is-dragging");
        },
        onEnd(evt) {
          document.body.classList.remove("is-dragging");

          const fromId   = evt.from.dataset.sectionId;
          const toId     = evt.to.dataset.sectionId;
          const cardId   = evt.item.dataset.cardId;
          const newIndex = evt.newIndex;

          if (fromId === toId) {
            // Reorder within the same section
            const newOrder = Array.from(evt.to.children)
              .map((el) => el.dataset.cardId)
              .filter(Boolean);
            Dashboard.reorderCards(toId, newOrder).then(() => {
              UI.showToast("Order saved", "success");
            });
          } else {
            // Move to a different section
            Dashboard.moveCard(fromId, toId, cardId, newIndex).then(() => {
              UI.showToast("Card moved & saved", "success");
            });
          }
        },
      });

      _instances.push(sortable);
    });

    // ── Section panels (drag by grip handle in section header) ─
    const container = document.getElementById("sectionsContainer");
    if (container) {
      const sectionSort = Sortable.create(container, {
        animation:  250,
        easing:     "cubic-bezier(0.4, 0, 0.2, 1)",
        ghostClass: "section-ghost",
        handle:     ".section-drag-handle",
        onStart() {
          document.body.classList.add("is-dragging");
        },
        onEnd() {
          document.body.classList.remove("is-dragging");
          const newOrder = Array.from(container.children)
            .map((el) => el.dataset.sectionId)
            .filter(Boolean);
          Dashboard.reorderSections(newOrder).then(() => {
            UI.showToast("Sections reordered", "success");
          });
        },
      });
      _instances.push(sectionSort);
    }
  }

  // ── Destroy all SortableJS instances ────────────────────────
  function destroyAll() {
    _instances.forEach((s) => {
      try { s.destroy(); } catch (_) {}
    });
    _instances.length = 0;
  }

  return { initializeDragDrop, destroyAll };
})();

window.DragDrop = DragDrop;
console.log("[DragDrop] Module loaded ✓");
