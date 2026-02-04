document.addEventListener("DOMContentLoaded", ()=>{

  /* =========================================================
     慢慢｜雙人記帳本 app.js
     ✅ 保留原功能：改覆蓋 / 改保留 / deleted / 清空本月&全部 / 匯出匯入 / 帳外調整
     ✅ 修復：querySelector 抓錯按鈕造成 null.onclick、兩個 modal 互相干擾
     ✅ UI：新增/編輯改用 editModal（不再用 prompt）
  ========================================================= */

  const STORAGE_KEY = "sbs_duo_book_records_v1";
  const NAME_KEY    = "sbs_duo_book_names_v1";
  const ADJUST_KEY  = "sbs_duo_book_adjust_v1";
  const RETAIN_DAYS = 365;

  /* ===== DOM ===== */
  const calendar    = document.querySelector(".calendar");
  const monthTitle  = document.querySelector(".month-title");

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

  const adjustSide   = document.getElementById("adjustSide");
  const adjustAmount = document.getElementById("adjustAmount");

  const modal      = document.getElementById("detailModal");
  const modalDate  = document.getElementById("modalDate");
  const closeBtn   = document.querySelector("#detailModal .close");

  const listA      = document.getElementById("listA");
  const listB      = document.getElementById("listB");
  const addBtns    = document.querySelectorAll(".add");

  /* ===== editModal（新增/編輯）===== */
  const editModal   = document.getElementById("editModal");
  const editTitleEl = editModal ? editModal.querySelector(".danger-title") : null;
  const editItem    = document.getElementById("editItem");
  const editAmount  = document.getElementById("editAmount");
  const editCancel  = document.getElementById("editCancel");
  const editOk      = document.getElementById("editOk");

  /* ===== dangerModal（清空確認）===== */
  const dangerModal = document.getElementById("dangerModal");
  const dangerTitle = dangerModal ? dangerModal.querySelector(".danger-title") : null;
  const dangerText  = dangerModal ? dangerModal.querySelector(".danger-text") : null;
  const dangerInput = document.getElementById("dangerInput");
  // ⚠️ 這裡必須限定在 dangerModal 裡抓，不然會抓到 editModal 的 btn-cancel / btn-confirm
const dangerCancel = document.getElementById("dangerCancelBtn");
const dangerConfirm= document.getElementById("dangerOkBtn");

  /* ===== Utils ===== */
  function safeParse(raw, fallback){
    try{ return raw ? JSON.parse(raw) : fallback; }
    catch{ return fallback; }
  }
  function pad(n){ return String(n).padStart(2,"0"); }
  function ymdToDate(ymd){
    const [y,m,d]=ymd.split("-").map(Number);
    return new Date(y,m-1,d);
  }
  function todayISO(){
    const t=new Date();
    return `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}`;
  }
  function downloadJson(filename, obj){
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:"application/json;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ===== Data ===== */
  let records = safeParse(localStorage.getItem(STORAGE_KEY), {});
  let names   = safeParse(localStorage.getItem(NAME_KEY), {A:"A",B:"B"});
  let adjust  = safeParse(localStorage.getItem(ADJUST_KEY), {side:"A",amount:0});

  function pruneOld(){
    const cutoff=new Date();
    cutoff.setDate(cutoff.getDate()-RETAIN_DAYS);
    Object.keys(records).forEach(k=>{
      if(ymdToDate(k) < cutoff) delete records[k];
    });
  }

  function saveRecords(){
    pruneOld();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
  function saveNames(){ localStorage.setItem(NAME_KEY, JSON.stringify(names)); }
  function saveAdjust(){ localStorage.setItem(ADJUST_KEY, JSON.stringify(adjust)); }

  /* ===== View Month ===== */
  const now = new Date();
  let viewYear  = now.getFullYear();
  let viewMonth = now.getMonth(); // 0-11

  function currentMonthPrefix(){ return `${viewYear}-${pad(viewMonth+1)}-`; }

  /* =========================================================
     Labels / Summary
  ========================================================= */
  function updateLabels(){
    // sumAB 行："<div>A 先付：$<span id='sumAB'>0</span></div>"
    const lineA = sumAB ? sumAB.parentElement : null;
    const lineB = sumBA ? sumBA.parentElement : null;
    if(lineA && lineA.childNodes && lineA.childNodes[0]){
      lineA.childNodes[0].textContent = `${names.A} 先付：$`;
    }
    if(lineB && lineB.childNodes && lineB.childNodes[0]){
      lineB.childNodes[0].textContent = `${names.B} 先付：$`;
    }

    // 表頭
    const headA = document.querySelector(".calendar .row.head .colA");
    const headB = document.querySelector(".calendar .row.head .colB");
    if(headA) headA.textContent = `${names.A}先付`;
    if(headB) headB.textContent = `${names.B}先付`;

    // 明細 h3
    const h3s = document.querySelectorAll(".detail-section h3");
    if(h3s[0]) h3s[0].textContent = `${names.A} 先付`;
    if(h3s[1]) h3s[1].textContent = `${names.B} 先付`;

    // 帳外調整
    if(adjustSide && adjustSide.options && adjustSide.options.length>=2){
      adjustSide.options[0].textContent = `${names.A} 多付`;
      adjustSide.options[1].textContent = `${names.B} 多付`;
    }

    updateSummary();
  }

  function getDailyTotal(date){
    let A=0, B=0;
    (records[date]||[]).forEach(r=>{
      if(r.deleted) return;
      if(r.type==="a_to_b") A += r.amount;
      if(r.type==="b_to_a") B += r.amount;
    });
    return {A,B};
  }

function updateSummary(){
  let A=0, B=0;
  const prefix = currentMonthPrefix();   // ⭐ 本月 key 開頭

  Object.keys(records).forEach(date=>{
    if(!date.startsWith(prefix)) return;  // ⭐ 只算本月

    records[date].forEach(r=>{
      if(r.deleted) return;
      if(r.type==="a_to_b") A += r.amount;
      if(r.type==="b_to_a") B += r.amount;
    });
  });

  // 帳外調整仍然適用（它本來就是跨月手動修正）
  if(adjust.side==="A") A += (adjust.amount||0);
  else B += (adjust.amount||0);

  if(sumAB) sumAB.textContent = A;
  if(sumBA) sumBA.textContent = B;

  if(finalResult){
    if(A > B){
      finalResult.innerHTML =
        `<span class="sideB">${names.B}</span> 應給 <span class="sideA">${names.A}</span> $${A-B}`;
    }else if(B > A){
      finalResult.innerHTML =
        `<span class="sideA">${names.A}</span> 應給 <span class="sideB">${names.B}</span> $${B-A}`;
    }else{
      finalResult.textContent = "目前平衡";
    }
  }
}

  /* =========================================================
     Calendar Render
  ========================================================= */
  function renderCalendar(){
    if(!calendar) return;

    calendar.querySelectorAll(".row:not(.head)").forEach(r=>r.remove());

    const days = new Date(viewYear, viewMonth+1, 0).getDate();

    for(let d=1; d<=days; d++){
      const dateStr = `${viewYear}-${pad(viewMonth+1)}-${pad(d)}`;
      const totals  = getDailyTotal(dateStr);

      const row = document.createElement("div");
      row.className = "row";
      row.dataset.date = dateStr;
      row.innerHTML = `
        <div class="date">
          <span class="date-text">${viewMonth+1}/${d}</span>
          <span class="expand-icon" title="查看明細">+</span>
        </div>
        <div class="colA">${totals.A}</div>
        <div class="colB">${totals.B}</div>
      `;
      calendar.appendChild(row);
    }

    if(monthTitle) monthTitle.textContent = `${viewYear} 年 ${viewMonth+1} 月`;
    updateSummary();
  }

  /* =========================================================
     Detail Render (改覆蓋 / 改保留)
  ========================================================= */
  function renderDetail(date){
    if(!listA || !listB) return;

    listA.innerHTML = "";
    listB.innerHTML = "";

    (records[date]||[]).forEach((r,i)=>{
      const div = document.createElement("div");
      const label = `${r.item || "懶得打"}  $${r.amount}`;

      div.innerHTML = `
        <span>${label}</span>
        <button data-i="${i}" data-m="overwrite">修改會覆蓋</button>
        <button data-i="${i}" data-m="preserve">修改仍保留</button>
      `;

      if(r.deleted) div.style.textDecoration = "line-through";

      div.querySelectorAll("button").forEach(btn=>{
        btn.onclick = ()=>{
          const mode = btn.dataset.m;
          openEditModal({
            title: (mode==="overwrite") ? "編輯（改覆蓋）" : "編輯（改保留）",
            item: r.item || "",
            amount: r.amount,
            onOk: ({item, amount})=>{
              applyEditRecord(date, i, mode, item, amount);
            }
          });
        };
      });

      (r.type==="a_to_b" ? listA : listB).appendChild(div);
    });
  }

  function applyEditRecord(date, index, mode, item, amount){
    const r = (records[date]||[])[index];
    if(!r) return;

    if(mode==="overwrite"){
      r.item = item;
      r.amount = amount;
      r.deleted = false;
    }else{
      // preserve：舊的劃掉，新增一筆新的
      r.deleted = true;
      records[date].push({ type:r.type, item, amount, deleted:false });
    }

    saveRecords();
    renderDetail(date);
    renderCalendar();
  }

  /* =========================================================
     editModal：新增/編輯（不再用 prompt）
  ========================================================= */
  let editAction = null;

  function openEditModal({title, item, amount, onOk}){
    if(!editModal || !editItem || !editAmount || !editOk) return;

    if(editTitleEl) editTitleEl.textContent = title || "新增紀錄";

    editItem.value = item || "";
    editAmount.value = (amount!=null) ? String(amount) : "";

    editAction = { onOk };

    editModal.classList.remove("hidden");
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
    const amount = Number(editAmount.value);

    if(!amount || amount <= 0){
      editAmount.focus();
      return;
    }

    editAction.onOk({ item, amount });
    closeEditModal();
  };

  // 新增按鈕（A/B）
  function addRecord(type){
    const date = modal ? modal.dataset.date : "";
    if(!date) return;

    openEditModal({
      title: "新增紀錄",
      item: "",
      amount: "",
      onOk: ({item, amount})=>{
        records[date] = records[date] || [];
        records[date].push({ type, item, amount, deleted:false });
        saveRecords();
        renderDetail(date);
        renderCalendar();
      }
    });
  }

  if(addBtns && addBtns.length >= 2){
    addBtns[0].onclick = ()=>addRecord("a_to_b");
    addBtns[1].onclick = ()=>addRecord("b_to_a");
  }

  /* =========================================================
     打開明細：只點「＋」
  ========================================================= */
  if(calendar){
    calendar.addEventListener("click", e=>{
      const icon = e.target.closest(".expand-icon");
      if(!icon) return;

      const row = icon.closest(".row");
      if(!row) return;

      const date = row.dataset.date;
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
   dangerModal：清空本月 / 清空全部（簡化版：直接確認）
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

/* ===== 清空本月 ===== */
if(refreshBtn){
  refreshBtn.onclick = ()=>{
    openDangerModal({
      title: "清空本月帳本",
      textHtml: `這會刪除 <b>${viewYear} 年 ${viewMonth+1} 月</b> 的所有明細。`,
      onConfirm: ()=>{
        const p = currentMonthPrefix();
        Object.keys(records).forEach(k=>{
          if(k.startsWith(p)) delete records[k];
        });
        saveRecords();
        renderCalendar();
      }
    });
  };
}

/* ===== 清空全部 ===== */
if(clearAllBtn){
  clearAllBtn.onclick = ()=>{
    openDangerModal({
      title: "清空全部帳本",
      textHtml: `這會清除所有記錄，是否刪除？`,
      onConfirm: ()=>{
        records = {};
        saveRecords();
        renderCalendar();
      }
    });
  };
}
  /* =========================================================
     匯出 / 匯入（JSON）
  ========================================================= */
  function exportAll(){
    const payload = {
      meta: {
        app: "sbs_duo_book",
        exported_at: new Date().toISOString(),
        version: 1
      },
      records,
      names,
      adjust
    };
    const fn = `sbs_duo_book_backup_${todayISO()}.json`;
    downloadJson(fn, payload);
  }

  function importAllFromFile(file){
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const obj = JSON.parse(reader.result);

        // 允許兩種格式：完整 payload 或單純 records
        if(obj && typeof obj === "object"){
          if(obj.records) records = obj.records;
          else records = obj;

          if(obj.names) names = obj.names;
          if(obj.adjust) adjust = obj.adjust;

          // 存回
          saveRecords();
          saveNames();
          saveAdjust();

          // 同步 UI
          if(inputA) inputA.value = (names.A==="A") ? "" : names.A;
          if(inputB) inputB.value = (names.B==="B") ? "" : names.B;
          if(adjustSide) adjustSide.value = adjust.side || "A";
          if(adjustAmount) adjustAmount.value = adjust.amount || 0;

          updateLabels();
          renderCalendar();
        }
      }catch(e){
        // 失敗就不動原資料
      }
    };
    reader.readAsText(file, "utf-8");
  }

  if(exportBtn) exportBtn.onclick = exportAll;

  if(importBtn && fileInput){
    importBtn.onclick = ()=> fileInput.click();
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
    inputA.value = (names.A==="A") ? "" : names.A;
    inputA.oninput = ()=>{
      names.A = inputA.value || "A";
      saveNames();
      updateLabels();
      renderCalendar();
    };
  }
  if(inputB){
    inputB.value = (names.B==="B") ? "" : names.B;
    inputB.oninput = ()=>{
      names.B = inputB.value || "B";
      saveNames();
      updateLabels();
      renderCalendar();
    };
  }

function updateAdjustColor(){
  const title = document.querySelector(".adjust-title");
  if(!title) return;

  if(adjust.side === "A"){
    title.style.color = "#e58a4b"; // A 色
  }else{
    title.style.color = "#8a79d6"; // B 色
  }
}

if(adjustSide){
  adjustSide.value = adjust.side || "A";
  adjustSide.onchange = ()=>{
    adjust.side = adjustSide.value;
    saveAdjust();
    updateSummary();
    updateAdjustColor();   // ⭐ 同步顏色
  };
}

  if(adjustAmount){
    adjustAmount.value = adjust.amount || 0;
    adjustAmount.oninput = ()=>{
      adjust.amount = Number(adjustAmount.value) || 0;
      saveAdjust();
      updateSummary();
    };
  }

  /* =========================================================
     Init
  ========================================================= */
updateLabels();
renderCalendar();
updateAdjustColor();  // ⭐ 初始化顏色
});