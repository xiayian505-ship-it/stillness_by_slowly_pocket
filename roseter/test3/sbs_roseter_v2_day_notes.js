// Day notes / third-leave dialog responsibilities split from sbs_roseter_v2.js.
// Move-only split: function bodies are unchanged.

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
