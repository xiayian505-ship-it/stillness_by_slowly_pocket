document.addEventListener("DOMContentLoaded", ()=>{

  const stage     = document.getElementById("stage");
  const yearInput = document.getElementById("yearInput");
  const weekStart = document.getElementById("weekStart");
  const btnRender = document.getElementById("btnRender");
  const btnPrint  = document.getElementById("btnPrint");

  /* 星期標籤 */
  const WEEK_LABELS = {
    1: ["一","二","三","四","五","六","日"],
    0: ["日","一","二","三","四","五","六"]
  };

  /* 月份名稱 */
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  /* 🇹🇼 台灣常見國定／紀念日（西元） */
  const HOLIDAYS = {
    "01-01": "元旦",
    "02-28": "和平紀念日",
    "03-08": "婦女節",
    "03-12": "植樹節",
    "03-29": "青年節",
    "04-04": "兒童節",
    "04-05": "清明節",
    "05-01": "勞動節",
    "06-03": "禁菸節",
    "09-03": "軍人節",
    "09-28": "教師節",
    "10-10": "國慶日",
    "10-25": "光復節",
    "11-12": "國父誕辰",
    "12-25": "聖誕節"
  };

  function daysInMonth(y,m){ return new Date(y,m,0).getDate(); }

  function firstIndex(y,m,startMon){
    const js = new Date(y,m-1,1).getDay();
    return startMon ? (js+6)%7 : js;
  }

  function buildMonth(y,m,startMon){
    const el = document.createElement("div");
    el.className = "month";
    el.innerHTML = `<div class="month_title"><span>${MONTH_NAMES[m-1]}</span><span>${m}</span></div>`;

    const grid = document.createElement("div");
    grid.className = "grid";

    /* 星期列 */
    WEEK_LABELS[startMon?1:0].forEach((w,i)=>{
      const c = document.createElement("div");
      c.className = "cell week";

      let jsDay = startMon ? (i+1)%7 : i;

      if(jsDay===0) c.classList.add("sun");
      else if(jsDay===6) c.classList.add("sat");
      else c.classList.add("wd");

      c.textContent = w;
      grid.appendChild(c);
    });

    const start = firstIndex(y,m,startMon);
    const dim   = daysInMonth(y,m);

    /* 前置空格 */
    for(let i=0;i<start;i++){
      const c=document.createElement("div");
      c.className="cell muted";
      c.textContent="·";
      grid.appendChild(c);
    }

    /* 日期格 */
    for(let d=1; d<=dim; d++){
  const c = document.createElement("div");
  c.className = "cell";

  const num = document.createElement("div");
  num.className = "solar";
  num.textContent = d;

  const key = `${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  if(HOLIDAYS[key]){
    c.classList.add("holiday");

    const tag = document.createElement("div");
    tag.className = "holiday_tag";
    tag.textContent = HOLIDAYS[key];

    c.appendChild(num);  // ⭐ 數字永遠在上
    c.appendChild(tag);  // ⭐ 節日在下
  } else {
    c.appendChild(num);
  }

  const jsDay = new Date(y,m-1,d).getDay();
  if(jsDay === 0) c.classList.add("sun");
  else if(jsDay === 6) c.classList.add("sat");
  else c.classList.add("wd");

  grid.appendChild(c);
}

    el.appendChild(grid);
    return el;
  }

  function buildSheet(y,startM,label,startMon){
    const sheet=document.createElement("section");
    sheet.className="sheet";

    const card=document.createElement("div");
    card.className="card";

    const head = document.createElement("div");
    head.className = "card_head";
    head.innerHTML = `<div>${y}</div><div>${label}</div>`;

    const brand = document.createElement("div");
    brand.className = "brand";
    brand.textContent = "慢慢｜Stillness by Slowly";

    card.appendChild(head);
    card.appendChild(brand);

    const months=document.createElement("div");
    months.className="months";
    for(let m=startM;m<startM+6;m++) months.appendChild(buildMonth(y,m,startMon));

    card.appendChild(months);
    sheet.appendChild(card);
    return sheet;
  }

  function render(){
    const y = Number(yearInput.value);
    const startMon = (Number(weekStart.value)===1);

    stage.innerHTML="";
    stage.appendChild(buildSheet(y,1,"上半年",startMon));
    stage.appendChild(buildSheet(y,7,"下半年",startMon));
    stage.appendChild(buildSheet(y,1,"上半年",startMon));
    stage.appendChild(buildSheet(y,7,"下半年",startMon));
  }

  /* 事件 */
  btnRender?.addEventListener("click", render);
  weekStart?.addEventListener("change", render);
  yearInput?.addEventListener("change", render);
  btnPrint?.addEventListener("click", ()=>window.print());

  render();
});