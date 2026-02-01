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
  "01-01": { name:"元旦", off:true },
  "02-28": { name:"和平", off:true },
  "03-08": { name:"婦女", off:false },
  "03-12": { name:"植樹", off:false },
  "03-29": { name:"青年", off:false },
  "04-04": { name:"兒童", off:true },
  "04-05": { name:"清明", off:true },
  "05-01": { name:"勞動", off:true },
  "06-03": { name:"禁菸", off:false },
  "09-03": { name:"軍人", off:false },
  "09-28": { name:"教師", off:false },
  "10-10": { name:"國慶", off:true },
  "10-25": { name:"光復", off:false },
  "12-25": { name:"聖誕", off:false }, 

  // 二分二至（不放假）
"03-20": { name:"春分", off:false, term:true },
"06-21": { name:"夏至", off:false, term:true },
"09-23": { name:"秋分", off:false, term:true },
"12-21": { name:"冬至", off:false, term:true },
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
  const h = HOLIDAYS[key];

  if(h.off){
    c.classList.add("offday");      // 放假
  }else if(h.term){
    c.classList.add("termday");     // ⭐ 節氣
  }else{
    c.classList.add("memoday");     // 紀念日
  }

  const tag = document.createElement("div");
  tag.className = "holiday_tag";
  tag.textContent = h.name;

  c.appendChild(num);
  c.appendChild(tag);
}else{
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

  if(!stage) return;

  const y = yearInput ? Number(yearInput.value) : new Date().getFullYear();
  const startMon = weekStart ? (Number(weekStart.value)===1) : true;

  stage.innerHTML="";

  // 正面
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
