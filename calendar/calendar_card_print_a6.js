document.addEventListener("DOMContentLoaded", () => {

  const stage     = document.getElementById("stage");
  const yearInput = document.getElementById("yearInput");
  const weekStart = document.getElementById("weekStart");

  const WEEK_LABELS = {
    0:["日","一","二","三","四","五","六"],
    1:["一","二","三","四","五","六","日"]
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

    WEEK_LABELS[startMon?1:0].forEach((w,i)=>{
      const c = document.createElement("div");
      c.className = "cell week";

      const jsDay = startMon ? (i+1)%7 : i;
      if(jsDay===0) c.classList.add("sun");
      if(jsDay===6) c.classList.add("sat");

      c.textContent = w;
      grid.appendChild(c);
    });

    const start = firstIndex(y,m,startMon);
    const dim   = daysInMonth(y,m);

    for(let i=0;i<start;i++){
      grid.appendChild(document.createElement("div")).className="cell";
    }

    for(let d=1; d<=dim; d++){
      const c = document.createElement("div");
      c.className = "cell";

      const jsDay = new Date(y,m-1,d).getDay();
      if(jsDay===0) c.classList.add("sun");
      if(jsDay===6) c.classList.add("sat");

      const num = document.createElement("div");
      num.className = "solar";
      num.textContent = d;

      c.appendChild(num);
      grid.appendChild(c);
    }

    el.appendChild(grid);
    return el;
  }

  function buildCard(y,startMonth,label,startMon){
    const card = document.createElement("div");
    card.className = "card";

    const head = document.createElement("div");
    head.className = "card_head";
    head.innerHTML = `<div>${y}</div><div>${label}</div>`;
    card.appendChild(head);

    const months = document.createElement("div");
    months.className = "months";

    for(let m=startMonth; m<startMonth+6; m++){
      months.appendChild(buildMonth(y,m,startMon));
    }

    card.appendChild(months);

    const brand = document.createElement("div");
    brand.className = "brand";
    brand.textContent = "慢 慢 | Stillness by Slowly";
    card.appendChild(brand);

    return card;
  }

  function render(){
    const y = Number(yearInput.value);
    const startMon = Number(weekStart.value)===1;

    stage.innerHTML="";
    stage.appendChild(buildCard(y,1,"上半年",startMon));
    stage.appendChild(buildCard(y,7,"下半年",startMon));
  }

  yearInput.addEventListener("change",render);
  weekStart.addEventListener("change",render);

  render();
});