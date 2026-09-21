// 班表排假／假別編輯責任模組。
// Phase v2_5：僅由主檔搬出既有函式，不重構函式內容。

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
