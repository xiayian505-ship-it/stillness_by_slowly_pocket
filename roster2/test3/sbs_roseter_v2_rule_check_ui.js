/* sbs_roseter_v2_rule_check_ui.js
 * 規則檢查前端流程。
 * phase_v2_7：由主檔原樣搬出，未重構函式內容。
 */

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
