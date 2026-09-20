/* sbs_roster_v2_style.js
 * Pure UI state only: page tabs, settings/rules tabs, details menu housekeeping.
 * No roster data, validation, storage, JSON, Excel, leave or scheduling rules.
 */
(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);

  const pages = [
    ["rosterViewTab", "rosterView"],
    ["settingsViewTab", "settingsView"],
    ["rulesViewTab", "rulesView"]
  ];

  function showPage(viewId) {
    pages.forEach(([tabId, panelId]) => {
      const tab = byId(tabId);
      const panel = byId(panelId);
      const active = panelId === viewId;
      if (panel) panel.hidden = !active;
      if (tab) {
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      }
    });
  }

  pages.forEach(([tabId, panelId]) => {
    byId(tabId)?.addEventListener("click", () => showPage(panelId));
  });

  const settingsTabs = [
    ["basicSettingsButton", "basicSettingsPanel"],
    ["shiftConfigButton", "shiftConfigPanel"],
    ["supervisorConfigButton", "supervisorConfigPanel"]
  ];

  function showSettingsPanel(panelId) {
    settingsTabs.forEach(([buttonId, targetId]) => {
      const button = byId(buttonId);
      const panel = byId(targetId);
      const active = targetId === panelId;
      if (panel) panel.hidden = !active;
      if (button) {
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-expanded", String(active));
      }
    });
  }

  settingsTabs.forEach(([buttonId, panelId]) => {
    byId(buttonId)?.addEventListener("click", () => showSettingsPanel(panelId));
  });

  const basicLive = byId("basicSettingsLive");
  const ruleEditor = byId("ruleSettingsEditor");
  const basicLiveButton = byId("basicSettingsLiveButton");
  const editButton = byId("editRuleSettingsButton");

  function showBasicMode(mode) {
    const editing = mode === "edit";
    if (basicLive) basicLive.hidden = editing;
    if (ruleEditor) ruleEditor.hidden = !editing;
    basicLiveButton?.classList.toggle("is-active", !editing);
    editButton?.classList.toggle("is-active", editing);
    basicLiveButton?.setAttribute("aria-pressed", String(!editing));
    editButton?.setAttribute("aria-pressed", String(editing));
  }

  basicLiveButton?.addEventListener("click", () => showBasicMode("live"));
  editButton?.addEventListener("click", () => showBasicMode("edit"));
  byId("ruleSettingsCancel")?.addEventListener("click", () => showBasicMode("live"));

  function wirePeoplePanel(prefix) {
    const seniorityButton = byId(`${prefix}SeniorityButton`);
    const peopleButton = byId(`${prefix}PeopleButton`);
    const seniority = byId(`${prefix}SeniorityInfo`);
    const people = prefix === "shift" ? byId("shiftConfigGrid") : byId("supervisorConfigBody");

    const show = (mode) => {
      const seniorityOn = mode === "seniority";
      if (seniority) seniority.hidden = !seniorityOn;
      if (people) people.hidden = seniorityOn;
      seniorityButton?.classList.toggle("is-active", seniorityOn);
      peopleButton?.classList.toggle("is-active", !seniorityOn);
      seniorityButton?.setAttribute("aria-expanded", String(seniorityOn));
      peopleButton?.setAttribute("aria-pressed", String(!seniorityOn));
    };

    seniorityButton?.addEventListener("click", () => show("seniority"));
    peopleButton?.addEventListener("click", () => show("people"));
  }

  wirePeoplePanel("shift");
  wirePeoplePanel("supervisor");

  const guideTabs = [
    ["operationGuideButton", "operationGuidePanel"],
    ["companyRulesButton", "companyRulesPanel"]
  ];

  function showGuide(panelId) {
    guideTabs.forEach(([buttonId, targetId]) => {
      const active = targetId === panelId;
      const button = byId(buttonId);
      const panel = byId(targetId);
      if (panel) panel.hidden = !active;
      button?.classList.toggle("is-active", active);
    });
  }

  guideTabs.forEach(([buttonId, panelId]) => {
    byId(buttonId)?.addEventListener("click", () => showGuide(panelId));
  });

  // Pure UI defaults for pages that were previously opened by business JS.
  showPage("rosterView");
  showSettingsPanel("basicSettingsPanel");
  showBasicMode("live");
  showGuide("operationGuidePanel");

  // Keep top-level toolbar menus from piling on top of one another.
  document.querySelectorAll("#rosterView .toolbar-menu").forEach((menu) => {
    menu.addEventListener("toggle", () => {
      if (!menu.open) return;
      document.querySelectorAll("#rosterView .toolbar-menu").forEach((other) => {
        if (other !== menu) other.open = false;
      });
    });
  });
})();
