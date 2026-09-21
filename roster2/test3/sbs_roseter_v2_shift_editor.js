/* sbs_roseter_v2_shift_editor.js
   班別編輯／人員班別資格／特殊與大夜時間／整列填班。
   Phase v2_6：由主檔原樣拆出，不重構既有函式。
*/

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
