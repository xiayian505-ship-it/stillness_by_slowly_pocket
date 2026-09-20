'use strict';

const rosterViewTab = document.getElementById('rosterViewTab');
const settingsViewTab = document.getElementById('settingsViewTab');
const rulesViewTab = document.getElementById('rulesViewTab');
const rosterView = document.getElementById('rosterView');
const settingsView = document.getElementById('settingsView');
const rulesView = document.getElementById('rulesView');
const basicSettingsButton = document.getElementById('basicSettingsButton');
const basicSettingsPanel = document.getElementById('basicSettingsPanel');
const basicSettingsLiveButton = document.getElementById('basicSettingsLiveButton');
const shiftPeopleButton = document.getElementById('shiftPeopleButton');
const supervisorPeopleButton = document.getElementById('supervisorPeopleButton');
const operationGuideButton = document.getElementById('operationGuideButton');
const companyRulesButton = document.getElementById('companyRulesButton');
const operationGuidePanel = document.getElementById('operationGuidePanel');
const companyRulesPanel = document.getElementById('companyRulesPanel');
const editRuleSettingsButton = document.getElementById('editRuleSettingsButton');
const ruleSettingsEditor = document.getElementById('ruleSettingsEditor');
const rulePublicLeaveText = document.getElementById('rulePublicLeaveText');
const ruleConsecutiveText = document.getElementById('ruleConsecutiveText');
const ruleTurnaroundText = document.getElementById('ruleTurnaroundText');
const ruleNightText = document.getElementById('ruleNightText');
const ruleShiftTimesText = document.getElementById('ruleShiftTimesText');
const ruleBlockedText = document.getElementById('ruleBlockedText');
const ruleBlockedTypesText = document.getElementById('ruleBlockedTypesText');
const ruleBlockedWeekdaysText = document.getElementById('ruleBlockedWeekdaysText');
const ruleSameDayText = document.getElementById('ruleSameDayText');
const ruleAdjacentText = document.getElementById('ruleAdjacentText');
const ruleMeetingText = document.getElementById('ruleMeetingText');
const rulePublicLeaveSettingInput = document.getElementById('rulePublicLeaveInput');
const ruleConsecutiveInput = document.getElementById('ruleConsecutiveInput');
const ruleTurnaroundInput = document.getElementById('ruleTurnaroundInput');
const ruleAnnualSixMonthInput = document.getElementById('ruleAnnualSixMonthInput');
const ruleAnnualYear1Input = document.getElementById('ruleAnnualYear1Input');
const ruleAnnualYear2Input = document.getElementById('ruleAnnualYear2Input');
const ruleAnnualYears3to4Input = document.getElementById('ruleAnnualYears3to4Input');
const ruleAnnualYears5to9Input = document.getElementById('ruleAnnualYears5to9Input');
const ruleAnnualYear10BaseInput = document.getElementById('ruleAnnualYear10BaseInput');
const ruleAnnualAfter10IncrementInput = document.getElementById('ruleAnnualAfter10IncrementInput');
const ruleAnnualMaxInput = document.getElementById('ruleAnnualMaxInput');
const ruleNightStartInput = document.getElementById('ruleNightStartInput');
const ruleNightEndInput = document.getElementById('ruleNightEndInput');
const ruleMeetingDefaultInput = document.getElementById('ruleMeetingDefaultInput');
const ruleSettingsCancel = document.getElementById('ruleSettingsCancel');
const ruleSettingsApply = document.getElementById('ruleSettingsApply');

const yearInput = document.getElementById('yearInput');
const monthInput = document.getElementById('monthInput');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const printButton = document.getElementById('printButton');
const blockModeButton = document.getElementById('blockModeButton');
const specialModeButton = document.getElementById('specialModeButton');
const nightModeButton = document.getElementById('nightModeButton');
const leaveTypeModeButton = document.getElementById('leaveTypeModeButton');
const meetingModeButton = document.getElementById('meetingModeButton');
const noteModeButton = document.getElementById('noteModeButton');
const shiftConfigButton = document.getElementById('shiftConfigButton');
const supervisorConfigButton = document.getElementById('supervisorConfigButton');
const leaveCheckButton = document.getElementById('leaveCheckButton');
const ruleCheckButton = document.getElementById('ruleCheckButton');
const checkBlockedLeaveButton = document.getElementById('checkBlockedLeaveButton');
const checkSameGroupLeaveButton = document.getElementById('checkSameGroupLeaveButton');
const checkAdjacentLeaveButton = document.getElementById('checkAdjacentLeaveButton');
const checkWorkLeaveConflictButton = document.getElementById('checkWorkLeaveConflictButton');
const checkAnnualLeaveButton = document.getElementById('checkAnnualLeaveButton');
const checkLeaveAllButton = document.getElementById('checkLeaveAllButton');
const checkFixedShiftButton = document.getElementById('checkFixedShiftButton');
const checkConsecutiveButton = document.getElementById('checkConsecutiveButton');
const checkTurnaroundButton = document.getElementById('checkTurnaroundButton');
const checkScheduleAllButton = document.getElementById('checkScheduleAllButton');
const clearMonthButton = document.getElementById('clearMonthButton');
const specialDatesButton = document.getElementById('specialDatesButton');
const specialDatesReminder = document.getElementById('specialDatesReminder');
const specialDatesReminderText = document.getElementById('specialDatesReminderText');
const specialDatesReminderButton = document.getElementById('specialDatesReminderButton');
const specialDatesDialog = document.getElementById('specialDatesDialog');
const specialDatesClose = document.getElementById('specialDatesClose');
const specialDatesYear = document.getElementById('specialDatesYear');
const specialDatesHolidayMode = document.getElementById('specialDatesHolidayMode');
const specialDatesWorkdayMode = document.getElementById('specialDatesWorkdayMode');
const specialDatesStatus = document.getElementById('specialDatesStatus');
const specialDatesCalendars = document.getElementById('specialDatesCalendars');
const specialDatesCancel = document.getElementById('specialDatesCancel');
const specialDatesApply = document.getElementById('specialDatesApply');

const scheduleTable = document.getElementById('scheduleTable');
const lowerTable = document.getElementById('lowerTable');
const summaryGrid = document.getElementById('summaryGrid');
const titleYear = document.getElementById('titleYear');
const titleMonth = document.getElementById('titleMonth');
const outputTimestamp = document.getElementById('outputTimestamp');
const publicLeaveInput = document.getElementById('publicLeaveInput');

const rowFillBar = document.getElementById('rowFillBar');
const rowFillTitle = document.getElementById('rowFillTitle');
const rowFillQuickLetters = document.getElementById('rowFillQuickLetters');
const rowFillClearRow = document.getElementById('rowFillClearRow');
const rowFillClose = document.getElementById('rowFillClose');

const batchLeaveDialog = document.getElementById('batchLeaveDialog');
const batchLeaveMessage = document.getElementById('batchLeaveMessage');
const batchLeaveCount = document.getElementById('batchLeaveCount');
const batchLeaveHint = document.getElementById('batchLeaveHint');
const batchLeaveDates = document.getElementById('batchLeaveDates');
const batchLeaveApply = document.getElementById('batchLeaveApply');
const batchLeaveCancel = document.getElementById('batchLeaveCancel');
const batchLeaveResultDialog = document.getElementById('batchLeaveResultDialog');
const batchLeaveResultMessage = document.getElementById('batchLeaveResultMessage');
const batchLeaveResultClose = document.getElementById('batchLeaveResultClose');

const shiftConfigPanel = document.getElementById('shiftConfigPanel');
const shiftConfigGrid = document.getElementById('shiftConfigGrid');
const shiftConfigClose = document.getElementById('shiftConfigClose');
const shiftSeniorityButton = document.getElementById('shiftSeniorityButton');
const shiftSeniorityInfo = document.getElementById('shiftSeniorityInfo');
const supervisorConfigPanel = document.getElementById('supervisorConfigPanel');
const supervisorConfigBody = document.getElementById('supervisorConfigBody');
const supervisorConfigClose = document.getElementById('supervisorConfigClose');
const supervisorSeniorityButton = document.getElementById('supervisorSeniorityButton');
const supervisorSeniorityInfo = document.getElementById('supervisorSeniorityInfo');

const conflictDialog = document.getElementById('conflictDialog');
const conflictDialogMessage = document.getElementById('conflictDialogMessage');
const conflictChooseSchedule = document.getElementById('conflictChooseSchedule');
const conflictChooseVacation = document.getElementById('conflictChooseVacation');

const blockedLeaveDialog = document.getElementById('blockedLeaveDialog');
const blockedLeaveMessage = document.getElementById('blockedLeaveMessage');
const blockedLeaveException = document.getElementById('blockedLeaveException');
const blockedLeaveFormal = document.getElementById('blockedLeaveFormal');
const blockedLeaveBack = document.getElementById('blockedLeaveBack');

const leaveTypeDialog = document.getElementById('leaveTypeDialog');
const leaveTypeMessage = document.getElementById('leaveTypeMessage');
const leaveTypeChoices = document.getElementById('leaveTypeChoices');
const leaveTypeCancel = document.getElementById('leaveTypeCancel');
const leaveNoteDialog = document.getElementById('leaveNoteDialog');
const leaveNoteMessage = document.getElementById('leaveNoteMessage');
const leaveNoteQuickChoices = document.getElementById('leaveNoteQuickChoices');
const leaveNoteCustomInput = document.getElementById('leaveNoteCustomInput');
const leaveNoteNoNote = document.getElementById('leaveNoteNoNote');
const leaveNoteApplyCustom = document.getElementById('leaveNoteApplyCustom');
const leaveNoteBack = document.getElementById('leaveNoteBack');

const specialTimeDialog = document.getElementById('specialTimeDialog');
const specialTimeMessage = document.getElementById('specialTimeMessage');
const specialTimeStartInput = document.getElementById('specialTimeStartInput');
const specialTimeEndInput = document.getElementById('specialTimeEndInput');
const specialTimeApply = document.getElementById('specialTimeApply');
const specialTimeRemove = document.getElementById('specialTimeRemove');
const specialTimeBack = document.getElementById('specialTimeBack');

const nightTimeDialog = document.getElementById('nightTimeDialog');
const nightTimeMessage = document.getElementById('nightTimeMessage');
const nightTimeStartInput = document.getElementById('nightTimeStartInput');
const nightTimeEndInput = document.getElementById('nightTimeEndInput');
const nightTimeApply = document.getElementById('nightTimeApply');
const nightTimeRemove = document.getElementById('nightTimeRemove');
const nightTimeBack = document.getElementById('nightTimeBack');
const dayNoteDialog = document.getElementById('dayNoteDialog');
const dayNoteMessage = document.getElementById('dayNoteMessage');
const dayNoteInput = document.getElementById('dayNoteInput');
const dayNoteCount = document.getElementById('dayNoteCount');
const extraLeaveLetter = document.getElementById('extraLeaveLetter');
const extraLeaveType = document.getElementById('extraLeaveType');
const extraLeaveNote = document.getElementById('extraLeaveNote');
const dayNoteApply = document.getElementById('dayNoteApply');
const dayNoteBack = document.getElementById('dayNoteBack');

const leaveCheckDialog = document.getElementById('leaveCheckDialog');
const leaveCheckMessage = document.getElementById('leaveCheckMessage');
const leaveCheckCorrect = document.getElementById('leaveCheckCorrect');
const leaveCheckIncorrect = document.getElementById('leaveCheckIncorrect');
const leaveCheckActions = document.getElementById('leaveCheckActions');

const ruleCheckDialog = document.getElementById('ruleCheckDialog');
const ruleCheckMessage = document.getElementById('ruleCheckMessage');
const ruleCheckException = document.getElementById('ruleCheckException');
const ruleCheckBack = document.getElementById('ruleCheckBack');
const ruleCheckActions = document.getElementById('ruleCheckActions');


const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const DEFAULT_SHIFT_RANGES = Object.freeze(['07~15', '15~23', '16~24', '23~07', '00~08']);
const SHIFT_GROUP_LABELS = Object.freeze(['早', '中', '中', '夜', '夜']);
let shiftRanges = [...DEFAULT_SHIFT_RANGES];

function formatShiftRangeLabel(rangeText) {
  return String(rangeText || '').replace(/\s+/g, '').replace('~', ' ~ ');
}

const shifts = DEFAULT_SHIFT_RANGES.map((rangeText, index) => ({
  label: formatShiftRangeLabel(rangeText),
  groupLabel: SHIFT_GROUP_LABELS[index]
}));

function syncShiftLabels() {
  shifts.forEach((shift, index) => {
    shift.label = formatShiftRangeLabel(shiftRanges[index] || DEFAULT_SHIFT_RANGES[index]);
  });
}

const LEAVE_TYPE_LABELS = Object.freeze({
  public: '公休',
  annual: '特休',
  leave: '請假',
  exceptionPublic: '例外排休'
});
const SHIFT_GROUP_KEYS = Object.freeze(['early', 'middle', 'night']);
const LEAVE_TYPE_KEYS = Object.freeze(['public', 'annual', 'leave', 'exceptionPublic']);
const BLOCKED_LEAVE_TYPE_KEYS = Object.freeze(['public', 'annual']);
const PUBLIC_LEAVE_TYPE_KEYS = Object.freeze(['public', 'exceptionPublic']);
const FORMAL_LEAVE_TYPES = Object.freeze(['leave']);
const SUPERVISOR_ID = 'emp_supervisor';
const DEFAULT_ANNUAL_LEAVE_RULES = Object.freeze({
  sixMonths: 3,
  year1: 7,
  year2: 10,
  years3to4: 14,
  years5to9: 15,
  year10Base: 16,
  after10Increment: 1,
  maxDays: 30
});

const storage = window.ShiftRosterStorage || null;
const DEFAULT_SETTINGS = Object.freeze({
  publicLeaveCount: 8,
  maxConsecutiveWorkDays: 6,
  minTurnaroundHours: 12,
  normalNightRange: '22~06',
  shiftRanges: [...DEFAULT_SHIFT_RANGES],
  blockedWeekdays: [6],
  blockedLeaveTypes: ['public', 'annual'],
  meetingDefaultText: '8點櫃檯開會',
  annualLeaveRules: { ...DEFAULT_ANNUAL_LEAVE_RULES }
});

// ===== 畫面工作狀態：月份切換時由本機資料層載入／保存。 =====
const names = Array(6).fill('');
const employeeIds = Array(6).fill('');
const specialLeaveValues = Array(6).fill('');
let publicLeaveCount = '8';
let maxConsecutiveWorkDays = 6;
let minTurnaroundHours = 12;
let normalNightRange = '22~06';
let blockedWeekdays = window.TreeSelection.create({ selected: ['6'] });
let blockedLeaveTypes = window.TreeSelection.create({ selected: ['public', 'annual'] });
let meetingDefaultText = '8點櫃檯開會';
let annualLeaveRules = { ...DEFAULT_ANNUAL_LEAVE_RULES };
const rosterValues = new Map();
const blockedVacationOverrides = new Map();
const specialShiftCells = new Set();
const nightShiftOverrides = new Map();
const leaveTypeValues = new Map();
const leaveNoteValues = new Map();
const manualNoteValues = new Map();
const extraLeaveValues = new Map();
const meetingNoteValues = new Map();
const specialShiftTimes = new Map();
const nightShiftTimes = new Map();
const meetingDays = new Set();
const annualGrantDecisionValues = new Map();
const annualBalanceCalibrationValues = new Map();
const personnelShiftValues = new Map();
const specialDaysCache = new Map();
let specialDatesDraftYear = null;
let specialDatesDraftMode = 'holiday';
let specialDatesDraft = window.FormDraft.create({});
const supervisorLeaveDays = new Set();

const editModeState = window.TreeSelection.create({ expansion: 'single' });
let selectedRowFillShiftIndex = null;
let conflictChoiceResolver = null;
let blockedLeaveResolver = null;
let leaveTypeResolver = null;
let leaveNoteResolver = null;
let specialTimeContext = null;
let nightTimeContext = null;
let dayNoteContext = null;
let leaveCheckItems = [];
let leaveCheckIndex = 0;
let leaveCheckCompleteMode = false;
let ruleCheckItems = [];
let ruleCheckIndex = 0;
let ruleCheckCompleteMode = false;
let ruleCheckName = '規則';

let expandedShiftConfigIndex = null;

let batchLeaveLetter = null;
const batchLeaveSelection = window.TreeSelection.create();
let batchLeaveFailedDays = [];

// 班表頁選單只保留一條展開路徑：開啟新項目時，收起其他分支；父層保留以維持目前子選單可見。
rosterView?.addEventListener('toggle', (event) => {
  const current = event.target;
  if (!(current instanceof HTMLDetailsElement) || !current.open) return;

  const keepOpen = new Set([current]);
  let ancestor = current.parentElement?.closest('details');
  while (ancestor && rosterView.contains(ancestor)) {
    keepOpen.add(ancestor);
    ancestor = ancestor.parentElement?.closest('details');
  }

  rosterView.querySelectorAll('details[open]').forEach((detail) => {
    if (!keepOpen.has(detail)) detail.open = false;
  });
}, true);

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

  closeRowFillPanel();
  if (!showSettings) {
    closeShiftConfigPanel();
    closeSupervisorConfigPanel();
    if (basicSettingsPanel) basicSettingsPanel.hidden = true;
  }

  if (showSettings) {
    renderRuleSettingsPage();
    resetSettingsSection();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (showRules) {
    renderRuleSettingsPage();
    resetGuideSection();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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
  closeRuleSettingsEditor();
}

function showBasicSettings() {
  closeShiftConfigPanel();
  closeSupervisorConfigPanel();
  basicSettingsPanel.hidden = false;
  setSettingsTopActive(basicSettingsButton);
  renderRuleSettingsPage();
}

function showShiftSettings() {
  if (basicSettingsPanel) basicSettingsPanel.hidden = true;
  closeSupervisorConfigPanel();
  openShiftConfigPanel();
  setSettingsTopActive(shiftConfigButton);
}

function showSupervisorSettings() {
  if (basicSettingsPanel) basicSettingsPanel.hidden = true;
  closeShiftConfigPanel();
  openSupervisorConfigPanel();
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

function formatRuleNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) ? String(number) : String(number).replace(/\.0+$/, '');
}

function normalizeClockSetting(value, allow24 = false) {
  let text = String(value || '').trim().replace(/[：]/g, ':').replace(/\s+/g, '');
  if (/^\d{3,4}$/.test(text)) {
    text = `${text.slice(0, -2)}:${text.slice(-2)}`;
  }
  const match = text.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) return '';
  if (hour === 24) {
    if (!allow24 || minute !== 0) return '';
    return '24';
  }
  if (hour < 0 || hour > 23) return '';
  const hh = String(hour).padStart(2, '0');
  return minute === 0 ? hh : `${hh}:${String(minute).padStart(2, '0')}`;
}

function buildShiftRangeFromInputs(startInput, endInput) {
  const start = normalizeClockSetting(startInput?.value, false);
  const end = normalizeClockSetting(endInput?.value, true);
  if (!start || !end) return '';
  const range = `${start}~${end}`;
  return window.ShiftRosterRules?.parseTimeRange(range) ? range : '';
}

function fillShiftTimeEditor() {
  shiftRanges.forEach((rangeText, index) => {
    const parsed = window.ShiftRosterRules?.parseTimeRange(rangeText);
    const startInput = document.querySelector(`[data-shift-time-start="${index}"]`);
    const endInput = document.querySelector(`[data-shift-time-end="${index}"]`);
    if (!startInput || !endInput || !parsed) return;
    startInput.value = normalizeClockSetting(
      parsed.start.minute ? `${parsed.start.hour}:${String(parsed.start.minute).padStart(2, '0')}` : String(parsed.start.hour),
      false
    );
    endInput.value = normalizeClockSetting(
      parsed.end.minute ? `${parsed.end.hour}:${String(parsed.end.minute).padStart(2, '0')}` : String(parsed.end.hour),
      true
    );
  });
}

function getShiftGroupDetail(groupKey, separator = '、') {
  const indexes = groupKey === 'early'
    ? [0]
    : groupKey === 'middle'
      ? [1, 2]
      : groupKey === 'night'
        ? [3, 4]
        : groupKey === 'day'
          ? [0, 1, 2]
          : [];
  return indexes.map((index) => shiftRanges[index]).filter(Boolean).join(separator);
}

function renderShiftSettingText() {
  if (ruleShiftTimesText) {
    ruleShiftTimesText.textContent = `早 ${getShiftGroupDetail('early')}｜中 ${getShiftGroupDetail('middle')}｜夜 ${getShiftGroupDetail('night')}`;
  }
  document.querySelectorAll('[data-shift-range-index]').forEach((node) => {
    const index = Number(node.dataset.shiftRangeIndex);
    if (Number.isInteger(index) && shiftRanges[index]) node.textContent = shiftRanges[index];
  });
  document.querySelectorAll('[data-shift-group-detail]').forEach((node) => {
    const group = node.dataset.shiftGroupDetail;
    if (!group) return;
    node.textContent = getShiftGroupDetail(group);
  });
}

function getCheckedValues(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return [...container.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function setCheckedValues(containerId, values) {
  const selected = window.TreeSelection.create({ selected: (values || []).map(String) });
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = selected.has(String(input.value));
  });
}

function formatBlockedWeekdayText() {
  if (!blockedWeekdays.selectedCount) return '無預設禁休';
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.filter((day) => blockedWeekdays.has(day)).map((day) => weekdays[day]).join('、');
}

function formatBlockedLeaveTypeText() {
  const labels = [];
  if (blockedLeaveTypes.has('public')) labels.push('公休');
  if (blockedLeaveTypes.has('annual')) labels.push('特休');
  return labels.length ? labels.join('、') : '不限制假別';
}

function renderRuleSettingsPage() {
  const publicLeave = publicLeaveCount || '8';
  rulePublicLeaveText.textContent = publicLeave;
  ruleConsecutiveText.textContent = String(maxConsecutiveWorkDays);
  ruleTurnaroundText.textContent = `${formatRuleNumber(minTurnaroundHours)} 小時`;
  ruleNightText.textContent = normalNightRange;
  if (ruleBlockedText) ruleBlockedText.textContent = `${formatBlockedWeekdayText()}｜${formatBlockedLeaveTypeText()}`;
  if (ruleBlockedTypesText) ruleBlockedTypesText.textContent = formatBlockedLeaveTypeText();
  if (ruleBlockedWeekdaysText) ruleBlockedWeekdaysText.textContent = `${formatBlockedWeekdayText()}、國定假日`;
  if (ruleSameDayText) ruleSameDayText.textContent = '早中｜夜';
  if (ruleAdjacentText) ruleAdjacentText.textContent = '中班休假隔日，早班禁休';
  if (ruleMeetingText) ruleMeetingText.textContent = meetingDefaultText || '8點櫃檯開會';
  renderShiftSettingText();

  document.querySelectorAll('[data-rule-public-leave]').forEach((node) => { node.textContent = publicLeave; });
  document.querySelectorAll('[data-rule-consecutive]').forEach((node) => { node.textContent = String(maxConsecutiveWorkDays); });
  document.querySelectorAll('[data-rule-turnaround]').forEach((node) => { node.textContent = `${formatRuleNumber(minTurnaroundHours)} 小時`; });
  document.querySelectorAll('[data-rule-night]').forEach((node) => { node.textContent = normalNightRange; });
}

function openRuleSettingsEditor() {
  rulePublicLeaveSettingInput.value = publicLeaveCount || '8';
  ruleConsecutiveInput.value = String(maxConsecutiveWorkDays);
  ruleTurnaroundInput.value = formatRuleNumber(minTurnaroundHours);
  ruleAnnualSixMonthInput.value = String(annualLeaveRules.sixMonths);
  ruleAnnualYear1Input.value = String(annualLeaveRules.year1);
  ruleAnnualYear2Input.value = String(annualLeaveRules.year2);
  ruleAnnualYears3to4Input.value = String(annualLeaveRules.years3to4);
  ruleAnnualYears5to9Input.value = String(annualLeaveRules.years5to9);
  ruleAnnualYear10BaseInput.value = String(annualLeaveRules.year10Base);
  ruleAnnualAfter10IncrementInput.value = String(annualLeaveRules.after10Increment);
  ruleAnnualMaxInput.value = String(annualLeaveRules.maxDays);
  fillHourPair(ruleNightStartInput, ruleNightEndInput, normalNightRange);
  fillShiftTimeEditor();
  setCheckedValues('ruleBlockedWeekdays', blockedWeekdays.getSelected());
  setCheckedValues('ruleBlockedLeaveTypes', blockedLeaveTypes.getSelected());
  ruleMeetingDefaultInput.value = meetingDefaultText;
  ruleSettingsEditor.hidden = false;
  editRuleSettingsButton.hidden = true;
  requestAnimationFrame(() => rulePublicLeaveSettingInput.focus());
}

function closeRuleSettingsEditor() {
  ruleSettingsEditor.hidden = true;
  editRuleSettingsButton.hidden = false;
}

function applyRuleSettings() {
  const nextPublicLeave = Number.parseInt(rulePublicLeaveSettingInput.value, 10);
  const nextConsecutive = Number.parseInt(ruleConsecutiveInput.value, 10);
  const nextTurnaround = Number(ruleTurnaroundInput.value);
  const nextNight = buildHourRange(ruleNightStartInput, ruleNightEndInput);
  const nextAnnualRules = {
    sixMonths: Number.parseInt(ruleAnnualSixMonthInput.value, 10),
    year1: Number.parseInt(ruleAnnualYear1Input.value, 10),
    year2: Number.parseInt(ruleAnnualYear2Input.value, 10),
    years3to4: Number.parseInt(ruleAnnualYears3to4Input.value, 10),
    years5to9: Number.parseInt(ruleAnnualYears5to9Input.value, 10),
    year10Base: Number.parseInt(ruleAnnualYear10BaseInput.value, 10),
    after10Increment: Number.parseInt(ruleAnnualAfter10IncrementInput.value, 10),
    maxDays: Number.parseInt(ruleAnnualMaxInput.value, 10)
  };
  const nextShiftRanges = DEFAULT_SHIFT_RANGES.map((_range, index) => {
    const startInput = document.querySelector(`[data-shift-time-start="${index}"]`);
    const endInput = document.querySelector(`[data-shift-time-end="${index}"]`);
    return buildShiftRangeFromInputs(startInput, endInput);
  });
  const nextBlockedWeekdays = getCheckedValues('ruleBlockedWeekdays').map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  const nextBlockedLeaveTypes = getCheckedValues('ruleBlockedLeaveTypes').filter((value) => window.ValueCycle.contains(BLOCKED_LEAVE_TYPE_KEYS, value));
  const nextMeetingText = Array.from(String(ruleMeetingDefaultInput.value || '').trim()).slice(0, 10).join('');

  const validation = window.SlowlyDataValidation.validate(
    {
      publicLeave: nextPublicLeave,
      consecutive: nextConsecutive,
      turnaround: nextTurnaround,
      annualRules: nextAnnualRules
    },
    {
      publicLeave: {
        validate: (value) => Number.isInteger(value) && value >= 1 && value <= 31
          ? true
          : '每月公休請輸入 1～31 天。'
      },
      consecutive: {
        validate: (value) => Number.isInteger(value) && value >= 1 && value <= 31
          ? true
          : '連續上班上限請輸入 1～31 天。'
      },
      turnaround: {
        validate: (value) => Number.isFinite(value) && value >= 0 && value <= 24
          ? true
          : '轉班最低間隔請輸入 0～24 小時。'
      },
      annualRules: {
        validate: (value) => Object.values(value).every((item) => Number.isInteger(item) && item >= 0 && item <= 99)
          ? true
          : '特休取得級距請輸入 0～99 的整數。'
      },
      'annualRules.maxDays': {
        validate: (value, data) => value >= data.annualRules.year10Base
          ? true
          : '特休最高天數不可低於滿 10 年基準天數。'
      }
    }
  );
  if (!validation.valid) {
    window.alert(validation.errors[0].message);
    return;
  }
  if (!window.ShiftRosterRules?.parseTimeRange(nextNight)) {
    window.alert('灰底預設時間請分別輸入開始與結束小時，例如 22、06。');
    return;
  }
  const invalidShiftIndex = nextShiftRanges.findIndex((range) => !range);
  if (invalidShiftIndex !== -1) {
    window.alert(`第 ${invalidShiftIndex + 1} 個班別時間格式不正確。可輸入 07、07:30、24 等格式。`);
    return;
  }
  if (!nextMeetingText) {
    window.alert('開會預設備註不可空白。');
    return;
  }

  publicLeaveCount = String(nextPublicLeave);
  maxConsecutiveWorkDays = nextConsecutive;
  minTurnaroundHours = nextTurnaround;
  normalNightRange = nextNight;
  annualLeaveRules = { ...nextAnnualRules };
  shiftRanges = [...nextShiftRanges];
  blockedWeekdays = window.TreeSelection.create({ selected: nextBlockedWeekdays });
  blockedLeaveTypes = window.TreeSelection.create({ selected: nextBlockedLeaveTypes });
  meetingDefaultText = nextMeetingText;
  syncShiftLabels();
  publicLeaveInput.textContent = publicLeaveCount;
  render();
  renderRuleSettingsPage();
  persistGlobalSettings();
  closeRuleSettingsEditor();
}

function getDaysInMonth(year, month) {
  const targetYear = Number(year);
  const targetMonth = Number(month);
  if (window.Calendar?.isSupportedYear?.(targetYear) && Number.isInteger(targetMonth) && targetMonth >= 1 && targetMonth <= 12) {
    return window.Calendar.getDaysInMonth(targetYear, targetMonth);
  }
  return new Date(targetYear, targetMonth, 0).getDate();
}

function getWeekdayIndex(year, month, day) {
  const targetYear = Number(year);
  const targetMonth = Number(month);
  const targetDay = Number(day);
  if (
    window.Calendar?.isSupportedYear?.(targetYear) &&
    Number.isInteger(targetMonth) && targetMonth >= 1 && targetMonth <= 12 &&
    Number.isInteger(targetDay) && targetDay >= 1 && targetDay <= getDaysInMonth(targetYear, targetMonth)
  ) {
    return window.Calendar.createDay(targetYear, targetMonth, targetDay).weekday;
  }
  return new Date(targetYear, targetMonth - 1, targetDay).getDay();
}

function getDayInfo(year, month, day) {
  const weekdayIndex = getWeekdayIndex(year, month, day);
  return {
    weekdayIndex,
    weekday: weekdays[weekdayIndex],
    className: weekdayIndex === 6 ? 'saturday' : weekdayIndex === 0 ? 'sunday' : ''
  };
}

function makeCalendarDateKey(year, month, day) {
  return `${Number(year)}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
}

function getSpecialDaysForYear(year) {
  const targetYear = Number(year);
  if (!Number.isInteger(targetYear)) {
    return {
      configured: false,
      holidays: window.TreeSelection.create(),
      workdays: window.TreeSelection.create()
    };
  }
  if (specialDaysCache.has(targetYear)) return specialDaysCache.get(targetYear);
  const raw = storage?.getSpecialDays?.(targetYear) || { configured: false, holidays: [], workdays: [] };
  const normalized = {
    configured: raw.configured === true,
    holidays: window.TreeSelection.create({ selected: Array.isArray(raw.holidays) ? raw.holidays : [] }),
    workdays: window.TreeSelection.create({ selected: Array.isArray(raw.workdays) ? raw.workdays : [] })
  };
  specialDaysCache.set(targetYear, normalized);
  return normalized;
}

function getAnnualSpecialDayType(year, month, day) {
  const data = getSpecialDaysForYear(year);
  const key = makeCalendarDateKey(year, month, day);
  if (data.holidays.has(key)) return 'holiday';
  if (data.workdays.has(key)) return 'workday';
  return '';
}

function getCalendarVisualInfo(year, month, day) {
  const info = getDayInfo(year, month, day);
  const specialType = getAnnualSpecialDayType(year, month, day);
  const weekendClass = specialType === 'workday' ? '' : info.className;
  const specialClass = specialType === 'holiday'
    ? 'is-calendar-holiday'
    : specialType === 'workday'
      ? 'is-calendar-workday'
      : '';
  return {
    ...info,
    specialType,
    className: [weekendClass, specialClass].filter(Boolean).join(' ')
  };
}

function clearSpecialDaysCache(year = null) {
  if (year !== null && year !== undefined && Number.isInteger(Number(year))) {
    specialDaysCache.delete(Number(year));
  } else {
    specialDaysCache.clear();
  }
}


// 上方日期列採「兩白、兩灰」循環，且跨月份不中斷。
// 以 2026/10/1～10/2 為白底基準。
function getDateBandClass(year, month, day) {
  const anchorUtc = Date.UTC(2026, 9, 1);
  const currentUtc = Date.UTC(year, month - 1, day);
  const dayDiff = Math.floor((currentUtc - anchorUtc) / 86400000);
  const pairIndex = Math.floor(dayDiff / 2);
  return Math.abs(pairIndex % 2) === 1 ? 'date-band-dark' : 'date-band-light';
}

function appendDayColumns(colgroup, days) {
  const labelCol = document.createElement('col');
  labelCol.className = 'label-col';
  colgroup.appendChild(labelCol);

  const codeCol = document.createElement('col');
  codeCol.className = 'code-col';
  colgroup.appendChild(codeCol);

  for (let day = 1; day <= days; day += 1) colgroup.appendChild(document.createElement('col'));
}

function makeRosterKey(year, month, day, type, index = '') {
  return `${year}-${month}-${day}-${type}-${index}`;
}
function makeBlockedDayKey(year, month, day) {
  return `${year}-${month}-${day}`;
}
function makeSpecialShiftKey(year, month, day, shiftIndex) {
  return `${year}-${month}-${day}-shift-${shiftIndex}`;
}
function makeNightShiftKey(year, month, day, shiftIndex) {
  return `${year}-${month}-${day}-night-${shiftIndex}`;
}
function makeMeetingDayKey(year, month, day) {
  return `${year}-${month}-${day}-meeting`;
}
function makeDayValueKey(year, month, day) {
  return `${year}-${month}-${day}`;
}
function makePersonnelShiftKey(year, month, letter) {
  return `${year}-${month}-${letter}-personnel-shifts`;
}

function syncMonthInputWidth() {
  monthInput.style.width = `${Math.max(1, Math.min(2, String(monthInput.value || '').length))}ch`;
}

function getCurrentYearMonth() {
  return { year: Number(yearInput.value), month: Number(monthInput.value) };
}

function getDefaultNextYearMonth(date = new Date()) {
  return window.CalendarMonthSequence.shift(
    date.getFullYear(),
    date.getMonth() + 1,
    1
  );
}

function getMonthMemoryPrefix(year, month) {
  return `${year}-${month}-`;
}

function serializeMapForMonth(map, year, month) {
  const prefix = getMonthMemoryPrefix(year, month);
  const output = {};
  for (const [key, value] of map.entries()) {
    const textKey = String(key);
    if (!textKey.startsWith(prefix)) continue;
    output[textKey.slice(prefix.length)] = value;
  }
  return output;
}

function serializeSetForMonth(set, year, month) {
  const prefix = getMonthMemoryPrefix(year, month);
  return [...set]
    .map((key) => String(key))
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length));
}

function restoreMapForMonth(map, year, month, values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return;
  const prefix = getMonthMemoryPrefix(year, month);
  for (const [suffix, value] of Object.entries(values)) map.set(`${prefix}${suffix}`, value);
}

function restoreSetForMonth(set, year, month, values) {
  if (!Array.isArray(values)) return;
  const prefix = getMonthMemoryPrefix(year, month);
  values.forEach((suffix) => set.add(`${prefix}${suffix}`));
}

function clearMonthMemory(year, month) {
  clearMapKeysForMonth(rosterValues, year, month);
  clearMapKeysForMonth(blockedVacationOverrides, year, month);
  clearMapKeysForMonth(nightShiftOverrides, year, month);
  clearMapKeysForMonth(leaveTypeValues, year, month);
  clearMapKeysForMonth(leaveNoteValues, year, month);
  clearMapKeysForMonth(manualNoteValues, year, month);
  clearMapKeysForMonth(extraLeaveValues, year, month);
  clearMapKeysForMonth(meetingNoteValues, year, month);
  clearMapKeysForMonth(specialShiftTimes, year, month);
  clearMapKeysForMonth(nightShiftTimes, year, month);
  clearMapKeysForMonth(annualGrantDecisionValues, year, month);
  clearMapKeysForMonth(annualBalanceCalibrationValues, year, month);
  clearMapKeysForMonth(personnelShiftValues, year, month);
  clearSetKeysForMonth(specialShiftCells, year, month);
  clearSetKeysForMonth(meetingDays, year, month);
  supervisorLeaveDays.clear();
}

function buildCurrentMonthSnapshot() {
  const { year, month } = getCurrentYearMonth();
  const monthId = storage?.makeMonthId(year, month) || `${year}-${String(month).padStart(2, '0')}`;
  const people = {};

  for (let index = 0; index < 6; index += 1) {
    const letter = String.fromCharCode(65 + index);
    const displayName = names[index] || '';
    const employeeId = employeeIds[index] || '';
    const shiftGroups = (letter === 'A' && !displayName && !employeeId) ? [] : [...getPersonnelShifts(year, month, letter)];
    if (!displayName && !employeeId && !shiftGroups.length) continue;
    people[letter] = { employeeId, displayName, shiftGroups };
  }

  return {
    month: monthId,
    people,
    specialLeaveValues: [...specialLeaveValues],
    rosterValues: serializeMapForMonth(rosterValues, year, month),
    blockedVacationOverrides: serializeMapForMonth(blockedVacationOverrides, year, month),
    specialShiftCells: serializeSetForMonth(specialShiftCells, year, month),
    nightShiftOverrides: serializeMapForMonth(nightShiftOverrides, year, month),
    leaveTypeValues: serializeMapForMonth(leaveTypeValues, year, month),
    leaveNoteValues: serializeMapForMonth(leaveNoteValues, year, month),
    manualNotes: serializeMapForMonth(manualNoteValues, year, month),
    extraLeaves: serializeMapForMonth(extraLeaveValues, year, month),
    annualGrantDecisions: serializeMapForMonth(annualGrantDecisionValues, year, month),
    annualBalanceCalibrations: serializeMapForMonth(annualBalanceCalibrationValues, year, month),
    specialShiftTimes: serializeMapForMonth(specialShiftTimes, year, month),
    nightShiftTimes: serializeMapForMonth(nightShiftTimes, year, month),
    meetingDays: serializeSetForMonth(meetingDays, year, month)
      .map((suffix) => Number(String(suffix).replace(/-meeting$/, '')))
      .filter((day) => Number.isInteger(day)),
    meetingNoteValues: serializeMapForMonth(meetingNoteValues, year, month),
    supervisorLeaveDays: [...supervisorLeaveDays].sort((a, b) => a - b)
  };
}

function persistCurrentMonth() {
  if (!storage) return;
  const { year, month } = getCurrentYearMonth();
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return;
  storage.saveMonth(buildCurrentMonthSnapshot());
}

function persistGlobalSettings() {
  if (!storage) return;
  storage.saveSettings({
    publicLeaveCount: Number.parseInt(publicLeaveCount || '8', 10) || 8,
    maxConsecutiveWorkDays,
    minTurnaroundHours,
      normalNightRange,
    shiftRanges: [...shiftRanges],
    blockedWeekdays: blockedWeekdays.getSelected().map(Number).sort((a, b) => a - b),
    blockedLeaveTypes: blockedLeaveTypes.getSelected(),
            meetingDefaultText,
    annualLeaveRules: { ...annualLeaveRules }
  });
}

function loadGlobalSettings() {
  if (!storage) return;
  const saved = storage.getSettings(DEFAULT_SETTINGS);
  publicLeaveCount = String(Number.parseInt(saved.publicLeaveCount, 10) || DEFAULT_SETTINGS.publicLeaveCount);
  maxConsecutiveWorkDays = Number.parseInt(saved.maxConsecutiveWorkDays, 10) || DEFAULT_SETTINGS.maxConsecutiveWorkDays;
  minTurnaroundHours = Number.isFinite(Number(saved.minTurnaroundHours)) ? Number(saved.minTurnaroundHours) : DEFAULT_SETTINGS.minTurnaroundHours;
  normalNightRange = String(saved.normalNightRange || DEFAULT_SETTINGS.normalNightRange);
  blockedWeekdays = window.TreeSelection.create({
    selected: (Array.isArray(saved.blockedWeekdays) ? saved.blockedWeekdays : DEFAULT_SETTINGS.blockedWeekdays)
      .map(Number)
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
  });
  blockedLeaveTypes = window.TreeSelection.create({
    selected: (Array.isArray(saved.blockedLeaveTypes) ? saved.blockedLeaveTypes : DEFAULT_SETTINGS.blockedLeaveTypes)
      .filter((value) => window.ValueCycle.contains(BLOCKED_LEAVE_TYPE_KEYS, value))
  });
  meetingDefaultText = Array.from(String(saved.meetingDefaultText || DEFAULT_SETTINGS.meetingDefaultText)).slice(0, 10).join('');
  const savedAnnualRules = saved.annualLeaveRules && typeof saved.annualLeaveRules === 'object' ? saved.annualLeaveRules : {};
  annualLeaveRules = { ...DEFAULT_ANNUAL_LEAVE_RULES, ...savedAnnualRules };
  const savedShiftRanges = Array.isArray(saved.shiftRanges) ? saved.shiftRanges : [];
  shiftRanges = DEFAULT_SHIFT_RANGES.map((fallback, index) => {
    const value = String(savedShiftRanges[index] || fallback).replace(/\s+/g, '');
    return window.ShiftRosterRules?.parseTimeRange(value) ? value : fallback;
  });
  syncShiftLabels();
}

function loadMonthIntoMemory(year, month, data) {
  clearMonthMemory(year, month);
  names.fill('');
  employeeIds.fill('');
  specialLeaveValues.fill('');

  const people = data?.people && typeof data.people === 'object' ? data.people : {};
  for (let index = 0; index < 6; index += 1) {
    const letter = String.fromCharCode(65 + index);
    const person = people[letter] || {};
    names[index] = typeof person.displayName === 'string' ? person.displayName : '';
    employeeIds[index] = typeof person.employeeId === 'string' ? person.employeeId : '';
    const groups = Array.isArray(person.shiftGroups) ? person.shiftGroups.filter((item) => window.ValueCycle.contains(SHIFT_GROUP_KEYS, item)) : [];
    if (letter === 'A') {
      personnelShiftValues.set(makePersonnelShiftKey(year, month, letter), [...A_ALL_SHIFT_GROUPS]);
    } else if (groups.length) {
      personnelShiftValues.set(makePersonnelShiftKey(year, month, letter), [groups[0]]);
    }
  }

  const leaveValues = Array.isArray(data?.specialLeaveValues) ? data.specialLeaveValues : [];
  for (let index = 0; index < 6; index += 1) specialLeaveValues[index] = String(leaveValues[index] || '');

  restoreMapForMonth(rosterValues, year, month, data?.rosterValues);
  restoreMapForMonth(blockedVacationOverrides, year, month, data?.blockedVacationOverrides);
  restoreSetForMonth(specialShiftCells, year, month, data?.specialShiftCells);

  restoreMapForMonth(nightShiftOverrides, year, month, data?.nightShiftOverrides);
  restoreMapForMonth(leaveTypeValues, year, month, data?.leaveTypeValues);
  restoreMapForMonth(leaveNoteValues, year, month, data?.leaveNoteValues);
  restoreMapForMonth(manualNoteValues, year, month, data?.manualNotes);
  restoreMapForMonth(extraLeaveValues, year, month, data?.extraLeaves);
  restoreMapForMonth(annualGrantDecisionValues, year, month, data?.annualGrantDecisions);
  restoreMapForMonth(annualBalanceCalibrationValues, year, month, data?.annualBalanceCalibrations);
  for (let index = 0; index < employeeIds.length; index += 1) {
    const calibration = getAnnualBalanceCalibration(employeeIds[index] || '', year, month);
    if (calibration) specialLeaveValues[index] = String(calibration.value);
  }
  autofillAnnualBalances(year, month);
  restoreMapForMonth(specialShiftTimes, year, month, data?.specialShiftTimes);
  restoreMapForMonth(nightShiftTimes, year, month, data?.nightShiftTimes);

  restoreMapForMonth(meetingNoteValues, year, month, data?.meetingNoteValues);

  if (Array.isArray(data?.meetingDays)) {
    data.meetingDays.forEach((day) => {
      if (Number.isInteger(day) && day >= 1 && day <= 31) meetingDays.add(makeMeetingDayKey(year, month, day));
    });
  }

  if (Array.isArray(data?.supervisorLeaveDays)) {
    const daysInMonth = getDaysInMonth(year, month);
    data.supervisorLeaveDays.forEach((day) => {
      if (Number.isInteger(day) && day >= 1 && day <= daysInMonth) supervisorLeaveDays.add(day);
    });
  }
}

function loadMonth(year, month) {
  if (!storage) return;
  const data = storage.ensureMonth(year, month);
  loadMonthIntoMemory(year, month, data);
}

function trimDisplayName(value) {
  return Array.from(String(value || '')).slice(0, 3).join('');
}

function findShiftGroupsForEmployee(employeeId, targetIndex) {
  if (!employeeId) return [];
  const { year, month } = getCurrentYearMonth();

  for (let index = 0; index < employeeIds.length; index += 1) {
    if (index === targetIndex || employeeIds[index] !== employeeId) continue;
    const letter = String.fromCharCode(65 + index);
    return [...getPersonnelShifts(year, month, letter)];
  }

  if (storage) {
    const previous = storage.getPreviousYearMonth(year, month);
    const previousMonth = storage.getMonth(previous.year, previous.month);
    for (const person of Object.values(previousMonth?.people || {})) {
      if (person?.employeeId === employeeId && Array.isArray(person.shiftGroups)) {
        return person.shiftGroups.filter((item) => window.ValueCycle.contains(SHIFT_GROUP_KEYS, item));
      }
    }
  }
  return [];
}

function setPersonnelGroupsForIndex(index, groups) {
  const { year, month } = getCurrentYearMonth();
  const letter = String.fromCharCode(65 + index);
  const key = makePersonnelShiftKey(year, month, letter);
  if (letter === 'A') {
    personnelShiftValues.set(key, [...A_ALL_SHIFT_GROUPS]);
    return;
  }
  const cleaned = window.TreeSelection.create({
    selected: (groups || []).filter((item) => window.ValueCycle.contains(SHIFT_GROUP_KEYS, item))
  }).getSelected();
  if (cleaned.length) personnelShiftValues.set(key, [cleaned[0]]);
  else personnelShiftValues.delete(key);
}

function commitNameAtIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index >= 6) return;
  const displayName = names[index] || '';
  const previousEmployeeId = employeeIds[index] || '';

  if (!displayName.trim()) {
    names[index] = '';
    employeeIds[index] = '';
    specialLeaveValues[index] = '';
    setPersonnelGroupsForIndex(index, []);
    persistCurrentMonth();
    return;
  }

  if (storage) {
    const nextEmployeeId = storage.resolveEmployee(displayName, previousEmployeeId);
    if (nextEmployeeId !== previousEmployeeId) {
      setPersonnelGroupsForIndex(index, findShiftGroupsForEmployee(nextEmployeeId, index));
      employeeIds[index] = nextEmployeeId;
      const current = getCurrentYearMonth();
      const calibration = getAnnualBalanceCalibration(nextEmployeeId, current.year, current.month);
      const basis = getAnnualBalanceBasis(index, current.year, current.month);
      specialLeaveValues[index] = calibration ? String(calibration.value) : (basis.value == null ? '' : String(basis.value));
    } else {
      employeeIds[index] = nextEmployeeId;
    }
  }
  persistCurrentMonth();
}

function commitAllVisibleNames() {
  for (let index = 0; index < names.length; index += 1) {
    names[index] = trimDisplayName(names[index]);
    syncNameInputsForIndex(index);
    commitNameAtIndex(index);
  }
}

function cleanEnglishLetter(value) {
  return String(value || '').toUpperCase().replace(/[^A-F]/g, '').slice(0, 1);
}
function cleanTwoDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 2);
}
function normalizeTimeInput(value) {
  return String(value || '').trim().replace(/[～〜—–－]/g, '~').replace(/\s+/g, '');
}
function cleanHourInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 2);
}
function splitHourRange(value) {
  const parsed = window.ShiftRosterRules?.parseTimeRange(normalizeTimeInput(value));
  if (!parsed) return { start: '', end: '' };
  return { start: String(parsed.start.hour).padStart(2, '0'), end: String(parsed.end.hour).padStart(2, '0') };
}
function buildHourRange(startInput, endInput) {
  const startText = cleanHourInput(startInput.value);
  const endText = cleanHourInput(endInput.value);
  startInput.value = startText;
  endInput.value = endText;
  if (!startText || !endText) return '';
  const start = Number(startText);
  const end = Number(endText);
  if (!Number.isInteger(start) || start < 0 || start > 23) return '';
  if (!Number.isInteger(end) || end < 0 || end > 24) return '';
  return `${String(start).padStart(2, '0')}~${String(end).padStart(2, '0')}`;
}
function fillHourPair(startInput, endInput, value) {
  const { start, end } = splitHourRange(value);
  startInput.value = start;
  endInput.value = end;
}
function bindHourPair(startInput, endInput, onSubmit) {
  const sanitize = (input) => { input.value = cleanHourInput(input.value); };
  startInput.addEventListener('input', () => {
    sanitize(startInput);
    if (startInput.value.length >= 2) endInput.focus();
  });
  endInput.addEventListener('input', () => sanitize(endInput));
  startInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); endInput.focus(); }
  });
  endInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); onSubmit(); }
  });
}

function clearMapKeysForMonth(map, year, month) {
  const prefix = `${year}-${month}-`;
  for (const key of [...map.keys()]) if (String(key).startsWith(prefix)) map.delete(key);
}
function clearSetKeysForMonth(set, year, month) {
  const prefix = `${year}-${month}-`;
  for (const key of [...set]) if (String(key).startsWith(prefix)) set.delete(key);
}

function getDefaultBlockedState(year, month, day) {
  const specialType = getAnnualSpecialDayType(year, month, day);
  if (specialType === 'holiday') return true;
  if (specialType === 'workday') return false;
  return blockedWeekdays.has(getDayInfo(year, month, day).weekdayIndex);
}
function isVacationBlocked(year, month, day) {
  if (isSupervisorLeaveDay(year, month, day)) return true;
  const key = makeBlockedDayKey(year, month, day);
  return blockedVacationOverrides.has(key) ? blockedVacationOverrides.get(key) : getDefaultBlockedState(year, month, day);
}
function setVacationBlockedState(year, month, day, blocked) {
  const key = makeBlockedDayKey(year, month, day);
  const defaultBlocked = getDefaultBlockedState(year, month, day);
  if (blocked === defaultBlocked) blockedVacationOverrides.delete(key);
  else blockedVacationOverrides.set(key, blocked);
}

function getDefaultNightGrayState(year, month, day, shiftIndex) {
  return shiftIndex === 3 && getDayInfo(year, month, day).weekdayIndex === 6;
}
function isNightGray(year, month, day, shiftIndex) {
  const key = makeNightShiftKey(year, month, day, shiftIndex);
  return nightShiftOverrides.has(key) ? nightShiftOverrides.get(key) : getDefaultNightGrayState(year, month, day, shiftIndex);
}
function setNightGrayState(year, month, day, shiftIndex, enabled) {
  const key = makeNightShiftKey(year, month, day, shiftIndex);
  const defaultState = getDefaultNightGrayState(year, month, day, shiftIndex);
  if (enabled === defaultState) nightShiftOverrides.delete(key);
  else nightShiftOverrides.set(key, enabled);
}

function getLeaveType(key) {
  const value = leaveTypeValues.get(key) || 'public';
  return window.ValueCycle.contains(LEAVE_TYPE_KEYS, value) ? value : 'leave';
}
function getLeaveNote(key) {
  return String(leaveNoteValues.get(key) || '');
}
function setLeaveType(key, type, note = '') {
  const normalized = window.ValueCycle.contains(LEAVE_TYPE_KEYS, type) ? type : 'public';
  if (normalized === 'public') leaveTypeValues.delete(key);
  else leaveTypeValues.set(key, normalized);
  if (normalized === 'leave' && note) leaveNoteValues.set(key, Array.from(String(note)).slice(0, 4).join(''));
  else leaveNoteValues.delete(key);
}
function isFormalLeaveType(type) {
  return window.ValueCycle.contains(FORMAL_LEAVE_TYPES, type || '');
}

function getVacationLettersForDay(year, month, day) {
  return [0, 1].map((slot) => {
    const key = makeRosterKey(year, month, day, 'vacation', slot);
    return { key, slot, value: rosterValues.get(key) || '', type: getLeaveType(key), note: getLeaveNote(key), extra: false };
  });
}
function getExtraLeaveForDay(year, month, day) {
  const key = makeDayValueKey(year, month, day);
  const raw = extraLeaveValues.get(key);
  if (!raw || typeof raw !== 'object') return null;
  const letter = cleanEnglishLetter(raw.letter || '');
  if (!letter) return null;
  const type = window.ValueCycle.contains(LEAVE_TYPE_KEYS, raw.type) ? raw.type : 'public';
  const note = type === 'leave' ? Array.from(String(raw.note || '')).slice(0, 4).join('') : '';
  return { key, slot: 2, value: letter, letter, type, note, extra: true };
}
function getAllLeaveEntriesForDay(year, month, day) {
  const regular = getVacationLettersForDay(year, month, day);
  const extra = getExtraLeaveForDay(year, month, day);
  return extra ? [...regular, extra] : regular;
}
function hasVacationLetter(year, month, day, letter) {
  return Boolean(letter) && getAllLeaveEntriesForDay(year, month, day).some((entry) => entry.value === letter);
}
function removeVacationLetter(year, month, day, letter) {
  getVacationLettersForDay(year, month, day).forEach((entry) => {
    if (entry.value === letter) {
      rosterValues.delete(entry.key);
      leaveTypeValues.delete(entry.key);
      leaveNoteValues.delete(entry.key);
    }
  });
  const extra = getExtraLeaveForDay(year, month, day);
  if (extra?.value === letter) extraLeaveValues.delete(makeDayValueKey(year, month, day));
}

function isBatchPublicLeaveType(type) {
  return window.ValueCycle.contains(PUBLIC_LEAVE_TYPE_KEYS, type || 'public');
}
function removeBatchPublicVacationLetter(year, month, day, letter) {
  getVacationLettersForDay(year, month, day).forEach((entry) => {
    if (entry.value === letter && isBatchPublicLeaveType(entry.type)) {
      rosterValues.delete(entry.key);
      leaveTypeValues.delete(entry.key);
      leaveNoteValues.delete(entry.key);
    }
  });
  const extra = getExtraLeaveForDay(year, month, day);
  if (extra?.value === letter && isBatchPublicLeaveType(extra.type)) {
    extraLeaveValues.delete(makeDayValueKey(year, month, day));
  }
}

function getShiftEntriesForDay(year, month, day) {
  return shifts.map((shift, shiftIndex) => {
    const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
    return { key, shiftIndex, value: rosterValues.get(key) || '' };
  });
}
function hasShiftLetterForDay(year, month, day, letter) {
  return Boolean(letter) && getShiftEntriesForDay(year, month, day).some((entry) => entry.value === letter);
}
function removeShiftLetterForDay(year, month, day, letter) {
  getShiftEntriesForDay(year, month, day).forEach((entry) => {
    if (entry.value !== letter) return;
    rosterValues.delete(entry.key);
    const specialKey = makeSpecialShiftKey(year, month, day, entry.shiftIndex);
    specialShiftCells.delete(specialKey);
    specialShiftTimes.delete(specialKey);
    nightShiftTimes.delete(makeNightShiftKey(year, month, day, entry.shiftIndex));
  });
}

const PERSONNEL_SHIFT_GROUPS = Object.freeze([
  { key: 'early', label: '早班' },
  { key: 'middle', label: '中班' },
  { key: 'night', label: '大夜' }
]);
const A_ALL_SHIFT_GROUPS = Object.freeze(['early', 'middle', 'night']);
const SHIFT_INDEX_GROUP_KEYS = Object.freeze(['early', 'middle', 'middle', 'night', 'night']);

function getPersonnelShifts(year, month, letter) {
  if (letter === 'A') return new Set(A_ALL_SHIFT_GROUPS);
  const value = personnelShiftValues.get(makePersonnelShiftKey(year, month, letter));
  const list = Array.isArray(value) ? value : value instanceof Set ? [...value] : [];
  const valid = list.filter((item) => window.ValueCycle.contains(SHIFT_GROUP_KEYS, item));
  return new Set(valid.slice(0, 1));
}
function setPersonnelFixedShift(year, month, letter, groupKey) {
  if (letter === 'A') return;
  const key = makePersonnelShiftKey(year, month, letter);
  if (!window.ValueCycle.contains(SHIFT_GROUP_KEYS, groupKey)) {
    personnelShiftValues.delete(key);
    return;
  }
  personnelShiftValues.set(key, [groupKey]);
}
function getShiftGroupKeyForIndex(shiftIndex) {
  return SHIFT_INDEX_GROUP_KEYS[shiftIndex] || '';
}
function getEligibleLettersForShift(shiftIndex) {
  const { year, month } = getCurrentYearMonth();
  const targetGroup = getShiftGroupKeyForIndex(shiftIndex);
  return ['A', 'B', 'C', 'D', 'E', 'F'].filter((letter) => {
    const index = letter.charCodeAt(0) - 65;
    if (!names[index]) return false;
    if (letter === 'A') return true;
    return getPersonnelShifts(year, month, letter).has(targetGroup);
  });
}

const EDIT_MODE_UI = Object.freeze({
  block: { button: blockModeButton, bodyClass: 'block-mode' },
  special: { button: specialModeButton, bodyClass: 'special-mode' },
  night: { button: nightModeButton, bodyClass: 'night-mode' },
  leaveType: { button: leaveTypeModeButton, bodyClass: 'leave-type-mode' },
  meeting: { button: meetingModeButton, bodyClass: 'meeting-mode' },
  note: { button: noteModeButton, bodyClass: 'note-mode' }
});

function isEditModeActive(name) {
  return editModeState.isExpanded(name);
}

function syncEditModeUI() {
  for (const [name, config] of Object.entries(EDIT_MODE_UI)) {
    const enabled = isEditModeActive(name);
    config.button.classList.toggle('is-active', enabled);
    config.button.setAttribute('aria-pressed', String(enabled));
    document.body.classList.toggle(config.bodyClass, enabled);
  }
}

function setEditMode(name, enabled) {
  if (enabled) editModeState.expand(name);
  else editModeState.collapse(name);
  syncEditModeUI();
}

function setBlockMode(enabled) { setEditMode('block', enabled); }
function setSpecialMode(enabled) { setEditMode('special', enabled); }
function setNightMode(enabled) { setEditMode('night', enabled); }
function setLeaveTypeMode(enabled) { setEditMode('leaveType', enabled); }
function setMeetingMode(enabled) { setEditMode('meeting', enabled); }
function setNoteMode(enabled) { setEditMode('note', enabled); }

function showConflictChoice(message) {
  if (conflictChoiceResolver) conflictChoiceResolver('vacation');
  conflictDialogMessage.textContent = message;
  conflictDialog.hidden = false;
  return new Promise((resolve) => {
    conflictChoiceResolver = resolve;
    requestAnimationFrame(() => conflictChooseVacation.focus());
  });
}
function resolveConflictChoice(choice) {
  if (!conflictChoiceResolver) return;
  const resolve = conflictChoiceResolver;
  conflictChoiceResolver = null;
  conflictDialog.hidden = true;
  resolve(choice);
}

function showBlockedLeaveChoice(message) {
  if (blockedLeaveResolver) blockedLeaveResolver('back');
  blockedLeaveMessage.textContent = message;
  blockedLeaveDialog.hidden = false;
  return new Promise((resolve) => {
    blockedLeaveResolver = resolve;
    requestAnimationFrame(() => blockedLeaveException.focus());
  });
}
function resolveBlockedLeaveChoice(choice) {
  if (!blockedLeaveResolver) return;
  const resolve = blockedLeaveResolver;
  blockedLeaveResolver = null;
  blockedLeaveDialog.hidden = true;
  resolve(choice);
}

function showLeaveTypeChoice({ message, allowedTypes = null }) {
  if (leaveTypeResolver) leaveTypeResolver(null);
  leaveTypeMessage.textContent = message;
  const allowed = allowedTypes
    ? window.TreeSelection.create({ selected: allowedTypes })
    : null;
  leaveTypeChoices.querySelectorAll('[data-leave-type]').forEach((button) => {
    button.hidden = Boolean(allowed && !allowed.has(button.dataset.leaveType));
  });
  leaveTypeDialog.hidden = false;
  return new Promise((resolve) => {
    leaveTypeResolver = resolve;
    const first = [...leaveTypeChoices.querySelectorAll('[data-leave-type]')].find((button) => !button.hidden);
    if (first) requestAnimationFrame(() => first.focus());
  });
}
function resolveLeaveTypeChoice(type) {
  if (!leaveTypeResolver) return;
  const resolve = leaveTypeResolver;
  leaveTypeResolver = null;
  leaveTypeDialog.hidden = true;
  resolve(type);
}

function showLeaveNoteChoice({ message = '請假備註（選填）', currentNote = '' } = {}) {
  if (leaveNoteResolver) leaveNoteResolver(null);
  leaveNoteMessage.textContent = message;
  leaveNoteCustomInput.value = currentNote && !window.ValueCycle.contains(['病假', '事假', '公假', '婚假', '喪假'], currentNote) ? currentNote : '';
  leaveNoteDialog.hidden = false;
  return new Promise((resolve) => {
    leaveNoteResolver = resolve;
    requestAnimationFrame(() => leaveNoteQuickChoices.querySelector('button')?.focus());
  });
}
function resolveLeaveNoteChoice(note) {
  if (!leaveNoteResolver) return;
  const resolve = leaveNoteResolver;
  leaveNoteResolver = null;
  leaveNoteDialog.hidden = true;
  resolve(note);
}

function openSpecialTimeDialog(year, month, day, shiftIndex) {
  const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
  const letter = rosterValues.get(key) || '';
  if (!letter) {
    window.alert('請先在這格填入員工代號，再設定特殊班時間。');
    return;
  }
  const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
  specialTimeContext = { year, month, day, shiftIndex, key, specialKey, letter };
  specialTimeMessage.textContent = `${month}/${day}　${letter}　粉底設定\n實際時間可留空；留空時沿用班別時間 ${shifts[shiftIndex]?.label || ''}`;
  fillHourPair(specialTimeStartInput, specialTimeEndInput, specialShiftTimes.get(specialKey) || '');
  specialTimeDialog.hidden = false;
  requestAnimationFrame(() => specialTimeStartInput.focus());
}
function closeSpecialTimeDialog() {
  specialTimeDialog.hidden = true;
  specialTimeContext = null;
}
function applySpecialTime() {
  if (!specialTimeContext) return;
  const startText = cleanHourInput(specialTimeStartInput.value);
  const endText = cleanHourInput(specialTimeEndInput.value);
  specialTimeStartInput.value = startText;
  specialTimeEndInput.value = endText;

  if (!startText && !endText) {
    specialShiftCells.add(specialTimeContext.specialKey);
    specialShiftTimes.delete(specialTimeContext.specialKey);
    closeSpecialTimeDialog();
    render();
    return;
  }
  if (!startText || !endText) {
    window.alert('時間可以完全留空；若要輸入，請把開始與結束時間都填完整。');
    (startText ? specialTimeEndInput : specialTimeStartInput).focus();
    return;
  }
  const value = `${String(Number(startText)).padStart(2, '0')}~${String(Number(endText)).padStart(2, '0')}`;
  if (!window.ShiftRosterRules?.parseTimeRange(value)) {
    window.alert('時間格式不正確，請分別輸入開始與結束小時，例如 12、20；或兩格都留空。');
    specialTimeStartInput.focus();
    return;
  }
  specialShiftCells.add(specialTimeContext.specialKey);
  specialShiftTimes.set(specialTimeContext.specialKey, value);
  closeSpecialTimeDialog();
  render();
}

function removeSpecialTime() {
  if (!specialTimeContext) return;
  specialShiftCells.delete(specialTimeContext.specialKey);
  specialShiftTimes.delete(specialTimeContext.specialKey);
  closeSpecialTimeDialog();
  render();
}

function openNightTimeDialog(year, month, day, shiftIndex) {
  const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
  const letter = rosterValues.get(key) || '';
  nightTimeContext = { year, month, day, shiftIndex, key, letter };
  const shiftLabel = shifts[shiftIndex]?.label || '';
  const emptyTimeHint = shiftIndex === 3
    ? `留空時使用灰底預設時間 ${normalNightRange}`
    : `留空時沿用班別時間 ${shiftLabel}`;
  nightTimeMessage.textContent = `${month}/${day}${letter ? `　${letter}` : ''}${shiftLabel ? `　${shiftLabel}` : ''}　灰底設定\n實際時間可留空；${emptyTimeHint}`;
  fillHourPair(nightTimeStartInput, nightTimeEndInput, nightShiftTimes.get(makeNightShiftKey(year, month, day, shiftIndex)) || '');
  nightTimeDialog.hidden = false;
  requestAnimationFrame(() => nightTimeStartInput.focus());
}
function closeNightTimeDialog() {
  nightTimeDialog.hidden = true;
  nightTimeContext = null;
}
function applyNightTime() {
  if (!nightTimeContext) return;

  const startText = cleanHourInput(nightTimeStartInput.value);
  const endText = cleanHourInput(nightTimeEndInput.value);
  nightTimeStartInput.value = startText;
  nightTimeEndInput.value = endText;

  const { year, month, day, shiftIndex } = nightTimeContext;
  const nightKey = makeNightShiftKey(year, month, day, shiftIndex);

  if (!startText && !endText) {
    setNightGrayState(year, month, day, shiftIndex, true);
    nightShiftTimes.delete(nightKey);
    closeNightTimeDialog();
    render();
    return;
  }

  if (!startText || !endText) {
    window.alert('時間可以完全留空；若要輸入，請把開始與結束時間都填完整。');
    (startText ? nightTimeEndInput : nightTimeStartInput).focus();
    return;
  }

  const value = `${String(Number(startText)).padStart(2, '0')}~${String(Number(endText)).padStart(2, '0')}`;
  if (!window.ShiftRosterRules?.parseTimeRange(value)) {
    window.alert('時間格式不正確，請分別輸入開始與結束小時，例如 21、05；或兩格都留空。');
    nightTimeStartInput.focus();
    return;
  }

  setNightGrayState(year, month, day, shiftIndex, true);
  nightShiftTimes.set(nightKey, value);
  closeNightTimeDialog();
  render();
}
function removeNight() {
  if (!nightTimeContext) return;
  const { year, month, day, shiftIndex } = nightTimeContext;
  setNightGrayState(year, month, day, shiftIndex, false);
  nightShiftTimes.delete(makeNightShiftKey(year, month, day, shiftIndex));
  closeNightTimeDialog();
  render();
}

async function openClearMonthDialog() {
  const { year, month } = getCurrentYearMonth();
  const confirmed = await window.SlowlyConfirm.show({
    title: '清空本月班表',
    message: `${year} 年 ${month} 月的排班與手動標記都要清空嗎？\n姓名與公休／特休數字會保留。`,
    confirmText: '清空',
    cancelText: '取消',
    initialFocus: 'cancel'
  });
  if (confirmed) clearCurrentMonth();
}
function clearCurrentMonth() {
  const { year, month } = getCurrentYearMonth();
  clearMapKeysForMonth(rosterValues, year, month);
  clearMapKeysForMonth(blockedVacationOverrides, year, month);
  clearMapKeysForMonth(nightShiftOverrides, year, month);
  clearMapKeysForMonth(leaveTypeValues, year, month);
  clearMapKeysForMonth(leaveNoteValues, year, month);
  clearMapKeysForMonth(manualNoteValues, year, month);
  clearMapKeysForMonth(extraLeaveValues, year, month);
  clearMapKeysForMonth(meetingNoteValues, year, month);
  clearMapKeysForMonth(specialShiftTimes, year, month);
  clearMapKeysForMonth(nightShiftTimes, year, month);
  clearMapKeysForMonth(personnelShiftValues, year, month);
  clearSetKeysForMonth(specialShiftCells, year, month);
  clearSetKeysForMonth(meetingDays, year, month);
  supervisorLeaveDays.clear();
  closeRowFillPanel();
  closeShiftConfigPanel();
  closeSupervisorConfigPanel();
  render();
}

function getActualShiftRange(year, month, day, shiftIndex) {
  const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
  if (specialShiftCells.has(specialKey)) {
    const specialTime = specialShiftTimes.get(specialKey) || '';
    if (specialTime) return specialTime;
  }

  if (isNightGray(year, month, day, shiftIndex)) {
    const nightTime = nightShiftTimes.get(makeNightShiftKey(year, month, day, shiftIndex)) || '';
    if (nightTime) return nightTime;
    if (shiftIndex === 3) return normalNightRange || '22~06';
  }

  return shiftRanges[shiftIndex] || DEFAULT_SHIFT_RANGES[shiftIndex] || '';
}

function timeRangeToDailySegments(rangeText) {
  const parsed = window.ShiftRosterRules?.parseTimeRange(rangeText);
  if (!parsed) return [];
  const start = parsed.start.hour * 60 + parsed.start.minute;
  const end = parsed.end.hour * 60 + parsed.end.minute;
  if (end > start) return [[start, end]];
  if (end === start) return [[0, 1440]];
  return [[start, 1440], [0, end]];
}

function doShiftRangesOverlap(firstRange, secondRange) {
  const firstSegments = timeRangeToDailySegments(firstRange);
  const secondSegments = timeRangeToDailySegments(secondRange);
  if (!firstSegments.length || !secondSegments.length) return false;
  return firstSegments.some(([firstStart, firstEnd]) => (
    secondSegments.some(([secondStart, secondEnd]) => Math.max(firstStart, secondStart) < Math.min(firstEnd, secondEnd))
  ));
}

function hasOverlappingShiftForLetter(year, month, day, targetShiftIndex, letter) {
  const targetRange = getActualShiftRange(year, month, day, targetShiftIndex);
  if (!targetRange) return false;
  for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex += 1) {
    if (shiftIndex === targetShiftIndex) continue;
    const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
    if ((rosterValues.get(key) || '') !== letter) continue;
    const otherRange = getActualShiftRange(year, month, day, shiftIndex);
    if (otherRange && doShiftRangesOverlap(targetRange, otherRange)) return true;
  }
  return false;
}

function clearShiftCellForRowFill(year, month, day, shiftIndex) {
  const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
  rosterValues.delete(key);
  const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
  specialShiftCells.delete(specialKey);
  specialShiftTimes.delete(specialKey);
  nightShiftTimes.delete(makeNightShiftKey(year, month, day, shiftIndex));
}

function applyLetterToShiftRow(shiftIndex, letter) {
  const { year, month } = getCurrentYearMonth();
  const cleaned = cleanEnglishLetter(letter);
  if (shiftIndex == null || shiftIndex < 0 || shiftIndex >= shifts.length) return;
  const days = getDaysInMonth(year, month);

  if (!cleaned) {
    for (let day = 1; day <= days; day += 1) clearShiftCellForRowFill(year, month, day, shiftIndex);
    closeRowFillPanel();
    render();
    return;
  }

  for (let day = 1; day <= days; day += 1) {
    const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
    const shouldStayBlank = hasVacationLetter(year, month, day, cleaned)
      || hasOverlappingShiftForLetter(year, month, day, shiftIndex, cleaned);

    if (shouldStayBlank) {
      clearShiftCellForRowFill(year, month, day, shiftIndex);
      continue;
    }
    rosterValues.set(key, cleaned);
  }
  closeRowFillPanel();
  render();
}

function openRowFillPanel(shiftIndex) {
  selectedRowFillShiftIndex = shiftIndex;
  rowFillTitle.textContent = `${shifts[shiftIndex].label} 整列填入`;
  buildRowFillQuickLetters(shiftIndex);
  rowFillBar.hidden = false;
  closeShiftConfigPanel();
  closeSupervisorConfigPanel();
  rowFillBar.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function closeRowFillPanel() {
  rowFillBar.hidden = true;
  selectedRowFillShiftIndex = null;
}
function buildRowFillQuickLetters(shiftIndex = selectedRowFillShiftIndex) {
  rowFillQuickLetters.innerHTML = '';
  const letters = shiftIndex == null
    ? ['A', 'B', 'C', 'D', 'E', 'F'].filter((letter) => names[letter.charCodeAt(0) - 65])
    : getEligibleLettersForShift(shiftIndex);

  if (!letters.length) {
    const empty = document.createElement('span');
    empty.className = 'row-fill-empty';
    empty.textContent = '目前沒有符合這個班別的人員。';
    rowFillQuickLetters.appendChild(empty);
    return;
  }

  for (const letter of letters) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = letter;
    button.title = letter === 'A' ? 'A：三班例外' : '只顯示固定為此班別的人員';
    button.addEventListener('click', () => {
      if (selectedRowFillShiftIndex != null) applyLetterToShiftRow(selectedRowFillShiftIndex, letter);
    });
    rowFillQuickLetters.appendChild(button);
  }
}

function openShiftConfigPanel() {
  commitAllVisibleNames();
  closeRowFillPanel();
  closeSupervisorConfigPanel();
  expandedShiftConfigIndex = null;
  renderShiftConfigPanel();
  shiftConfigPanel.hidden = false;
  shiftConfigButton.setAttribute('aria-expanded', 'true');
  shiftSeniorityInfo.hidden = true;
  shiftConfigGrid.hidden = true;
  shiftSeniorityButton.classList.remove('is-active');
  shiftPeopleButton?.classList.remove('is-active');
}
function closeShiftConfigPanel() {
  shiftConfigPanel.hidden = true;
  shiftConfigButton.setAttribute('aria-expanded', 'false');
  collapseSeniorityInfo(shiftSeniorityButton, shiftSeniorityInfo);
  if (shiftConfigGrid) shiftConfigGrid.hidden = true;
  shiftPeopleButton?.classList.remove('is-active');
}
function openSupervisorConfigPanel() {
  commitAllVisibleNames();
  closeRowFillPanel();
  closeShiftConfigPanel();
  const { year, month } = getCurrentYearMonth();
  renderSupervisorConfigPanel(year, month);
  supervisorConfigPanel.hidden = false;
  supervisorConfigButton.setAttribute('aria-expanded', 'true');
  supervisorSeniorityInfo.hidden = true;
  supervisorConfigBody.hidden = true;
  supervisorSeniorityButton.classList.remove('is-active');
  supervisorPeopleButton?.classList.remove('is-active');
}
function closeSupervisorConfigPanel() {
  supervisorConfigPanel.hidden = true;
  supervisorConfigButton.setAttribute('aria-expanded', 'false');
  collapseSeniorityInfo(supervisorSeniorityButton, supervisorSeniorityInfo);
  if (supervisorConfigBody) supervisorConfigBody.hidden = true;
  supervisorPeopleButton?.classList.remove('is-active');
}
function getAnnualBalanceSnapshot(index, year, month) {
  const balanceText = String(specialLeaveValues[index] || '').trim();
  const available = /^\d+$/.test(balanceText) ? Number(balanceText) : null;
  const letter = String.fromCharCode(65 + index);
  const employeeId = employeeIds[index] || '';
  const calibration = getAnnualBalanceCalibration(employeeId, year, month);
  const used = getLeaveSummaryForLetter(year, month, letter).annualDates.length;
  const remaining = available == null ? null : Math.max(0, available - used);
  const overused = available == null ? 0 : Math.max(0, used - available);
  const basis = getAnnualBalanceBasis(index, year, month);
  return { available, used, remaining, overused, expected: basis.value, expectedSource: basis.source, calibration };
}

function syncNameInputsForIndex(index) {
  document.querySelectorAll(`[data-person-name-index="${index}"]`).forEach((input) => {
    if (input instanceof HTMLInputElement && input.value !== names[index]) input.value = names[index];
  });
  const lowerInput = document.querySelector(`.name-input[data-index="${index}"]`);
  if (lowerInput && lowerInput.value !== names[index]) lowerInput.value = names[index];
}

function renderShiftConfigPanel() {
  const { year, month } = getCurrentYearMonth();
  shiftConfigGrid.innerHTML = '';
  for (let index = 0; index < names.length; index += 1) {
    const letter = String.fromCharCode(65 + index);
    const row = document.createElement('div');
    row.className = 'shift-config-row';

    const person = document.createElement('div');
    person.className = 'shift-config-person';

    const letterLabel = document.createElement('strong');
    letterLabel.className = 'shift-config-letter';
    letterLabel.textContent = `${letter}.`;

    const nameLabel = document.createElement('label');
    nameLabel.className = 'shift-config-field';
    const nameCaption = document.createElement('span');
    nameCaption.textContent = '姓名';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'shift-config-name-input';
    nameInput.value = names[index] || '';
    nameInput.dataset.personNameIndex = String(index);
    nameInput.autocomplete = 'off';
    nameInput.setAttribute('aria-label', `${letter} 姓名`);
    nameInput.addEventListener('compositionstart', () => { nameInput.dataset.composing = 'true'; });
    nameInput.addEventListener('compositionend', () => {
      nameInput.dataset.composing = 'false';
      const cleaned = trimDisplayName(nameInput.value);
      names[index] = cleaned;
      nameInput.value = cleaned;
      syncNameInputsForIndex(index);
      persistCurrentMonth();
      renderSummary();
    });
    nameInput.addEventListener('input', () => {
      const cleaned = trimDisplayName(nameInput.value);
      names[index] = cleaned;
      if (nameInput.dataset.composing !== 'true' && nameInput.value !== cleaned) nameInput.value = cleaned;
      syncNameInputsForIndex(index);
      persistCurrentMonth();
      renderSummary();
    });
    nameInput.addEventListener('blur', () => {
      if (nameInput.dataset.composing === 'true') return;
      const cleaned = trimDisplayName(nameInput.value);
      names[index] = cleaned;
      nameInput.value = cleaned;
      commitNameAtIndex(index);
      const calibration = getAnnualBalanceCalibration(employeeIds[index] || '', year, month);
      const basis = getAnnualBalanceBasis(index, year, month);
      if (!String(specialLeaveValues[index] || '').trim()) {
        if (calibration) specialLeaveValues[index] = String(calibration.value);
        else if (basis.value != null) specialLeaveValues[index] = String(basis.value);
        if (String(specialLeaveValues[index] || '').trim()) persistCurrentMonth();
      }
      syncNameInputsForIndex(index);
      renderLower(year, month);
      renderSummary();
      renderShiftConfigPanel();
      if (selectedRowFillShiftIndex != null) buildRowFillQuickLetters(selectedRowFillShiftIndex);
    });
    nameLabel.append(nameCaption, nameInput);
    person.append(letterLabel, nameLabel);

    const employeeId = employeeIds[index] || '';
    const record = employeeId ? (getEmployeeRecord(employeeId) || {}) : {};

    const hireLabel = document.createElement('label');
    hireLabel.className = 'shift-config-field';
    const hireCaption = document.createElement('span');
    hireCaption.textContent = '到職日';
    const hireInput = document.createElement('input');
    hireInput.type = 'date';
    hireInput.className = 'shift-config-hire-input';
    hireInput.value = String(record.hireDate || '');
    hireInput.disabled = !employeeId;
    hireInput.title = employeeId ? '用到職日判斷滿 6 個月與每年特休取得日' : '先輸入姓名建立人員資料';
    hireInput.addEventListener('change', () => {
      const previousExpected = calculateExpectedAnnualBalanceFromPrevious(index, year, month);
      const oldAutomatic = calculateAnnualBalanceFromHireDate(employeeId, year, month);
      const currentText = String(specialLeaveValues[index] || '').trim();
      const currentNumber = /^\d+$/.test(currentText) ? Number(currentText) : null;

      updateEmployeeRecord(employeeId, { hireDate: hireInput.value || '' });

      // 已有前月銜接時不動本月數字；第一次建立時，空白或原本就是自動值才跟著到職日重算。
      // 若本月已有明確數字（例如已套用校正），變更到職日時不要擅自覆蓋。
      if (previousExpected == null) {
        const nextAutomatic = calculateAnnualBalanceFromHireDate(employeeId, year, month);
        if (!currentText || (oldAutomatic != null && currentNumber === oldAutomatic)) {
          specialLeaveValues[index] = nextAutomatic == null ? '' : String(nextAutomatic);
        }
      }

      persistCurrentMonth();
      renderLower(year, month);
      renderShiftConfigPanel();
    });
    hireLabel.append(hireCaption, hireInput);
    person.appendChild(hireLabel);

    const options = document.createElement('div');
    options.className = 'shift-config-options';

    if (letter !== 'A') {
      options.setAttribute('aria-label', `${letter} 固定班別，只能單選`);
      const current = getPersonnelShifts(year, month, letter);
      PERSONNEL_SHIFT_GROUPS.forEach((group) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'shift-config-option';
        const active = current.has(group.key);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        const groupDetail = getShiftGroupDetail(group.key, '／');
        button.setAttribute('aria-label', `${letter} 固定${group.label} ${groupDetail}`);

        const label = document.createElement('strong');
        label.textContent = group.label;
        const detail = document.createElement('small');
        detail.textContent = groupDetail;
        button.append(label, detail);

        button.addEventListener('click', () => {
          const wasActive = button.getAttribute('aria-pressed') === 'true';
          setPersonnelFixedShift(year, month, letter, wasActive ? '' : group.key);
          persistCurrentMonth();
          renderShiftConfigPanel();
          if (selectedRowFillShiftIndex != null) buildRowFillQuickLetters(selectedRowFillShiftIndex);
        });
        options.appendChild(button);
      });
    }

    const meta = document.createElement('div');
    meta.className = 'shift-config-meta';

    const annual = getAnnualBalanceSnapshot(index, year, month);

    const calibrationBox = document.createElement('div');
    calibrationBox.className = 'annual-calibration-control';

    const calibrationLabel = document.createElement('label');
    calibrationLabel.className = 'shift-config-field annual-balance-field';
    const calibrationCaption = document.createElement('span');
    calibrationCaption.textContent = '本月特休校正';
    const calibrationInput = document.createElement('input');
    calibrationInput.type = 'number';
    calibrationInput.min = '0';
    calibrationInput.max = '99';
    calibrationInput.inputMode = 'numeric';
    calibrationInput.value = annual.calibration ? String(annual.calibration.value) : '';
    calibrationInput.placeholder = employeeId ? '輸入校正值' : '先輸入姓名';
    calibrationInput.disabled = !employeeId;
    calibrationInput.setAttribute('aria-label', `${letter} 本月特休校正值`);
    calibrationInput.title = employeeId ? '只有按下「套用校正」才會改成本月特休起點；可在任何月份重新校正' : '先輸入姓名';
    calibrationLabel.append(calibrationCaption, calibrationInput);

    const calibrationActions = document.createElement('div');
    calibrationActions.className = 'annual-calibration-actions';
    const applyCalibrationButton = document.createElement('button');
    applyCalibrationButton.type = 'button';
    applyCalibrationButton.textContent = '套用校正';
    applyCalibrationButton.disabled = !employeeId;
    applyCalibrationButton.addEventListener('click', () => {
      const text = String(calibrationInput.value || '').trim();
      if (!/^\d+$/.test(text)) {
        window.alert('請先輸入 0～99 的特休校正天數。');
        calibrationInput.focus();
        return;
      }
      const numeric = Math.max(0, Math.min(99, Number.parseInt(text, 10) || 0));
      const calibrationKey = makeAnnualBalanceCalibrationKey(year, month, employeeId);
      annualBalanceCalibrationValues.set(calibrationKey, { value: numeric });
      specialLeaveValues[index] = String(numeric);
      persistCurrentMonth();
      renderLower(year, month);
      renderShiftConfigPanel();
    });

    const cancelCalibrationButton = document.createElement('button');
    cancelCalibrationButton.type = 'button';
    cancelCalibrationButton.textContent = '取消校正';
    cancelCalibrationButton.disabled = !employeeId || !annual.calibration;
    cancelCalibrationButton.addEventListener('click', () => {
      const calibrationKey = makeAnnualBalanceCalibrationKey(year, month, employeeId);
      annualBalanceCalibrationValues.delete(calibrationKey);
      const basis = getAnnualBalanceBasis(index, year, month);
      specialLeaveValues[index] = basis.value == null ? '' : String(basis.value);
      persistCurrentMonth();
      renderLower(year, month);
      renderShiftConfigPanel();
    });

    calibrationActions.append(applyCalibrationButton, cancelCalibrationButton);
    calibrationBox.append(calibrationLabel, calibrationActions);
    meta.appendChild(calibrationBox);

    const annualStatus = document.createElement('div');
    annualStatus.className = 'annual-balance-status';
    const availableText = annual.available == null ? '未設定' : `${annual.available} 天`;
    const remainingText = annual.remaining == null ? '—' : `${annual.remaining} 天`;
    annualStatus.innerHTML = `<span>本月可用 <strong>${availableText}</strong></span><span>已排 <strong>${annual.used} 天</strong></span><span>目前剩餘 <strong>${remainingText}</strong></span>`;
    if (annual.overused > 0) {
      const warning = document.createElement('strong');
      warning.className = 'annual-balance-warning';
      warning.textContent = `已超用 ${annual.overused} 天`;
      annualStatus.appendChild(warning);
    }
    meta.appendChild(annualStatus);

    const carry = document.createElement('div');
    carry.className = 'annual-carry-status';
    if (!employeeId) {
      carry.textContent = '先輸入姓名，才能保存到職日並銜接跨月特休。';
    } else if (annual.calibration) {
      carry.textContent = `本月已套用校正 ${annual.calibration.value} 天；後續月份會從這個數字正常扣除／結轉，下一個取得日仍照原本累加或重置規則。`;
    } else if (annual.expectedSource === 'hire') {
      carry.textContent = `依到職日自動計算本月起點 ${annual.expected} 天；若實際現況不同，可輸入校正值後按「套用校正」。`;
    } else if (annual.expectedSource === 'previous') {
      if (annual.available === annual.expected) {
        carry.textContent = `跨月計算：上月餘額－上月已用／取得日處理 → 本月 ${annual.expected} 天。`;
      } else {
        carry.textContent = `跨月計算應為 ${annual.expected} 天；目前為 ${availableText}。若現況確實不同，請用「本月特休校正」套用。`;
      }
    } else if (annual.available != null) {
      carry.textContent = `目前本月可用為 ${availableText}；補上到職日後即可自動判斷取得日與年資。`;
    } else {
      carry.textContent = '輸入到職日後會自動計算；若實際現況不同，可在任何月份使用「本月特休校正」。';
    }

    if (employeeId) {
      const grant = getAnnualGrantEventForEmployee(employeeId, year, month);
      if (grant && grant.days > 0) {
        const decisionKey = makeAnnualGrantDecisionKey(year, month, employeeId);
        const decision = annualGrantDecisionValues.get(decisionKey) || null;
        const grantBox = document.createElement('div');
        grantBox.className = 'annual-grant-choice';
        const grantText = document.createElement('span');
        grantText.textContent = `${month}/${grant.day} ${grant.label}取得 ${grant.days} 天；依目前月結邏輯於次月套入`;
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.textContent = decision?.mode === 'accumulate' ? '✓ 累加特休' : '累加特休';
        const resetButton = document.createElement('button');
        resetButton.type = 'button';
        resetButton.textContent = decision?.mode === 'reset' ? '✓ 舊額歸零，換成本次天數' : '舊額歸零，換成本次天數';
        addButton.addEventListener('click', () => {
          annualGrantDecisionValues.set(decisionKey, { mode: 'accumulate', days: grant.days, day: grant.day });
          persistCurrentMonth();
          renderShiftConfigPanel();
          renderLower(year, month);
        });
        resetButton.addEventListener('click', () => {
          annualGrantDecisionValues.set(decisionKey, { mode: 'reset', days: grant.days, day: grant.day });
          persistCurrentMonth();
          renderShiftConfigPanel();
          renderLower(year, month);
        });
        grantBox.append(grantText, addButton, resetButton);
      }
    }

    const summary = document.createElement('div');
    summary.className = 'shift-config-summary';
    const summaryCode = document.createElement('strong');
    summaryCode.textContent = letter;
    const summaryName = document.createElement('span');
    summaryName.textContent = names[index] || '未設定';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = '編輯';
    editButton.addEventListener('click', () => {
      expandedShiftConfigIndex = expandedShiftConfigIndex === index ? null : index;
      renderShiftConfigPanel();
    });
    summary.append(summaryCode, summaryName, editButton);

    const detail = document.createElement('div');
    detail.className = 'shift-config-detail';
    detail.hidden = expandedShiftConfigIndex !== index;
    detail.append(person, options, meta);
    row.append(summary, detail);
    shiftConfigGrid.appendChild(row);
  }
  renderShiftSeniorityInfo();
}

function renderSupervisorConfigPanel(year, month) {
  if (!supervisorConfigBody) return;
  supervisorConfigBody.innerHTML = '';
  const record = getSupervisorRecord() || {};

  const card = document.createElement('div');
  card.className = 'supervisor-config-card';

  const fields = document.createElement('div');
  fields.className = 'supervisor-config-fields';

  const makeField = (caption, input) => {
    const label = document.createElement('label');
    label.className = 'shift-config-field supervisor-config-field';
    const span = document.createElement('span');
    span.textContent = caption;
    label.append(span, input);
    return label;
  };

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.autocomplete = 'off';
  nameInput.value = String(record.name || '');
  nameInput.placeholder = '主管姓名';
  nameInput.addEventListener('blur', () => {
    const value = cleanSupervisorName(nameInput.value);
    nameInput.value = value;
    updateSupervisorRecord({ name: value });
  });

  const displayInput = document.createElement('input');
  displayInput.type = 'text';
  displayInput.autocomplete = 'off';
  displayInput.value = String(record.displayChar || '');
  displayInput.placeholder = '1 字';
  displayInput.maxLength = 1;
  displayInput.setAttribute('aria-label', '主管班表顯示字');
  const commitSupervisorDisplayChar = () => {
    const value = cleanSupervisorDisplayChar(displayInput.value);
    if (displayInput.value !== value) displayInput.value = value;
    updateSupervisorRecord({ displayChar: value });
  };
  displayInput.addEventListener('compositionstart', () => { displayInput.dataset.composing = 'true'; });
  displayInput.addEventListener('compositionend', () => {
    displayInput.dataset.composing = 'false';
    commitSupervisorDisplayChar();
  });
  displayInput.addEventListener('input', () => {
    if (displayInput.dataset.composing === 'true') return;
    commitSupervisorDisplayChar();
  });

  const codeInput = document.createElement('input');
  codeInput.type = 'text';
  codeInput.autocomplete = 'off';
  codeInput.autocapitalize = 'characters';
  codeInput.spellcheck = false;
  codeInput.value = String(record.code || '');
  codeInput.placeholder = 'L';
  codeInput.setAttribute('aria-label', '主管代號');
  codeInput.addEventListener('input', () => {
    const value = cleanSupervisorCode(codeInput.value);
    if (codeInput.value !== value) codeInput.value = value;
    updateSupervisorRecord({ code: value });
    renderLower(year, month);
  });
  codeInput.addEventListener('blur', () => renderSupervisorConfigPanel(year, month));

  const hireInput = document.createElement('input');
  hireInput.type = 'date';
  hireInput.value = String(record.hireDate || '');
  hireInput.addEventListener('change', () => {
    updateSupervisorRecord({ hireDate: hireInput.value || '' });
    renderLower(year, month);
    renderSupervisorConfigPanel(year, month);
  });

  fields.append(
    makeField('姓名', nameInput),
    makeField('班表顯示', displayInput),
    makeField('代號', codeInput),
    makeField('到職日', hireInput)
  );
  card.appendChild(fields);



  const leaveBox = document.createElement('div');
  leaveBox.className = 'supervisor-leave-box';
  const leaveHead = document.createElement('div');
  leaveHead.className = 'supervisor-leave-head';
  const leaveTitle = document.createElement('strong');
  leaveTitle.textContent = '當月休假';
  const leaveCount = document.createElement('span');
  leaveCount.textContent = `已選 ${supervisorLeaveDays.size} 天`;
  leaveHead.append(leaveTitle, leaveCount);
  leaveBox.appendChild(leaveHead);

  const leaveDates = document.createElement('div');
  leaveDates.className = 'supervisor-leave-dates';
  const days = getDaysInMonth(year, month);
  for (let day = 1; day <= days; day += 1) {
    const info = getDayInfo(year, month, day);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'supervisor-leave-date';
    button.setAttribute('aria-pressed', supervisorLeaveDays.has(day) ? 'true' : 'false');
    button.setAttribute('aria-label', `${month}月${day}日主管休假`);
    const dayText = document.createElement('strong');
    dayText.textContent = String(day);
    const weekText = document.createElement('small');
    weekText.textContent = info.weekday;
    button.append(dayText, weekText);
    button.addEventListener('click', () => {
      if (supervisorLeaveDays.has(day)) supervisorLeaveDays.delete(day);
      else supervisorLeaveDays.add(day);
      persistCurrentMonth();
      renderSchedule(year, month);
      renderSupervisorConfigPanel(year, month);
    });
    leaveDates.appendChild(button);
  }
  leaveBox.appendChild(leaveDates);
  card.appendChild(leaveBox);

  const applyButton = document.createElement('button');
  applyButton.type = 'button';
  applyButton.className = 'supervisor-apply-button';
  applyButton.textContent = '套用';
  applyButton.addEventListener('click', () => {
    const name = cleanSupervisorName(nameInput.value);
    const displayChar = cleanSupervisorDisplayChar(displayInput.value);
    const code = cleanSupervisorCode(codeInput.value);
    nameInput.value = name;
    displayInput.value = displayChar;
    codeInput.value = code;
    updateSupervisorRecord({ name, displayChar, code, hireDate: hireInput.value || '' });
    persistCurrentMonth();
    renderSchedule(year, month);
    renderLower(year, month);
  });
  card.appendChild(applyButton);

  supervisorConfigBody.appendChild(card);
  renderSupervisorSeniorityInfo();
}


function createLetterInput({ value = '', ariaLabel, onChange, className }) {
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 1;
  input.inputMode = 'text';
  input.pattern = '[A-Za-z]';
  input.value = value;
  input.className = className;
  input.autocomplete = 'off';
  input.autocapitalize = 'characters';
  input.spellcheck = false;
  input.setAttribute('aria-label', ariaLabel);
  input.addEventListener('input', () => {
    const cleaned = cleanEnglishLetter(input.value);
    if (input.value !== cleaned) input.value = cleaned;
    onChange(cleaned, input);
  });
  return input;
}

function restoreVacationEntry(key, inputElement, previousLetter, previousType, previousNote = '') {
  if (previousLetter) rosterValues.set(key, previousLetter);
  else rosterValues.delete(key);
  setLeaveType(key, previousType || 'public', previousNote);
  inputElement.value = previousLetter;
}

async function handleVacationChange({ year, month, day, key, letter, inputElement }) {
  const previousLetter = inputElement.dataset.previousValue || '';
  const previousType = inputElement.dataset.previousType || 'public';
  const previousNote = inputElement.dataset.previousNote || '';

  if (!letter) {
    rosterValues.delete(key);
    leaveTypeValues.delete(key);
    leaveNoteValues.delete(key);
    render();
    return;
  }

  if (hasShiftLetterForDay(year, month, day, letter)) {
    const choice = await showConflictChoice(`${month}/${day}　${letter} 已排班\n要以哪一種為準？`);
    if (choice === 'vacation') removeShiftLetterForDay(year, month, day, letter);
    else {
      restoreVacationEntry(key, inputElement, previousLetter, previousType, previousNote);
      return;
    }
  }

  rosterValues.set(key, letter);
  if (previousLetter !== letter) {
    leaveTypeValues.delete(key);
    leaveNoteValues.delete(key);
  }

  if (isVacationBlocked(year, month, day) && blockedLeaveTypes.has('public')) {
    const blockedChoice = await showBlockedLeaveChoice(`${month}/${day} 為禁假日，${letter} 要如何處理？`);
    if (blockedChoice === 'exception') {
      setLeaveType(key, 'exceptionPublic');
    } else if (blockedChoice === 'formal') {
      const note = await showLeaveNoteChoice({ message: `${month}/${day}　${letter} 請假備註（選填）` });
      setLeaveType(key, 'leave', note === null ? '' : note);
    } else {
      restoreVacationEntry(key, inputElement, previousLetter, previousType, previousNote);
      render();
      return;
    }
  } else if (!leaveTypeValues.has(key)) {
    setLeaveType(key, 'public');
  }

  inputElement.dataset.previousValue = rosterValues.get(key) || '';
  inputElement.dataset.previousType = getLeaveType(key);
  inputElement.dataset.previousNote = getLeaveNote(key);
  render();
}

function getBatchPublicLeaveMax() {
  return Math.max(1, Number.parseInt(publicLeaveCount || '8', 10) || 8);
}

function renderBatchLeaveDates() {
  if (!batchLeaveLetter) return;
  const { year, month } = getCurrentYearMonth();
  const days = getDaysInMonth(year, month);

  batchLeaveDates.innerHTML = '';
  for (let day = 1; day <= days; day += 1) {
    const info = getDayInfo(year, month, day);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'batch-leave-date';
    button.dataset.day = String(day);
    button.setAttribute('aria-pressed', batchLeaveSelection.has(day) ? 'true' : 'false');
    button.setAttribute('aria-label', `${month}月${day}日（${info.weekday}）`);

    const number = document.createElement('strong');
    number.textContent = String(day);
    const weekday = document.createElement('small');
    weekday.textContent = info.weekday;
    button.append(number, weekday);

    button.addEventListener('click', () => {
      if (batchLeaveSelection.has(day)) {
        batchLeaveSelection.unselect(day);
        batchLeaveHint.textContent = '點日期可複選；特休／請假請回班表單格輸入。';
      } else {
        if (batchLeaveSelection.selectedCount >= getBatchPublicLeaveMax()) {
          batchLeaveHint.textContent = `最多只能選 ${getBatchPublicLeaveMax()} 天。`;
          return;
        }
        batchLeaveSelection.select(day);
        batchLeaveHint.textContent = '點日期可複選；特休／請假請回班表單格輸入。';
      }
      renderBatchLeaveDates();
    });

    batchLeaveDates.appendChild(button);
  }

  batchLeaveCount.textContent = `已選 ${batchLeaveSelection.selectedCount} / ${getBatchPublicLeaveMax()} 天`;
  batchLeaveApply.disabled = batchLeaveSelection.selectedCount < 1 || batchLeaveSelection.selectedCount > getBatchPublicLeaveMax();
}

function openBatchLeaveDialog(letter) {
  const { year, month } = getCurrentYearMonth();
  batchLeaveLetter = cleanEnglishLetter(letter);
  if (!batchLeaveLetter) return;

  closeRowFillPanel();
  closeShiftConfigPanel();
  closeSupervisorConfigPanel();
  batchLeaveSelection.replaceSelected(getPublicVacationDatesForLetter(year, month, batchLeaveLetter));
  batchLeaveFailedDays = [];
  batchLeaveMessage.textContent = `${batchLeaveLetter}｜${year} 年 ${month} 月批次排公休`;
  batchLeaveHint.textContent = batchLeaveSelection.selectedCount > getBatchPublicLeaveMax()
    ? `目前已有 ${batchLeaveSelection.selectedCount} 天公休；批次最多 ${getBatchPublicLeaveMax()} 天，請先取消日期。`
    : '點日期可複選；特休／請假請回班表單格輸入。';
  renderBatchLeaveDates();
  batchLeaveDialog.hidden = false;
  requestAnimationFrame(() => batchLeaveDates.querySelector('button[aria-pressed="true"], button')?.focus());
}

function closeBatchLeaveDialog() {
  batchLeaveDialog.hidden = true;
  batchLeaveLetter = null;
  batchLeaveSelection.clearSelection();
}

function getBatchLeaveFailureText(month, failure) {
  const date = `${month}/${failure.day}`;
  if (failure.reason === 'full') {
    return `${date} 已有 ${failure.occupants.join('、')} 排休，所以 ${failure.letter} 未排進去。`;
  }
  if (failure.reason === 'shift') {
    return `${date} ${failure.letter} 已排班，所以未自動改成排休。`;
  }
  if (failure.reason === 'other-leave') {
    return `${date} ${failure.letter} 已有特休／請假，所以未改成公休。`;
  }
  return `${date} ${failure.letter} 未排進去。`;
}

function focusBatchLeaveFailure(day) {
  const cell = scheduleTable.querySelector(`.vacation-cell[data-day="${day}"]`);
  if (!cell) return;
  cell.classList.add('is-batch-leave-missed');
  cell.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  const input = cell.querySelector('.vacation-input');
  requestAnimationFrame(() => input?.focus({ preventScroll: true }));
  window.setTimeout(() => cell.classList.remove('is-batch-leave-missed'), 2200);
}

function closeBatchLeaveResult() {
  const firstFailure = batchLeaveFailedDays[0];
  batchLeaveResultDialog.hidden = true;
  if (firstFailure) focusBatchLeaveFailure(firstFailure.day);
  batchLeaveFailedDays = [];
}

function applyBatchLeave() {
  if (!batchLeaveLetter) return;
  if (batchLeaveSelection.selectedCount < 1) {
    batchLeaveHint.textContent = '至少要選 1 天。';
    return;
  }
  if (batchLeaveSelection.selectedCount > getBatchPublicLeaveMax()) {
    batchLeaveHint.textContent = `最多只能選 ${getBatchPublicLeaveMax()} 天。`;
    return;
  }

  const { year, month } = getCurrentYearMonth();
  const letter = batchLeaveLetter;
  const selected = batchLeaveSelection.getSelected().map(Number);
  const days = getDaysInMonth(year, month);
  const failures = [];

  // 批次視為「這位員工的公休日期編輯器」：取消勾選時只移除公休／例外排休，
  // 不碰特休、請假等手動假別。
  for (let day = 1; day <= days; day += 1) {
    if (!batchLeaveSelection.has(day)) removeBatchPublicVacationLetter(year, month, day, letter);
  }

  for (const day of selected.slice().sort((a, b) => a - b)) {
    const entries = getVacationLettersForDay(year, month, day);
    const ownEntry = getAllLeaveEntriesForDay(year, month, day).find((entry) => entry.value === letter);

    if (ownEntry) {
      if (isBatchPublicLeaveType(ownEntry.type)) continue;
      failures.push({ day, letter, reason: 'other-leave' });
      continue;
    }

    if (hasShiftLetterForDay(year, month, day, letter)) {
      failures.push({ day, letter, reason: 'shift' });
      continue;
    }

    const occupied = entries.filter((entry) => entry.value);
    if (occupied.length >= 2) {
      failures.push({ day, letter, reason: 'full', occupants: occupied.map((entry) => entry.value) });
      continue;
    }

    const emptyEntry = entries.find((entry) => !entry.value);
    if (!emptyEntry) {
      failures.push({ day, letter, reason: 'full', occupants: occupied.map((entry) => entry.value) });
      continue;
    }

    rosterValues.set(emptyEntry.key, letter);
    setLeaveType(emptyEntry.key, 'public');
  }

  const requestedCount = selected.size;
  closeBatchLeaveDialog();
  render();

  if (failures.length) {
    batchLeaveFailedDays = failures;
    const actualCount = getPublicVacationDatesForLetter(year, month, letter).length;
    const details = failures.map((failure) => `・${getBatchLeaveFailureText(month, failure)}`).join('\n');
    batchLeaveResultMessage.textContent = `${letter} 批次排休完成 ${actualCount} / ${requestedCount} 天。\n\n${details}\n\n未排入的日期請回班表單獨調整，不用重選其他日期。`;
    batchLeaveResultDialog.hidden = false;
    requestAnimationFrame(() => batchLeaveResultClose.focus());
  }
}

function makeTimeNoteLines(letter, value) {
  const { start, end } = splitHourRange(value);
  if (!letter || !start || !end) return [];
  return [letter, start, '│', end];
}

function makeLeaveNoteLines(entry) {
  if (!entry?.value) return [];
  if (entry.type === 'annual') return [entry.value, '特', '休'];
  if (entry.type === 'leave') return [entry.value, ...Array.from(entry.note || '請假')];
  if (entry.extra && window.ValueCycle.contains(PUBLIC_LEAVE_TYPE_KEYS, entry.type)) return [entry.value, '公', '休'];
  return [];
}

function buildDayNotes(year, month, day) {
  const notes = [];

  for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex += 1) {
    const letter = rosterValues.get(makeRosterKey(year, month, day, 'shift', shiftIndex)) || '';
    if (!letter) continue;
    const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
    if (specialShiftCells.has(specialKey)) {
      const time = specialShiftTimes.get(specialKey);
      if (time) notes.push({ kind: 'time', lines: makeTimeNoteLines(letter, time) });
    }
    const grayTime = nightShiftTimes.get(makeNightShiftKey(year, month, day, shiftIndex));
    if (grayTime) notes.push({ kind: 'time', lines: makeTimeNoteLines(letter, grayTime) });
  }

  for (const entry of getAllLeaveEntriesForDay(year, month, day)) {
    const lines = makeLeaveNoteLines(entry);
    if (lines.length) notes.push({ kind: 'leave', lines });
  }

  for (let index = 0; index < employeeIds.length; index += 1) {
    const employeeId = employeeIds[index] || '';
    if (!employeeId) continue;
    const grant = getAnnualGrantEventForEmployee(employeeId, year, month);
    if (!grant || grant.day !== day || grant.days <= 0) continue;
    const letter = String.fromCharCode(65 + index);
    notes.push({ kind: 'annual-grant', lines: [letter, String(grant.days)] });
  }

  const supervisorGrantNote = getSupervisorAnnualGrantNote(year, month, day);
  if (supervisorGrantNote) notes.push(supervisorGrantNote);

  if (meetingDays.has(makeMeetingDayKey(year, month, day))) {
    const text = meetingNoteValues.get(makeDayValueKey(year, month, day)) || meetingDefaultText || '8點櫃檯開會';
    notes.push({ kind: 'meeting', lines: Array.from(text) });
  }

  const manual = String(manualNoteValues.get(makeDayValueKey(year, month, day)) || '');
  if (manual) notes.push({ kind: 'manual', lines: Array.from(manual) });

  return notes;
}

function syncExtraLeaveNoteState() {
  const enabled = extraLeaveType.value === 'leave' && Boolean(extraLeaveLetter.value);
  extraLeaveNote.disabled = !enabled;
  if (!enabled) extraLeaveNote.value = '';
}

function openDayNoteDialog(year, month, day) {
  dayNoteContext = { year, month, day };
  const dayKey = makeDayValueKey(year, month, day);
  dayNoteMessage.textContent = `${month}/${day}　長條備註`;
  dayNoteInput.value = String(manualNoteValues.get(dayKey) || '');
  dayNoteCount.textContent = String(Array.from(dayNoteInput.value).length);

  const currentExtra = getExtraLeaveForDay(year, month, day);
  extraLeaveLetter.innerHTML = '<option value="">不設定</option>';
  names.forEach((name, index) => {
    const letter = String.fromCharCode(65 + index);
    if (!String(name || '').trim() && currentExtra?.value !== letter) return;
    const option = document.createElement('option');
    option.value = letter;
    option.textContent = name ? `${letter}. ${name}` : letter;
    extraLeaveLetter.appendChild(option);
  });
  extraLeaveLetter.value = currentExtra?.value || '';
  extraLeaveType.value = currentExtra?.type || 'public';
  extraLeaveNote.value = currentExtra?.note || '';
  syncExtraLeaveNoteState();
  dayNoteDialog.hidden = false;
  requestAnimationFrame(() => dayNoteInput.focus());
}

function closeDayNoteDialog() {
  dayNoteDialog.hidden = true;
  dayNoteContext = null;
}

function applyDayNote() {
  if (!dayNoteContext) return;
  const { year, month, day } = dayNoteContext;
  const dayKey = makeDayValueKey(year, month, day);
  const manual = Array.from(String(dayNoteInput.value || '').trim()).slice(0, 10).join('');
  const letter = cleanEnglishLetter(extraLeaveLetter.value || '');
  let nextExtra = null;

  if (letter) {
    const currentExtra = getExtraLeaveForDay(year, month, day);
    const visibleEntries = getVacationLettersForDay(year, month, day).filter((entry) => entry.value);
    if (!currentExtra && visibleEntries.length < 2) {
      window.alert('休假欄還有空格，請先把人員填在上方休假格；第三人休假只在兩格都滿時使用。');
      return;
    }
    if (visibleEntries.some((entry) => entry.value === letter)) {
      window.alert(`${letter} 已經在當天休假格裡。`);
      return;
    }
    if (hasShiftLetterForDay(year, month, day, letter)) {
      window.alert(`${letter} 當天已排班，請先處理排班／休假衝突。`);
      return;
    }
    const type = window.ValueCycle.contains(LEAVE_TYPE_KEYS, extraLeaveType.value) ? extraLeaveType.value : 'public';
    const note = type === 'leave' ? Array.from(String(extraLeaveNote.value || '').trim()).slice(0, 4).join('') : '';
    nextExtra = { letter, type, note };
  }

  if (manual) manualNoteValues.set(dayKey, manual);
  else manualNoteValues.delete(dayKey);

  if (nextExtra) {
    extraLeaveValues.set(dayKey, nextExtra);
  } else {
    extraLeaveValues.delete(dayKey);
  }

  closeDayNoteDialog();
  render();
}

function renderSchedule(year, month) {
  const days = getDaysInMonth(year, month);
  scheduleTable.innerHTML = '';

  const colgroup = document.createElement('colgroup');
  appendDayColumns(colgroup, days);
  scheduleTable.appendChild(colgroup);

  const thead = document.createElement('thead');
  const dateRow = document.createElement('tr');
  const labelHead = document.createElement('th');
  labelHead.colSpan = 2;
  labelHead.className = 'header-label';
  labelHead.textContent = '日期';
  dateRow.appendChild(labelHead);
  for (let day = 1; day <= days; day += 1) {
    const visual = getCalendarVisualInfo(year, month, day);
    const th = document.createElement('th');
    th.className = `date-cell ${getDateBandClass(year, month, day)} ${visual.specialType === 'holiday' ? 'is-calendar-holiday' : visual.specialType === 'workday' ? 'is-calendar-workday' : ''}`.trim();
    th.textContent = day;
    dateRow.appendChild(th);
  }

  const weekdayRow = document.createElement('tr');
  const weekdayHead = document.createElement('th');
  weekdayHead.colSpan = 2;
  weekdayHead.className = 'header-label';
  weekdayHead.textContent = '星期';
  weekdayRow.appendChild(weekdayHead);
  for (let day = 1; day <= days; day += 1) {
    const info = getCalendarVisualInfo(year, month, day);
    const th = document.createElement('th');
    th.className = `weekday-cell ${info.className}`.trim();
    th.textContent = info.weekday;
    weekdayRow.appendChild(th);
  }
  thead.append(dateRow, weekdayRow);
  scheduleTable.appendChild(thead);

  const tbody = document.createElement('tbody');

  shifts.forEach((shift, shiftIndex) => {
    const row = document.createElement('tr');
    const label = document.createElement('th');
    label.className = 'shift-label';
    label.textContent = shift.label;
    label.title = '點一下可整列填入同一個英文字母';
    label.tabIndex = 0;
    label.setAttribute('role', 'button');
    label.setAttribute('aria-label', `${shift.label} 整列填入`);
    label.addEventListener('click', () => openRowFillPanel(shiftIndex));
    label.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openRowFillPanel(shiftIndex);
      }
    });
    row.appendChild(label);

    const code = document.createElement('td');
    code.className = 'shift-code';
    code.textContent = shift.groupLabel;
    row.appendChild(code);

    for (let day = 1; day <= days; day += 1) {
      const td = document.createElement('td');
      td.className = 'shift-cell';
      td.dataset.shiftIndex = String(shiftIndex);
      td.dataset.day = String(day);
      td.classList.toggle('is-night-gray', isNightGray(year, month, day, shiftIndex));

      const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
      td.classList.toggle('is-special', specialShiftCells.has(specialKey));

      const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
      const input = createLetterInput({
        value: rosterValues.get(key) || '',
        ariaLabel: `${month}月${day}日 ${shift.label} 班別`,
        className: 'shift-input',
        onChange: async (letter, inputElement) => {
          const previous = rosterValues.get(key) || '';
          if (!letter) {
            rosterValues.delete(key);
            specialShiftCells.delete(specialKey);
            specialShiftTimes.delete(specialKey);
            nightShiftTimes.delete(makeNightShiftKey(year, month, day, shiftIndex));
            renderLower(year, month);
            return;
          }

          if (hasVacationLetter(year, month, day, letter)) {
            const choice = await showConflictChoice(`${month}/${day}　${letter} 已排休\n要以哪一種為準？`);
            if (choice === 'schedule') {
              removeVacationLetter(year, month, day, letter);
              rosterValues.set(key, letter);
              render();
            } else inputElement.value = previous;
            return;
          }
          rosterValues.set(key, letter);
          renderLower(year, month);
        }
      });
      td.appendChild(input);

      td.addEventListener('click', (event) => {
        if (isEditModeActive('night')) {
          event.preventDefault();
          if (isNightGray(year, month, day, shiftIndex)) {
            setNightGrayState(year, month, day, shiftIndex, false);
            nightShiftTimes.delete(makeNightShiftKey(year, month, day, shiftIndex));
            render();
          } else {
            openNightTimeDialog(year, month, day, shiftIndex);
          }
          return;
        }
        if (isEditModeActive('special')) {
          event.preventDefault();
          if (specialShiftCells.has(specialKey)) {
            specialShiftCells.delete(specialKey);
            specialShiftTimes.delete(specialKey);
            render();
          } else {
            openSpecialTimeDialog(year, month, day, shiftIndex);
          }
        }
      });
      row.appendChild(td);
    }
    tbody.appendChild(row);
  });

  const vacationRow = document.createElement('tr');
  const vacationLabel = document.createElement('th');
  vacationLabel.colSpan = 2;
  vacationLabel.className = 'vacation-label';
  vacationLabel.textContent = '休 假';
  vacationRow.appendChild(vacationLabel);

  for (let day = 1; day <= days; day += 1) {
    const info = getCalendarVisualInfo(year, month, day);
    const td = document.createElement('td');
    td.className = `vacation-cell ${info.className}`.trim();
    td.dataset.day = String(day);

    const miniWeekday = document.createElement('span');
    miniWeekday.className = 'mini-weekday';
    miniWeekday.textContent = info.weekday;

    const inputs = document.createElement('div');
    inputs.className = 'vacation-inputs';
    inputs.classList.toggle('is-blocked', isVacationBlocked(year, month, day));
    inputs.classList.toggle('is-supervisor-leave', isSupervisorLeaveDay(year, month, day));

    for (let slot = 0; slot < 2; slot += 1) {
      const key = makeRosterKey(year, month, day, 'vacation', slot);
      const currentValue = rosterValues.get(key) || '';
      const currentType = getLeaveType(key);
      const currentNote = getLeaveNote(key);
      const input = createLetterInput({
        value: currentValue,
        ariaLabel: `${month}月${day}日 休假第${slot + 1}格`,
        className: 'vacation-input',
        onChange: async (letter, inputElement) => {
          await handleVacationChange({ year, month, day, key, letter, inputElement });
        }
      });
      input.dataset.previousValue = currentValue;
      input.dataset.previousType = currentType;
      input.dataset.previousNote = currentNote;
      input.dataset.leaveKey = key;
      input.classList.toggle('is-formal-leave', isFormalLeaveType(currentType));
      input.classList.toggle('is-annual-leave', currentType === 'annual');
      input.title = currentValue ? `${LEAVE_TYPE_LABELS[currentType] || '公休'}${currentNote ? `（${currentNote}）` : ''}；假別模式可修改` : '';

      input.addEventListener('pointerdown', (event) => {
        if (!isEditModeActive('leaveType')) return;
        event.preventDefault();
      });
      input.addEventListener('click', async (event) => {
        if (!isEditModeActive('leaveType')) return;
        event.preventDefault();
        event.stopPropagation();
        const letter = rosterValues.get(key) || '';
        if (!letter) {
          window.alert('請先在休假格填入員工代號，再設定假別。');
          return;
        }
        const type = await showLeaveTypeChoice({ message: `${month}/${day}　${letter} 請選擇假別` });
        if (!type) return;
        let note = '';
        if (type === 'leave') {
          const selectedNote = await showLeaveNoteChoice({ message: `${month}/${day}　${letter} 請假備註（選填）`, currentNote: getLeaveNote(key) });
          if (selectedNote === null) return;
          note = selectedNote;
        }
        setLeaveType(key, type, note);
        render();
      });
      inputs.appendChild(input);
    }

    const inner = document.createElement('div');
    inner.className = 'vacation-cell-inner';
    inner.append(miniWeekday, inputs);
    td.appendChild(inner);

    td.addEventListener('click', (event) => {
      if (!isEditModeActive('block')) return;
      event.preventDefault();
      if (isSupervisorLeaveDay(year, month, day)) return;
      const nextBlockedState = !isVacationBlocked(year, month, day);
      setVacationBlockedState(year, month, day, nextBlockedState);
      persistCurrentMonth();
      inputs.classList.toggle('is-blocked', nextBlockedState);
    });
    vacationRow.appendChild(td);
  }

  tbody.appendChild(vacationRow);
  scheduleTable.appendChild(tbody);
}

function renderLower(year, month) {
  const days = getDaysInMonth(year, month);
  lowerTable.innerHTML = '';

  const colgroup = document.createElement('colgroup');
  appendDayColumns(colgroup, days);
  lowerTable.appendChild(colgroup);

  const tbody = document.createElement('tbody');
  const mainRow = document.createElement('tr');

  const namesCell = document.createElement('td');
  namesCell.className = 'names-cell lower-main-cell';
  const namesPanel = document.createElement('div');
  namesPanel.className = 'names-panel';

  names.forEach((name, index) => {
    const row = document.createElement('div');
    row.className = 'name-row';
    const personLetter = String.fromCharCode(65 + index);
    const letter = document.createElement('button');
    letter.type = 'button';
    letter.className = 'name-letter';
    letter.textContent = `${personLetter}.`;
    letter.setAttribute('aria-label', `${personLetter} 批次排公休`);
    letter.title = `${personLetter} 批次排公休`;
    letter.addEventListener('click', () => openBatchLeaveDialog(personLetter));

    const input = document.createElement('input');
    input.className = 'name-input';
    input.type = 'text';
    input.value = name;
    input.dataset.index = index;
    input.autocomplete = 'off';
    input.readOnly = true;
    input.tabIndex = -1;
    input.style.pointerEvents = 'none';
    input.setAttribute('aria-label', `${String.fromCharCode(65 + index)} 姓名`);
    input.addEventListener('compositionstart', () => { input.dataset.composing = 'true'; });
    input.addEventListener('compositionend', (event) => {
      input.dataset.composing = 'false';
      handleNameInput(event);
    });
    input.addEventListener('input', handleNameInput);
    input.addEventListener('blur', handleNameCommit);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
      }
    });

    const leaveInput = document.createElement('input');
    leaveInput.className = 'special-leave-input';
    leaveInput.type = 'text';
    leaveInput.readOnly = true;
    const annual = getAnnualBalanceSnapshot(index, year, month);
    // 班表姓名旁顯示「本月月初可用特休」。
    // 當月排入多少特休都不即時扣這個數字；已用天數於建立下個月時才從上月餘額扣除。
    leaveInput.value = annual.available == null ? '' : String(annual.available);
    leaveInput.dataset.index = index;
    leaveInput.setAttribute('aria-label', `${String.fromCharCode(65 + index)} 本月可用特休`);
    leaveInput.title = '本月月初可用特休；當月已排特休於下個月結轉時才扣除。請到「櫃檯人員資料」查看已排與目前剩餘';

    row.append(letter, input, leaveInput);
    namesPanel.appendChild(row);
  });

  namesCell.appendChild(namesPanel);
  mainRow.appendChild(namesCell);

  const lowerCodeCell = document.createElement('td');
  lowerCodeCell.className = 'lower-code-cell';
  mainRow.appendChild(lowerCodeCell);

  for (let day = 1; day <= days; day += 1) {
    const td = document.createElement('td');
    td.className = 'day-blank';
    td.dataset.day = String(day);
    td.setAttribute('aria-label', `${month}月${day}日備註`);

    const notes = buildDayNotes(year, month, day);
    if (notes.length) {
      const stack = document.createElement('div');
      stack.className = 'day-note-stack';
      notes.forEach((note) => {
        const noteEl = document.createElement('div');
        noteEl.className = `day-note day-note-${note.kind}`;
        note.lines.forEach((line) => {
          const span = document.createElement('span');
          span.className = 'day-note-line';
          if (note.kind === 'time' && line === '│') span.classList.add('day-note-time-separator');
          span.textContent = line;
          noteEl.appendChild(span);
        });
        stack.appendChild(noteEl);
      });
      td.appendChild(stack);
    }

    td.addEventListener('click', (event) => {
      if (isEditModeActive('note')) {
        event.preventDefault();
        openDayNoteDialog(year, month, day);
        return;
      }
      if (!isEditModeActive('meeting')) return;
      event.preventDefault();
      const key = makeMeetingDayKey(year, month, day);
      const dayKey = makeDayValueKey(year, month, day);
      if (meetingDays.has(key)) {
        meetingDays.delete(key);
        meetingNoteValues.delete(dayKey);
      } else {
        meetingDays.add(key);
        meetingNoteValues.set(dayKey, meetingDefaultText);
      }
      renderLower(year, month);
    });
    mainRow.appendChild(td);
  }

  const dateRow = document.createElement('tr');
  const blank = document.createElement('td');
  blank.colSpan = 2;
  blank.className = 'lower-date-label';
  dateRow.appendChild(blank);

  for (let day = 1; day <= days; day += 1) {
    const info = getDayInfo(year, month, day);
    const td = document.createElement('td');
    td.className = `lower-date-label ${info.className}`.trim();
    td.textContent = day;
    dateRow.appendChild(td);
  }

  tbody.append(mainRow, dateRow);
  lowerTable.appendChild(tbody);
  persistCurrentMonth();
}

function renderSummary() {
  summaryGrid.innerHTML = '';
  const { year, month } = getCurrentYearMonth();
  names.forEach((name, index) => {
    const letter = String.fromCharCode(65 + index);
    const summary = getLeaveSummaryForLetter(year, month, letter);
    const item = document.createElement('div');
    item.className = 'summary-item';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'summary-name';
    nameSpan.textContent = name || `${letter}.`;
    const publicLeave = document.createElement('span');
    publicLeave.className = 'summary-count';
    publicLeave.textContent = `公休：${summary.publicDates.length}`;
    const specialLeave = document.createElement('span');
    specialLeave.className = 'summary-count';
    specialLeave.textContent = `特休：${summary.annualDates.length}`;
    item.append(nameSpan, publicLeave, specialLeave);
    summaryGrid.appendChild(item);
  });
}

function handleNameInput(event) {
  const index = Number(event.target.dataset.index);
  if (event.target.dataset.composing === 'true') {
    names[index] = trimDisplayName(event.target.value);
    persistCurrentMonth();
    return;
  }
  const cleaned = trimDisplayName(event.target.value);
  names[index] = cleaned;
  if (event.target.value !== cleaned) event.target.value = cleaned;
  persistCurrentMonth();
  renderSummary();
  if (!shiftConfigPanel.hidden) renderShiftConfigPanel();
}
function handleNameCommit(event) {
  if (event.target.dataset.composing === 'true') return;
  handleNameInput(event);
  commitNameAtIndex(Number(event.target.dataset.index));
}
function handlePublicLeaveInput() {
  const cleaned = cleanTwoDigits(publicLeaveInput.textContent);
  publicLeaveCount = cleaned;
  if (publicLeaveInput.textContent !== cleaned) {
    publicLeaveInput.textContent = cleaned;
    const selection = window.getSelection();
    if (selection) {
      selection.selectAllChildren(publicLeaveInput);
      selection.collapseToEnd();
    }
  }
  renderSummary();
  renderRuleSettingsPage();
  persistGlobalSettings();
}

function getActiveLettersForCurrentMonth() {
  const model = buildRuleModel();
  return window.ShiftRosterRules?.getActiveLetters(model) || [];
}
function getLeaveSummaryForLetter(year, month, letter) {
  const summary = { publicDates: [], annualDates: [], leaveDates: [], totalDates: [] };
  const days = getDaysInMonth(year, month);
  for (let day = 1; day <= days; day += 1) {
    const entry = getAllLeaveEntriesForDay(year, month, day).find((item) => item.value === letter);
    if (!entry) continue;
    summary.totalDates.push(day);
    if ((window.ShiftRosterRules?.isPublicLeaveType(entry.type) ?? window.ValueCycle.contains(PUBLIC_LEAVE_TYPE_KEYS, entry.type))) summary.publicDates.push(day);
    else if (entry.type === 'annual') summary.annualDates.push(day);
    else if (entry.type === 'leave') summary.leaveDates.push(day);
  }
  return summary;
}
function getPublicVacationDatesForLetter(year, month, letter) {
  return getLeaveSummaryForLetter(year, month, letter).publicDates;
}
function buildLeaveCheckItems() {
  const { year, month } = getCurrentYearMonth();
  const target = Number.parseInt(publicLeaveCount || '8', 10) || 8;
  const items = [];
  const activeLetters = getActiveLettersForCurrentMonth();
  for (const letter of activeLetters) {
    const index = letter.charCodeAt(0) - 65;
    if (index < 0 || index >= 6) continue;
    const summary = getLeaveSummaryForLetter(year, month, letter);
    if (summary.publicDates.length === target) continue;
    items.push({ year, month, target, index, letter, name: names[index] || '', ...summary });
  }
  return items;
}
function formatLeaveCheckMessage(item) {
  const person = item.name ? `${item.letter} ${item.name}` : item.letter;
  const publicCount = item.publicDates.length;
  const annualCount = item.annualDates.length;
  const leaveCount = item.leaveDates.length;
  const total = item.totalDates.length;
  const composition = `共休 ${total} 天：公休 ${publicCount}、特休 ${annualCount}、請假 ${leaveCount}`;
  const publicDateText = item.publicDates.length ? item.publicDates.map((day) => `${item.month}/${day}`).join('、') : '無';
  if (publicCount > item.target) {
    return `${person} ${composition}。\n公休比設定的 ${item.target} 天多 ${publicCount - item.target} 天。\n公休日期：${publicDateText}\n\n若多出的休假其實是特休／請假，請回班表設定假別。\n此排假是否正確？`;
  }
  return `${person} ${composition}。\n公休比設定的 ${item.target} 天少 ${item.target - publicCount} 天。\n公休日期：${publicDateText}\n\n特休／請假不會拿來補公休目標。\n此排假是否正確？`;
}

function showLeaveCheckItem() {
  const item = leaveCheckItems[leaveCheckIndex];
  if (!item) {
    leaveCheckCompleteMode = true;
    leaveCheckMessage.textContent = leaveCheckItems.length ? '排假檢查完成。' : '排假檢查完成：目前有效員工的公休天數都符合設定。';
    leaveCheckCorrect.textContent = '完成';
    leaveCheckIncorrect.hidden = true;
    leaveCheckActions.classList.add('is-single');
    leaveCheckDialog.hidden = false;
    requestAnimationFrame(() => leaveCheckCorrect.focus());
    return;
  }
  leaveCheckCompleteMode = false;
  leaveCheckCorrect.textContent = '正確';
  leaveCheckIncorrect.hidden = false;
  leaveCheckActions.classList.remove('is-single');
  leaveCheckMessage.textContent = `${leaveCheckIndex + 1}/${leaveCheckItems.length}\n${formatLeaveCheckMessage(item)}`;
  leaveCheckDialog.hidden = false;
  requestAnimationFrame(() => leaveCheckCorrect.focus());
}
function startLeaveCheck() {
  closeRowFillPanel();
  closeShiftConfigPanel();
  closeSupervisorConfigPanel();
  leaveCheckItems = buildLeaveCheckItems();
  leaveCheckIndex = 0;
  showLeaveCheckItem();
}
function handleLeaveCheckCorrect() {
  if (leaveCheckCompleteMode) {
    leaveCheckDialog.hidden = true;
    leaveCheckActions.classList.remove('is-single');
    leaveCheckCompleteMode = false;
    leaveCheckItems = [];
    leaveCheckIndex = 0;
    return;
  }
  leaveCheckIndex += 1;
  showLeaveCheckItem();
}
function handleLeaveCheckIncorrect() {
  leaveCheckDialog.hidden = true;
  leaveCheckActions.classList.remove('is-single');
  leaveCheckCompleteMode = false;
  leaveCheckItems = [];
  leaveCheckIndex = 0;
}

function getStoredRosterValue(monthData, day, type, index) {
  return String(monthData?.rosterValues?.[`${day}-${type}-${index}`] || '');
}

function getStoredActualRange(monthData, year, month, day, shiftIndex) {
  const specialKey = `${day}-shift-${shiftIndex}`;
  if (Array.isArray(monthData?.specialShiftCells) && window.ValueCycle.contains(monthData.specialShiftCells, specialKey)) {
    const specialTime = monthData?.specialShiftTimes?.[specialKey] || '';
    if (specialTime) return specialTime;
  }

  const nightKey = `${day}-night-${shiftIndex}`;
  const defaultGray = shiftIndex === 3 && getDayInfo(year, month, day).weekdayIndex === 6;
  const overrides = monthData?.nightShiftOverrides || {};
  const times = monthData?.nightShiftTimes || {};
  const hasNewOverride = Object.prototype.hasOwnProperty.call(overrides, nightKey);
  const gray = hasNewOverride ? Boolean(overrides[nightKey]) : defaultGray;

  if (gray) {
    const grayTime = times[nightKey] || '';
    if (grayTime) return grayTime;
    if (shiftIndex === 3) return normalNightRange || '22~06';
  }

  return shifts[shiftIndex]?.label.replace(/\s+/g, '') || null;
}

function getStoredDayStatus(monthData, year, month, day, letter) {
  const workIntervals = [];
  for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex += 1) {
    if (getStoredRosterValue(monthData, day, 'shift', shiftIndex) !== letter) continue;
    const rangeText = getStoredActualRange(monthData, year, month, day, shiftIndex);
    if (rangeText) workIntervals.push({ year, month, day, shiftIndex, rangeText });
  }
  if (workIntervals.length) return { status: 'work', workIntervals };

  for (let slot = 0; slot < 2; slot += 1) {
    if (getStoredRosterValue(monthData, day, 'vacation', slot) === letter) {
      return { status: 'leave', workIntervals: [] };
    }
  }
  if (monthData?.extraLeaves?.[String(day)]?.letter === letter) {
    return { status: 'leave', workIntervals: [] };
  }
  return { status: 'unknown', workIntervals: [] };
}

function getPreviousMonthHistory(letter) {
  const index = String(letter || '').charCodeAt(0) - 65;
  const employeeId = index >= 0 && index < employeeIds.length ? employeeIds[index] : '';
  const { year, month } = getCurrentYearMonth();
  const previous = storage?.getPreviousYearMonth(year, month)
    || window.CalendarMonthSequence.shift(year, month, -1);
  const monthData = storage?.getMonth(previous.year, previous.month) || null;

  if (!employeeId) {
    return { employeeId: '', monthMissing: false, employeeFound: false, incomplete: false, carryWorkDays: 0, carryStart: null, previousWorkIntervals: [], restGapKnown: true };
  }
  if (!monthData) {
    return { employeeId, monthMissing: true, employeeFound: false, incomplete: true, carryWorkDays: 0, carryStart: null, previousWorkIntervals: [], restGapKnown: false };
  }

  let previousLetter = '';
  for (const [candidateLetter, person] of Object.entries(monthData.people || {})) {
    if (person?.employeeId === employeeId) {
      previousLetter = candidateLetter;
      break;
    }
  }
  if (!previousLetter) {
    return { employeeId, monthMissing: false, employeeFound: false, incomplete: false, carryWorkDays: 0, carryStart: null, previousWorkIntervals: [], restGapKnown: true };
  }

  const previousDays = getDaysInMonth(previous.year, previous.month);
  const maxLookback = Math.max(1, Number(maxConsecutiveWorkDays) || 6);
  let carryWorkDays = 0;
  let carryStart = null;
  let incomplete = false;

  for (let offset = 0; offset < maxLookback; offset += 1) {
    const day = previousDays - offset;
    if (day < 1) break;
    const info = getStoredDayStatus(monthData, previous.year, previous.month, day, previousLetter);
    if (info.status === 'work') {
      carryWorkDays += 1;
      carryStart = { year: previous.year, month: previous.month, day };
      continue;
    }
    if (info.status === 'leave') break;
    incomplete = true;
    break;
  }

  const lastDayInfo = getStoredDayStatus(monthData, previous.year, previous.month, previousDays, previousLetter);
  if (lastDayInfo.status === 'unknown') incomplete = true;

  return {
    employeeId,
    previousLetter,
    monthMissing: false,
    employeeFound: true,
    incomplete,
    carryWorkDays,
    carryStart,
    restGapKnown: lastDayInfo.status !== 'unknown',
    previousWorkIntervals: lastDayInfo.status === 'work' ? lastDayInfo.workIntervals : []
  };
}

function buildRuleModel() {
  const { year, month } = getCurrentYearMonth();
  const days = getDaysInMonth(year, month);
  return {
    year,
    month,
    days,
    shifts,
    settings: {
      maxConsecutiveDays: maxConsecutiveWorkDays,
      minTurnaroundHours,
          normalNightRange,
      blockedLeaveTypes: blockedLeaveTypes.getSelected()
    },
    employees: names.map((name, index) => {
      const letter = String.fromCharCode(65 + index);
      return { letter, name, employeeId: employeeIds[index] || '', shiftGroups: [...getPersonnelShifts(year, month, letter)] };
    }),
    previousMonth: storage?.getPreviousYearMonth(year, month) || null,
    previousMonthExists: storage ? Boolean(storage.getMonth((storage.getPreviousYearMonth(year, month)).year, (storage.getPreviousYearMonth(year, month)).month)) : false,
    getPreviousMonthHistory,
    getShiftLetter(day, shiftIndex) {
      return rosterValues.get(makeRosterKey(year, month, day, 'shift', shiftIndex)) || '';
    },
    getLeaveEntries(day) {
      return getAllLeaveEntriesForDay(year, month, day)
        .filter((entry) => entry.value)
        .map((entry) => ({ letter: entry.value, type: entry.type, note: entry.note || '', slot: entry.slot, extra: Boolean(entry.extra) }));
    },
    isBlocked(day) {
      return isVacationBlocked(year, month, day);
    },
    isSupervisorLeave(day) {
      return isSupervisorLeaveDay(year, month, day);
    },
    isSpecial(day, shiftIndex) {
      return specialShiftCells.has(makeSpecialShiftKey(year, month, day, shiftIndex));
    },
    getSpecialTime(day, shiftIndex) {
      return specialShiftTimes.get(makeSpecialShiftKey(year, month, day, shiftIndex)) || '';
    },
    isNightGray(day, shiftIndex) {
      return isNightGray(year, month, day, shiftIndex);
    },
    getNightTime(day, shiftIndex) {
      return nightShiftTimes.get(makeNightShiftKey(year, month, day, shiftIndex)) || '';
    }
  };
}
function makePublicLeaveRuleIssues() {
  return buildLeaveCheckItems().map((item) => ({
    code: 'public-leave-count',
    title: '公休天數',
    message: formatLeaveCheckMessage(item)
  }));
}

function buildAnnualLeaveRuleIssues() {
  const { year, month } = getCurrentYearMonth();
  const issues = [];
  for (let index = 0; index < names.length; index += 1) {
    if (!names[index]) continue;
    const letter = String.fromCharCode(65 + index);
    const employeeId = employeeIds[index] || '';
    if (!employeeId) continue;
    const record = getEmployeeRecord(employeeId) || {};
    if (!record.hireDate) {
      issues.push({ code: 'annual-hire-date-missing', title: '特休到職日未設定', message: `${letter} ${names[index]} 尚未設定到職日，無法判斷取得日。` });
    }
    const balanceText = String(specialLeaveValues[index] || '');
    if (!/^\d+$/.test(balanceText)) {
      issues.push({ code: 'annual-balance-missing', title: '特休餘額未設定', message: `${letter} ${names[index]} 本月可用特休尚未設定。可輸入到職日讓系統自動計算；若實際現況不同，可使用「本月特休校正」。` });
      continue;
    }
    const balance = Number(balanceText);
    const used = getLeaveSummaryForLetter(year, month, letter).annualDates.length;
    if (used > balance) {
      issues.push({ code: 'annual-overuse', title: '特休使用超過餘額', message: `${letter} ${names[index]} 本月可用特休 ${balance} 天，但已排 ${used} 天特休。` });
    }
    const basis = getAnnualBalanceBasis(index, year, month);
    const calibration = getAnnualBalanceCalibration(employeeId, year, month);
    // 有明確套用本月校正時，以校正值為準；沒有校正才檢查跨月結轉是否一致。
    if (!calibration && basis.source === 'previous' && basis.value != null && basis.value !== balance) {
      issues.push({ code: 'annual-balance-different', title: '特休結轉數字需確認', message: `${letter} ${names[index]} 依前月餘額、前月已用與取得日設定計算，本月應為 ${basis.value} 天；目前是 ${balance} 天。若現況確實不同，請到「櫃檯人員資料」使用「本月特休校正」。` });
    }
    const grant = getAnnualGrantEventForEmployee(employeeId, year, month);
    if (grant && grant.days > 0) {
      const decision = annualGrantDecisionValues.get(makeAnnualGrantDecisionKey(year, month, employeeId));
      if (!decision) {
        issues.push({ code: 'annual-grant-choice-missing', title: '特休取得日尚未選擇處理方式', message: `${letter} ${names[index]} 在 ${month}/${grant.day} ${grant.label}取得 ${grant.days} 天特休。請到「櫃檯人員資料」選擇「累加特休」或「舊額歸零，換成本次天數」；依目前月結邏輯於次月套入。` });
      }
    }
  }
  return issues;
}

function startRuleCheckByKind(kind = 'all', label = '規則') {
  commitAllVisibleNames();
  persistCurrentMonth();
  closeRowFillPanel();
  closeShiftConfigPanel();
  closeSupervisorConfigPanel();
  if (!window.ShiftRosterRules) {
    window.alert('規則模組未載入。');
    return;
  }
  ruleCheckName = label;
  ruleCheckItems = window.ShiftRosterRules.collectIssuesByKind(buildRuleModel(), kind);
  if (kind === 'annual-leave') {
    ruleCheckItems = buildAnnualLeaveRuleIssues();
  } else if (kind === 'leave-all' || kind === 'all') {
    ruleCheckItems = [...makePublicLeaveRuleIssues(), ...buildAnnualLeaveRuleIssues(), ...ruleCheckItems];
  }
  ruleCheckIndex = 0;
  showRuleCheckItem();
}

function startRuleCheck() {
  startRuleCheckByKind('all', '完整規則');
}
function showRuleCheckItem() {
  const item = ruleCheckItems[ruleCheckIndex];
  if (!item) {
    ruleCheckCompleteMode = true;
    ruleCheckMessage.textContent = ruleCheckItems.length ? `${ruleCheckName}檢查完成。` : `${ruleCheckName}檢查完成：目前沒有發現需要確認的項目。`;
    ruleCheckException.textContent = '完成';
    ruleCheckBack.hidden = true;
    ruleCheckDialog.hidden = false;
    requestAnimationFrame(() => ruleCheckException.focus());
    return;
  }
  ruleCheckCompleteMode = false;
  ruleCheckException.textContent = '例外安排';
  ruleCheckBack.hidden = false;
  ruleCheckMessage.textContent = `${ruleCheckIndex + 1}/${ruleCheckItems.length}　${item.title}\n\n${item.message}`;
  ruleCheckDialog.hidden = false;
  requestAnimationFrame(() => ruleCheckException.focus());
}
function handleRuleCheckException() {
  if (ruleCheckCompleteMode) {
    ruleCheckDialog.hidden = true;
    ruleCheckCompleteMode = false;
    ruleCheckItems = [];
    ruleCheckIndex = 0;
    return;
  }
  ruleCheckIndex += 1;
  showRuleCheckItem();
}
function handleRuleCheckBack() {
  ruleCheckDialog.hidden = true;
  ruleCheckCompleteMode = false;
  ruleCheckItems = [];
  ruleCheckIndex = 0;
}

function formatOutputTimestamp(date = new Date()) {
  const formatted = window.DateTime.formatDateTime(date);
  if (!formatted) return '';
  const [datePart, timePart] = formatted.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  return `${year}/${month}/${day} ${timePart}`;
}
function requestOutputTimeChoice() {
  return window.SlowlyConfirm.show({
    title: '輸出時間',
    message: '這次輸出要加入右上角時間嗎？',
    confirmText: '加時間',
    cancelText: '不加時間',
    initialFocus: 'confirm'
  });
}
async function prepareOutputTimestamp() {
  const includeTime = await requestOutputTimeChoice();
  if (includeTime) {
    outputTimestamp.textContent = formatOutputTimestamp();
    outputTimestamp.hidden = false;
  } else {
    outputTimestamp.textContent = '';
    outputTimestamp.hidden = true;
  }
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return () => {
    outputTimestamp.textContent = '';
    outputTimestamp.hidden = true;
  };
}

function setSpecialDatesMode(mode) {
  specialDatesDraftMode = mode === 'workday' ? 'workday' : 'holiday';
  specialDatesHolidayMode?.classList.toggle('is-active', specialDatesDraftMode === 'holiday');
  specialDatesHolidayMode?.setAttribute('aria-pressed', String(specialDatesDraftMode === 'holiday'));
  specialDatesWorkdayMode?.classList.toggle('is-active', specialDatesDraftMode === 'workday');
  specialDatesWorkdayMode?.setAttribute('aria-pressed', String(specialDatesDraftMode === 'workday'));
}

function loadSpecialDatesDraft(year) {
  const targetYear = Number(year);
  if (!Number.isInteger(targetYear) || targetYear < 2000 || targetYear > 2100) return false;
  specialDatesDraftYear = targetYear;
  const data = getSpecialDaysForYear(targetYear);
  const draftValues = {};
  data.holidays.getSelected().forEach((date) => { draftValues[date] = 'holiday'; });
  data.workdays.getSelected().forEach((date) => { draftValues[date] = 'workday'; });
  specialDatesDraft = window.FormDraft.create(draftValues);
  if (specialDatesYear) specialDatesYear.value = String(targetYear);
  renderSpecialDatesCalendars();
  updateSpecialDatesStatus();
  return true;
}

function updateSpecialDatesStatus() {
  if (!specialDatesStatus) return;
  let holidayCount = 0;
  let workdayCount = 0;
  for (const type of Object.values(specialDatesDraft.get())) {
    if (type === 'holiday') holidayCount += 1;
    if (type === 'workday') workdayCount += 1;
  }
  const configured = specialDatesDraftYear != null && getSpecialDaysForYear(specialDatesDraftYear).configured;
  specialDatesStatus.textContent = `${specialDatesDraftYear || ''} 年：休假日 ${holidayCount} 天／補班日 ${workdayCount} 天${configured ? '；已存在年度設定，套用會更新。' : '；尚未套用年度設定。'}`;
}

function updateSpecialDateDayButton(button, type) {
  button.classList.toggle('is-holiday', type === 'holiday');
  button.classList.toggle('is-workday', type === 'workday');
  button.setAttribute('aria-pressed', String(Boolean(type)));
  button.title = type === 'holiday' ? '休假日' : type === 'workday' ? '補班日' : '';
}

function renderSpecialDatesCalendars() {
  if (!specialDatesCalendars || !Number.isInteger(specialDatesDraftYear)) return;
  specialDatesCalendars.innerHTML = '';
  const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  for (let month = 1; month <= 12; month += 1) {
    const card = document.createElement('section');
    card.className = 'special-date-month';

    const title = document.createElement('h3');
    title.className = 'special-date-month-title';
    title.textContent = `${month} 月`;
    card.appendChild(title);

    const weekdayRow = document.createElement('div');
    weekdayRow.className = 'special-date-weekdays';
    weekdayLabels.forEach((label) => {
      const cell = document.createElement('span');
      cell.textContent = label;
      weekdayRow.appendChild(cell);
    });
    card.appendChild(weekdayRow);

    const dayGrid = document.createElement('div');
    dayGrid.className = 'special-date-days';
    const firstWeekday = getWeekdayIndex(specialDatesDraftYear, month, 1);
    const days = getDaysInMonth(specialDatesDraftYear, month);

    for (let blank = 0; blank < firstWeekday; blank += 1) {
      const spacer = document.createElement('span');
      spacer.className = 'special-date-blank';
      dayGrid.appendChild(spacer);
    }

    for (let day = 1; day <= days; day += 1) {
      const dateKey = makeCalendarDateKey(specialDatesDraftYear, month, day);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'special-date-day';
      button.textContent = String(day);
      button.dataset.date = dateKey;
      button.setAttribute('aria-label', `${specialDatesDraftYear}年${month}月${day}日`);
      updateSpecialDateDayButton(button, specialDatesDraft.getValue(dateKey) || '');
      button.addEventListener('click', () => {
        const current = specialDatesDraft.getValue(dateKey) || '';
        if (current === specialDatesDraftMode) specialDatesDraft.remove(dateKey);
        else specialDatesDraft.set(dateKey, specialDatesDraftMode);
        updateSpecialDateDayButton(button, specialDatesDraft.getValue(dateKey) || '');
        updateSpecialDatesStatus();
      });
      dayGrid.appendChild(button);
    }

    card.appendChild(dayGrid);
    specialDatesCalendars.appendChild(card);
  }
}

function openSpecialDatesDialog(year = null) {
  const current = getCurrentYearMonth();
  const targetYear = Number(year ?? current.year);
  if (!loadSpecialDatesDraft(targetYear)) return;
  setSpecialDatesMode('holiday');
  specialDatesDialog.hidden = false;
  requestAnimationFrame(() => specialDatesHolidayMode?.focus());
}

function closeSpecialDatesDialog() {
  if (!specialDatesDialog) return;
  specialDatesDialog.hidden = true;
  specialDatesDraftYear = null;
  specialDatesDraft = window.FormDraft.create({});
}

function applySpecialDates() {
  if (!storage?.saveSpecialDays || !Number.isInteger(specialDatesDraftYear)) return;
  const holidays = [];
  const workdays = [];
  for (const [date, type] of Object.entries(specialDatesDraft.get())) {
    if (type === 'holiday') holidays.push(date);
    if (type === 'workday') workdays.push(date);
  }
  storage.saveSpecialDays(specialDatesDraftYear, {
    configured: true,
    holidays: holidays.sort(),
    workdays: workdays.sort()
  });
  clearSpecialDaysCache(specialDatesDraftYear);
  closeSpecialDatesDialog();
  render();
}

function updateSpecialDatesReminder(year, month) {
  if (!specialDatesReminder || !specialDatesReminderText || !specialDatesReminderButton) return;
  if (!window.ValueCycle.contains([11, 12], Number(month))) {
    specialDatesReminder.hidden = true;
    return;
  }
  const targetYear = Number(year) + 1;
  if (targetYear < 2000) {
    specialDatesReminder.hidden = true;
    return;
  }
  const configured = getSpecialDaysForYear(targetYear).configured;
  specialDatesReminder.hidden = configured;
  if (!configured) {
    specialDatesReminderText.textContent = `${targetYear} 年休假／補班日期尚未設定。`;
    specialDatesReminderButton.textContent = `設定 ${targetYear}`;
    specialDatesReminderButton.dataset.year = String(targetYear);
  }
}


function render() {
  let year = Number(yearInput.value);
  let month = Number(monthInput.value);
  const fallback = getDefaultNextYearMonth();
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    year = fallback.year;
    yearInput.value = year;
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    month = fallback.month;
    monthInput.value = String(month);
  }
  syncMonthInputWidth();
  titleYear.textContent = year;
  titleMonth.textContent = month;
  renderSchedule(year, month);
  renderLower(year, month);
  renderSummary();
  updateSpecialDatesReminder(year, month);
  if (!shiftConfigPanel.hidden) renderShiftConfigPanel();
  if (!supervisorConfigPanel.hidden) renderSupervisorConfigPanel(year, month);
}
function changeMonth(offset) {
  commitAllVisibleNames();
  persistCurrentMonth();
  const currentYear = Number(yearInput.value);
  const currentMonth = Number(monthInput.value);
  const next = window.CalendarMonthSequence.shift(currentYear, currentMonth, offset);
  const { year, month } = next;
  if (year < 1900 || year > 2100) return;
  yearInput.value = year;
  monthInput.value = String(month);
  closeRowFillPanel();
  closeShiftConfigPanel();
  closeSupervisorConfigPanel();
  loadMonth(year, month);
  render();
}

// ===== 事件 =====
rosterViewTab.addEventListener('click', () => setMainView('roster'));
settingsViewTab.addEventListener('click', () => setMainView('settings'));
rulesViewTab.addEventListener('click', () => setMainView('rules'));
basicSettingsButton.addEventListener('click', showBasicSettings);
operationGuideButton.addEventListener('click', () => showGuideSection('operation'));
companyRulesButton.addEventListener('click', () => showGuideSection('company'));
basicSettingsLiveButton.addEventListener('click', closeRuleSettingsEditor);
editRuleSettingsButton.addEventListener('click', openRuleSettingsEditor);
document.querySelectorAll('.setting-row-edit').forEach((button) => {
  button.addEventListener('click', () => {
    openRuleSettingsEditor();
    requestAnimationFrame(() => {
      const target = button.dataset.ruleFocus
        ? document.getElementById(button.dataset.ruleFocus)
        : document.querySelector(button.dataset.ruleFocusSelector || '');
      target?.focus();
    });
  });
});
ruleSettingsCancel.addEventListener('click', closeRuleSettingsEditor);
ruleSettingsApply.addEventListener('click', applyRuleSettings);

yearInput.addEventListener('change', () => {
  const year = Number(yearInput.value);
  const month = Number(monthInput.value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return render();
  closeRowFillPanel();
  closeShiftConfigPanel();
  closeSupervisorConfigPanel();
  loadMonth(year, month);
  render();
});
monthInput.addEventListener('input', syncMonthInputWidth);
monthInput.addEventListener('change', () => {
  const { year, month } = getCurrentYearMonth();
  closeRowFillPanel();
  closeShiftConfigPanel();
  closeSupervisorConfigPanel();
  loadMonth(year, month);
  render();
});
[yearInput, monthInput].forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    input.blur();
  });
});
prevMonthButton.addEventListener('click', () => changeMonth(-1));
nextMonthButton.addEventListener('click', () => changeMonth(1));
blockModeButton.addEventListener('click', () => setBlockMode(!isEditModeActive('block')));
specialModeButton.addEventListener('click', () => setSpecialMode(!isEditModeActive('special')));
nightModeButton.addEventListener('click', () => setNightMode(!isEditModeActive('night')));
leaveTypeModeButton.addEventListener('click', () => setLeaveTypeMode(!isEditModeActive('leaveType')));
meetingModeButton.addEventListener('click', () => setMeetingMode(!isEditModeActive('meeting')));
noteModeButton.addEventListener('click', () => setNoteMode(!isEditModeActive('note')));
shiftConfigButton.addEventListener('click', showShiftSettings);
supervisorConfigButton.addEventListener('click', showSupervisorSettings);
shiftConfigClose.addEventListener('click', closeShiftConfigPanel);
supervisorConfigClose.addEventListener('click', closeSupervisorConfigPanel);
shiftSeniorityButton?.addEventListener('click', () => showShiftSubsection('seniority'));
shiftPeopleButton?.addEventListener('click', () => showShiftSubsection('people'));
supervisorSeniorityButton?.addEventListener('click', () => showSupervisorSubsection('seniority'));
supervisorPeopleButton?.addEventListener('click', () => showSupervisorSubsection('people'));
leaveCheckButton.addEventListener('click', startLeaveCheck);
ruleCheckButton.addEventListener('click', startRuleCheck);
checkBlockedLeaveButton?.addEventListener('click', () => startRuleCheckByKind('blocked-leave', '禁休日'));
checkSameGroupLeaveButton?.addEventListener('click', () => startRuleCheckByKind('same-group-leave', '同組撞休'));
checkAdjacentLeaveButton?.addEventListener('click', () => startRuleCheckByKind('adjacent-leave', '早中排休順序'));
checkWorkLeaveConflictButton?.addEventListener('click', () => startRuleCheckByKind('work-leave-conflict', '班休衝突'));
checkAnnualLeaveButton?.addEventListener('click', () => startRuleCheckByKind('annual-leave', '特休'));
checkLeaveAllButton?.addEventListener('click', () => startRuleCheckByKind('leave-all', '休假規則全部'));
checkFixedShiftButton?.addEventListener('click', () => startRuleCheckByKind('fixed-shift', '固定班別'));
checkConsecutiveButton?.addEventListener('click', () => startRuleCheckByKind('consecutive', '連勤'));
checkTurnaroundButton?.addEventListener('click', () => startRuleCheckByKind('turnaround', '轉班 12 小時'));
checkScheduleAllButton?.addEventListener('click', () => startRuleCheckByKind('schedule-all', '排班規則全部'));
specialDatesButton?.addEventListener('click', () => openSpecialDatesDialog());
specialDatesReminderButton?.addEventListener('click', () => {
  const targetYear = Number(specialDatesReminderButton.dataset.year);
  openSpecialDatesDialog(Number.isInteger(targetYear) ? targetYear : null);
});
specialDatesClose?.addEventListener('click', closeSpecialDatesDialog);
specialDatesCancel?.addEventListener('click', closeSpecialDatesDialog);
specialDatesApply?.addEventListener('click', applySpecialDates);
specialDatesHolidayMode?.addEventListener('click', () => setSpecialDatesMode('holiday'));
specialDatesWorkdayMode?.addEventListener('click', () => setSpecialDatesMode('workday'));
function syncSpecialDatesYearFromInput() {
  const year = Number(specialDatesYear?.value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return false;
  if (year === specialDatesDraftYear) return true;
  return loadSpecialDatesDraft(year);
}
specialDatesYear?.addEventListener('input', syncSpecialDatesYearFromInput);
specialDatesYear?.addEventListener('change', () => {
  if (!syncSpecialDatesYearFromInput() && specialDatesDraftYear != null) {
    specialDatesYear.value = String(specialDatesDraftYear);
  }
});
batchLeaveApply.addEventListener('click', applyBatchLeave);
batchLeaveCancel.addEventListener('click', closeBatchLeaveDialog);
batchLeaveResultClose.addEventListener('click', closeBatchLeaveResult);
clearMonthButton.addEventListener('click', openClearMonthDialog);
printButton.addEventListener('click', async () => {
  const cleanup = await prepareOutputTimestamp();
  try {
    window.print();
  } finally {
    cleanup();
  }
});

conflictChooseSchedule.addEventListener('click', () => resolveConflictChoice('schedule'));
conflictChooseVacation.addEventListener('click', () => resolveConflictChoice('vacation'));
blockedLeaveException.addEventListener('click', () => resolveBlockedLeaveChoice('exception'));
blockedLeaveFormal.addEventListener('click', () => resolveBlockedLeaveChoice('formal'));
blockedLeaveBack.addEventListener('click', () => resolveBlockedLeaveChoice('back'));
leaveTypeChoices.addEventListener('click', (event) => {
  const button = event.target.closest('[data-leave-type]');
  if (button) resolveLeaveTypeChoice(button.dataset.leaveType);
});
leaveTypeCancel.addEventListener('click', () => resolveLeaveTypeChoice(null));

leaveNoteQuickChoices.addEventListener('click', (event) => {
  const button = event.target.closest('[data-leave-note]');
  if (button) resolveLeaveNoteChoice(button.dataset.leaveNote);
});
leaveNoteNoNote.addEventListener('click', () => resolveLeaveNoteChoice(''));
leaveNoteApplyCustom.addEventListener('click', () => {
  const note = Array.from(String(leaveNoteCustomInput.value || '').trim()).slice(0, 4).join('');
  resolveLeaveNoteChoice(note);
});
leaveNoteBack.addEventListener('click', () => resolveLeaveNoteChoice(null));

specialTimeApply.addEventListener('click', applySpecialTime);
specialTimeRemove.addEventListener('click', removeSpecialTime);
specialTimeBack.addEventListener('click', closeSpecialTimeDialog);
nightTimeApply.addEventListener('click', applyNightTime);
nightTimeRemove.addEventListener('click', removeNight);
nightTimeBack.addEventListener('click', closeNightTimeDialog);

dayNoteApply.addEventListener('click', applyDayNote);
dayNoteBack.addEventListener('click', closeDayNoteDialog);
dayNoteInput.addEventListener('input', () => {
  const text = Array.from(String(dayNoteInput.value || '')).slice(0, 10).join('');
  if (dayNoteInput.value !== text) dayNoteInput.value = text;
  dayNoteCount.textContent = String(Array.from(text).length);
});
extraLeaveLetter.addEventListener('change', syncExtraLeaveNoteState);
extraLeaveType.addEventListener('change', syncExtraLeaveNoteState);

leaveCheckCorrect.addEventListener('click', handleLeaveCheckCorrect);
leaveCheckIncorrect.addEventListener('click', handleLeaveCheckIncorrect);
ruleCheckException.addEventListener('click', handleRuleCheckException);
ruleCheckBack.addEventListener('click', handleRuleCheckBack);

rowFillClose.addEventListener('click', closeRowFillPanel);
rowFillClearRow.addEventListener('click', () => {
  if (selectedRowFillShiftIndex != null) applyLetterToShiftRow(selectedRowFillShiftIndex, '');
});
publicLeaveInput.addEventListener('input', handlePublicLeaveInput);
publicLeaveInput.addEventListener('blur', () => {
  if (!publicLeaveCount) {
    publicLeaveCount = '8';
    publicLeaveInput.textContent = publicLeaveCount;
    renderSummary();
    renderRuleSettingsPage();
    persistGlobalSettings();
  }
});

bindHourPair(specialTimeStartInput, specialTimeEndInput, applySpecialTime);
bindHourPair(nightTimeStartInput, nightTimeEndInput, applyNightTime);
bindHourPair(ruleNightStartInput, ruleNightEndInput, applyRuleSettings);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!ruleSettingsEditor.hidden) return closeRuleSettingsEditor();
  if (specialDatesDialog && !specialDatesDialog.hidden) return closeSpecialDatesDialog();
  if (!batchLeaveResultDialog.hidden) return closeBatchLeaveResult();
  if (!batchLeaveDialog.hidden) return closeBatchLeaveDialog();
  if (!leaveTypeDialog.hidden) return resolveLeaveTypeChoice(null);
  if (!leaveNoteDialog.hidden) return resolveLeaveNoteChoice(null);
  if (!blockedLeaveDialog.hidden) return resolveBlockedLeaveChoice('back');
  if (!specialTimeDialog.hidden) return closeSpecialTimeDialog();
  if (!nightTimeDialog.hidden) return closeNightTimeDialog();
  if (!dayNoteDialog.hidden) return closeDayNoteDialog();
  if (!leaveCheckDialog.hidden) return handleLeaveCheckIncorrect();
  if (!ruleCheckDialog.hidden) return handleRuleCheckBack();
  if (!rowFillBar.hidden) return closeRowFillPanel();
  if (!shiftConfigPanel.hidden) return closeShiftConfigPanel();
  if (!supervisorConfigPanel.hidden) return closeSupervisorConfigPanel();
});

window.ShiftRosterOutput = Object.freeze({
  prepare: prepareOutputTimestamp,
  formatTimestamp: formatOutputTimestamp
});

window.ShiftRosterApp = Object.freeze({
  saveCurrentMonth: () => {
    commitAllVisibleNames();
    persistCurrentMonth();
    persistGlobalSettings();
  },
  reloadFromStorage: () => {
    clearSpecialDaysCache();
    loadGlobalSettings();
    publicLeaveInput.textContent = publicLeaveCount;
    const { year, month } = getCurrentYearMonth();
    loadMonth(year, month);
    render();
    renderRuleSettingsPage();
  },
  getSupervisorLeaveDays: () => [...supervisorLeaveDays].sort((a, b) => a - b),
  getCurrentYearMonth
});

loadGlobalSettings();
persistGlobalSettings();
const initialMonth = getDefaultNextYearMonth();
yearInput.value = initialMonth.year;
monthInput.value = String(initialMonth.month);
syncMonthInputWidth();
publicLeaveInput.textContent = publicLeaveCount;
loadMonth(initialMonth.year, initialMonth.month);
buildRowFillQuickLetters();
render();
renderRuleSettingsPage();

if (storage && !storage.isPersistent()) {
  window.setTimeout(() => {
    window.alert('目前瀏覽器無法使用本機自動保存。班表仍可操作，但重新整理後資料可能消失；請使用「下載 JSON」備份。');
  }, 0);
}
