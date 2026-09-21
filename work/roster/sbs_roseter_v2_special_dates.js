/* sbs_roseter_v2_special_dates.js
 * 年度休假／補班日期：資料快取、日曆編輯器與提醒。
 * 由主檔原樣拆出；不改既有函式名稱、參數或行為。
 */

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

function syncSpecialDatesYearFromInput() {
  const year = Number(specialDatesYear?.value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return false;
  if (year === specialDatesDraftYear) return true;
  return loadSpecialDatesDraft(year);
}
