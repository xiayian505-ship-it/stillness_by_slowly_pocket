function makeAnnualGrantDecisionKey(year, month, employeeId) {
  return `${year}-${month}-${employeeId}`;
}
function makeAnnualBalanceCalibrationKey(year, month, employeeId) {
  return `${year}-${month}-${employeeId}`;
}
function getAnnualBalanceCalibration(employeeId, year, month) {
  if (!employeeId) return null;
  const raw = annualBalanceCalibrationValues.get(makeAnnualBalanceCalibrationKey(year, month, employeeId));
  if (!raw || !Number.isInteger(Number(raw.value))) return null;
  const value = Number(raw.value);
  return value >= 0 && value <= 99 ? { value } : null;
}

function getEmployeeRecord(employeeId) {
  if (!storage || !employeeId) return null;
  return storage.getEmployees()?.[employeeId] || null;
}

function updateEmployeeRecord(employeeId, patch) {
  if (!storage || !employeeId) return;
  const employees = storage.getEmployees();
  const current = employees[employeeId] || {};
  employees[employeeId] = { ...current, ...patch, updatedAt: new Date().toISOString() };
  storage.saveEmployees(employees);
}

function getSupervisorRecord() {
  const record = getEmployeeRecord(SUPERVISOR_ID);
  return record?.role === 'supervisor' ? record : null;
}

function updateSupervisorRecord(patch) {
  if (!storage) return;
  const employees = storage.getEmployees();
  const now = new Date().toISOString();
  const current = employees[SUPERVISOR_ID] || {};
  employees[SUPERVISOR_ID] = {
    ...current,
    name: typeof current.name === 'string' ? current.name : '',
    role: 'supervisor',
    active: true,
    createdAt: current.createdAt || now,
    ...patch,
    updatedAt: now
  };
  storage.saveEmployees(employees);
}

function cleanSupervisorCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
}

function cleanSupervisorDisplayChar(value) {
  return Array.from(String(value || '').trim()).slice(0, 1).join('');
}

function cleanSupervisorName(value) {
  return Array.from(String(value || '').trim()).slice(0, 20).join('');
}

function isSupervisorLeaveDay(year, month, day) {
  const current = getCurrentYearMonth();
  return current.year === Number(year) && current.month === Number(month) && supervisorLeaveDays.has(Number(day));
}

function addMonthsClamped(date, months) {
  const target = window.CalendarMonthSequence.shift(
    date.getFullYear(),
    date.getMonth() + 1,
    months
  );
  const day = date.getDate();
  const lastDay = getDaysInMonth(target.year, target.month);
  return new Date(target.year, target.month - 1, Math.min(day, lastDay));
}

function addYearsClamped(date, years) {
  return addMonthsClamped(date, Number(years) * 12);
}

function getAnnualGrantDaysForYears(years) {
  if (years === 1) return annualLeaveRules.year1;
  if (years === 2) return annualLeaveRules.year2;
  if (years >= 3 && years < 5) return annualLeaveRules.years3to4;
  if (years >= 5 && years < 10) return annualLeaveRules.years5to9;
  if (years >= 10) return Math.min(annualLeaveRules.maxDays, annualLeaveRules.year10Base + (years - 10) * annualLeaveRules.after10Increment);
  return 0;
}

function parseHireDateValue(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = window.DateTime.parseDateKey(text);
  if (!date) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    date
  };
}

function getCurrentCalendarDate() {
  const date = window.DateTime.parseDateKey(window.DateTime.dateKey(new Date()));
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    date
  };
}

function getAnnualLeaveEntitlementForDate(record, referenceDate, supervisor = false) {
  const parsed = parseHireDateValue(record?.hireDate);
  if (!parsed || !(referenceDate instanceof Date) || Number.isNaN(referenceDate.getTime()) || referenceDate < parsed.date) return 0;

  let days = 0;
  const sixMonth = addMonthsClamped(parsed.date, 6);
  if (referenceDate >= sixMonth) days = annualLeaveRules.sixMonths;

  for (let years = 1; years <= 80; years += 1) {
    const anniversary = addYearsClamped(parsed.date, years);
    if (anniversary > referenceDate) break;
    days = getAnnualGrantDaysForYears(years);
  }

  return supervisor ? Math.ceil(Number(days || 0) / 2) : Number(days || 0);
}

function getCalendarSeniority(startDate, endDate) {
  if (!(startDate instanceof Date) || !(endDate instanceof Date) || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return null;
  }

  let years = endDate.getFullYear() - startDate.getFullYear();
  let yearAnchor = addYearsClamped(startDate, years);
  if (yearAnchor > endDate) {
    years -= 1;
    yearAnchor = addYearsClamped(startDate, years);
  }

  let months = 0;
  while (months < 11 && addMonthsClamped(yearAnchor, months + 1) <= endDate) {
    months += 1;
  }
  const monthAnchor = addMonthsClamped(yearAnchor, months);
  const dayMs = 24 * 60 * 60 * 1000;
  const anchorUtc = Date.UTC(monthAnchor.getFullYear(), monthAnchor.getMonth(), monthAnchor.getDate());
  const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const days = Math.floor((endUtc - anchorUtc) / dayMs);

  return { years, months, days };
}

function getSeniorityInfo(record, supervisor = false) {
  const parsed = parseHireDateValue(record?.hireDate);
  if (!parsed) return null;
  const today = getCurrentCalendarDate();
  if (parsed.date > today.date) return null;

  const dayMs = 24 * 60 * 60 * 1000;
  const hireUtc = Date.UTC(parsed.year, parsed.month - 1, parsed.day);
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
  const days = Math.floor((todayUtc - hireUtc) / dayMs);
  const calendarSeniority = getCalendarSeniority(parsed.date, today.date);
  const annualDays = getAnnualLeaveEntitlementForDate(record, today.date, supervisor);
  const gregorian = `${parsed.year}.${String(parsed.month).padStart(2, '0')}.${String(parsed.day).padStart(2, '0')}`;
  const roc = `${parsed.year - 1911}.${String(parsed.month).padStart(2, '0')}.${String(parsed.day).padStart(2, '0')}`;

  return {
    days,
    annualDays,
    calendarSeniority,
    gregorian,
    roc
  };
}

function formatSeniorityLine(name, record, supervisor = false) {
  const displayName = String(name || '').trim();
  const info = getSeniorityInfo(record, supervisor);
  if (!displayName || !info || !info.calendarSeniority) return '';
  const seniority = info.calendarSeniority;
  return `${displayName} ${info.days}天 | 特休${info.annualDays}天 | ${seniority.years}年${seniority.months}個月${seniority.days}天\n到職日 | 西元${info.gregorian} | 民國${info.roc}`;
}

function renderShiftSeniorityInfo() {
  if (!shiftSeniorityInfo || shiftSeniorityInfo.hidden) return;
  shiftSeniorityInfo.innerHTML = '';
  let count = 0;
  for (let index = 0; index < names.length; index += 1) {
    const employeeId = employeeIds[index] || '';
    const line = formatSeniorityLine(names[index], employeeId ? getEmployeeRecord(employeeId) : null, false);
    if (!line) continue;
    const item = document.createElement('div');
    item.className = 'seniority-info-line';
    item.textContent = line;
    shiftSeniorityInfo.appendChild(item);
    count += 1;
  }
  if (!count) {
    const empty = document.createElement('div');
    empty.className = 'seniority-info-empty';
    empty.textContent = '尚無可顯示的年資資訊。';
    shiftSeniorityInfo.appendChild(empty);
  }
}

function renderSupervisorSeniorityInfo() {
  if (!supervisorSeniorityInfo || supervisorSeniorityInfo.hidden) return;
  supervisorSeniorityInfo.innerHTML = '';
  const record = getSupervisorRecord() || {};
  const line = formatSeniorityLine(record.name, record, true);
  const item = document.createElement('div');
  item.className = line ? 'seniority-info-line' : 'seniority-info-empty';
  item.textContent = line || '尚無可顯示的年資資訊。';
  supervisorSeniorityInfo.appendChild(item);
}

function showShiftSubsection(kind) {
  const showSeniority = kind === 'seniority';
  shiftSeniorityInfo.hidden = !showSeniority;
  shiftConfigGrid.hidden = showSeniority;
  shiftSeniorityButton.setAttribute('aria-expanded', String(showSeniority));
  shiftSeniorityButton.classList.toggle('is-active', showSeniority);
  shiftPeopleButton?.classList.toggle('is-active', !showSeniority);
  shiftPeopleButton?.setAttribute('aria-pressed', String(!showSeniority));
  if (showSeniority) renderShiftSeniorityInfo();
}

function showSupervisorSubsection(kind) {
  const showSeniority = kind === 'seniority';
  supervisorSeniorityInfo.hidden = !showSeniority;
  supervisorConfigBody.hidden = showSeniority;
  supervisorSeniorityButton.setAttribute('aria-expanded', String(showSeniority));
  supervisorSeniorityButton.classList.toggle('is-active', showSeniority);
  supervisorPeopleButton?.classList.toggle('is-active', !showSeniority);
  supervisorPeopleButton?.setAttribute('aria-pressed', String(!showSeniority));
  if (showSeniority) renderSupervisorSeniorityInfo();
}

function collapseSeniorityInfo(button, info) {
  if (info) info.hidden = true;
  if (button) button.setAttribute('aria-expanded', 'false');
}

function getAnnualGrantEventForRecord(record, year, month) {
  const match = String(record?.hireDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const hireDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(hireDate.getTime())) return null;
  const sixMonth = addMonthsClamped(hireDate, 6);
  if (sixMonth.getFullYear() === year && sixMonth.getMonth() + 1 === month) {
    return { day: sixMonth.getDate(), days: annualLeaveRules.sixMonths, label: '滿 6 個月' };
  }
  for (let years = 1; years <= 80; years += 1) {
    const anniversary = addYearsClamped(hireDate, years);
    if (anniversary.getFullYear() > year) break;
    if (anniversary.getFullYear() === year && anniversary.getMonth() + 1 === month) {
      return { day: anniversary.getDate(), days: getAnnualGrantDaysForYears(years), label: `滿 ${years} 年` };
    }
  }
  return null;
}

function getAnnualGrantEventForEmployee(employeeId, year, month) {
  return getAnnualGrantEventForRecord(getEmployeeRecord(employeeId), year, month);
}

function getSupervisorAnnualGrantEvent(year, month) {
  const base = getAnnualGrantEventForRecord(getSupervisorRecord(), year, month);
  if (!base) return null;
  return { ...base, baseDays: base.days, days: Math.ceil(Number(base.days || 0) / 2) };
}

function getSupervisorAnnualGrantNote(year, month, day) {
  const supervisor = getSupervisorRecord();
  if (!supervisor) return null;
  const grant = getSupervisorAnnualGrantEvent(Number(year), Number(month));
  if (!grant || Number(grant.day) !== Number(day) || Number(grant.days) <= 0) return null;
  const code = cleanSupervisorCode(supervisor.code || '');
  if (!code) return null;
  return { kind: 'supervisor-annual-grant', lines: [code, String(grant.days)] };
}

function countAnnualLeaveInMonthData(monthData, letter) {
  if (!monthData || !letter) return 0;
  let count = 0;
  const parsed = storage?.parseMonthId(monthData.month || '');
  const days = parsed ? getDaysInMonth(parsed.year, parsed.month) : 31;
  for (let day = 1; day <= days; day += 1) {
    for (let slot = 0; slot < 2; slot += 1) {
      const key = `${day}-vacation-${slot}`;
      if (monthData.rosterValues?.[key] === letter && String(monthData.leaveTypeValues?.[key] || 'public') === 'annual') count += 1;
    }
    const extra = monthData.extraLeaves?.[String(day)];
    if (extra?.letter === letter && extra?.type === 'annual') count += 1;
  }
  return count;
}

function calculateExpectedAnnualBalanceFromPrevious(index, year, month) {
  if (!storage) return null;
  const employeeId = employeeIds[index] || '';
  if (!employeeId) return null;
  const previous = storage.getPreviousYearMonth(year, month);
  const data = storage.getMonth(previous.year, previous.month);
  if (!data) return null;
  let previousLetter = '';
  let previousIndex = -1;
  for (const [letter, person] of Object.entries(data.people || {})) {
    if (person?.employeeId === employeeId) {
      previousLetter = letter;
      previousIndex = letter.charCodeAt(0) - 65;
      break;
    }
  }
  if (!previousLetter || previousIndex < 0) return null;
  const previousBalanceText = String(data.specialLeaveValues?.[previousIndex] ?? '');
  if (!/^\d+$/.test(previousBalanceText)) return null;
  let balance = Math.max(0, Number(previousBalanceText) - countAnnualLeaveInMonthData(data, previousLetter));
  const decision = data.annualGrantDecisions?.[employeeId];
  if (decision && Number.isFinite(Number(decision.days))) {
    balance = decision.mode === 'reset' ? Number(decision.days) : balance + Number(decision.days);
  }
  return Math.max(0, balance);
}

function calculateAnnualBalanceFromHireDate(employeeId, year, month) {
  const record = getEmployeeRecord(employeeId);
  const match = String(record?.hireDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const hireDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(hireDate.getTime())) return null;

  // 本月第一次建立資料時，以「上月底已經取得的法定特休」當月初起點。
  // 若取得日剛好落在本月，仍沿用既有的取得日累加／重置流程，避免重複計入。
  const referenceDate = new Date(Number(year), Number(month) - 1, 0, 23, 59, 59, 999);
  if (referenceDate < hireDate) return 0;

  let balance = 0;
  const sixMonth = addMonthsClamped(hireDate, 6);
  if (sixMonth <= referenceDate) balance = annualLeaveRules.sixMonths;

  for (let years = 1; years <= 80; years += 1) {
    const anniversary = addYearsClamped(hireDate, years);
    if (anniversary > referenceDate) break;
    balance = getAnnualGrantDaysForYears(years);
  }
  return Math.max(0, Number(balance) || 0);
}

function getAnnualBalanceBasis(index, year, month) {
  const fromPrevious = calculateExpectedAnnualBalanceFromPrevious(index, year, month);
  if (fromPrevious != null) return { value: fromPrevious, source: 'previous' };

  const employeeId = employeeIds[index] || '';
  if (!employeeId) return { value: null, source: 'none' };
  const fromHireDate = calculateAnnualBalanceFromHireDate(employeeId, year, month);
  if (fromHireDate != null) return { value: fromHireDate, source: 'hire' };
  return { value: null, source: 'none' };
}

function autofillAnnualBalances(year, month) {
  for (let index = 0; index < 6; index += 1) {
    if (String(specialLeaveValues[index] || '').trim()) continue;
    const basis = getAnnualBalanceBasis(index, year, month);
    if (basis.value != null) specialLeaveValues[index] = String(basis.value);
  }
}


