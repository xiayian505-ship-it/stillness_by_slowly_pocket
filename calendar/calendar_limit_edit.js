document.addEventListener("DOMContentLoaded", ()=>{

  const stage     = document.getElementById("stage");
  const yearInput = document.getElementById("yearInput");
  const weekStart = document.getElementById("weekStart");
  const btnPrint  = document.getElementById("btnPrint");
  const btnAddLunar = document.getElementById("btnAddLunar");
  const lunarName   = document.getElementById("lunarName");
  const lunarDate   = document.getElementById("lunarDate");

  let LUNAR_EVENTS = {};

  const WEEK_LABELS = {
    1: ["一","二","三","四","五","六","日"],
    0: ["日","一","二","三","四","五","六"]
  };

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const HOLIDAYS = {
    "01-01": { name:"元旦", off:true },
    "02-28": { name:"和平", off:true },
    "04-04": { name:"兒童", off:true },
    "04-05": { name:"清明", off:true },
    "05-01": { name:"勞動", off:true },
    "10-10": { name:"國慶", off:true }
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
      num.textContent = d;

      const tag = document.createElement("div");
      tag.className = "holiday_tag";

      const key = `${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

      if(HOLIDAYS[key]){
        c.classList.add("offday");
        tag.textContent = HOLIDAYS[key].name;
      }
      else if(LUNAR_EVENTS[key]){
        const name = LUNAR_EVENTS[key];
        tag.textContent = name;

        if(["除夕","初一","端午","中秋"].includes(name))
          c.classList.add("lunar_main");
        else if(["初二","初三","初四","初五","七夕"].includes(name))
          c.classList.add("lunar_minor");
        else if(["春分","夏至","秋分","冬至"].includes(name))
          c.classList.add("lunar_term");
        else if(name==="中元")
          c.classList.add("lunar_ghost");
      }
      else{
        tag.textContent = "";
        c.classList.add("no_tag");
      }

      c.appendChild(num);
      c.appendChild(tag);

      const jsDay = new Date(y,m-1,d).getDay();
      if(jsDay===0) c.classList.add("sun");
      else if(jsDay===6) c.classList.add("sat");

      grid.appendChild(c);
    }

    el.appendChild(grid);
    return el;
  }

  function buildSheet(y,startM,label,startMon){
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
    return card;
  }

  function render(){
    if(!stage) return;

    const y = yearInput ? Number(yearInput.value) : new Date().getFullYear();
    const startMon = weekStart ? (Number(weekStart.value)===1) : true;

    stage.innerHTML="";
    stage.appendChild(buildSheet(y,1,"上半年",startMon));
    stage.appendChild(buildSheet(y,7,"下半年",startMon));
  }

  btnAddLunar?.addEventListener("click", ()=>{
    if(!lunarDate?.value) return;
    const d = new Date(lunarDate.value);
    const key = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    LUNAR_EVENTS[key] = lunarName.value;
    render();
  });

  weekStart?.addEventListener("change", render);
  yearInput?.addEventListener("change", render);
  btnPrint?.addEventListener("click", ()=>window.print());

  render();
});