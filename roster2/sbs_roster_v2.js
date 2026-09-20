/* sbs_roster_v2.js
 * 第一階段：日期 + 班表月份切換。
 * 命名沿用 shift_roster_v1.js；尚未接回資料、規則、儲存、匯入匯出。
 */

const yearInput = document.getElementById('yearInput');
const monthInput = document.getElementById('monthInput');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const titleYear = document.getElementById('titleYear');
const titleMonth = document.getElementById('titleMonth');
const scheduleTable = document.getElementById('scheduleTable');
const lowerTable = document.getElementById('lowerTable');
const summaryGrid = document.getElementById('summaryGrid');
const specialDatesButton = document.getElementById('specialDatesButton');
const specialDatesReminder = document.getElementById('specialDatesReminder');
const specialDatesReminderText = document.getElementById('specialDatesReminderText');
const specialDatesReminderButton = document.getElementById('specialDatesReminderButton');
const specialDatesDialog = document.getElementById('specialDatesDialog');
const specialDatesClose = document.getElementById('specialDatesClose');
const specialDatesCancel = document.getElementById('specialDatesCancel');
const specialDatesApply = document.getElementById('specialDatesApply');
const specialDatesYear = document.getElementById('specialDatesYear');
const specialDatesHolidayMode = document.getElementById('specialDatesHolidayMode');
const specialDatesWorkdayMode = document.getElementById('specialDatesWorkdayMode');
const specialDatesCalendars = document.getElementById('specialDatesCalendars');
const specialDatesStatus = document.getElementById('specialDatesStatus');

const storage = window.ShiftRosterStorage || null;

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

const names = Array(6).fill('');
const specialDaysCache = new Map();
let specialDatesDraftYear = null;
let specialDatesDraftMode = 'holiday';
let specialDatesDraft = new Map();

function syncMonthInputWidth() {
  monthInput.style.width = `${Math.max(1, Math.min(2, String(monthInput.value || '').length))}ch`;
}

function getCurrentYearMonth() {
  return { year: Number(yearInput.value), month: Number(monthInput.value) };
}

function getDefaultNextYearMonth(date = new Date()) {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { year: next.getFullYear(), month: next.getMonth() + 1 };
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getDayInfo(year, month, day) {
  const weekdayIndex = new Date(year, month - 1, day).getDay();
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
  if (!Number.isInteger(targetYear) || targetYear < 2000 || targetYear > 2100) {
    return { configured: false, holidays: new Set(), workdays: new Set() };
  }
  if (specialDaysCache.has(targetYear)) return specialDaysCache.get(targetYear);
  const raw = storage?.getSpecialDays?.(targetYear) || { configured: false, holidays: [], workdays: [] };
  const normalized = {
    configured: raw.configured === true,
    holidays: new Set(Array.isArray(raw.holidays) ? raw.holidays : []),
    workdays: new Set(Array.isArray(raw.workdays) ? raw.workdays : [])
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
  if (year != null) {
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

function createLetterInput({ value = '', ariaLabel = '', className = '' } = {}) {
  const input = document.createElement('input');
  input.className = className;
  input.type = 'text';
  input.maxLength = 1;
  input.autocomplete = 'off';
  input.value = value;
  input.setAttribute('aria-label', ariaLabel);
  return input;
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

      const input = createLetterInput({
        value: '',
        ariaLabel: `${month}月${day}日 ${shift.label} 班別`,
        className: 'shift-input'
      });
      td.appendChild(input);
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

    for (let slot = 0; slot < 2; slot += 1) {
      const input = createLetterInput({
        value: '',
        ariaLabel: `${month}月${day}日 休假第${slot + 1}格`,
        className: 'vacation-input'
      });
      inputs.appendChild(input);
    }

    const inner = document.createElement('div');
    inner.className = 'vacation-cell-inner';
    inner.append(miniWeekday, inputs);
    td.appendChild(inner);
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

    const leaveInput = document.createElement('input');
    leaveInput.className = 'special-leave-input';
    leaveInput.type = 'text';
    leaveInput.readOnly = true;
    leaveInput.value = '';
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
}

function renderSummary() {
  summaryGrid.innerHTML = '';
  names.forEach((name, index) => {
    const letter = String.fromCharCode(65 + index);
    const item = document.createElement('div');
    item.className = 'summary-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'summary-name';
    nameSpan.textContent = name || `${letter}.`;

    const publicLeave = document.createElement('span');
    publicLeave.className = 'summary-count';
    publicLeave.textContent = '公休：0';

    const specialLeave = document.createElement('span');
    specialLeave.className = 'summary-count';
    specialLeave.textContent = '特休：0';

    item.append(nameSpan, publicLeave, specialLeave);
    summaryGrid.appendChild(item);
  });
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
  specialDatesDraft = new Map();
  const data = getSpecialDaysForYear(targetYear);
  data.holidays.forEach((date) => specialDatesDraft.set(date, 'holiday'));
  data.workdays.forEach((date) => specialDatesDraft.set(date, 'workday'));
  if (specialDatesYear) specialDatesYear.value = String(targetYear);
  renderSpecialDatesCalendars();
  updateSpecialDatesStatus();
  return true;
}

function updateSpecialDatesStatus() {
  if (!specialDatesStatus) return;
  let holidayCount = 0;
  let workdayCount = 0;
  for (const type of specialDatesDraft.values()) {
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
    const firstWeekday = new Date(specialDatesDraftYear, month - 1, 1).getDay();
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
      updateSpecialDateDayButton(button, specialDatesDraft.get(dateKey) || '');
      button.addEventListener('click', () => {
        const current = specialDatesDraft.get(dateKey) || '';
        if (current === specialDatesDraftMode) specialDatesDraft.delete(dateKey);
        else specialDatesDraft.set(dateKey, specialDatesDraftMode);
        updateSpecialDateDayButton(button, specialDatesDraft.get(dateKey) || '');
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
  specialDatesDraft = new Map();
}

function applySpecialDates() {
  if (!storage?.saveSpecialDays || !Number.isInteger(specialDatesDraftYear)) return;
  const holidays = [];
  const workdays = [];
  for (const [date, type] of specialDatesDraft.entries()) {
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
  if (![11, 12].includes(Number(month))) {
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
}

function changeMonth(offset) {
  let year = Number(yearInput.value);
  let month = Number(monthInput.value) + offset;

  if (month < 1) {
    month = 12;
    year -= 1;
  } else if (month > 12) {
    month = 1;
    year += 1;
  }

  if (year < 1900 || year > 2100) return;

  yearInput.value = year;
  monthInput.value = String(month);
  render();
}

yearInput.addEventListener('change', () => {
  const year = Number(yearInput.value);
  const month = Number(monthInput.value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return render();
  render();
});

monthInput.addEventListener('input', syncMonthInputWidth);
monthInput.addEventListener('change', () => {
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

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (specialDatesDialog && !specialDatesDialog.hidden) closeSpecialDatesDialog();
});

const initialMonth = getDefaultNextYearMonth();
yearInput.value = initialMonth.year;
monthInput.value = String(initialMonth.month);
syncMonthInputWidth();
render();
