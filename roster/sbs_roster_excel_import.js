(() => {
  'use strict';

  const COLOR = {
    pink: 'F586C0',
    gray: 'B7B7B7',
    red: 'B3261E'
  };
  const DEFAULT_BLOCKED_WEEKDAYS = [6];
  const A_ALL_SHIFT_GROUPS = ['early', 'middle', 'night'];

  const storage = window.ShiftRosterStorage;
  const app = window.ShiftRosterApp;
  const importButton = document.getElementById('importExcelButton');
  const importInput = document.getElementById('importExcelInput');

  if (!storage || !app || !importButton || !importInput) return;

  importButton.addEventListener('click', async () => {
    const proceed = await window.SlowlyConfirm.show({
      title: '匯入 Excel',
      message:
        '僅支援本程式輸出的 Excel 檔案。\n' +
        '匯入後只會更新該月份班表，不會修改其他月份或系統設定。\n\n' +
        '是否繼續？',
      confirmText: '繼續',
      cancelText: '取消',
      initialFocus: 'cancel'
    });
    if (!proceed) return;
    importInput.value = '';
    importInput.click();
  });

  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;

    importButton.disabled = true;
    const originalText = importButton.textContent;
    importButton.textContent = '匯入中…';

    try {
      const buffer = await window.SlowlyFileReader.arrayBuffer(file);
      const parsed = parseBook(await loadXlsx(buffer));
      const imported = buildImportedMonth(parsed);
      const monthData = mergeWithExistingMonth(imported);

      storage.saveMonth(monthData);

      const current = app.getCurrentYearMonth?.();
      const toast = window.SlowlyToast.create('#appToast', { duration: 2600 });
      if (current && Number(current.year) === parsed.year && Number(current.month) === parsed.month) {
        app.reloadFromStorage?.();
        toast.show(`${parsed.year} 年 ${parsed.month} 月班表匯入完成。`);
      } else {
        toast.show(
          `${parsed.year} 年 ${parsed.month} 月班表匯入完成。\n` +
          '請切換到該月份查看。'
        );
      }
    } catch (error) {
      console.error(error);
      const message = isFormatError(error)
        ? '這不是本程式輸出的 Excel 班表，無法匯入。'
        : `Excel 匯入失敗。\n${error?.message || '未知錯誤'}`;
      window.alert(message);
    } finally {
      importInput.value = '';
      importButton.disabled = false;
      importButton.textContent = originalText;
    }
  });

  function isFormatError(error) {
    return Boolean(error?.isRosterFormatError);
  }

  function formatError(message) {
    const error = new Error(message);
    error.isRosterFormatError = true;
    return error;
  }

  async function loadXlsx(buffer) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('目前瀏覽器不支援 Excel 解壓縮。請使用新版 Chrome、Edge 或 Safari。');
    }

    const zip = new ZipReader(buffer);
    let sheetXml;
    let workbookXml;
    let stringsXml;
    let stylesXml;

    try {
      [sheetXml, workbookXml, stringsXml, stylesXml] = await Promise.all([
        zip.text('xl/worksheets/sheet1.xml'),
        zip.text('xl/workbook.xml'),
        zip.textOptional('xl/sharedStrings.xml'),
        zip.textOptional('xl/styles.xml')
      ]);
    } catch (error) {
      if (/XLSX|ZIP|xl\//i.test(String(error?.message || ''))) throw formatError(error.message);
      throw error;
    }

    const strings = stringsXml ? parseSharedStrings(parseXml(stringsXml)) : [];
    const sheet = parseSheet(parseXml(sheetXml), strings);
    const styles = stylesXml ? parseStyles(parseXml(stylesXml)) : emptyStyles();
    const workbook = parseXml(workbookXml);
    const sheetElement = firstByLocal(workbook, 'sheet');
    const sheetName = sheetElement?.getAttribute('name') || '';

    return { sheet, sheetName, styles };
  }

  class ZipReader {
    constructor(buffer) {
      this.bytes = new Uint8Array(buffer);
      this.view = new DataView(buffer);
      this.entries = this.readCentralDirectory();
    }

    u16(offset) {
      return this.view.getUint16(offset, true);
    }

    u32(offset) {
      return this.view.getUint32(offset, true);
    }

    readCentralDirectory() {
      const bytes = this.bytes;
      let end = -1;
      for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index -= 1) {
        if (this.u32(index) === 0x06054b50) {
          end = index;
          break;
        }
      }
      if (end < 0) throw formatError('不是有效的 Excel 檔案。');

      const count = this.u16(end + 10);
      const offset = this.u32(end + 16);
      const entries = new Map();
      let cursor = offset;

      for (let index = 0; index < count; index += 1) {
        if (this.u32(cursor) !== 0x02014b50) throw formatError('Excel 檔案結構不正確。');
        const method = this.u16(cursor + 10);
        const compressedSize = this.u32(cursor + 20);
        const uncompressedSize = this.u32(cursor + 24);
        const nameLength = this.u16(cursor + 28);
        const extraLength = this.u16(cursor + 30);
        const commentLength = this.u16(cursor + 32);
        const localOffset = this.u32(cursor + 42);
        const name = new TextDecoder().decode(this.bytes.slice(cursor + 46, cursor + 46 + nameLength));
        entries.set(name, { method, compressedSize, uncompressedSize, localOffset });
        cursor += 46 + nameLength + extraLength + commentLength;
      }
      return entries;
    }

    async raw(name) {
      const entry = this.entries.get(name);
      if (!entry) throw formatError(`Excel 缺少必要資料：${name}`);

      const cursor = entry.localOffset;
      if (this.u32(cursor) !== 0x04034b50) throw formatError('Excel 檔案結構不正確。');
      const nameLength = this.u16(cursor + 26);
      const extraLength = this.u16(cursor + 28);
      const start = cursor + 30 + nameLength + extraLength;
      const part = this.bytes.slice(start, start + entry.compressedSize);

      if (entry.method === 0) return part;
      if (entry.method === 8) {
        const stream = new DecompressionStream('deflate-raw');
        const result = await new Response(new Blob([part]).stream().pipeThrough(stream)).arrayBuffer();
        return new Uint8Array(result);
      }
      throw formatError('Excel 使用了目前不支援的壓縮格式。');
    }

    async text(name) {
      return new TextDecoder('utf-8').decode(await this.raw(name));
    }

    async textOptional(name) {
      if (!this.entries.has(name)) return '';
      return this.text(name);
    }
  }

  function parseXml(text) {
    const documentNode = new DOMParser().parseFromString(text, 'application/xml');
    if (documentNode.getElementsByTagName('parsererror')[0]) throw formatError('Excel 內部資料無法解析。');
    return documentNode;
  }

  function byLocal(root, name) {
    return [...root.getElementsByTagNameNS('*', name)];
  }

  function firstByLocal(root, name) {
    return root.getElementsByTagNameNS('*', name)[0] || null;
  }

  function directChildren(root, name) {
    return [...root.children].filter((child) => child.localName === name);
  }

  function parseSharedStrings(documentNode) {
    return byLocal(documentNode, 'si').map((item) => byLocal(item, 't').map((node) => node.textContent || '').join(''));
  }

  function parseSheet(documentNode, strings) {
    const cells = new Map();
    for (const cell of byLocal(documentNode, 'c')) {
      const ref = cell.getAttribute('r');
      if (!ref) continue;
      const type = cell.getAttribute('t') || '';
      const styleIndex = Number(cell.getAttribute('s') || 0);
      let value = '';

      if (type === 's') {
        const raw = firstByLocal(cell, 'v')?.textContent;
        value = strings[Number(raw)] ?? '';
      } else if (type === 'inlineStr') {
        value = byLocal(cell, 't').map((node) => node.textContent || '').join('');
      } else {
        value = firstByLocal(cell, 'v')?.textContent ?? '';
      }

      cells.set(ref, { value: String(value), styleIndex });
    }

    return {
      get(row, column) {
        return cells.get(cellRef(row, column)) || { value: '', styleIndex: 0 };
      }
    };
  }

  function emptyStyles() {
    return { xfs: [{ fontId: 0, fillId: 0, borderId: 0 }], fonts: [{}], fills: [{}], borders: [{}] };
  }

  function parseStyles(documentNode) {
    const fontsNode = firstByLocal(documentNode, 'fonts');
    const fillsNode = firstByLocal(documentNode, 'fills');
    const bordersNode = firstByLocal(documentNode, 'borders');
    const xfsNode = firstByLocal(documentNode, 'cellXfs');

    const fonts = fontsNode
      ? directChildren(fontsNode, 'font').map((node) => ({ color: normalizeColor(firstByLocal(node, 'color')?.getAttribute('rgb')) }))
      : [];
    const fills = fillsNode
      ? directChildren(fillsNode, 'fill').map((node) => ({ color: normalizeColor(firstByLocal(firstByLocal(node, 'patternFill') || node, 'fgColor')?.getAttribute('rgb')) }))
      : [];
    const borders = bordersNode
      ? directChildren(bordersNode, 'border').map((node) => ({
          diagonalUp: node.getAttribute('diagonalUp') === '1',
          diagonalDown: node.getAttribute('diagonalDown') === '1',
          color: normalizeColor(firstByLocal(firstByLocal(node, 'diagonal') || node, 'color')?.getAttribute('rgb'))
        }))
      : [];
    const xfs = xfsNode
      ? directChildren(xfsNode, 'xf').map((node) => ({
          fontId: Number(node.getAttribute('fontId') || 0),
          fillId: Number(node.getAttribute('fillId') || 0),
          borderId: Number(node.getAttribute('borderId') || 0)
        }))
      : [];

    return { fonts, fills, borders, xfs };
  }

  function styleOf(book, row, column) {
    const cell = book.sheet.get(row, column);
    const xf = book.styles.xfs[cell.styleIndex] || {};
    return {
      font: book.styles.fonts[xf.fontId] || {},
      fill: book.styles.fills[xf.fillId] || {},
      border: book.styles.borders[xf.borderId] || {}
    };
  }

  function normalizeColor(value) {
    const text = String(value || '').replace(/[^0-9A-F]/gi, '').toUpperCase();
    return text.length >= 6 ? text.slice(-6) : '';
  }

  function getDaysInMonth(year, month) {
    if (window.Calendar?.isSupportedYear(Number(year))) {
      return window.Calendar.getDaysInMonth(Number(year), Number(month));
    }
    return new Date(Number(year), Number(month), 0).getDate();
  }

  function getWeekday(year, month, day) {
    if (window.Calendar?.isSupportedYear(Number(year))) {
      return window.Calendar.createDay(Number(year), Number(month), Number(day)).weekday;
    }
    return new Date(Number(year), Number(month) - 1, Number(day)).getDay();
  }

  function parseBook(book) {
    const sheetNameMatch = book.sheetName.match(/(\d{4})-(0[1-9]|1[0-2])\s*班表/);
    const title = book.sheet.get(1, 1).value;
    const titleMatch = title.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/);
    if (!sheetNameMatch && !titleMatch) throw formatError('找不到本程式班表月份。');

    const match = sheetNameMatch || titleMatch;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const days = getDaysInMonth(year, month);

    if (Number(book.sheet.get(2, 5).value) !== 1 || Number(book.sheet.get(2, 4 + days).value) !== days) {
      throw formatError('日期列與本程式 Excel 格式不一致。');
    }

    if (String(book.sheet.get(2, 1).value).trim() !== '日期' || String(book.sheet.get(3, 1).value).trim() !== '星期') {
      throw formatError('表頭與本程式 Excel 格式不一致。');
    }

    const expectedGroups = ['早', '中', '中', '夜', '夜'];
    for (let index = 0; index < 5; index += 1) {
      if (book.sheet.get(4 + index, 4).value !== expectedGroups[index]) {
        throw formatError('班別列與本程式 Excel 格式不一致。');
      }
    }

    const vacationLabel = String(book.sheet.get(9, 1).value || '').replace(/\s+/g, '');
    if (vacationLabel !== '休假') throw formatError('休假列與本程式 Excel 格式不一致。');

    for (let index = 0; index < 6; index += 1) {
      const expected = `${String.fromCharCode(65 + index)}.`;
      if (String(book.sheet.get(11 + index, 1).value).trim() !== expected) {
        throw formatError('人員列與本程式 Excel 格式不一致。');
      }
    }

    return {
      book,
      year,
      month,
      days,
      monthId: `${year}-${String(month).padStart(2, '0')}`
    };
  }

  function buildImportedMonth(context) {
    const { book, year, month, days, monthId } = context;
    const peopleNames = {};

    for (let index = 0; index < 6; index += 1) {
      const letter = String.fromCharCode(65 + index);
      const displayName = trimDisplayName(book.sheet.get(11 + index, 2).value);
      if (displayName) peopleNames[letter] = displayName;
    }

    const specialLeaveValues = Array.from({ length: 6 }, (_, index) => {
      const value = String(book.sheet.get(11 + index, 3).value || '').trim();
      return /^\d{1,2}$/.test(value) ? value : '';
    });

    const rosterValues = {};
    for (let shift = 0; shift < 5; shift += 1) {
      for (let day = 1; day <= days; day += 1) {
        const letter = normalizeLetter(book.sheet.get(4 + shift, 4 + day).value);
        if (letter) rosterValues[`${day}-shift-${shift}`] = letter;
      }
    }

    for (let day = 1; day <= days; day += 1) {
      const values = extractLetters(book.sheet.get(10, 4 + day).value);
      values.slice(0, 2).forEach((letter, index) => {
        rosterValues[`${day}-vacation-${index}`] = letter;
      });
    }

    const specialShiftCells = [];
    const nightShiftOverrides = {};
    for (let shift = 0; shift < 5; shift += 1) {
      for (let day = 1; day <= days; day += 1) {
        const style = styleOf(book, 4 + shift, 4 + day);
        const pink = style.fill.color === COLOR.pink;
        const gray = style.fill.color === COLOR.gray;
        const shiftKey = `${day}-shift-${shift}`;
        if (pink) specialShiftCells.push(shiftKey);

        const defaultGray = shift === 3 && getWeekday(year, month, day) === 6;
        if (!pink && gray !== defaultGray) nightShiftOverrides[`${day}-night-${shift}`] = gray;
      }
    }

    const notes = recoverNotes(book, days, rosterValues, specialShiftCells);
    const blockedDays = [];
    const supervisorLeaveDays = [];

    for (let day = 1; day <= days; day += 1) {
      const border = styleOf(book, 10, 4 + day).border;
      const hasDiagonal = Boolean(border.diagonalUp || border.diagonalDown);
      if (!hasDiagonal) continue;
      blockedDays.push(day);
      if (border.color === COLOR.red) supervisorLeaveDays.push(day);
    }

    return {
      ...context,
      peopleNames,
      specialLeaveValues,
      rosterValues,
      specialShiftCells,
      nightShiftOverrides,
      leaveTypeValues: notes.leaveTypeValues,
      leaveNoteValues: notes.leaveNoteValues,
      specialShiftTimes: notes.specialShiftTimes,
      nightShiftTimes: notes.nightShiftTimes,
      blockedDays,
      supervisorLeaveDays
    };
  }

  function mergeWithExistingMonth(imported) {
    const { year, month, days, monthId } = imported;
    const existing = storage.getMonth(year, month) || emptyMonth(monthId);
    const people = resolvePeople(imported, existing);

    const blockedVacationOverrides = buildBlockedVacationOverrides(imported);
    const leaveMetadata = mergeLeaveMetadata(imported, existing);

    return {
      month: monthId,
      people,
      specialLeaveValues: [...imported.specialLeaveValues],
      rosterValues: { ...imported.rosterValues },
      blockedVacationOverrides,
      specialShiftCells: [...imported.specialShiftCells],
      nightShiftOverrides: { ...imported.nightShiftOverrides },
      leaveTypeValues: leaveMetadata.leaveTypeValues,
      leaveNoteValues: leaveMetadata.leaveNoteValues,

      // 這幾項在 Excel 裡沒有足夠標記可安全反推；保留該月份原資料，避免匯入班表時誤刪。
      manualNotes: clonePlain(existing.manualNotes),
      extraLeaves: clonePlain(existing.extraLeaves),
      annualGrantDecisions: clonePlain(existing.annualGrantDecisions),
      annualBalanceCalibrations: clonePlain(existing.annualBalanceCalibrations),
      meetingDays: Array.isArray(existing.meetingDays) ? existing.meetingDays.filter((day) => Number.isInteger(day) && day >= 1 && day <= days) : [],
      meetingNoteValues: clonePlain(existing.meetingNoteValues),

      specialShiftTimes: { ...imported.specialShiftTimes },
      nightShiftTimes: { ...imported.nightShiftTimes },
      supervisorLeaveDays: [...imported.supervisorLeaveDays].sort((a, b) => a - b)
    };
  }

  function resolvePeople(imported, existing) {
    const result = {};
    const employees = storage.getEmployees();

    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const displayName = imported.peopleNames[letter];
      if (!displayName) continue;

      const normalizedName = normalizeName(displayName);
      const existingPerson = existing.people?.[letter];
      let employeeId = '';

      if (
        existingPerson?.employeeId &&
        normalizeName(existingPerson.displayName) === normalizedName &&
        employees[existingPerson.employeeId]?.role !== 'supervisor'
      ) {
        employeeId = existingPerson.employeeId;
      }

      if (!employeeId) {
        employeeId = Object.keys(employees).find((id) => {
          const employee = employees[id];
          return employee?.role !== 'supervisor' && normalizeName(employee?.name) === normalizedName;
        }) || '';
      }

      if (!employeeId) employeeId = storage.resolveEmployee(displayName, '');

      let shiftGroups;
      if (letter === 'A') {
        shiftGroups = [...A_ALL_SHIFT_GROUPS];
      } else if (
        existingPerson &&
        normalizeName(existingPerson.displayName) === normalizedName &&
        Array.isArray(existingPerson.shiftGroups) &&
        existingPerson.shiftGroups.length
      ) {
        shiftGroups = existingPerson.shiftGroups.filter((group) => window.ValueCycle.contains(A_ALL_SHIFT_GROUPS, group)).slice(0, 1);
      } else {
        shiftGroups = inferShiftGroups(letter, imported.rosterValues);
      }

      result[letter] = { employeeId, displayName, shiftGroups };
    }

    return result;
  }

  function inferShiftGroups(letter, rosterValues) {
    const counts = { early: 0, middle: 0, night: 0 };
    for (const [key, value] of Object.entries(rosterValues)) {
      if (value !== letter || !/-shift-/.test(key)) continue;
      const match = key.match(/-shift-(\d)$/);
      if (!match) continue;
      const shift = Number(match[1]);
      if (shift === 0) counts.early += 1;
      else if (shift === 1 || shift === 2) counts.middle += 1;
      else counts.night += 1;
    }
    const used = Object.entries(counts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
    return used.length ? [used[0][0]] : [];
  }

  function buildBlockedVacationOverrides(imported) {
    const settings = storage.getSettings({ blockedWeekdays: DEFAULT_BLOCKED_WEEKDAYS });
    const blockedWeekdays = window.TreeSelection.create({
      selected: (Array.isArray(settings.blockedWeekdays) ? settings.blockedWeekdays : DEFAULT_BLOCKED_WEEKDAYS)
        .map(Number)
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    });
    const specialDays = storage.getSpecialDays(imported.year);
    const holidays = window.TreeSelection.create({
      selected: Array.isArray(specialDays.holidays) ? specialDays.holidays : []
    });
    const workdays = window.TreeSelection.create({
      selected: Array.isArray(specialDays.workdays) ? specialDays.workdays : []
    });
    const blockedFromExcel = window.TreeSelection.create({ selected: imported.blockedDays });
    const supervisorDays = window.TreeSelection.create({ selected: imported.supervisorLeaveDays });
    const overrides = {};

    for (let day = 1; day <= imported.days; day += 1) {
      if (supervisorDays.has(day)) continue;
      const dateKey = `${imported.year}-${String(imported.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let defaultBlocked;
      if (holidays.has(dateKey)) defaultBlocked = true;
      else if (workdays.has(dateKey)) defaultBlocked = false;
      else defaultBlocked = blockedWeekdays.has(getWeekday(imported.year, imported.month, day));

      const excelBlocked = blockedFromExcel.has(day);
      if (excelBlocked !== defaultBlocked) overrides[String(day)] = excelBlocked;
    }

    return overrides;
  }

  function mergeLeaveMetadata(imported, existing) {
    const leaveTypeValues = {};
    const leaveNoteValues = {};
    const preserveTypes = ['exceptionPublic', 'personal', 'bereavement', 'other'];

    for (let day = 1; day <= imported.days; day += 1) {
      for (let slot = 0; slot < 2; slot += 1) {
        const key = `${day}-vacation-${slot}`;
        const letter = imported.rosterValues[key];
        if (!letter) continue;

        if (imported.leaveTypeValues[key]) {
          leaveTypeValues[key] = imported.leaveTypeValues[key];
          if (imported.leaveNoteValues[key]) leaveNoteValues[key] = imported.leaveNoteValues[key];
          continue;
        }

        const sameLetter = String(existing.rosterValues?.[key] || '') === letter;
        const existingType = String(existing.leaveTypeValues?.[key] || '');
        if (sameLetter && window.ValueCycle.contains(preserveTypes, existingType)) {
          leaveTypeValues[key] = existingType;
          const note = existing.leaveNoteValues?.[key];
          if (typeof note === 'string' && note) leaveNoteValues[key] = note;
        }
      }
    }

    return { leaveTypeValues, leaveNoteValues };
  }

  function recoverNotes(book, days, rosterValues, specialShiftCells) {
    const leaveTypeValues = {};
    const leaveNoteValues = {};
    const specialShiftTimes = {};
    const nightShiftTimes = {};
    const specialShiftCellSelection = window.TreeSelection.create({
      selected: Array.isArray(specialShiftCells) ? specialShiftCells : []
    });

    for (let day = 1; day <= days; day += 1) {
      const tokens = splitTokens(book.sheet.get(11, 4 + day).value);
      const vacationLetters = [0, 1].map((slot) => rosterValues[`${day}-vacation-${slot}`]).filter(Boolean);

      for (let slot = 0; slot < 2; slot += 1) {
        const key = `${day}-vacation-${slot}`;
        const letter = rosterValues[key];
        if (!letter) continue;

        if (hasSequence(tokens, [letter, '特', '休'])) {
          leaveTypeValues[key] = 'annual';
          continue;
        }

        const note = findLeaveNote(tokens, letter);
        if (note) {
          leaveTypeValues[key] = 'leave';
          leaveNoteValues[key] = note;
          continue;
        }

        const style = styleOf(book, 10, 4 + day);
        if (style.font.color === COLOR.red && vacationLetters.length === 1) {
          leaveTypeValues[key] = 'leave';
          leaveNoteValues[key] = '請假';
        }
      }

      for (const timeNote of findTimeNotes(tokens)) {
        const candidates = [];
        for (let shift = 0; shift < 5; shift += 1) {
          if (rosterValues[`${day}-shift-${shift}`] === timeNote.letter) candidates.push(shift);
        }
        const pink = candidates.filter((shift) => specialShiftCellSelection.has(`${day}-shift-${shift}`));
        const gray = candidates.filter((shift) => styleOf(book, 4 + shift, 4 + day).fill.color === COLOR.gray);
        if (pink.length === 1) specialShiftTimes[`${day}-shift-${pink[0]}`] = timeNote.range;
        else if (gray.length === 1) nightShiftTimes[`${day}-night-${gray[0]}`] = timeNote.range;
      }
    }

    return { leaveTypeValues, leaveNoteValues, specialShiftTimes, nightShiftTimes };
  }

  function emptyMonth(monthId) {
    return {
      month: monthId,
      people: {},
      specialLeaveValues: ['', '', '', '', '', ''],
      rosterValues: {},
      blockedVacationOverrides: {},
      specialShiftCells: [],
      nightShiftOverrides: {},
      leaveTypeValues: {},
      leaveNoteValues: {},
      manualNotes: {},
      extraLeaves: {},
      annualGrantDecisions: {},
      annualBalanceCalibrations: {},
      specialShiftTimes: {},
      nightShiftTimes: {},
      meetingDays: [],
      meetingNoteValues: {},
      supervisorLeaveDays: []
    };
  }

  function clonePlain(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return JSON.parse(JSON.stringify(value));
  }

  function trimDisplayName(value) {
    return Array.from(String(value || '').trim()).slice(0, 3).join('');
  }

  function normalizeName(value) {
    return String(value || '').normalize('NFC').replace(/\s+/gu, '');
  }

  function cellRef(row, column) {
    let label = '';
    for (let value = column; value > 0; value = Math.floor((value - 1) / 26)) {
      label = String.fromCharCode(65 + ((value - 1) % 26)) + label;
    }
    return `${label}${row}`;
  }

  function normalizeLetter(value) {
    const match = String(value || '').trim().toUpperCase().match(/^[A-F]$/);
    return match ? match[0] : '';
  }

  function extractLetters(value) {
    return String(value || '').toUpperCase().match(/[A-F]/g) || [];
  }

  function splitTokens(value) {
    return String(value || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function hasSequence(tokens, sequence) {
    for (let index = 0; index <= tokens.length - sequence.length; index += 1) {
      if (sequence.every((value, offset) => tokens[index + offset] === value)) return true;
    }
    return false;
  }

  function isTime(value) {
    return /^\d{1,2}(?::\d{2})?$/.test(String(value || ''));
  }

  function findTimeNotes(tokens) {
    const result = [];
    for (let index = 0; index <= tokens.length - 4; index += 1) {
      if (/^[A-F]$/.test(tokens[index]) && isTime(tokens[index + 1]) && tokens[index + 2] === '│' && isTime(tokens[index + 3])) {
        result.push({ letter: tokens[index], range: `${tokens[index + 1]}~${tokens[index + 3]}` });
        index += 3;
      }
    }
    return result;
  }

  function findLeaveNote(tokens, letter) {
    for (let index = 0; index < tokens.length; index += 1) {
      if (tokens[index] !== letter) continue;
      if (tokens[index + 1] === '特' && tokens[index + 2] === '休') continue;
      if (tokens[index + 1] === '公' && tokens[index + 2] === '休') continue;
      if (isTime(tokens[index + 1]) && tokens[index + 2] === '│' && isTime(tokens[index + 3])) continue;

      const chars = [];
      for (let cursor = index + 1; cursor < tokens.length && chars.length < 4; cursor += 1) {
        const token = tokens[cursor];
        if (/^[A-F]$/.test(token) || token === '│' || /^\d{1,2}$/.test(token) || isTime(token)) break;
        chars.push(token);
      }
      const note = chars.join('').slice(0, 4);
      if (note) return note;
    }
    return '';
  }
})();
