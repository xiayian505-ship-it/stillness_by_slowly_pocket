document.addEventListener("DOMContentLoaded", async ()=>{

  /* =========================================================
     慢慢｜雙人記帳本 app.js v3 lib-integrated
     ✅ 延續 v2 / v3 功能
     ✅ 修復：清空取消時 currencyBook 不會先被刪除
     ✅ 修復：匯出 / 匯入包含 currencyBook
     ✅ 修復：清空全部 / 本月時 records 與 currencyBook 同步在確認後執行
     ✅ v3：列表改為西曆月曆，點整個日期格開啟明細
     ✅ bugfix：帳外調整改為「每月」保存
     ✅ bugfix：365 天清理 records / currencyBook 分別執行
     ✅ bugfix：多幣別日總計統一以 TWD 計算
     ✅ bugfix：匯入加入基本格式驗證，避免錯誤 JSON 覆蓋帳本
     ✅ bugfix：結算外幣可用即時匯率，失敗時回退系統匯率
     ✅ lib：Responsive Base / DateTime / Timestamp / Money / Currency / DataBackup
     ✅ data：FictionStorage 單一 state record / FictionChange 變更事件
     ✅ color：沿用慢慢月曆卡低飽和配色
  ========================================================= */

  const RETAIN_DAYS = 365;
  const STORE_NAMESPACE = "sbs-duo-book-v3";
  const STATE_ID = "main";

  if(
    !window.DateTime || !window.Timestamp || !window.Money ||
    !window.Currency || !window.DataBackup ||
    !window.FictionChange || !window.FictionStorage
  ){
    window.alert("共用模組載入失敗，請重新整理後再試。");
    return;
  }


  /* ===== DOM ===== */
  const calendarGrid = document.getElementById("calendarGrid");
  const monthTitle   = document.querySelector(".month-title");

  const navBtns     = document.querySelectorAll(".nav-btn");
  const prevBtn     = navBtns[0] || null;
  const nextBtn     = navBtns[1] || null;

  const refreshBtn  = document.querySelector(".refresh");
  const clearAllBtn = document.getElementById("clearAllBtn");

  const exportBtn   = document.getElementById("exportBtn");
  const importBtn   = document.getElementById("importBtn");
  const fileInput   = document.getElementById("fileInput");

  const inputA      = document.getElementById("nameA");
  const inputB      = document.getElementById("nameB");

  const sumAB       = document.getElementById("sumAB");
  const sumBA       = document.getElementById("sumBA");
  const finalResult = document.getElementById("finalResult");
  const currencyStats = document.getElementById("currencyStats");

  const adjustSide   = document.getElementById("adjustSide");
  const adjustAmount = document.getElementById("adjustAmount");

  const adjustSideFake    = document.getElementById("adjustSideFake");
  const adjustSideTrigger = document.getElementById("adjustSideTrigger");
  const adjustSideLabel   = document.getElementById("adjustSideLabel");
  const adjustSideMenu    = document.getElementById("adjustSideMenu");
  const adjustSideOptions = Array.from(document.querySelectorAll("#adjustSideMenu .fake-select-option"));

  const modal      = document.getElementById("detailModal");
  const modalDate  = document.getElementById("modalDate");
  const closeBtn   = document.querySelector("#detailModal .close");

  const listA      = document.getElementById("listA");
  const listB      = document.getElementById("listB");
  const addBtns    = document.querySelectorAll(".add");

  const editModal   = document.getElementById("editModal");
  const editTitleEl = editModal ? editModal.querySelector(".danger-title") : null;
  const editItem    = document.getElementById("editItem");
  const editAmount  = document.getElementById("editAmount");
  const editCancel  = document.getElementById("editCancel");
  const editOk      = document.getElementById("editOk");

  const dangerModal  = document.getElementById("dangerModal");
  const dangerTitle  = dangerModal ? dangerModal.querySelector(".danger-title") : null;
  const dangerText   = dangerModal ? dangerModal.querySelector(".danger-text") : null;
  const dangerCancel = document.getElementById("dangerCancelBtn");
  const dangerConfirm= document.getElementById("dangerOkBtn");

  const settleCurrency = document.getElementById("settleCurrency");
  const applyBtn        = document.getElementById("applyCurrencyBtn");
  const editCurrency    = document.getElementById("editCurrency");

  const settleCurrencyFake    = document.getElementById("settleCurrencyFake");
  const settleCurrencyTrigger = document.getElementById("settleCurrencyTrigger");
  const settleCurrencyLabel   = document.getElementById("settleCurrencyLabel");
  const settleCurrencyMenu    = document.getElementById("settleCurrencyMenu");
  const settleCurrencyOptions = Array.from(document.querySelectorAll("#settleCurrencyMenu .fake-select-option"));

  const editCurrencyFake    = document.getElementById("editCurrencyFake");
  const editCurrencyTrigger = document.getElementById("editCurrencyTrigger");
  const editCurrencyLabel   = document.getElementById("editCurrencyLabel");
  const editCurrencyMenu    = document.getElementById("editCurrencyMenu");
  const editCurrencyOptions = Array.from(document.querySelectorAll("#editCurrencyMenu .fake-select-option"));
  const editRate        = document.getElementById("editRate");

  /* ===== Utils ===== */
  function pad(n){ return String(n).padStart(2,"0"); }

  function escapeHtml(value){
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function isPlainObject(value){
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function isValidDateKey(key){
    return DateTime.parseDateKey(key) !== null;
  }

  function isValidRecordsObject(obj){
    if(!isPlainObject(obj)) return false;

    return Object.entries(obj).every(([date, rows])=>{
      if(!isValidDateKey(date) || !Array.isArray(rows)) return false;

      return rows.every(r=>{
        if(!isPlainObject(r)) return false;
        if(r.type !== "a_to_b" && r.type !== "b_to_a") return false;
        if(!Number.isFinite(Number(r.amount)) || Number(r.amount) <= 0) return false;
        return true;
      });
    });
  }

  function isValidCurrencyBook(obj){
    if(!isPlainObject(obj)) return false;

    return Object.entries(obj).every(([date, rows])=>{
      if(!isValidDateKey(date) || !Array.isArray(rows)) return false;
      return rows.every(c=>{
        if(c == null) return true;
        if(!isPlainObject(c)) return false;
        return typeof c.currency === "string" &&
          Number.isFinite(Number(c.rate)) && Number(c.rate) > 0 &&
          Number.isFinite(Number(c.baseTWD)) && Number(c.baseTWD) >= 0;
      });
    });
  }

  /* ===== Data / FictionStorage ===== */
  const store = FictionStorage.create({ namespace: STORE_NAMESPACE });
  const stateCollection = store.collection("state");
  const bookChange = FictionChange.create({ name: "sbs-duo-book" });

  let records = {};
  let names = {A:"A",B:"B"};
  let adjust = {};
  let currencyBook = {};
  let saveQueue = Promise.resolve();

  const now = new Date();
  let viewYear  = now.getFullYear();
  let viewMonth = now.getMonth();

  function currentMonthPrefix(){ return `${viewYear}-${pad(viewMonth+1)}-`; }
  function currentMonthKey(){ return `${viewYear}-${pad(viewMonth+1)}`; }

  function normalizeState(raw){
    const source = isPlainObject(raw) ? raw : {};

    return {
      records: isValidRecordsObject(source.records) ? source.records : {},
      names: isPlainObject(source.names)
        ? { A:String(source.names.A || "A"), B:String(source.names.B || "B") }
        : {A:"A",B:"B"},
      adjust: isPlainObject(source.adjust) ? source.adjust : {},
      currencyBook: isValidCurrencyBook(source.currencyBook) ? source.currencyBook : {}
    };
  }

  async function loadState(){
    const saved = await stateCollection.get(STATE_ID);
    const state = normalizeState(saved);

    records = state.records;
    names = state.names;
    adjust = state.adjust;
    currencyBook = state.currencyBook;
  }

  function getMonthAdjust(){
    const a = adjust[currentMonthKey()];
    return {
      side: a?.side === "B" ? "B" : "A",
      amount: Money.toNumber(a?.amount, 0)
    };
  }

  function setMonthAdjust(side, amount){
    adjust[currentMonthKey()] = {
      side: side === "B" ? "B" : "A",
      amount: Money.toNumber(amount, 0)
    };
  }

  function pruneOld(){
    const today = DateTime.dateKey();

    Object.keys(records).forEach(k=>{
      const age = DateTime.diffDays(k, today);
      if(age !== null && age > RETAIN_DAYS){
        delete records[k];
      }
    });

    Object.keys(currencyBook).forEach(k=>{
      const age = DateTime.diffDays(k, today);
      if(age !== null && age > RETAIN_DAYS){
        delete currencyBook[k];
      }
    });
  }

  function snapshotState(){
    const state = {
      id: STATE_ID,
      records,
      names,
      adjust,
      currencyBook
    };

    if(typeof window.structuredClone === "function"){
      return window.structuredClone(state);
    }

    return JSON.parse(JSON.stringify(state));
  }

  function saveState(type = "save"){
    pruneOld();
    const operationId = Timestamp.create();
    const snapshot = snapshotState();

    saveQueue = saveQueue
      .catch(()=>{})
      .then(async ()=>{
        await stateCollection.upsert(snapshot);
        bookChange.emit({
          type,
          collection: "state",
          operationId
        });
      })
      .catch(error=>{
        console.error("[共付日常] 儲存失敗。", error);
      });

    return saveQueue;
  }

  await loadState();

  /* =========================================================
     Labels / Summary
  ========================================================= */
  function updateLabels(){
    const lineA = sumAB ? sumAB.parentElement : null;
    const lineB = sumBA ? sumBA.parentElement : null;

    if(lineA && lineA.childNodes && lineA.childNodes[0]){
      lineA.childNodes[0].textContent = `${names.A} 先付：TWD `;
    }
    if(lineB && lineB.childNodes && lineB.childNodes[0]){
      lineB.childNodes[0].textContent = `${names.B} 先付：TWD `;
    }

    const h3s = document.querySelectorAll(".detail-section h3");
    if(h3s[0]) h3s[0].textContent = `${names.A} 先付`;
    if(h3s[1]) h3s[1].textContent = `${names.B} 先付`;

    if(adjustSide && adjustSide.options && adjustSide.options.length >= 2){
      adjustSide.options[0].textContent = `${names.A} 多付`;
      adjustSide.options[1].textContent = `${names.B} 多付`;
    }

    syncCustomAdjustSelect();
    updateSummary();
  }

  let liveRateToTWD = {};

  async function refreshLiveRateFor(currency){
    try{
      const rate = await Currency.fetchRateToTWD(currency);
      liveRateToTWD[currency] = rate;
      return rate;
    }catch(e){
      return null;
    }
  }

  function getDisplayRate(currency){
    return liveRateToTWD[currency] || Currency.getRateToTWD(currency);
  }

  function lockRateAndStore(date, recordIndex, currency, userRate, amount){
    const parsedUserRate = Money.toNumber(userRate, NaN);
    const rate = Number.isFinite(parsedUserRate) && parsedUserRate > 0
      ? parsedUserRate
      : getDisplayRate(currency);
    const baseTWD = Currency.foreignToTWD(amount, rate);

    currencyBook[date] = currencyBook[date] || [];
    currencyBook[date][recordIndex] = {
      currency,
      rate,
      baseTWD
    };

  }

  function getDailyTotal(date){
    let A = 0;
    let B = 0;

    (records[date] || []).forEach((r,i)=>{
      if(r.deleted) return;

      const c = currencyBook[date]?.[i];
      const baseTWD = c && Number.isFinite(Number(c.baseTWD))
        ? Money.toNumber(c.baseTWD, 0)
        : Money.toNumber(r.amount, 0);

      if(r.type === "a_to_b") A += baseTWD;
      if(r.type === "b_to_a") B += baseTWD;
    });

    return {A,B};
  }

  function calculateTWDSettlement(){
    let A_TWD = 0;
    let B_TWD = 0;
    const prefix = currentMonthPrefix();

    Object.keys(records).forEach(date=>{
      if(!date.startsWith(prefix) || !Array.isArray(records[date])) return;

      records[date].forEach((r,i)=>{
        if(r.deleted) return;

        const c = currencyBook[date]?.[i];
        const base = c && Number.isFinite(Number(c.baseTWD))
          ? Money.toNumber(c.baseTWD, 0)
          : Money.toNumber(r.amount, 0);

        if(r.type === "a_to_b") A_TWD += base;
        if(r.type === "b_to_a") B_TWD += base;
      });
    });

    const monthAdjust = getMonthAdjust();
    if(monthAdjust.side === "A") A_TWD += monthAdjust.amount;
    else B_TWD += monthAdjust.amount;

    return { A_TWD, B_TWD, diffTWD: A_TWD - B_TWD };
  }

  function convertForDisplay(diffTWD, currency){
    const rate = getDisplayRate(currency);
    const converted = Currency.twdToForeign(diffTWD, rate);
    return Number.isFinite(converted) ? converted : diffTWD;
  }

  function updateCurrencyStats(){
    if(!currencyStats) return;
    const sel = settleCurrency?.value || "TWD";

    if(sel === "TWD"){
      currencyStats.textContent = "結算基準：TWD";
      return;
    }

    const rate = getDisplayRate(sel);
    const source = liveRateToTWD[sel] ? "即時匯率" : "系統備用匯率";
    currencyStats.textContent = `${source}：1 ${sel} ≈ ${rate.toFixed(3)} TWD`;
  }

  function updateSummary(){
    const { A_TWD, B_TWD, diffTWD } = calculateTWDSettlement();

    if(sumAB) sumAB.textContent = Money.formatNumber(A_TWD, {maximumFractionDigits:0});
    if(sumBA) sumBA.textContent = Money.formatNumber(B_TWD, {maximumFractionDigits:0});

    const sel = settleCurrency?.value || "TWD";
    const final = Money.formatNumber(convertForDisplay(Math.abs(diffTWD), sel), {minimumFractionDigits:2, maximumFractionDigits:2});

    if(finalResult){
      if(diffTWD > 0)
        finalResult.textContent = `${names.B} 應給 ${names.A} ${final} ${sel}`;
      else if(diffTWD < 0)
        finalResult.textContent = `${names.A} 應給 ${names.B} ${final} ${sel}`;
      else
        finalResult.textContent = "目前平衡";
    }

    updateCurrencyStats();
  }

  function syncAdjustControls(){
    const monthAdjust = getMonthAdjust();
    if(adjustSide) adjustSide.value = monthAdjust.side;
    if(adjustAmount) adjustAmount.value = monthAdjust.amount || 0;
    syncCustomAdjustSelect();
    updateAdjustColor();
  }

  /* =========================================================
     Calendar Render
  ========================================================= */
  function renderCalendar(){
    if(!calendarGrid) return;

    calendarGrid.innerHTML = "";

    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const days = new Date(viewYear, viewMonth+1, 0).getDate();

    for(let i=0; i<firstWeekday; i++){
      const empty = document.createElement("div");
      empty.className = "calendar-day empty";
      empty.setAttribute("aria-hidden", "true");
      calendarGrid.appendChild(empty);
    }

    for(let d=1; d<=days; d++){
      const dateStr = `${viewYear}-${pad(viewMonth+1)}-${pad(d)}`;
      const totals  = getDailyTotal(dateStr);

      const day = document.createElement("button");
      day.type = "button";
      day.className = "calendar-day";
      day.dataset.date = dateStr;
      day.setAttribute("aria-label", `${viewYear} 年 ${viewMonth+1} 月 ${d} 日`);

      day.innerHTML = `
        <span class="day-number">${d}</span>
        <span class="day-totals">
          <span class="day-total colA">
            <span class="day-name">${escapeHtml(names.A)}</span>
            <span class="day-amount">${Money.formatNumber(totals.A, {maximumFractionDigits:0})}</span>
          </span>
          <span class="day-total colB">
            <span class="day-name">${escapeHtml(names.B)}</span>
            <span class="day-amount">${Money.formatNumber(totals.B, {maximumFractionDigits:0})}</span>
          </span>
        </span>
      `;

      calendarGrid.appendChild(day);
    }

    if(monthTitle) monthTitle.textContent = `${viewYear} 年 ${viewMonth+1} 月`;
    syncAdjustControls();
    updateSummary();
  }

  /* =========================================================
     Detail Render (改覆蓋 / 改保留)
  ========================================================= */
  function renderDetail(date){
    if(!listA || !listB) return;

    listA.innerHTML = "";
    listB.innerHTML = "";

    (records[date] || []).forEach((r,i)=>{
      const div = document.createElement("div");
      const c = currencyBook[date]?.[i];
      const currency = c?.currency || "TWD";
      const label = `${escapeHtml(r.item || "懶得打")}  ${Money.cleanNumber(r.amount)} ${escapeHtml(currency)}`;

      if(r.deleted){
        div.classList.add("is-history");
        div.innerHTML = `
          <span>${label}</span>
          <span class="history-tag">歷史</span>
        `;
      }else{
        div.innerHTML = `
          <span>${label}</span>
          <button data-i="${i}" data-m="overwrite">修改會覆蓋</button>
          <button data-i="${i}" data-m="preserve">修改仍保留</button>
        `;

        div.querySelectorAll("button").forEach(btn=>{
          btn.onclick = ()=>{
            const mode = btn.dataset.m;
            openEditModal({
              title: (mode === "overwrite") ? "編輯（改覆蓋）" : "編輯（改保留）",
              item: r.item || "",
              amount: r.amount,
              onOpen: ()=>{
                const currentCurrency = currencyBook[date]?.[i];
                if(editCurrency){
                  editCurrency.value = currentCurrency?.currency || "TWD";
                  syncFakeSelect(editCurrency, editCurrencyLabel, editCurrencyOptions);
                }
                if(editRate) editRate.value = currentCurrency?.rate ?? "";
              },
              onOk: ({item, amount})=>{
                applyEditRecord(date, i, mode, item, amount);
              }
            });
          };
        });
      }

      (r.type === "a_to_b" ? listA : listB).appendChild(div);
    });
  }

  function applyEditRecord(date, index, mode, item, amount){
    const r = (records[date] || [])[index];
    if(!r || r.deleted) return;

    const currency = editCurrency?.value || currencyBook[date]?.[index]?.currency || "TWD";
    const userRate = editRate?.value || null;

    if(mode === "overwrite"){
      r.item = item;
      r.amount = amount;
      r.deleted = false;
      lockRateAndStore(date, index, currency, userRate, amount);
    }else{
      r.deleted = true;
      records[date].push({ type:r.type, item, amount, deleted:false });

      const newIndex = records[date].length - 1;
      lockRateAndStore(date, newIndex, currency, userRate, amount);
    }

    saveState("records-change");
    renderDetail(date);
    renderCalendar();
  }

  /* =========================================================
     editModal：新增 / 編輯
  ========================================================= */
  let editAction = null;

  function openEditModal({title, item, amount, onOk, onOpen}){
    if(!editModal || !editItem || !editAmount || !editOk) return;

    if(editTitleEl) editTitleEl.textContent = title || "新增紀錄";

    editItem.value = item || "";
    editAmount.value = (amount != null) ? String(amount) : "";

    let rateTouched = false;

    if(editRate){
      editRate.oninput = ()=>{
        rateTouched = true;
      };
    }

    if(editCurrency && editRate){
      editCurrency.onchange = async ()=>{
        syncFakeSelect(editCurrency, editCurrencyLabel, editCurrencyOptions);

        if(rateTouched) return;

        const cur = editCurrency.value;
        if(cur === "TWD"){
          editRate.value = "1";
          return;
        }

        const rateToTWD = await refreshLiveRateFor(cur);
        if(rateToTWD != null && !rateTouched){
          editRate.value = rateToTWD.toFixed(3);
        }
      };
    }

    editAction = { onOk };
    editModal.classList.remove("hidden");
    if(onOpen) onOpen();

    setTimeout(()=>{ editItem.focus(); }, 0);
  }

  function closeEditModal(){
    if(!editModal) return;
    editModal.classList.add("hidden");
    editAction = null;
  }

  if(editCancel) editCancel.onclick = closeEditModal;

  if(editOk) editOk.onclick = ()=>{
    if(!editAction) return;

    const item = (editItem.value || "").trim();
    const amount = Money.toNumber(editAmount.value, NaN);

    if(!Number.isFinite(amount) || amount <= 0){
      editAmount.focus();
      return;
    }

    editAction.onOk({ item, amount });
    closeEditModal();
  };

  function addRecord(type){
    const date = modal?.dataset?.date;
    if(!date) return;

    openEditModal({
      title:"新增紀錄",
      item:"",
      amount:"",
      onOpen: ()=>{
        if(editCurrency){
          editCurrency.value = "TWD";
          syncFakeSelect(editCurrency, editCurrencyLabel, editCurrencyOptions);
        }
        if(editRate) editRate.value = "1";
      },
      onOk:({item, amount})=>{
        const currency = editCurrency?.value || "TWD";
        const userRate = editRate?.value || null;

        records[date] = records[date] || [];
        records[date].push({ type, item, amount, deleted:false });

        const index = records[date].length - 1;
        lockRateAndStore(date, index, currency, userRate, amount);

        saveState("records-add");
        renderDetail(date);
        renderCalendar();
      }
    });
  }

  if(addBtns.length >= 2){
    addBtns[0].onclick = ()=>addRecord("a_to_b");
    addBtns[1].onclick = ()=>addRecord("b_to_a");
  }

  /* =========================================================
     打開明細：點整個日期格
  ========================================================= */
  if(calendarGrid){
    calendarGrid.addEventListener("click", e=>{
      const day = e.target.closest(".calendar-day[data-date]");
      if(!day) return;

      const date = day.dataset.date;
      if(modal) modal.dataset.date = date;
      if(modalDate) modalDate.textContent = `${date} 明細`;

      renderDetail(date);
      if(modal) modal.classList.remove("hidden");
    });
  }

  if(closeBtn) closeBtn.onclick = ()=>{ if(modal) modal.classList.add("hidden"); };

  /* =========================================================
     月份切換
  ========================================================= */
  if(prevBtn){
    prevBtn.onclick = ()=>{
      viewMonth--;
      if(viewMonth < 0){ viewMonth = 11; viewYear--; }
      renderCalendar();
    };
  }

  if(nextBtn){
    nextBtn.onclick = ()=>{
      viewMonth++;
      if(viewMonth > 11){ viewMonth = 0; viewYear++; }
      renderCalendar();
    };
  }

  /* =========================================================
     dangerModal：清空本月 / 清空全部
  ========================================================= */
  let dangerAction = null;

  function openDangerModal({title, textHtml, onConfirm}){
    if(!dangerModal || !dangerCancel || !dangerConfirm) return;

    if(dangerTitle) dangerTitle.textContent = title || "確認";
    if(dangerText)  dangerText.innerHTML = textHtml || "";

    dangerAction = { onConfirm };
    dangerModal.classList.remove("hidden");
  }

  function closeDangerModal(){
    if(!dangerModal) return;
    dangerModal.classList.add("hidden");
    dangerAction = null;
  }

  if(dangerCancel) dangerCancel.onclick = closeDangerModal;

  if(dangerConfirm) dangerConfirm.onclick = ()=>{
    if(!dangerAction) return;
    dangerAction.onConfirm();
    closeDangerModal();
  };

  if(refreshBtn){
    refreshBtn.onclick = ()=>{
      openDangerModal({
        title: "清空本月帳本",
        textHtml: `這會刪除 <b>${viewYear} 年 ${viewMonth+1} 月</b> 的所有明細與本月帳外調整。`,
        onConfirm: ()=>{
          const p = currentMonthPrefix();

          Object.keys(records).forEach(k=>{
            if(k.startsWith(p)) delete records[k];
          });
          Object.keys(currencyBook).forEach(k=>{
            if(k.startsWith(p)) delete currencyBook[k];
          });

          delete adjust[currentMonthKey()];

          saveState("clear-month");
          renderCalendar();
        }
      });
    };
  }

  if(clearAllBtn){
    clearAllBtn.onclick = ()=>{
      openDangerModal({
        title: "清空全部帳本",
        textHtml: "這會清除所有記錄、匯率資料與帳外調整，是否刪除？",
        onConfirm: ()=>{
          records = {};
          currencyBook = {};
          adjust = {};

          saveState("clear-all");
          renderCalendar();
        }
      });
    };
  }

  /* =========================================================
     匯出 / 匯入（JSON）
  ========================================================= */
  function exportAll(){
    const payload = DataBackup.createPayload({
      app: "sbs_duo_book",
      version: "3.3-lib8",
      data: { records, names, adjust, currencyBook }
    });

    const fn = `sbs_duo_book_v3_backup_${DateTime.dateKey()}.json`;
    DataBackup.downloadJson(fn, payload);
  }

  function normalizeImportedAdjust(value){
    if(!isPlainObject(value)) return {};

    const result = {};
    Object.entries(value).forEach(([month, a])=>{
      if(!/^\d{4}-\d{2}$/.test(month) || !isPlainObject(a)) return;
      result[month] = {
        side: a.side === "B" ? "B" : "A",
        amount: Money.toNumber(a.amount, 0)
      };
    });
    return result;
  }

  async function importAllFromFile(file){
    try{
      const obj = await DataBackup.readJsonFile(file);
      const data = DataBackup.extractData(obj, { allowRaw:false });

      if(!isPlainObject(data)) throw new Error("invalid data");
      if(!isValidRecordsObject(data.records)) throw new Error("invalid records");
      if(!isValidCurrencyBook(data.currencyBook)) throw new Error("invalid currencyBook");
      if(!isPlainObject(data.names)) throw new Error("invalid names");
      if(!isPlainObject(data.adjust)) throw new Error("invalid adjust");

      const importedNames = {
        A: String(data.names.A || "A"),
        B: String(data.names.B || "B")
      };
      const importedAdjust = normalizeImportedAdjust(data.adjust);

      records = data.records;
      currencyBook = data.currencyBook;
      names = importedNames;
      adjust = importedAdjust;

      await saveState("import");

      if(inputA) inputA.value = (names.A === "A") ? "" : names.A;
      if(inputB) inputB.value = (names.B === "B") ? "" : names.B;

      updateLabels();
      renderCalendar();
    }catch(e){
      window.alert("匯入失敗：這不是可用的雙人記帳本備份檔。原資料沒有變更。");
    }
  }

  if(exportBtn) exportBtn.onclick = exportAll;

  if(importBtn && fileInput){
    importBtn.onclick = ()=>fileInput.click();
    fileInput.addEventListener("change", ()=>{
      const file = fileInput.files && fileInput.files[0];
      if(!file) return;
      importAllFromFile(file);
      fileInput.value = "";
    });
  }

  /* =========================================================
     名字 / 帳外調整事件
  ========================================================= */
  if(inputA){
    inputA.value = (names.A === "A") ? "" : names.A;
    inputA.oninput = ()=>{
      names.A = inputA.value || "A";
      saveState("names-change");
      updateLabels();
      renderCalendar();
    };
  }

  if(inputB){
    inputB.value = (names.B === "B") ? "" : names.B;
    inputB.oninput = ()=>{
      names.B = inputB.value || "B";
      saveState("names-change");
      updateLabels();
      renderCalendar();
    };
  }

  function syncFakeSelect(nativeSelect, labelEl, optionButtons){
    if(!nativeSelect || !labelEl) return;

    const value = nativeSelect.value || "";
    labelEl.textContent = value;

    optionButtons.forEach((btn)=>{
      btn.setAttribute(
        "aria-selected",
        btn.dataset.value === value ? "true" : "false"
      );
    });
  }

  function closeFakeSelect(menu, trigger){
    if(!menu || !trigger) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function closeAllFakeSelects(exceptMenu = null){
    document.querySelectorAll(".fake-select-menu").forEach((menu)=>{
      if(menu === exceptMenu) return;
      menu.hidden = true;
      menu.closest(".fake-select")
        ?.querySelector(".fake-select-trigger")
        ?.setAttribute("aria-expanded", "false");
    });
  }

  function bindFakeSelect(nativeSelect, fakeRoot, trigger, menu, labelEl, optionButtons){
    if(!nativeSelect || !fakeRoot || !trigger || !menu || !labelEl) return;

    syncFakeSelect(nativeSelect, labelEl, optionButtons);

    trigger.addEventListener("click", (e)=>{
      e.stopPropagation();

      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      closeAllFakeSelects(menu);

      menu.hidden = isOpen;
      trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });

    optionButtons.forEach((btn)=>{
      btn.addEventListener("click", ()=>{
        const value = btn.dataset.value;
        if(!value) return;

        nativeSelect.value = value;
        syncFakeSelect(nativeSelect, labelEl, optionButtons);

        nativeSelect.dispatchEvent(
          new Event("change", { bubbles:true })
        );

        closeFakeSelect(menu, trigger);
        trigger.focus();
      });
    });
  }

  function syncCustomAdjustSelect(){
    if(!adjustSideFake || !adjustSideTrigger || !adjustSideLabel || !adjustSide) return;

    const value = adjustSide.value === "B" ? "B" : "A";

    adjustSideLabel.textContent =
      value === "A" ? `${names.A} 多付` : `${names.B} 多付`;

    adjustSideFake.classList.toggle("is-a", value === "A");
    adjustSideFake.classList.toggle("is-b", value === "B");

    adjustSideOptions.forEach((btn)=>{
      const isA = btn.dataset.value === "A";
      const isB = btn.dataset.value === "B";

      if(isA) btn.textContent = `${names.A} 多付`;
      if(isB) btn.textContent = `${names.B} 多付`;

      btn.setAttribute(
        "aria-selected",
        btn.dataset.value === value ? "true" : "false"
      );
    });
  }

  function closeCustomAdjustSelect(){
    if(!adjustSideMenu || !adjustSideTrigger) return;
    adjustSideMenu.hidden = true;
    adjustSideTrigger.setAttribute("aria-expanded", "false");
  }

  function toggleCustomAdjustSelect(){
    if(!adjustSideMenu || !adjustSideTrigger) return;
    const open = adjustSideTrigger.getAttribute("aria-expanded") === "true";
    adjustSideMenu.hidden = open;
    adjustSideTrigger.setAttribute("aria-expanded", open ? "false" : "true");
  }

  function updateAdjustColor(){
    const title = document.querySelector(".adjust-title");
    if(!title) return;

    const monthAdjust = getMonthAdjust();
    title.style.color = monthAdjust.side === "A" ? "#879886" : "#b9867e";
  }

  bindFakeSelect(
    settleCurrency,
    settleCurrencyFake,
    settleCurrencyTrigger,
    settleCurrencyMenu,
    settleCurrencyLabel,
    settleCurrencyOptions
  );

  bindFakeSelect(
    editCurrency,
    editCurrencyFake,
    editCurrencyTrigger,
    editCurrencyMenu,
    editCurrencyLabel,
    editCurrencyOptions
  );

  if(adjustSideTrigger){
    adjustSideTrigger.addEventListener("click", (e)=>{
      e.stopPropagation();
      toggleCustomAdjustSelect();
    });
  }

  adjustSideOptions.forEach((btn)=>{
    btn.addEventListener("click", ()=>{
      if(!adjustSide) return;
      adjustSide.value = btn.dataset.value === "B" ? "B" : "A";
      adjustSide.dispatchEvent(new Event("change", { bubbles:true }));
      closeCustomAdjustSelect();
      adjustSideTrigger?.focus();
    });
  });

  document.addEventListener("click", (e)=>{
    if(adjustSideFake && !adjustSideFake.contains(e.target)){
      closeCustomAdjustSelect();
    }

    if(settleCurrencyFake && !settleCurrencyFake.contains(e.target)){
      closeFakeSelect(settleCurrencyMenu, settleCurrencyTrigger);
    }

    if(editCurrencyFake && !editCurrencyFake.contains(e.target)){
      closeFakeSelect(editCurrencyMenu, editCurrencyTrigger);
    }
  });

  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      closeCustomAdjustSelect();
      closeFakeSelect(settleCurrencyMenu, settleCurrencyTrigger);
      closeFakeSelect(editCurrencyMenu, editCurrencyTrigger);
    }
  });

  if(adjustSide){
    adjustSide.onchange = ()=>{
      const monthAdjust = getMonthAdjust();
      setMonthAdjust(adjustSide.value, monthAdjust.amount);
      saveState("adjust-change");
      updateSummary();
      syncCustomAdjustSelect();
      updateAdjustColor();
    };
  }

  if(adjustAmount){
    adjustAmount.oninput = ()=>{
      const monthAdjust = getMonthAdjust();
      setMonthAdjust(monthAdjust.side, Money.toNumber(adjustAmount.value, 0));
      saveState("adjust-change");
      updateSummary();
    };
  }

  if(applyBtn){
    applyBtn.onclick = async ()=>{
      const currency = settleCurrency?.value || "TWD";
      applyBtn.disabled = true;

      try{
        await refreshLiveRateFor(currency);
      }finally{
        applyBtn.disabled = false;
        updateSummary();
      }
    };
  }

  if(settleCurrency){
    settleCurrency.onchange = ()=>{
      syncFakeSelect(settleCurrency, settleCurrencyLabel, settleCurrencyOptions);
      updateSummary();
    };
  }

  /* =========================================================
     Init
  ========================================================= */
  syncFakeSelect(settleCurrency, settleCurrencyLabel, settleCurrencyOptions);
  syncFakeSelect(editCurrency, editCurrencyLabel, editCurrencyOptions);

  pruneOld();
  await saveState("init");
  updateLabels();
  renderCalendar();
});
