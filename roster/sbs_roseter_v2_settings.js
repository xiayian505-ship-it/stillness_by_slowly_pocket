/* sbs_roseter_v2_settings.js
 * 設定頁 UI：基本規則、班別設定、主管設定。
 * 由 sbs_roseter_v2.js 原函式原樣拆出；不改既有行為。
 */

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
