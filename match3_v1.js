(() => {

const SIZE = 8;
const COLORS = 6;

const TOP3_KEY  = "match33_top3_v1";
const LOCAL_KEY = "match33_local_v1";

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const bestEl  = document.getElementById("best");
const top3TextEl = document.getElementById("top3Text");
const statusTextEl = document.getElementById("statusText");

const btnStart   = document.getElementById("btnStart");
const btnStart2  = document.getElementById("btnStart2");
const btnEnd     = document.getElementById("btnEnd");
const btnNew     = document.getElementById("btnNew");
const btnHint    = document.getElementById("btnHint");
const btnShuffle = document.getElementById("btnShuffle");
const btnCloseGO = document.getElementById("btnCloseGO");
const soundOnEl  = document.getElementById("soundOn");

const bombOverlayEl = document.getElementById("bombOverlay");
const comboFloatEl  = document.getElementById("comboFloat");
const gameOverOverlayEl = document.getElementById("gameOverOverlay");
const goMetaEl = document.getElementById("goMeta");

let grid=[];
let domCells=[];
let selected=null;
let busy=false;

let gameRunning=false;
let runStartMs=0;

let score=0;
let combo=0;
let bombShown=false;

/* ===== 基本工具 ===== */
const key = (r,c)=> r*SIZE+c;
const inBounds=(r,c)=> r>=0 && r<SIZE && c>=0 && c<SIZE;
const randColor=()=> Math.floor(Math.random()*COLORS);

/* ===== 音效 ===== */
let audioCtx=null;
function ensureAudio(){
  if(!soundOnEl.checked) return null;
  if(!audioCtx){
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  }
  return audioCtx;
}
function tone(f=440,d=0.06){
  const ctx=ensureAudio();
  if(!ctx) return;
  const o=ctx.createOscillator();
  const g=ctx.createGain();
  o.frequency.value=f;
  o.connect(g);
  g.connect(ctx.destination);
  g.gain.value=0.08;
  o.start();
  o.stop(ctx.currentTime+d);
}

/* ===== 初始化 ===== */
function createDom(){
  boardEl.innerHTML="";
  domCells=[];
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const div=document.createElement("div");
      div.className="cell";
      div.dataset.r=r;
      div.dataset.c=c;
      div.addEventListener("click",onCell);
      boardEl.appendChild(div);
      domCells.push(div);
    }
  }
}

function fillRandom(){
  grid=[];
  for(let r=0;r<SIZE;r++){
    grid[r]=[];
    for(let c=0;c<SIZE;c++){
      grid[r][c]={c:randColor(),sp:null};
    }
  }
}

function render(){
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const el=domCells[key(r,c)];
      el.innerHTML="";
      const cell=grid[r][c];
      if(cell.c===null) continue;

      const candy=document.createElement("div");
      candy.className="candy t"+cell.c;

      if(cell.sp==="sh") candy.classList.add("striped-h");
      if(cell.sp==="sv") candy.classList.add("striped-v");
      if(cell.sp==="w") candy.classList.add("wrapped");
      if(cell.sp==="b") candy.classList.add("colorbomb");

      el.appendChild(candy);
    }
  }
  scoreEl.textContent=score;
  comboEl.textContent=combo;
}

/* ===== 點擊 ===== */
function onCell(e){
  if(!gameRunning || busy) return;
  ensureAudio();

  const r=+e.currentTarget.dataset.r;
  const c=+e.currentTarget.dataset.c;

  if(!selected){
    selected={r,c};
    return;
  }

  if(Math.abs(selected.r-r)+Math.abs(selected.c-c)!==1){
    selected={r,c};
    return;
  }

  swap(selected,{r,c});
  selected=null;
  resolveBoard();
  render();
}

/* ===== 交換 ===== */
function swap(a,b){
  const t=grid[a.r][a.c];
  grid[a.r][a.c]=grid[b.r][b.c];
  grid[b.r][b.c]=t;
  tone(500);
}

/* ===== 消除核心（簡化完整連鎖）===== */
function resolveBoard(){
  let found=false;

  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE-2;c++){
      const v=grid[r][c].c;
      if(v!==null &&
         grid[r][c+1].c===v &&
         grid[r][c+2].c===v){

        for(let k=0;k<3;k++){
          grid[r][c+k]={c:randColor(),sp:null};
        }
        score+=30*(combo+1);
        found=true;
      }
    }
  }

  if(found){
    combo++;
    showCombo();
    tone(700);

    if(score>=10000 && !bombShown){
      bombShown=true;
      bombOverlayEl.style.display="flex";
      setTimeout(()=>bombOverlayEl.style.display="none",2000);
    }
  }else{
    combo=0;
  }
}

/* ===== Combo 浮字 ===== */
function showCombo(){
  if(combo<=1) return;
  comboFloatEl.textContent="COMBO ×"+combo;
  comboFloatEl.style.opacity=1;
  setTimeout(()=>comboFloatEl.style.opacity=0,400);
}

/* ===== 遊戲控制 ===== */
function startGame(){
  score=0;
  combo=0;
  bombShown=false;
  gameRunning=true;
  runStartMs=Date.now();
  btnEnd.disabled=false;
  statusTextEl.textContent="遊戲中";
  fillRandom();
  render();
}

function endGame(){
  if(!gameRunning) return;
  gameRunning=false;
  btnEnd.disabled=true;
  statusTextEl.textContent="已結束";

  const playTime=Math.floor((Date.now()-runStartMs)/1000);

  // 本機紀錄
  let local=JSON.parse(localStorage.getItem(LOCAL_KEY)||"{}");
  local.plays=(local.plays||0)+1;
  local.last=score;
  if(score>(local.best||0)) local.best=score;
  localStorage.setItem(LOCAL_KEY,JSON.stringify(local));

  // TOP3
  let top3=JSON.parse(localStorage.getItem(TOP3_KEY)||"[]");
  top3.push({score,time:playTime});
  top3.sort((a,b)=>b.score-a.score);
  top3=top3.slice(0,3);
  localStorage.setItem(TOP3_KEY,JSON.stringify(top3));

  goMetaEl.textContent="分數："+score+" ｜ 時間："+playTime+" 秒";
  gameOverOverlayEl.style.display="flex";

  updateTop3UI();
}

function updateTop3UI(){
  const top3=JSON.parse(localStorage.getItem(TOP3_KEY)||"[]");
  if(top3.length===0){
    bestEl.textContent="0";
    top3TextEl.textContent="—";
    return;
  }
  bestEl.textContent=top3[0].score;
  top3TextEl.textContent=top3.map((x,i)=>
    "#"+(i+1)+" "+x.score+"("+x.time+"s)"
  ).join(" ｜ ");
}

/* ===== 按鈕 ===== */
btnStart.onclick=startGame;
btnStart2.onclick=()=>{
  gameOverOverlayEl.style.display="none";
  startGame();
};
btnEnd.onclick=endGame;
btnNew.onclick=()=>{fillRandom();render();}
btnCloseGO.onclick=()=>gameOverOverlayEl.style.display="none";

/* ===== 啟動 ===== */
createDom();
fillRandom();
render();
updateTop3UI();

})();