(() => {
  'use strict';

  const PUBLIC_LEAVE_TYPES = Object.freeze(['public', 'exceptionPublic']);
  const SHIFT_GROUP_KEYS = Object.freeze(['early', 'middle', 'night']);
  const FIXED_LEAVE_GROUPS = Object.freeze([
    { name: '早／中班組', keys: Object.freeze(['early', 'middle']) },
    { name: '大夜班組', keys: Object.freeze(['night']) }
  ]);

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function normalizeTimeText(value) {
    return String(value || '')
      .trim()
      .replace(/[：:]/g, ':')
      .replace(/[～〜—–－]/g, '~')
      .replace(/\s+/g, '');
  }

  function parseClockPart(part) {
    const match = String(part || '').match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return null;
    if (hour === 24 && minute !== 0) return null;
    return { hour, minute };
  }

  function parseTimeRange(value) {
    const normalized = normalizeTimeText(value);
    const parts = normalized.split('~');
    if (parts.length !== 2) return null;
    const start = parseClockPart(parts[0]);
    const end = parseClockPart(parts[1]);
    if (!start || !end || start.hour === 24) return null;
    return { start, end, text: `${pad2(start.hour)}:${pad2(start.minute)}~${pad2(end.hour)}:${pad2(end.minute)}` };
  }

  function buildInterval(year, month, day, rangeText) {
    const parsed = parseTimeRange(rangeText);
    if (!parsed) return null;
    const start = new Date(year, month - 1, day, parsed.start.hour, parsed.start.minute, 0, 0);
    let endDay = day;
    let endHour = parsed.end.hour;
    const endMinute = parsed.end.minute;
    if (endHour === 24) {
      endHour = 0;
      endDay += 1;
    }
    let end = new Date(year, month - 1, endDay, endHour, endMinute, 0, 0);
    if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    return { start, end, rangeText };
  }

  function formatDate(month, day) {
    return `${month}/${day}`;
  }

  function formatDateRef(ref) {
    return ref ? `${ref.month}/${ref.day}` : '';
  }

  function formatDurationHours(ms) {
    const hours = ms / 3600000;
    if (Number.isInteger(hours)) return String(hours);
    return hours.toFixed(1).replace(/\.0$/, '');
  }

  function isPublicLeaveType(type) {
    return window.ValueCycle.contains(PUBLIC_LEAVE_TYPES, type || 'public');
  }


  function isSchedulingException(letter) {
    return String(letter || '') === 'A';
  }

  function getActiveLetters(model) {
    const initial = (model.employees || [])
      .filter((employee) => String(employee.name || '').trim())
      .map((employee) => employee.letter);
    const active = window.TreeSelection.create({ selected: initial });
    const namedLetters = window.TreeSelection.create({ selected: initial });
    for (let day = 1; day <= model.days; day += 1) {
      for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
        const letter = model.getShiftLetter(day, shiftIndex);
        if (letter && namedLetters.has(letter)) active.select(letter);
      }
      for (const leave of model.getLeaveEntries(day)) {
        if (leave.letter && namedLetters.has(leave.letter)) active.select(leave.letter);
      }
    }
    return active.getSelected().sort();
  }

  function getSchedulingLetters(model) {
    return getActiveLetters(model).filter((letter) => !isSchedulingException(letter));
  }

  function getShiftGroups(employee) {
    return window.TreeSelection.create({
      selected: Array.isArray(employee?.shiftGroups) ? employee.shiftGroups : []
    });
  }

  function getFixedShiftGroup(employee) {
    const groups = getShiftGroups(employee)
      .getSelected()
      .filter((key) => window.ValueCycle.contains(SHIFT_GROUP_KEYS, key));
    return groups.length === 1 ? groups[0] : '';
  }

  function getShiftGroupKey(model, shiftIndex) {
    const label = String(model.shifts?.[shiftIndex]?.groupLabel || '');
    if (label === '早') return 'early';
    if (label === '中') return 'middle';
    if (label === '夜') return 'night';
    return '';
  }

  // ---------- 休假規則 ----------

  function collectBlockedLeaveIssues(model, issues) {
    const blockedTypes = window.TreeSelection.create({
      selected: Array.isArray(model.settings?.blockedLeaveTypes) ? model.settings.blockedLeaveTypes : ['public', 'annual']
    });
    if (!blockedTypes.selectedCount) return;
    for (let day = 1; day <= model.days; day += 1) {
      if (!model.isBlocked(day)) continue;
      for (const leave of model.getLeaveEntries(day)) {
        if (!leave.letter) continue;
        if (leave.letter === 'A' && model.isSupervisorLeave?.(day)) continue;
        const type = leave.type || 'public';
        if (!blockedTypes.has(type)) continue;
        const label = type === 'annual' ? '特休' : '公休';
        issues.push({
          code: 'blocked-leave',
          title: '禁假日排休',
          message: `${formatDate(model.month, day)} 為禁假日，${leave.letter} 排了${label}。\n請確認是例外安排還是排錯。`
        });
      }
    }
  }

  function collectSameGroupLeaveIssues(model, issues) {
    const employeeMap = new Map((model.employees || []).map((employee) => [employee.letter, employee]));
    for (let day = 1; day <= model.days; day += 1) {
      const leaves = model.getLeaveEntries(day).filter((entry) => entry.letter && !isSchedulingException(entry.letter));
      for (const group of FIXED_LEAVE_GROUPS) {
        const members = leaves
          .filter((leave) => window.ValueCycle.contains(group.keys, getFixedShiftGroup(employeeMap.get(leave.letter))))
          .map((leave) => leave.letter);
        const unique = window.TreeSelection.create({ selected: members }).getSelected();
        if (unique.length > 1) {
          issues.push({
            code: 'same-group-leave',
            title: '同組同日排休',
            message: `${formatDate(model.month, day)} ${group.name}同日排休：${unique.join('、')}。\n早／中同組、大夜同組，同一天原則上各只能休 1 人。`
          });
        }
      }
    }
  }

  function collectAdjacentLeaveOrderIssues(model, issues) {
    const employeeMap = new Map((model.employees || []).map((employee) => [employee.letter, employee]));
    for (let day = 1; day < model.days; day += 1) {
      const todayMiddle = model.getLeaveEntries(day)
        .filter((entry) => entry.letter && !isSchedulingException(entry.letter))
        .filter((entry) => getFixedShiftGroup(employeeMap.get(entry.letter)) === 'middle');
      const nextEarly = model.getLeaveEntries(day + 1)
        .filter((entry) => entry.letter && !isSchedulingException(entry.letter))
        .filter((entry) => getFixedShiftGroup(employeeMap.get(entry.letter)) === 'early');

      for (const first of todayMiddle) {
        for (const second of nextEarly) {
          issues.push({
            code: 'adjacent-leave-order',
            title: '早班排休接在中班後',
            message: `${formatDate(model.month, day)} ${first.letter}（中班）休假，${formatDate(model.month, day + 1)} ${second.letter}（早班）休假。\n早班不能休在中班後面。`
          });
        }
      }
    }
  }

  function collectWorkLeaveConflictIssues(model, issues) {
    for (let day = 1; day <= model.days; day += 1) {
      const leaveLetters = window.TreeSelection.create({
        selected: model.getLeaveEntries(day).map((entry) => entry.letter).filter(Boolean)
      }).getSelected();
      if (!leaveLetters.length) continue;
      const workSelection = window.TreeSelection.create();
      for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
        const letter = model.getShiftLetter(day, shiftIndex);
        if (letter) workSelection.select(letter);
      }
      const workLetters = workSelection.getSelected();
      const overlaps = window.DateOverlap.overlaps([
        { id: 'leave', dates: leaveLetters },
        { id: 'work', dates: workLetters }
      ], { min: 2, sort: false });
      for (const entry of overlaps) {
        const letter = entry.date;
        issues.push({
          code: 'work-leave-conflict',
          title: '排班／休假衝突',
          message: `${formatDate(model.month, day)} ${letter} 同一天同時有排班與休假。`
        });
      }
    }
  }

  function collectSupervisorLeaveAIssues(model, issues, mode = 'all') {
    if (typeof model.isSupervisorLeave !== 'function') return;
    for (let day = 1; day <= model.days; day += 1) {
      if (!model.isSupervisorLeave(day)) continue;
      const hasAWork = window.ValueCycle.contains(
        Array.from({ length: model.shifts.length }, (_, shiftIndex) => model.getShiftLetter(day, shiftIndex)),
        'A'
      );
      const hasALeave = model.getLeaveEntries(day).some((entry) => entry.letter === 'A');
      const shouldReport = mode === 'work' ? hasAWork : mode === 'leave' ? hasALeave : (hasAWork || hasALeave);
      if (!shouldReport) continue;
      issues.push({
        code: 'a-supervisor-leave',
        title: 'A不可排',
        message: `${formatDate(model.month, day)} A不可排`
      });
    }
  }

  // ---------- 人員固定班別 ----------

  function collectPersonnelShiftIssues(model, issues) {
    const employeeMap = new Map((model.employees || []).map((employee) => [employee.letter, employee]));
    for (const letter of getSchedulingLetters(model)) {
      const employee = employeeMap.get(letter);
      const group = getFixedShiftGroup(employee);
      if (!group) {
        issues.push({
          code: 'missing-personnel-shift',
          title: '固定班別未設定',
          message: `${letter}${employee?.name ? ` ${employee.name}` : ''} 必須設定且只能設定 1 個固定班別。`
        });
      }
    }

    for (let day = 1; day <= model.days; day += 1) {
      for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
        const letter = model.getShiftLetter(day, shiftIndex);
        if (!letter || isSchedulingException(letter)) continue;
        const employee = employeeMap.get(letter);
        const fixedGroup = getFixedShiftGroup(employee);
        const actualGroup = getShiftGroupKey(model, shiftIndex);
        if (!fixedGroup || !actualGroup || fixedGroup === actualGroup) continue;
        const groupLabel = { early: '早班', middle: '中班', night: '大夜' };
        issues.push({
          code: 'wrong-fixed-shift',
          title: '排到非固定班別',
          message: `${formatDate(model.month, day)} ${letter} 固定為${groupLabel[fixedGroup] || fixedGroup}，但被排到${groupLabel[actualGroup] || actualGroup}。`
        });
      }
    }
  }

  // ---------- 時間與跨月資料 ----------

  function getActualRange(model, day, shiftIndex) {
    const shift = model.shifts[shiftIndex];
    if (!shift) return null;
    if (model.isSpecial(day, shiftIndex)) {
      const specialTime = model.getSpecialTime(day, shiftIndex);
      if (specialTime) return specialTime;
    }
    if (model.isNightGray(day, shiftIndex)) {
      const grayTime = model.getNightTime(day, shiftIndex);
      if (grayTime) return grayTime;
      if (shiftIndex === 3) return model.settings?.normalNightRange || '22~06';
    }
    return shift.label.replace(/\s+/g, '');
  }

  function buildWorkIntervals(model) {
    const byLetter = new Map();
    for (let day = 1; day <= model.days; day += 1) {
      for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
        const letter = model.getShiftLetter(day, shiftIndex);
        if (!letter || isSchedulingException(letter)) continue;
        const rangeText = getActualRange(model, day, shiftIndex);
        if (!rangeText) continue;
        const interval = buildInterval(model.year, model.month, day, rangeText);
        if (!interval) continue;
        Object.assign(interval, { year: model.year, month: model.month, day, shiftIndex, letter, rangeText });
        if (!byLetter.has(letter)) byLetter.set(letter, []);
        byLetter.get(letter).push(interval);
      }
    }
    for (const intervals of byLetter.values()) intervals.sort((a, b) => a.start - b.start || a.end - b.end);
    return byLetter;
  }

  function collectSpecialTimeIssues(model, issues) {
    for (let day = 1; day <= model.days; day += 1) {
      for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
        const letter = model.getShiftLetter(day, shiftIndex);
        if (!letter) continue;
        if (model.isSpecial(day, shiftIndex)) {
          const time = model.getSpecialTime(day, shiftIndex);
          if (time && !parseTimeRange(time)) {
            issues.push({ code: 'special-time-invalid', title: '粉底時間格式', message: `${formatDate(model.month, day)} ${letter} 的粉底實際時間「${time}」無法判讀。` });
          }
        }
        const grayTime = model.getNightTime(day, shiftIndex);
        if (grayTime && !parseTimeRange(grayTime)) {
          issues.push({ code: 'night-time-invalid', title: '灰底時間格式', message: `${formatDate(model.month, day)} ${letter} 的灰底實際時間「${grayTime}」無法判讀。` });
        }
      }
    }
  }

  function collectPreviousMonthDataIssues(model, issues) {
    const activeLetters = getSchedulingLetters(model);
    if (!activeLetters.length || typeof model.getPreviousMonthHistory !== 'function') return;
    if (model.previousMonthExists === false) {
      const previous = model.previousMonth;
      const label = previous ? `${previous.year} 年 ${previous.month} 月` : '前一個月';
      issues.push({
        code: 'previous-month-missing',
        title: '前月銜接資料不存在',
        message: `找不到${label}的班表資料。\n本月月初的跨月連勤與轉班 12 小時無法完整檢查。`
      });
      return;
    }
    for (const letter of activeLetters) {
      const history = model.getPreviousMonthHistory(letter);
      if (!history?.employeeFound || !history.incomplete) continue;
      const employee = (model.employees || []).find((item) => item.letter === letter);
      issues.push({
        code: 'previous-month-incomplete',
        title: '前月月底資料不完整',
        message: `${letter}${employee?.name ? ` ${employee.name}` : ''} 的前月月底銜接資料有空白。\n跨月連勤／轉班可能無法完整判斷。`
      });
    }
  }

  // ---------- 排班規則：A 全部排除 ----------

  function collectConsecutiveWorkIssues(model, issues) {
    const maxDays = Math.max(1, Number(model.settings?.maxConsecutiveDays) || 6);
    for (const letter of getSchedulingLetters(model)) {
      const history = typeof model.getPreviousMonthHistory === 'function' ? model.getPreviousMonthHistory(letter) : null;
      const carryDays = history && history.employeeFound ? history.carryWorkDays : 0;
      let runLength = 0;
      let runStart = null;
      let runEnd = null;

      const flushRun = () => {
        if (runLength > maxDays && runStart && runEnd) {
          issues.push({
            code: 'consecutive-work',
            title: `連續上班超過 ${maxDays} 天`,
            message: `${letter} 於 ${formatDateRef(runStart)}～${formatDateRef(runEnd)} 連續上班 ${runLength} 天。\n第 ${maxDays + 1} 天應休假。`
          });
        }
        runLength = 0;
        runStart = null;
        runEnd = null;
      };

      for (let day = 1; day <= model.days; day += 1) {
        let works = false;
        for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
          if (model.getShiftLetter(day, shiftIndex) === letter) {
            works = true;
            break;
          }
        }
        if (!works) {
          flushRun();
          continue;
        }
        if (runLength === 0) {
          if (day === 1 && carryDays > 0) {
            runLength = carryDays + 1;
            runStart = history.carryStart || { year: model.year, month: model.month, day };
          } else {
            runLength = 1;
            runStart = { year: model.year, month: model.month, day };
          }
        } else {
          runLength += 1;
        }
        runEnd = { year: model.year, month: model.month, day };
      }
      flushRun();
    }
  }

  function collectRestGapIssues(model, issues) {
    const byLetter = buildWorkIntervals(model);
    const configuredRestHours = Number(model.settings?.minTurnaroundHours);
    const minRestHours = Number.isFinite(configuredRestHours) ? Math.max(0, configuredRestHours) : 12;

    function pushGapIssue(letter, current, next) {
      const gapMs = next.start - current.end;
      if (gapMs >= minRestHours * 3600000) return;
      issues.push({
        code: 'rest-gap',
        title: `轉班間隔低於 ${formatDurationHours(minRestHours * 3600000)} 小時`,
        message: `${letter}：${formatDate(current.month, current.day)} ${current.rangeText} → ${formatDate(next.month, next.day)} ${next.rangeText}\n中間休息約 ${formatDurationHours(gapMs)} 小時，低於 ${formatDurationHours(minRestHours * 3600000)} 小時。`
      });
    }

    for (const letter of getSchedulingLetters(model)) {
      const intervals = byLetter.get(letter) || [];
      const history = typeof model.getPreviousMonthHistory === 'function' ? model.getPreviousMonthHistory(letter) : null;
      if (intervals.length && history?.employeeFound && history.restGapKnown !== false && Array.isArray(history.previousWorkIntervals)) {
        const previousIntervals = history.previousWorkIntervals
          .map((entry) => {
            const interval = buildInterval(entry.year, entry.month, entry.day, entry.rangeText);
            return interval ? { ...interval, ...entry } : null;
          })
          .filter(Boolean)
          .sort((a, b) => a.end - b.end);
        const previousLast = previousIntervals.at(-1);
        if (previousLast) pushGapIssue(letter, previousLast, intervals[0]);
      }
      for (let index = 0; index < intervals.length - 1; index += 1) {
        pushGapIssue(letter, intervals[index], intervals[index + 1]);
      }
    }
  }

  function collectIssuesByKind(model, kind) {
    const issues = [];
    switch (kind) {
      case 'blocked-leave':
        collectBlockedLeaveIssues(model, issues);
        collectSupervisorLeaveAIssues(model, issues, 'leave');
        break;
      case 'same-group-leave':
        collectPersonnelShiftIssues(model, issues);
        collectSameGroupLeaveIssues(model, issues);
        break;
      case 'adjacent-leave':
        collectPersonnelShiftIssues(model, issues);
        collectAdjacentLeaveOrderIssues(model, issues);
        break;
      case 'work-leave-conflict':
        collectWorkLeaveConflictIssues(model, issues);
        break;
      case 'fixed-shift':
        collectPersonnelShiftIssues(model, issues);
        break;
      case 'consecutive':
        collectPreviousMonthDataIssues(model, issues);
        collectConsecutiveWorkIssues(model, issues);
        break;
      case 'turnaround':
        collectSpecialTimeIssues(model, issues);
        collectPreviousMonthDataIssues(model, issues);
        collectRestGapIssues(model, issues);
        break;
      case 'data':
        collectPersonnelShiftIssues(model, issues);
        collectSpecialTimeIssues(model, issues);
        collectPreviousMonthDataIssues(model, issues);
        break;
      case 'leave-all':
        collectBlockedLeaveIssues(model, issues);
        collectPersonnelShiftIssues(model, issues);
        collectSameGroupLeaveIssues(model, issues);
        collectAdjacentLeaveOrderIssues(model, issues);
        collectWorkLeaveConflictIssues(model, issues);
        collectSupervisorLeaveAIssues(model, issues, 'leave');
        break;
      case 'schedule-all':
        collectPersonnelShiftIssues(model, issues);
        collectSpecialTimeIssues(model, issues);
        collectPreviousMonthDataIssues(model, issues);
        collectConsecutiveWorkIssues(model, issues);
        collectRestGapIssues(model, issues);
        collectSupervisorLeaveAIssues(model, issues, 'work');
        break;
      default:
        collectBlockedLeaveIssues(model, issues);
        collectPersonnelShiftIssues(model, issues);
        collectSameGroupLeaveIssues(model, issues);
        collectAdjacentLeaveOrderIssues(model, issues);
        collectWorkLeaveConflictIssues(model, issues);
        collectSpecialTimeIssues(model, issues);
        collectPreviousMonthDataIssues(model, issues);
        collectConsecutiveWorkIssues(model, issues);
        collectRestGapIssues(model, issues);
        collectSupervisorLeaveAIssues(model, issues);
        break;
    }
    return issues;
  }


  window.ShiftRosterRules = Object.freeze({
    parseTimeRange,
    isPublicLeaveType,
    getActiveLetters,
    collectIssuesByKind
  });
})();
