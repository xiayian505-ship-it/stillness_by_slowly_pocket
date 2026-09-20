/* sbs_roster_v2_style.js
 * 純 UI 行為。
 * 不處理日期、班表資料、匯入匯出、儲存或規則。
 */
(() => {
  'use strict';

  const rosterViewTab = document.getElementById('rosterViewTab');
  const settingsViewTab = document.getElementById('settingsViewTab');
  const rulesViewTab = document.getElementById('rulesViewTab');
  const rosterView = document.getElementById('rosterView');
  const settingsView = document.getElementById('settingsView');
  const rulesView = document.getElementById('rulesView');

  const basicSettingsButton = document.getElementById('basicSettingsButton');
  const shiftConfigButton = document.getElementById('shiftConfigButton');
  const supervisorConfigButton = document.getElementById('supervisorConfigButton');
  const basicSettingsPanel = document.getElementById('basicSettingsPanel');
  const shiftConfigPanel = document.getElementById('shiftConfigPanel');
  const supervisorConfigPanel = document.getElementById('supervisorConfigPanel');

  const operationGuideButton = document.getElementById('operationGuideButton');
  const companyRulesButton = document.getElementById('companyRulesButton');
  const operationGuidePanel = document.getElementById('operationGuidePanel');
  const companyRulesPanel = document.getElementById('companyRulesPanel');

  const shiftSeniorityButton = document.getElementById('shiftSeniorityButton');
  const shiftPeopleButton = document.getElementById('shiftPeopleButton');
  const shiftSeniorityInfo = document.getElementById('shiftSeniorityInfo');
  const shiftConfigGrid = document.getElementById('shiftConfigGrid');

  const supervisorSeniorityButton = document.getElementById('supervisorSeniorityButton');
  const supervisorPeopleButton = document.getElementById('supervisorPeopleButton');
  const supervisorSeniorityInfo = document.getElementById('supervisorSeniorityInfo');
  const supervisorConfigBody = document.getElementById('supervisorConfigBody');

  function setMainView(view) {
    const showRoster = view === 'roster';
    const showSettings = view === 'settings';
    const showRules = view === 'rules';

    rosterView.hidden = !showRoster;
    settingsView.hidden = !showSettings;
    rulesView.hidden = !showRules;

    rosterViewTab.classList.toggle('is-active', showRoster);
    settingsViewTab.classList.toggle('is-active', showSettings);
    rulesViewTab.classList.toggle('is-active', showRules);
    rosterViewTab.setAttribute('aria-selected', String(showRoster));
    settingsViewTab.setAttribute('aria-selected', String(showSettings));
    rulesViewTab.setAttribute('aria-selected', String(showRules));

    if (showSettings) resetSettingsSection();
    if (showRules) resetGuideSection();
  }

  function setSettingsTopActive(button) {
    [basicSettingsButton, shiftConfigButton, supervisorConfigButton].forEach((item) => {
      item?.classList.toggle('is-active', item === button);
    });
  }

  function resetSettingsSection() {
    if (basicSettingsPanel) basicSettingsPanel.hidden = true;
    if (shiftConfigPanel) shiftConfigPanel.hidden = true;
    if (supervisorConfigPanel) supervisorConfigPanel.hidden = true;
    setSettingsTopActive(null);
  }

  function showBasicSettings() {
    if (shiftConfigPanel) shiftConfigPanel.hidden = true;
    if (supervisorConfigPanel) supervisorConfigPanel.hidden = true;
    if (basicSettingsPanel) basicSettingsPanel.hidden = false;
    setSettingsTopActive(basicSettingsButton);
  }

  function showShiftSettings() {
    if (basicSettingsPanel) basicSettingsPanel.hidden = true;
    if (supervisorConfigPanel) supervisorConfigPanel.hidden = true;
    if (shiftConfigPanel) shiftConfigPanel.hidden = false;
    setSettingsTopActive(shiftConfigButton);
  }

  function showSupervisorSettings() {
    if (basicSettingsPanel) basicSettingsPanel.hidden = true;
    if (shiftConfigPanel) shiftConfigPanel.hidden = true;
    if (supervisorConfigPanel) supervisorConfigPanel.hidden = false;
    setSettingsTopActive(supervisorConfigButton);
  }

  function resetGuideSection() {
    if (operationGuidePanel) operationGuidePanel.hidden = true;
    if (companyRulesPanel) companyRulesPanel.hidden = true;
    operationGuideButton?.classList.remove('is-active');
    companyRulesButton?.classList.remove('is-active');
  }

  function showGuideSection(kind) {
    const operation = kind === 'operation';
    operationGuidePanel.hidden = !operation;
    companyRulesPanel.hidden = operation;
    operationGuideButton.classList.toggle('is-active', operation);
    companyRulesButton.classList.toggle('is-active', !operation);
  }

  function showShiftSubsection(kind) {
    const showSeniority = kind === 'seniority';
    shiftSeniorityInfo.hidden = !showSeniority;
    shiftConfigGrid.hidden = showSeniority;
    shiftSeniorityButton.setAttribute('aria-expanded', String(showSeniority));
    shiftSeniorityButton.classList.toggle('is-active', showSeniority);
    shiftPeopleButton?.classList.toggle('is-active', !showSeniority);
    shiftPeopleButton?.setAttribute('aria-pressed', String(!showSeniority));
  }

  function showSupervisorSubsection(kind) {
    const showSeniority = kind === 'seniority';
    supervisorSeniorityInfo.hidden = !showSeniority;
    supervisorConfigBody.hidden = showSeniority;
    supervisorSeniorityButton.setAttribute('aria-expanded', String(showSeniority));
    supervisorSeniorityButton.classList.toggle('is-active', showSeniority);
    supervisorPeopleButton?.classList.toggle('is-active', !showSeniority);
    supervisorPeopleButton?.setAttribute('aria-pressed', String(!showSeniority));
  }

  rosterViewTab?.addEventListener('click', () => setMainView('roster'));
  settingsViewTab?.addEventListener('click', () => setMainView('settings'));
  rulesViewTab?.addEventListener('click', () => setMainView('rules'));
  basicSettingsButton?.addEventListener('click', showBasicSettings);
  shiftConfigButton?.addEventListener('click', showShiftSettings);
  supervisorConfigButton?.addEventListener('click', showSupervisorSettings);
  operationGuideButton?.addEventListener('click', () => showGuideSection('operation'));
  companyRulesButton?.addEventListener('click', () => showGuideSection('company'));
  shiftSeniorityButton?.addEventListener('click', () => showShiftSubsection('seniority'));
  shiftPeopleButton?.addEventListener('click', () => showShiftSubsection('people'));
  supervisorSeniorityButton?.addEventListener('click', () => showSupervisorSubsection('seniority'));
  supervisorPeopleButton?.addEventListener('click', () => showSupervisorSubsection('people'));

  setMainView('roster');
})();
