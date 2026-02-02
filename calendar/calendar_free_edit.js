document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  const stage     = $("stage");
  const yearInput = $("yearInput");
  const weekStart = $("weekStart");
  const btnPrint  = $("btnPrint");

  const noteDate   = $("noteDate");
  const noteText   = $("noteText");
  const btnAddNote = $("btnAddNote");

  let CUSTOM_NOTES = {};
  let currentHalf  = 1;

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

  function buildMonth(y,m,startMon){
    const el = document.createElement("div");
    el.className = "month";
    el.innerHTML = `<div class="month_title"><span>${MONTH_NAMES[m-1]}</span><span>${m}</span></div>`;

    const grid = document.createElement("div");
    grid.className = "grid";

    // 星期列（加回紅字判斷）
    WEEK_LABELS[startMon?1:0].forEach((w,i)=>{
      const c = document.createElement("div");
      c.className = "cell week";

      let jsDay = startMon ? (i+1)%7 : i;
      if(jsDay===0) c.classList.add("sun");
      else if(jsDay===6) c.classList.add("sat");

      c.textContent = w;
      grid.appendChild(c);
    });

    const start = firstIndex(y,m,startMon);
    const dim   = daysInMonth(y,m);

    for(let i=0;i<start;i++){
      const c=document.createElement("div");
      c.className="cell muted";
      grid.appendChild(c);
    }

    for(let d=1; d<=dim; d++){
      const c = document.createElement("div");
      c.className = "cell";

      const num = document.createElement("div");
      num.className = "solar";
      num.contentEditable = "true";
      num.textContent = d;

      const tag = document.createElement("div");
      tag.className = "holiday_tag";
      tag.contentEditable = "true";

      const key = `${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

      if(CUSTOM_NOTES[key]){
        tag.textContent = CUSTOM_NOTES[key];
        c.classList.add("memoday");
      } else {
        c.classList.add("no_tag");
      }

      // ⭐ 加回六日紅字
      const jsDay = new Date(y,m-1,d).getDay();
      if(jsDay===0) c.classList.add("sun");
      else if(jsDay===6) c.classList.add("sat");

      c.appendChild(num);
      c.appendChild(tag);
      grid.appendChild(c);
    }

    el.appendChild(grid);
    return el;
  }

  function buildCard(y,startMonth,label,startMon){
    const card=document.createElement("div");
    card.className="card";

    const head = document.createElement("div");
    head.className="card_head";
    head.innerHTML = `<div>${y}</div><div>${label}</div>`;
    card.appendChild(head);

    const months=document.createElement("div");
    months.className="months";
    for(let m=startMonth;m<startMonth+6;m++){
      months.appendChild(buildMonth(y,m,startMon));
    }

card.appendChild(months);

/* ⭐ 品牌字 */
const brand = document.createElement("div");
brand.className = "brand";
brand.textContent = " 慢 慢 | Stillness by Slowly";
card.appendChild(brand);

return card;
  }

  function render(){
    if(!stage) return;

    const y = Number(yearInput.value);
    const startMon = (Number(weekStart.value)===1);

    stage.innerHTML="";

    if(currentHalf===1){
      stage.appendChild(buildCard(y,1,"上半年",startMon));
    } else {
      stage.appendChild(buildCard(y,7,"下半年",startMon));
    }
  }

  // 切換半年
  stage.addEventListener("click", ()=>{
    currentHalf = currentHalf===1 ? 2 : 1;
    render();
  });

  // 加入標註（限制 2 字）
  btnAddNote && btnAddNote.addEventListener("click", ()=>{
    if(!noteDate?.value || !noteText?.value) return;
    const d = new Date(noteDate.value);
    const key = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    CUSTOM_NOTES[key] = noteText.value.slice(0,2);
    render();
  });

  weekStart && weekStart.addEventListener("change", render);
  yearInput && yearInput.addEventListener("change", render);
  btnPrint && btnPrint.addEventListener("click", ()=>window.print());

  render();
});