/* sbs_roster_v2 / style.js
 * UI behavior only.
 * No roster data, leave rules, validation, JSON, Excel, or other business logic.
 */
(() => {
  "use strict";

  const topTabs = [...document.querySelectorAll(".page-tab[data-view]")];
  const views = [...document.querySelectorAll(".app-view")];

  function showView(viewId) {
    views.forEach((view) => {
      view.hidden = view.id !== viewId;
    });

    topTabs.forEach((tab) => {
      const active = tab.dataset.view === viewId;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
  }

  topTabs.forEach((tab) => {
    tab.addEventListener("click", () => showView(tab.dataset.view));
  });

  document.querySelectorAll(".sub-tabs").forEach((tabGroup) => {
    const buttons = [...tabGroup.querySelectorAll("button[data-panel]")];

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
        });

        buttons.forEach((item) => {
          const panel = document.getElementById(item.dataset.panel);
          if (panel) panel.hidden = item !== button;
        });
      });
    });
  });
})();
