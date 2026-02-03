/* calendar_book_edit.js */
document.addEventListener("DOMContentLoaded", () => {

  const $ = (id) => document.getElementById(id);

  // ===== DOM =====
  const stage      = $("stage");
  const yearInput  = $("yearInput");
  const weekStart  = $("weekStart");
  const btnPrint   = $("btnPrint");

  const btnAddNote = $("btnAddNote");
  const noteDate   = $("noteDate");
  const noteText   = $("noteText");

  // ===== 防呆：必要節點不存在就直接停（避免整支炸掉）=====
  if(!stage){
    console.error("stage not found (#stage)");
    return;
  }

  // ===== 狀態：自訂標註（以 MM-DD 當 key）=====
  let CUSTOM_NOTES = {};

  // ===== 常數 =====
  const WEEK_LABELS = {
    1: ["一","二","三","四","五","六","日"],
    0: ["日","一","二","三","四","五","六"]
  };

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const daysInMonth = (y,m)=> new Date(y,m,0).getDate();
  const firstIndex  = (y,m,startMon)=>{
    const js = new Date(y,m-1,1).getDay();
    return startMon ? (js+6)%7 : js;
  };

  // ===== 工具：生成 key =====
  function mmddKeyFromDateInput(value){
    // value: "YYYY-MM-DD"
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return null;
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    return `${mm}-${dd}`;
  }

  // ===== 生成：單月 =====
  function buildMonth(y,m,startMon){
    const el = document.createElement("div");
    el.className = "month";
    el.innerHTML = `<div class="month_title"><span>${MONTH_NAMES[m-1]}</span><span>${m}</span></div>`;

    const grid = document.createElement("div");
    grid.className = "grid";

    // 星期列
    WEEK_LABELS[startMon?1:0].forEach((w,i)=>{
      const c = document.createElement("div");
      c.className = "cell week";

      const jsDay = startMon ? (i+1)%7 : i;
      if(jsDay===0) c.classList.add("sun");
      else if(jsDay===6) c.classList.add("sat");

      c.textContent = w;
      grid.appendChild(c);
    });

    // 前置空格
    const start = firstIndex(y,m,startMon);
    const dim   = daysInMonth(y,m);

    for(let i=0;i<start;i++){
      const c = document.createElement("div");
      c.className = "cell muted";
      grid.appendChild(c);
    }

    // 日期格
    for(let d=1; d<=dim; d++){
      const c = document.createElement("div");
      c.className = "cell";

      // 日期數字
      const num = document.createElement("div");
      num.className = "solar";
      num.textContent = d;

      // 標註（2字）
      const tag = document.createElement("div");
      tag.className = "holiday_tag";
      tag.contentEditable = "true"; // 允許直接在格子裡改字

      const key = `${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

      if(CUSTOM_NOTES[key]){
        tag.textContent = CUSTOM_NOTES[key];
        c.classList.add("memoday");
      }else{
        // 沒標註就留空，但保留高度避免版面跳
        tag.textContent = "";
        c.classList.add("no_tag");
      }

      // 六日色
      const jsDay = new Date(y,m-1,d).getDay();
      if(jsDay===0) c.classList.add("sun");
      else if(jsDay===6) c.classList.add("sat");

      // ⭐ 直接編輯 tag 後同步回 CUSTOM_NOTES（限制 2 字）
      tag.addEventListener("input", ()=>{
        const v = (tag.textContent || "").trim().slice(0,2);
        tag.textContent = v;

        if(v){
          CUSTOM_NOTES[key] = v;
          c.classList.add("memoday");
          c.classList.remove("no_tag");
        }else{
          delete CUSTOM_NOTES[key];
          c.classList.remove("memoday");
          c.classList.add("no_tag");
        }
      });

      c.appendChild(num);
      c.appendChild(tag);
      grid.appendChild(c);
    }

    el.appendChild(grid);
    return el;
  }

  // ===== 生成：半年卡 =====
  function buildCard(y,startMonth,label,startMon){
    const card = document.createElement("div");
    card.className = "card";

    // 頭
    const head = document.createElement("div");
    head.className = "card_head";
    head.innerHTML = `<div>${y}</div><div>${label}</div>`;
    card.appendChild(head);

    // 月份區
    const months = document.createElement("div");
    months.className = "months";

    for(let m=startMonth; m<startMonth+6; m++){
      months.appendChild(buildMonth(y,m,startMon));
    }

    card.appendChild(months);

    // 品牌字（你說之後會換位置，所以先照舊）
    const brand = document.createElement("div");
    brand.className = "brand";
    brand.textContent = "慢 慢 | Stillness by Slowly";
    card.appendChild(brand);

    return card;
  }

  // ===== 渲染 =====
  function render(){
    const y = Number(yearInput?.value || new Date().getFullYear());
    const startMon = (Number(weekStart?.value || 0) === 1);

    stage.innerHTML = "";
    stage.appendChild(buildCard(y,1,"上半年",startMon));
    stage.appendChild(buildCard(y,7,"下半年",startMon));
  }

  // ===== 綁事件（全部加防呆，避免 null addEventListener）=====
  if(yearInput) yearInput.addEventListener("change", render);
  if(weekStart) weekStart.addEventListener("change", render);
  if(btnPrint)  btnPrint.addEventListener("click", ()=>window.print());

  // 加入標註（用上方 input）
  if(btnAddNote){
    btnAddNote.addEventListener("click", ()=>{
      const key = noteDate?.value ? mmddKeyFromDateInput(noteDate.value) : null;
      const txt = (noteText?.value || "").trim().slice(0,2);

      if(!key || !txt) return;

      CUSTOM_NOTES[key] = txt;
      // 清空輸入（可選，覺得方便就留）
      if(noteText) noteText.value = "";

      render();
    });
  }

  render();
});