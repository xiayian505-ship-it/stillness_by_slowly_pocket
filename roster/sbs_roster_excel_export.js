(() => {
  'use strict';

  const WEEKDAYS = ['日','一','二','三','四','五','六'];
  const DEFAULT_SHIFTS = ['07~15','15~23','16~24','23~07','00~08'];
  const SHIFT_GROUPS = ['早','中','中','夜','夜'];
  const PINK = 'FFF586C0';
  const GRAY = 'FFB7B7B7';
  const WHITE = 'FFFFFFFF';
  const BLACK = 'FF1B1B1B';
  const RED = 'FFB3261E';

  const storage = window.ShiftRosterStorage;
  const exportButton = document.getElementById('exportExcelButton');
  if (!storage || !exportButton) return;

  let payload = null;

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function makeTimestamp(date = new Date()) {
    const stamp = window.Timestamp.create(date);
    return stamp ? `${stamp.slice(0, 8)}_${stamp.slice(8, 12)}` : '';
  }

  function makeExcelFileName() {
    return `EliteHotel_${makeTimestamp()}_班表.xlsx`;
  }

  function getCurrentMonthId() {
    const current = window.ShiftRosterApp?.getCurrentYearMonth?.();
    if (!current) throw new Error('無法取得目前班表月份。');
    return `${Number(current.year)}-${pad2(Number(current.month))}`;
  }

  function getDaysInMonth(year, month) {
    const targetYear = Number(year);
    const targetMonth = Number(month);
    if (window.Calendar?.isSupportedYear?.(targetYear) && Number.isInteger(targetMonth) && targetMonth >= 1 && targetMonth <= 12) {
      return window.Calendar.getDaysInMonth(targetYear, targetMonth);
    }
    return new Date(targetYear, targetMonth, 0).getDate();
  }

  function getWeekdayIndex(year, month, day) {
    const targetYear = Number(year);
    const targetMonth = Number(month);
    const targetDay = Number(day);
    if (
      window.Calendar?.isSupportedYear?.(targetYear) &&
      Number.isInteger(targetMonth) && targetMonth >= 1 && targetMonth <= 12 &&
      Number.isInteger(targetDay) && targetDay >= 1 && targetDay <= getDaysInMonth(targetYear, targetMonth)
    ) {
      return window.Calendar.createDay(targetYear, targetMonth, targetDay).weekday;
    }
    return new Date(targetYear, targetMonth - 1, targetDay).getDay();
  }

  async function exportCurrentMonth() {
    if (!window.ExcelJS) {
      window.alert('Excel 匯出元件尚未載入。請確認網路連線後重新整理頁面。');
      return;
    }

    exportButton.disabled = true;
    const originalText = exportButton.textContent;
    exportButton.textContent = '匯出中…';

    try {
      if (typeof window.ShiftRosterApp?.saveCurrentMonth === 'function') {
        window.ShiftRosterApp.saveCurrentMonth();
      }

      // 與「下載 JSON」共用同一份資料來源，但只留在記憶體，不建立 JSON 檔案。
      payload = storage.exportPayload();
      const monthId = getCurrentMonthId();
      const monthData = payload?.months?.[monthId];
      if (!monthData) throw new Error(`找不到 ${monthId} 的班表資料。`);

      // 主管當月休假以目前畫面正在使用的狀態為準，避免匯出時讀到舊的月份快照。
      const liveSupervisorLeaveDays = window.ShiftRosterApp?.getSupervisorLeaveDays?.();
      if (Array.isArray(liveSupervisorLeaveDays)) {
        monthData.supervisorLeaveDays = [...liveSupervisorLeaveDays];
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Stillness by Slowly';
      workbook.created = new Date();
      buildMonthSheet(workbook, monthId, monthData);

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),
        makeExcelFileName()
      );
    } catch (error) {
      console.error(error);
      window.alert(`Excel 匯出失敗。\n${error?.message || '未知錯誤'}`);
    } finally {
      payload = null;
      exportButton.disabled = false;
      exportButton.textContent = originalText;
    }
  }

  function buildMonthSheet(workbook, monthId, data) {
    const [year, month] = monthId.split('-').map(Number);
    const days = getDaysInMonth(year, month);
    const settings = payload.settings || {};
    const shiftRanges = Array.isArray(settings.shiftRanges) && settings.shiftRanges.length === 5 ? settings.shiftRanges : DEFAULT_SHIFTS;
    const blockedWeekdays = window.TreeSelection.create({
      selected: (settings.blockedWeekdays || [6]).map(Number)
    });
    const specialShiftCells = window.TreeSelection.create({
      selected: Array.isArray(data.specialShiftCells) ? data.specialShiftCells : []
    });
    const publicLeaveTarget = Number(settings.publicLeaveCount || 8);

    const ws = workbook.addWorksheet(`${monthId} 班表`, {
      views:[{showGridLines:false, state:'normal'}],
      pageSetup:{paperSize:9, orientation:'landscape', fitToPage:true, fitToWidth:1, fitToHeight:1, horizontalCentered:true, verticalCentered:false},
      pageMargins:{left:0.2,right:0.2,top:0.25,bottom:0.25,header:0.1,footer:0.1}
    });

    // 正式 HTML：左主欄 128px、班別代號 31px、右側說明 38px。
    // Excel 內把 128px 再拆成「代號 / 姓名 / 特休」三欄，排班區再合併回同一主欄。
    ws.getColumn(1).width = 4.1;   // A 27px
    ws.getColumn(2).width = 10.2;  // B 約71px
    ws.getColumn(3).width = 4.5;   // C 30px
    ws.getColumn(4).width = 4.4;   // D 31px
    for (let c = 5; c < 5 + days; c += 1) ws.getColumn(c).width = 4.05;
    const noteCol = 5 + days;
    ws.getColumn(noteCol).width = 5.4;

    const thin = {style:'thin', color:{argb:BLACK}};
    const medium = {style:'medium', color:{argb:BLACK}};
    const baseBorder = {top:thin,left:thin,bottom:thin,right:thin};
    const serif = 'PMingLiU';
    const sans = 'Arial';

    // Title
    ws.getRow(1).height = 28.5;
    ws.mergeCells(1,1,1,7);
    ws.getCell(1,1).value = `${year} 年 ${month} 月`;
    ws.getCell(1,1).font = {name:serif,size:14};
    ws.getCell(1,1).alignment = {vertical:'bottom',horizontal:'left'};
    const titleStart = 8;
    const titleEnd = Math.max(titleStart, noteCol - 4);
    ws.mergeCells(1,titleStart,1,titleEnd);
    const title = ws.getCell(1,titleStart);
    title.value = '櫃檯人員排班紀錄表';
    title.font = {name:serif,size:18,bold:true};
    title.alignment = {vertical:'bottom',horizontal:'center'};

    let r = 2;
    const tableStart = r;

    // 日期列
    ws.getRow(r).height = 17.25;
    mergeSet(ws,r,1,r,4,'日期',{font:{name:serif,size:10},alignment:{horizontal:'center',vertical:'middle'},border:baseBorder});
    for (let day=1; day<=days; day+=1) {
      const cell = ws.getCell(r,4+day);
      cell.value = day;
      cell.font = {name:sans,size:9};
      if (getAnnualSpecialDayType(year,month,day) === 'holiday') cell.font = {name:sans,size:9,bold:true,color:{argb:RED}};
      cell.alignment = {horizontal:'center',vertical:'middle'};
      cell.fill = solidFill(getDateBandDark(year,month,day) ? GRAY : WHITE);
      cell.border = baseBorder;
    }
    r += 1;

    // 星期列
    ws.getRow(r).height = 17.25;
    mergeSet(ws,r,1,r,4,'星期',{font:{name:serif,size:10},alignment:{horizontal:'center',vertical:'middle'},border:baseBorder});
    for (let day=1; day<=days; day+=1) {
      const d = getWeekdayIndex(year, month, day);
      const cell = ws.getCell(r,4+day);
      cell.value = WEEKDAYS[d];
      const specialType = getAnnualSpecialDayType(year,month,day);
      cell.font = specialType === 'holiday'
        ? {name:serif,size:9,bold:true,color:{argb:RED}}
        : {name:serif,size:9};
      cell.alignment = {horizontal:'center',vertical:'middle'};
      if ((d === 0 || d === 6) && specialType !== 'workday') cell.fill = solidFill(PINK);
      cell.border = baseBorder;
    }
    r += 1;

    // 五班
    for (let shift=0; shift<5; shift+=1) {
      ws.getRow(r).height = 36;
      mergeSet(ws,r,1,r,3,formatShift(shiftRanges[shift]),{
        font:{name:serif,size:14},alignment:{horizontal:'center',vertical:'middle'},border:baseBorder
      });
      const group = ws.getCell(r,4);
      group.value = SHIFT_GROUPS[shift];
      group.font = {name:serif,size:11};
      group.alignment = {horizontal:'center',vertical:'middle'};
      group.border = baseBorder;

      for (let day=1; day<=days; day+=1) {
        const key = `${day}-shift-${shift}`;
        const cell = ws.getCell(r,4+day);
        cell.value = String(data.rosterValues?.[key] || '');
        cell.font = {name:sans,size:14};
        cell.alignment = {horizontal:'center',vertical:'middle'};
        if (isNightGray(data,year,month,day,shift)) cell.fill = solidFill(GRAY);
        if (specialShiftCells.has(key)) cell.fill = solidFill(PINK);
        cell.border = baseBorder;
      }
      r += 1;
    }

    // 休假：20px 迷你星期 + 46px 兩格（HTML 中間線本來就是透明，所以合在一格用換行最接近）
    const vacWeekRow = r;
    const vacBodyRow = r + 1;
    ws.getRow(vacWeekRow).height = 15;
    ws.getRow(vacBodyRow).height = 34.5;
    ws.mergeCells(vacWeekRow,1,vacBodyRow,4);
    const vacLabel = ws.getCell(vacWeekRow,1);
    vacLabel.value = '休　假';
    vacLabel.font = {name:serif,size:17};
    vacLabel.alignment = {horizontal:'center',vertical:'middle'};
    vacLabel.border = baseBorder;

    for (let day=1; day<=days; day+=1) {
      const dow = getWeekdayIndex(year, month, day);
      const top = ws.getCell(vacWeekRow,4+day);
      top.value = WEEKDAYS[dow];
      const specialType = getAnnualSpecialDayType(year,month,day);
      top.font = specialType === 'holiday'
        ? {name:serif,size:9,bold:true,color:{argb:RED}}
        : {name:serif,size:9};
      top.alignment = {horizontal:'center',vertical:'middle'};
      top.border = baseBorder;
      if ((dow === 0 || dow === 6) && specialType !== 'workday') top.fill = solidFill(PINK);

      const v0 = String(data.rosterValues?.[`${day}-vacation-0`] || '');
      const v1 = String(data.rosterValues?.[`${day}-vacation-1`] || '');
      const body = ws.getCell(vacBodyRow,4+day);
      body.value = [v0,v1].join('\n').replace(/^\n|\n$/g,'');
      body.font = {name:sans,size:12};
      body.alignment = {horizontal:'center',vertical:'middle',wrapText:true};
      body.border = baseBorder;
      if (isBlocked(data,blockedWeekdays,year,month,day)) {
        const supervisorLeave = isSupervisorLeave(data,day);
        body.border = {
          ...baseBorder,
          diagonal:{
            up:true,
            down:false,
            style:'thin',
            color:{argb:supervisorLeave ? RED : BLACK}
          }
        };
      }
      // 請假紅字：若兩格其中一格是請假，Excel 單一 cell 無法分行套兩種字色，因此整格改紅。
      const t0 = data.leaveTypeValues?.[`${day}-vacation-0`] || 'public';
      const t1 = data.leaveTypeValues?.[`${day}-vacation-1`] || 'public';
      if (t0 === 'leave' || t1 === 'leave') body.font = {name:sans,size:12,color:{argb:RED}};
    }
    r += 2;

    // 下方姓名 / 長條備註區：六列共 267px。
    const lowerStart = r;
    const rowHeight = 33.375;
    const people = normalizePeople(data);
    const specialLeave = Array.from({length:6}, (_,i) => String(data.specialLeaveValues?.[i] ?? ''));
    for (let i=0;i<6;i+=1) {
      ws.getRow(r+i).height = rowHeight;
      const letter = String.fromCharCode(65+i);
      const rowTop = i === 0 ? {top:thin} : {};

      const lc = ws.getCell(r+i,1);
      lc.value = `${letter}.`;
      lc.font = {name:sans,size:12};
      lc.alignment = {horizontal:'center',vertical:'middle'};
      lc.border = {...rowTop,left:thin,bottom:thin};

      const nc = ws.getCell(r+i,2);
      nc.value = people[letter]?.displayName || '';
      nc.font = {name:serif,size:12};
      nc.alignment = {horizontal:'left',vertical:'middle'};
      nc.border = {...rowTop,bottom:thin};

      const ac = ws.getCell(r+i,3);
      ac.value = specialLeave[i];
      ac.font = {name:sans,size:11};
      ac.alignment = {horizontal:'center',vertical:'middle'};
      ac.border = {...rowTop,left:thin,right:thin,bottom:thin};
    }
    ws.mergeCells(lowerStart,4,lowerStart+5,4);
    ws.getCell(lowerStart,4).border = baseBorder;
    for (let day=1; day<=days; day+=1) {
      ws.mergeCells(lowerStart,4+day,lowerStart+5,4+day);
      const cell = ws.getCell(lowerStart,4+day);
      const notes = buildNotes(data,day,people);
      cell.value = notes.join('\n');
      cell.font = {name:serif,size:8};
      cell.alignment = {horizontal:'center',vertical:'top',wrapText:true};
      cell.border = baseBorder;
    }
    r += 6;

    // 下方日期列
    ws.getRow(r).height = 16.5;
    mergeSet(ws,r,1,r,4,'',{border:baseBorder});
    for (let day=1; day<=days; day+=1) {
      const dow = getWeekdayIndex(year, month, day);
      const cell = ws.getCell(r,4+day);
      cell.value = day;
      cell.font = {name:sans,size:9};
      cell.alignment = {horizontal:'center',vertical:'middle'};
      cell.border = baseBorder;
      if (dow === 0 || dow === 6) cell.fill = solidFill(PINK);
    }
    r += 1;

    // 休假統計：正式版每列三人，共兩列。
    const summaryStart = r;
    const totalMainCols = 4 + days;
    const groups = splitThreeRanges(1,totalMainCols);
    for (let sr=0; sr<2; sr+=1) {
      ws.getRow(r+sr).height = 21.75;
      for (let gi=0; gi<3; gi+=1) {
        const i = sr*3 + gi;
        const letter = String.fromCharCode(65+i);
        const range = groups[gi];
        ws.mergeCells(r+sr,range[0],r+sr,range[1]);
        const cell = ws.getCell(r+sr,range[0]);
        const name = people[letter]?.displayName || `${letter}.`;
        const summary = getLeaveSummary(data,letter,days);
        cell.value = `${name}　公休：${summary.publicCount}　特休：${summary.annualCount}`;
        cell.font = {name:serif,size:10};
        cell.alignment = {horizontal:'left',vertical:'middle'};
        cell.border = baseBorder;
      }
    }
    r += 2;

    // 右側直排說明：從表格頂端到統計底部。
    ws.mergeCells(tableStart,noteCol,r-1,noteCol);
    const side = ws.getCell(tableStart,noteCol);
    side.value = `請每人先各排 ${publicLeaveTarget} 天月假，等大家全部都排完再排特休。`;
    side.font = {name:serif,size:11};
    side.alignment = {horizontal:'center',vertical:'middle',textRotation:'vertical',wrapText:true};
    side.border = {top:medium,left:medium,bottom:medium,right:medium};

    // 外框稍粗，接近 HTML 2px；內格保留 1px。
    applyOuterBorder(ws, tableStart, 1, summaryStart+1, totalMainCols, medium);

    ws.pageSetup.printArea = `A1:${colName(noteCol)}${r-1}`;
    ws.headerFooter.oddFooter = '&C&8';

    // 年資資訊：只加在同一張工作表的正式列印範圍下方，不改動原班表版型與 A4 列印範圍。
    appendSeniorityInfo(ws, payload, people, r + 1, totalMainCols, serif, sans);
  }

  function normalizePeople(data) {
    const result = {};
    for (const letter of ['A','B','C','D','E','F']) {
      const p = data.people?.[letter] || {};
      result[letter] = {displayName:String(p.displayName || ''),employeeId:String(p.employeeId || '')};
    }
    return result;
  }

  function appendSeniorityInfo(ws, sourcePayload, people, startRow, totalMainCols, serif, sans) {
    const today = getCurrentCalendarDate();
    const dateLabel = `${today.year}.${String(today.month).padStart(2,'0')}.${String(today.day).padStart(2,'0')}`;
    const rows = [];

    for (const letter of ['A','B','C','D','E','F']) {
      const person = people?.[letter] || {};
      const employeeId = String(person.employeeId || '');
      const record = employeeId ? sourcePayload?.employees?.[employeeId] : null;
      const line = formatSeniorityLine(sourcePayload, person.displayName, record, false);
      if (line) rows.push(line);
    }

    const supervisor = sourcePayload?.employees?.emp_supervisor;
    const supervisorLine = supervisor?.role === 'supervisor'
      ? formatSeniorityLine(sourcePayload, supervisor.name, supervisor, true)
      : '';

    if (!rows.length && !supervisorLine) return;

    let r = startRow;
    ws.mergeCells(r,1,r,totalMainCols);
    const title = ws.getCell(r,1);
    title.value = `年資資訊（截至 ${dateLabel}）`;
    title.font = {name:serif,size:11,bold:true};
    title.alignment = {horizontal:'left',vertical:'middle'};
    ws.getRow(r).height = 20;
    r += 1;

    for (const line of rows) {
      ws.mergeCells(r,1,r,totalMainCols);
      const cell = ws.getCell(r,1);
      cell.value = line;
      cell.font = {name:sans,size:10};
      cell.alignment = {horizontal:'left',vertical:'middle'};
      ws.getRow(r).height = 18;
      r += 1;
    }

    if (supervisorLine) {
      ws.mergeCells(r,1,r,totalMainCols);
      const cell = ws.getCell(r,1);
      cell.value = supervisorLine;
      cell.font = {name:sans,size:10};
      cell.alignment = {horizontal:'left',vertical:'middle'};
      ws.getRow(r).height = 18;
    }
  }

  function parseHireDateValue(value) {
    const text = String(value || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    const date = window.DateTime.parseDateKey(text);
    if (!date) return null;
    return {
      year:date.getFullYear(),
      month:date.getMonth()+1,
      day:date.getDate(),
      date
    };
  }

  function getCurrentCalendarDate() {
    const date = window.DateTime.parseDateKey(window.DateTime.dateKey(new Date()));
    return {
      year:date.getFullYear(),
      month:date.getMonth()+1,
      day:date.getDate(),
      date
    };
  }

  function addMonthsClamped(date,months) {
    const target = window.CalendarMonthSequence.shift(
      date.getFullYear(),
      date.getMonth() + 1,
      months
    );
    const day = date.getDate();
    const lastDay = getDaysInMonth(target.year, target.month);
    return new Date(target.year, target.month - 1, Math.min(day,lastDay));
  }

  function addYearsClamped(date,years) {
    return addMonthsClamped(date, Number(years) * 12);
  }

  function getAnnualRules(sourcePayload) {
    const defaults = {sixMonths:3,year1:7,year2:10,years3to4:14,years5to9:15,year10Base:16,after10Increment:1,maxDays:30};
    const saved = sourcePayload?.settings?.annualLeaveRules;
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? {...defaults,...saved} : defaults;
  }

  function getAnnualGrantDaysForYears(sourcePayload,years) {
    const rules = getAnnualRules(sourcePayload);
    if (years === 1) return Number(rules.year1 || 0);
    if (years === 2) return Number(rules.year2 || 0);
    if (years >= 3 && years < 5) return Number(rules.years3to4 || 0);
    if (years >= 5 && years < 10) return Number(rules.years5to9 || 0);
    if (years >= 10) return Math.min(Number(rules.maxDays || 0), Number(rules.year10Base || 0) + (years - 10) * Number(rules.after10Increment || 0));
    return 0;
  }

  function getAnnualLeaveEntitlementForDate(sourcePayload,record,referenceDate,supervisor = false) {
    const parsed = parseHireDateValue(record?.hireDate);
    if (!parsed || !(referenceDate instanceof Date) || Number.isNaN(referenceDate.getTime()) || referenceDate < parsed.date) return 0;
    const rules = getAnnualRules(sourcePayload);
    let days = 0;
    const sixMonth = addMonthsClamped(parsed.date,6);
    if (referenceDate >= sixMonth) days = Number(rules.sixMonths || 0);
    for (let years=1; years<=80; years+=1) {
      const anniversary = addYearsClamped(parsed.date,years);
      if (anniversary > referenceDate) break;
      days = getAnnualGrantDaysForYears(sourcePayload,years);
    }
    return supervisor ? Math.ceil(Number(days || 0) / 2) : Number(days || 0);
  }

  function getCalendarSeniority(startDate,endDate) {
    if (!(startDate instanceof Date) || !(endDate instanceof Date) || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return null;
    let years = endDate.getFullYear() - startDate.getFullYear();
    let yearAnchor = addYearsClamped(startDate,years);
    if (yearAnchor > endDate) {
      years -= 1;
      yearAnchor = addYearsClamped(startDate,years);
    }
    let months = 0;
    while (months < 11 && addMonthsClamped(yearAnchor,months+1) <= endDate) months += 1;
    const monthAnchor = addMonthsClamped(yearAnchor,months);
    const dayMs = 24 * 60 * 60 * 1000;
    const anchorUtc = Date.UTC(monthAnchor.getFullYear(),monthAnchor.getMonth(),monthAnchor.getDate());
    const endUtc = Date.UTC(endDate.getFullYear(),endDate.getMonth(),endDate.getDate());
    const days = Math.floor((endUtc - anchorUtc) / dayMs);
    return {years,months,days};
  }

  function getSeniorityInfo(sourcePayload,record,supervisor = false) {
    const parsed = parseHireDateValue(record?.hireDate);
    if (!parsed) return null;
    const today = getCurrentCalendarDate();
    if (parsed.date > today.date) return null;
    const dayMs = 24 * 60 * 60 * 1000;
    const hireUtc = Date.UTC(parsed.year,parsed.month-1,parsed.day);
    const todayUtc = Date.UTC(today.year,today.month-1,today.day);
    const days = Math.floor((todayUtc - hireUtc) / dayMs);
    const calendarSeniority = getCalendarSeniority(parsed.date,today.date);
    const annualDays = getAnnualLeaveEntitlementForDate(sourcePayload,record,today.date,supervisor);
    const gregorian = `${parsed.year}.${String(parsed.month).padStart(2,'0')}.${String(parsed.day).padStart(2,'0')}`;
    const roc = `${parsed.year - 1911}.${String(parsed.month).padStart(2,'0')}.${String(parsed.day).padStart(2,'0')}`;
    return {days,annualDays,calendarSeniority,gregorian,roc};
  }

  function formatSeniorityLine(sourcePayload,name,record,supervisor = false) {
    const displayName = String(name || '').trim();
    const info = getSeniorityInfo(sourcePayload,record,supervisor);
    if (!displayName || !info || !info.calendarSeniority) return '';
    const seniority = info.calendarSeniority;
    return `${displayName} ${info.days} 天｜${info.annualDays} 天｜${seniority.years} 年 ${seniority.months} 個月 ${seniority.days} 天｜${info.gregorian}｜${info.roc}`;
  }

  function formatShift(value) {
    return String(value || '').replace(/\s+/g,'').replace('~',' ~ ');
  }

  function solidFill(argb) {
    return {type:'pattern',pattern:'solid',fgColor:{argb}};
  }

  function mergeSet(ws,r1,c1,r2,c2,value,style={}) {
    ws.mergeCells(r1,c1,r2,c2);
    const cell = ws.getCell(r1,c1);
    cell.value = value;
    Object.assign(cell,style);
    return cell;
  }

  function getDateBandDark(year,month,day) {
    const anchor = Date.UTC(2026,9,1);
    const current = Date.UTC(year,month-1,day);
    const diff = Math.floor((current-anchor)/86400000);
    const pair = Math.floor(diff/2);
    return Math.abs(pair % 2) === 1;
  }

  function getAnnualSpecialDayType(year,month,day) {
    const specialDays = payload?.specialDays?.[String(year)];
    if (!specialDays) return '';
    const key = `${Number(year)}-${pad2(Number(month))}-${pad2(Number(day))}`;
    const holidays = window.TreeSelection.create({
      selected: Array.isArray(specialDays.holidays) ? specialDays.holidays : []
    });
    const workdays = window.TreeSelection.create({
      selected: Array.isArray(specialDays.workdays) ? specialDays.workdays : []
    });
    if (holidays.has(key)) return 'holiday';
    if (workdays.has(key)) return 'workday';
    return '';
  }

  function isSupervisorLeave(data,day) {
    if (!Array.isArray(data.supervisorLeaveDays)) return false;
    const supervisorLeaveDays = window.TreeSelection.create({
      selected: data.supervisorLeaveDays.map(Number)
    });
    return supervisorLeaveDays.has(Number(day));
  }

  function isBlocked(data,blockedWeekdays,year,month,day) {
    if (isSupervisorLeave(data,day)) return true;
    const override = data.blockedVacationOverrides?.[String(day)];
    if (typeof override === 'boolean') return override;
    const specialType = getAnnualSpecialDayType(year,month,day);
    if (specialType === 'holiday') return true;
    if (specialType === 'workday') return false;
    const dow = getWeekdayIndex(year, month, day);
    return blockedWeekdays.has(dow);
  }

  function isNightGray(data,year,month,day,shift) {
    const key = `${day}-night-${shift}`;
    const override = data.nightShiftOverrides?.[key];
    if (typeof override === 'boolean') return override;
    return shift === 3 && getWeekdayIndex(year, month, day) === 6;
  }

  function getLeaveSummary(data,letter,days) {
    let publicCount = 0;
    let annualCount = 0;
    for (let day=1;day<=days;day+=1) {
      for (let slot=0;slot<2;slot+=1) {
        const key = `${day}-vacation-${slot}`;
        if (String(data.rosterValues?.[key] || '') !== letter) continue;
        const type = String(data.leaveTypeValues?.[key] || 'public');
        if (type === 'annual') annualCount += 1;
        else if (type === 'public' || type === 'exceptionPublic') publicCount += 1;
      }
      const extra = data.extraLeaves?.[String(day)];
      if (extra && String(extra.letter || '') === letter) {
        const type = String(extra.type || 'public');
        if (type === 'annual') annualCount += 1;
        else if (type === 'public' || type === 'exceptionPublic') publicCount += 1;
      }
    }
    return {publicCount,annualCount};
  }

  function buildNotes(data,day,people) {
    const groups = [];
    for (let shift=0;shift<5;shift+=1) {
      const letter = String(data.rosterValues?.[`${day}-shift-${shift}`] || '');
      if (!letter) continue;
      const specialTime = data.specialShiftTimes?.[`${day}-shift-${shift}`];
      const nightTime = data.nightShiftTimes?.[`${day}-night-${shift}`];
      if (specialTime) groups.push(timeNote(letter,specialTime));
      if (nightTime) groups.push(timeNote(letter,nightTime));
    }
    for (let slot=0;slot<2;slot+=1) {
      const key = `${day}-vacation-${slot}`;
      const letter = String(data.rosterValues?.[key] || '');
      if (!letter) continue;
      const type = String(data.leaveTypeValues?.[key] || 'public');
      const note = String(data.leaveNoteValues?.[key] || '');
      if (type === 'annual') groups.push(`${letter}\n特\n休`);
      else if (type === 'leave') groups.push(`${letter}\n${Array.from(note || '請假').join('\n')}`);
    }
    const extra = data.extraLeaves?.[String(day)];
    if (extra?.letter) {
      if (extra.type === 'annual') groups.push(`${extra.letter}\n特\n休`);
      else if (extra.type === 'leave') groups.push(`${extra.letter}\n${Array.from(extra.note || '請假').join('\n')}`);
      else groups.push(`${extra.letter}\n公\n休`);
    }
    const grantEntries = Object.entries(data.annualGrantDecisions || {});
    for (const [employeeId, grant] of grantEntries) {
      if (Number(grant?.day) !== day || Number(grant?.days) <= 0) continue;
      const letter = Object.keys(people).find(l => people[l].employeeId === employeeId);
      if (letter) groups.push(`${letter}\n${grant.days}`);
    }
    const meetingDays = window.TreeSelection.create({
      selected: (data.meetingDays || []).map(Number)
    });
    if (meetingDays.has(day)) {
      const text = String(data.meetingNoteValues?.[String(day)] || payload.settings?.meetingDefaultText || '8點櫃檯開會');
      groups.push(Array.from(text).join('\n'));
    }
    const manual = String(data.manualNotes?.[String(day)] || '');
    if (manual) groups.push(Array.from(manual).join('\n'));
    return groups;
  }

  function timeNote(letter,range) {
    const [start,end] = String(range).replace(/\s+/g,'').split('~');
    return `${letter}\n${start || ''}\n│\n${end || ''}`;
  }

  function splitThreeRanges(start,end) {
    const count = end-start+1;
    const base = Math.floor(count/3);
    const rem = count%3;
    const out=[];
    let cursor=start;
    for (let i=0;i<3;i+=1) {
      const size=base+(i<rem?1:0);
      out.push([cursor,cursor+size-1]);
      cursor+=size;
    }
    return out;
  }

  function applyOuterBorder(ws,r1,c1,r2,c2,edge) {
    for (let c=c1;c<=c2;c+=1) {
      ws.getCell(r1,c).border = {...ws.getCell(r1,c).border,top:edge};
      ws.getCell(r2,c).border = {...ws.getCell(r2,c).border,bottom:edge};
    }
    for (let r=r1;r<=r2;r+=1) {
      ws.getCell(r,c1).border = {...ws.getCell(r,c1).border,left:edge};
      ws.getCell(r,c2).border = {...ws.getCell(r,c2).border,right:edge};
    }
  }

  function colName(number) {
    let n = number;
    let name = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      name = String.fromCharCode(65 + rem) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }


  function downloadBlob(blob, filename) {
    const url = window.SlowlyBlobURL.create(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.SlowlyBlobURL.revoke(url), 1000);
  }

  exportButton.addEventListener('click', exportCurrentMonth);

  window.ShiftRosterExcelExport = Object.freeze({
    exportCurrentMonth
  });
})();
