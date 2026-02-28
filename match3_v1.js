(() => {
  /* =========================
     match3_v1
     - 8x8
     - Candy 特殊糖：條紋(行/列)、包裝(3x3)、彩球(清色)
     - 開始/暫停/結束：結束才寫入 TOP3（分數/時間/步數）
     - BOM：每 10000 倍數跳 3 秒（可繼續玩）
     - Combo 浮字 + 分數加成
     - 無步自動洗牌
     - 重整：每局一次（保留分數/時間/步數，只重排棋盤）
  ========================= */

  const SIZE = 8;
  const COLORS = 6;

  // localStorage key（專案隔離 + 版本）
  const TOP3_KEY = "match33_match3_top3_v1";

  // DOM
  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const comboEl = document.getElementById("combo");
  const timeEl  = document.getElementById("time");
  const stepsEl = document.getElementById("steps");
  const stateTextEl = document.getElementById("stateText");
  const rankListEl = document.getElementById("rankList");

  const btnStart   = document.getElementById("btnStart");
  const btnPause   = document.getElementById("btnPause");
  const btnEnd     = document.getElementById("btnEnd");
  const btnHint    = document.getElementById("btnHint");
  const btnShuffle = document.getElementById("btnShuffle");
  const btnRefresh = document.getElementById("btnRefresh");
  const soundOnEl  = document.getElementById("soundOn");

  const bombOverlayEl = document.getElementById("bombOverlay");
  const comboFloatEl  = document.getElementById("comboFloat");

  // cell model:
  // { c: 0..COLORS-1 | null, sp: null|"sh"|"sv"|"w"|"b" }
  let grid = [];
  let domCells = [];

  let selected = null; // {r,c}
  let busy = false;

  // game stats
  let score = 0;
  let combo = 0;
  let steps = 0;

  // game state
  const STATE = { IDLE:"IDLE", RUNNING:"RUNNING", PAUSED:"PAUSED", ENDED:"ENDED" };
  let gameState = STATE.IDLE;

  // timer
  let startMs = 0;
  let elapsedMs = 0;
  let tickRaf = 0;

  // BOM
  let nextBom = 10000;
  let bomShowing = false;

  // refresh (once per game)
  let refreshUsed = false;

  /* ===== WebAudio（簡單合成音效）===== */
  let audioCtx = null;
  function ensureAudio(){
    if(!soundOnEl.checked) return null;
    if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }
  function playTone({freq=440, dur=0.08, type="sine", gain=0.12, slide=0}={}){
    const ctx = ensureAudio();
    if(!ctx) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if(slide){
      o.frequency.exponentialRampToValueAtTime(Math.max(40, freq*slide), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function sfxSwap(){ playTone({freq:520, dur:0.06, type:"triangle", gain:0.10, slide:0.8}); }
  function sfxBad(){ playTone({freq:180, dur:0.10, type:"sawtooth", gain:0.06, slide:0.7}); }
  function sfxPop(n=1){
    const base = 520 * (1 + Math.min(12, combo) * 0.035);
    for(let i=0;i<Math.min(6,n);i++){
      setTimeout(()=>playTone({freq: base*(1+i*0.12), dur:0.06, type:"square", gain:0.07, slide:0.95}), i*18);
    }
  }
  function sfxSpecial(){
    playTone({freq:780, dur:0.10, type:"triangle", gain:0.10, slide:1.6});
    setTimeout(()=>playTone({freq:420, dur:0.12, type:"sine", gain:0.08, slide:0.7}), 25);
  }
  function sfxBomb(){
    playTone({freq:120, dur:0.18, type:"sawtooth", gain:0.07, slide:0.55});
    setTimeout(()=>playTone({freq:220, dur:0.10, type:"triangle", gain:0.05, slide:0.85}), 30);
  }
  function sfxShuffle(){
    playTone({freq:360, dur:0.10, type:"triangle", gain:0.08, slide:1.35});
    setTimeout(()=>playTone({freq:540, dur:0.08, type:"triangle", gain:0.06, slide:1.1}), 60);
  }

  /* ===== helpers ===== */
  const inBounds = (r,c)=> r>=0 && r<SIZE && c>=0 && c<SIZE;
  const k = (r,c)=> r*SIZE + c;
  const randColor = ()=> Math.floor(Math.random()*COLORS);
  const now = ()=> Date.now();

  function pad2(n){ return String(n).padStart(2,"0"); }
  function fmtHMS(ms){
    ms = Math.max(0, ms|0);
    const s = Math.floor(ms/1000);
    const hh = Math.floor(s/3600);
    const mm = Math.floor((s%3600)/60);
    const ss = s%60;
    return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
  }

  function readTop3(){
    try{
      const arr = JSON.parse(localStorage.getItem(TOP3_KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    }catch(_){ return []; }
  }

  function writeTop3(arr){
    localStorage.setItem(TOP3_KEY, JSON.stringify(arr));
  }

  function renderTop3(){
    const top3 = readTop3();
    if(top3.length===0){
      rankListEl.innerHTML = `<div class="rankLine">—</div>`;
      return;
    }
    rankListEl.innerHTML = top3.map((x,i)=>{
      return `<div class="rankLine"><b>TOP ${i+1}</b> ｜ 分數：${x.score} ｜ 時間：${fmtHMS(x.timeMs)} ｜ 步數：${x.steps}</div>`;
    }).join("");
  }

  function saveCurrentToTop3(){
    const item = { score, timeMs: elapsedMs, steps, at: now() };
    let arr = readTop3();
    arr.push(item);
    arr.sort((a,b)=>{
      if(b.score!==a.score) return b.score-a.score;
      if(a.timeMs!==b.timeMs) return a.timeMs-b.timeMs;
      return a.steps-b.steps;
    });
    arr = arr.slice(0,3);
    writeTop3(arr);
    renderTop3();
  }

  function setState(next){
    gameState = next;
    const running = (gameState===STATE.RUNNING);
    const paused  = (gameState===STATE.PAUSED);

    btnStart.disabled = !(gameState===STATE.IDLE || gameState===STATE.ENDED);
    btnPause.disabled = !(running || paused);
    btnEnd.disabled   = !(running || paused);

    btnHint.disabled    = !running;
    btnShuffle.disabled = !running;
    btnRefresh.disabled = !running || refreshUsed;

    btnPause.textContent = paused ? "繼續" : "暫停";
    stateTextEl.textContent =
      (gameState===STATE.IDLE) ? "待開始" :
      (gameState===STATE.RUNNING) ? "進行中" :
      (gameState===STATE.PAUSED) ? "暫停中" :
      "已結束";

    // lock board interactions visually
    for(const el of domCells){
      el.classList.toggle("locked", !running);
    }
  }

  /* ===== board build/render ===== */
  function makeEmptyGrid(){
    grid = Array.from({length: SIZE}, ()=> Array.from({length: SIZE}, ()=> ({c:null, sp:null})));
  }

  function createDom(){
    boardEl.innerHTML = "";
    domCells = [];
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const cell = document.createElement("div");
        cell.className = "cell locked";
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.tabIndex = 0;
        cell.addEventListener("pointerdown", onCellDown);
        cell.addEventListener("keydown", (e)=>{
          if(e.key==="Enter" || e.key===" "){
            e.preventDefault();
            onCellDown(e);
          }
        });
        boardEl.appendChild(cell);
        domCells.push(cell);
      }
    }
  }

  function render(){
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const el = domCells[k(r,c)];
        const cell = grid[r][c];

        el.classList.toggle("selected", !!selected && selected.r===r && selected.c===c);
        el.classList.remove("hint");
        el.innerHTML = "";

        if(cell.c===null && cell.sp!=="b") continue;

        const candy = document.createElement("div");
        candy.className = "candy";

        if(cell.sp==="b"){
          candy.classList.add("colorbomb");
        }else{
          candy.classList.add("t"+cell.c);
          if(cell.sp==="sh") candy.classList.add("striped-h");
          if(cell.sp==="sv") candy.classList.add("striped-v");
          if(cell.sp==="w")  candy.classList.add("wrapped");
        }

        if(cell.sp){
          const bd = document.createElement("div");
          bd.className = "badge";
          bd.textContent = (cell.sp==="sh") ? "—" :
                           (cell.sp==="sv") ? "|" :
                           (cell.sp==="w")  ? "✚" :
                           (cell.sp==="b")  ? "★" : "";
          candy.appendChild(bd);
        }

        el.appendChild(candy);
      }
    }

    scoreEl.textContent = score;
    comboEl.textContent = combo;
    stepsEl.textContent = steps;
    timeEl.textContent  = fmtHMS(elapsedMs);
  }

  /* ===== init board with no immediate matches ===== */
  function createsMatchAt(r,c){
    const cell = grid[r][c];
    if(cell.sp==="b") return false;
    const color = cell.c;

    if(c>=2){
      const a=grid[r][c-1], b=grid[r][c-2];
      if(a.sp!=="b" && b.sp!=="b" && a.c===color && b.c===color) return true;
    }
    if(r>=2){
      const a=grid[r-1][c], b=grid[r-2][c];
      if(a.sp!=="b" && b.sp!=="b" && a.c===color && b.c===color) return true;
    }
    return false;
  }

  function fillRandomNoMatches(){
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        let tries = 0;
        while(true){
          grid[r][c] = {c: randColor(), sp:null};
          tries++;
          if(!createsMatchAt(r,c)) break;
          if(tries>50) break;
        }
      }
    }
  }

  /* ===== timer ===== */
  function startTimer(){
    startMs = now();
    cancelAnimationFrame(tickRaf);
    const tick = ()=>{
      if(gameState!==STATE.RUNNING) return;
      const delta = now() - startMs;
      startMs = now();
      elapsedMs += delta;
      timeEl.textContent = fmtHMS(elapsedMs);
      tickRaf = requestAnimationFrame(tick);
    };
    tickRaf = requestAnimationFrame(tick);
  }
  function stopTimer(){
    cancelAnimationFrame(tickRaf);
    tickRaf = 0;
  }

  /* ===== BOM ===== */
  function checkBOM(){
    if(bomShowing) return;
    if(score < nextBom) return;

    // jump to next multiple (handle big gains)
    while(score >= nextBom) nextBom += 10000;

    bomShowing = true;
    bombOverlayEl.style.display = "flex";
    sfxBomb();

    setTimeout(()=>{
      bombOverlayEl.style.display = "none";
      bomShowing = false;
    }, 3000);
  }

  /* ===== combo float ===== */
  function showComboFloat(){
    if(combo<=1) return;
    comboFloatEl.textContent = `COMBO ×${combo}`;
    comboFloatEl.style.fontSize = `${Math.min(64, 22 + combo*6)}px`;
    comboFloatEl.classList.remove("comboShow");
    void comboFloatEl.offsetWidth;
    comboFloatEl.classList.add("comboShow");
  }

  /* ===== input ===== */
  function onCellDown(e){
    if(gameState!==STATE.RUNNING) return;
    if(busy) return;

    ensureAudio();

    const el = e.currentTarget;
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);

    if(grid[r][c].c===null && grid[r][c].sp!=="b") return;

    if(!selected){
      selected = {r,c};
      render();
      return;
    }

    if(selected.r===r && selected.c===c){
      selected = null;
      render();
      return;
    }

    if(Math.abs(selected.r-r)+Math.abs(selected.c-c)!==1){
      selected = {r,c};
      render();
      return;
    }

    const a = selected;
    const b = {r,c};
    selected = null;
    trySwap(a,b);
  }

  /* ===== match finding ===== */
  function findAllMatches(){
    const groups = [];

    // horizontal
    for(let r=0;r<SIZE;r++){
      let c=0;
      while(c<SIZE){
        const cell = grid[r][c];
        const color = (cell.sp==="b") ? null : cell.c;
        if(color===null){ c++; continue; }
        let j=c+1;
        while(j<SIZE){
          const cc = grid[r][j];
          if(cc.sp==="b" || cc.c!==color) break;
          j++;
        }
        const len = j-c;
        if(len>=3){
          const cells=[];
          for(let x=c;x<j;x++) cells.push({r,c:x});
          groups.push({type:"h", len, cells});
        }
        c = j;
      }
    }

    // vertical
    for(let c=0;c<SIZE;c++){
      let r=0;
      while(r<SIZE){
        const cell = grid[r][c];
        const color = (cell.sp==="b") ? null : cell.c;
        if(color===null){ r++; continue; }
        let j=r+1;
        while(j<SIZE){
          const cc = grid[j][c];
          if(cc.sp==="b" || cc.c!==color) break;
          j++;
        }
        const len = j-r;
        if(len>=3){
          const cells=[];
          for(let x=r;x<j;x++) cells.push({r:x,c});
          groups.push({type:"v", len, cells});
        }
        r = j;
      }
    }

    return { groups };
  }

  function computeSpecialCreations(matches){
    const creations = [];
    const used = new Set();

    // belong map for T/L
    const belong = new Map(); // k -> [groupIdx...]
    matches.groups.forEach((g, idx)=>{
      g.cells.forEach(p=>{
        const kk = k(p.r,p.c);
        if(!belong.has(kk)) belong.set(kk, []);
        belong.get(kk).push(idx);
      });
    });

    // T/L => wrapped
    for(const [kk, arr] of belong.entries()){
      if(arr.length<2) continue;
      const r = Math.floor(kk/SIZE), c = kk%SIZE;
      const cell = grid[r][c];
      if(cell.sp==="b") continue;
      const color = cell.c;

      let hasH=false, hasV=false;
      for(const idx of arr){
        const g = matches.groups[idx];
        if(g.type==="h") hasH=true;
        if(g.type==="v") hasV=true;
      }
      if(hasH && hasV && !used.has(kk)){
        creations.push({r,c, sp:"w", color});
        used.add(kk);
      }
    }

    // 5 => colorbomb, 4 => striped
    for(const g of matches.groups){
      if(g.len>=5){
        const mid = g.cells[Math.floor(g.cells.length/2)];
        const kk = k(mid.r, mid.c);
        if(used.has(kk)) continue;
        const color = grid[mid.r][mid.c].c;
        creations.push({r: mid.r, c: mid.c, sp:"b", color});
        used.add(kk);
      }else if(g.len===4){
        const mid = g.cells[1];
        const kk = k(mid.r, mid.c);
        if(used.has(kk)) continue;
        const color = grid[mid.r][mid.c].c;
        const sp = (g.type==="h") ? "sh" : "sv";
        creations.push({r: mid.r, c: mid.c, sp, color});
        used.add(kk);
      }
    }

    return creations;
  }

  /* ===== clear/apply ===== */
  function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }

  async function expandByTriggeredSpecials(toClear){
    const expanded = new Set([...toClear]);
    let changed = true;
    let safety = 0;

    while(changed && safety<12){
      changed = false;
      safety++;

      for(const kk of Array.from(expanded)){
        const r = Math.floor(kk/SIZE), c = kk%SIZE;
        const cell = grid[r][c];
        if(!cell || !cell.sp) continue;

        if(cell.sp==="b"){
          for(let rr=0;rr<SIZE;rr++){
            for(let cc=0;cc<SIZE;cc++){
              const k2 = k(rr,cc);
              if(!expanded.has(k2)){ expanded.add(k2); changed=true; }
            }
          }
          continue;
        }

        if(cell.sp==="sh"){
          for(let cc=0;cc<SIZE;cc++){
            const k2 = k(r,cc);
            if(!expanded.has(k2)){ expanded.add(k2); changed=true; }
          }
        }else if(cell.sp==="sv"){
          for(let rr=0;rr<SIZE;rr++){
            const k2 = k(rr,c);
            if(!expanded.has(k2)){ expanded.add(k2); changed=true; }
          }
        }else if(cell.sp==="w"){
          for(let dr=-1;dr<=1;dr++){
            for(let dc=-1;dc<=1;dc++){
              const rr=r+dr, cc=c+dc;
              if(!inBounds(rr,cc)) continue;
              const k2 = k(rr,cc);
              if(!expanded.has(k2)){ expanded.add(k2); changed=true; }
            }
          }
        }
      }
    }
    return expanded;
  }

  function applyClear(toClearSet, preserveSet){
    let count = 0;
    for(const kk of toClearSet){
      if(preserveSet.has(kk)) continue;
      const r = Math.floor(kk / SIZE);
      const c = kk % SIZE;
      if(grid[r][c].c!==null || grid[r][c].sp==="b"){
        // pop anim
        const el = domCells[k(r,c)];
        const candy = el.querySelector(".candy");
        if(candy) candy.classList.add("pop");

        grid[r][c] = {c:null, sp:null};
        count++;
      }
    }
    return count;
  }

  function dropDownAndFill(){
    for(let c=0;c<SIZE;c++){
      const stack = [];
      for(let r=SIZE-1;r>=0;r--){
        const cell = grid[r][c];
        if(cell.c!==null || cell.sp==="b") stack.push(cell);
      }
      for(let r=SIZE-1;r>=0;r--){
        if(stack.length){
          grid[r][c] = stack.shift();
        }else{
          grid[r][c] = {c: randColor(), sp:null};
        }
      }
    }
  }

  /* ===== specials trigger on swap ===== */
  function swapCells(a,b){
    const tmp = grid[a.r][a.c];
    grid[a.r][a.c] = grid[b.r][b.c];
    grid[b.r][b.c] = tmp;
  }

  async function triggerColorBombAt(bombPos, targetColor){
    const toClear = new Set();
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const cell = grid[r][c];
        if(cell.sp==="b") continue;
        if(cell.c===targetColor) toClear.add(k(r,c));
      }
    }
    toClear.add(k(bombPos.r, bombPos.c));

    const expanded = await expandByTriggeredSpecials(toClear);
    const cleared = applyClear(expanded, new Set());
    // score
    const gain = cleared * 14 * Math.max(1, combo);
    score += gain;

    sfxBomb();
    render();
    await sleep(160);
    dropDownAndFill();
    render();
    await sleep(120);

    checkBOM();
  }

  async function triggerClearAll(){
    const toClear = new Set();
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++) toClear.add(k(r,c));
    }
    const expanded = await expandByTriggeredSpecials(toClear);
    const cleared = applyClear(expanded, new Set());
    score += cleared * 16 * Math.max(1, combo);

    sfxBomb();
    render();
    await sleep(180);
    dropDownAndFill();
    render();
    await sleep(140);

    checkBOM();
  }

  async function triggerSpecialAt(pos){
    const cell = grid[pos.r][pos.c];
    if(!cell.sp) return;

    if(cell.sp==="b"){
      await triggerClearAll();
      return;
    }

    const set = new Set([k(pos.r,pos.c)]);
    const expanded = await expandByTriggeredSpecials(set);
    let count = 0;
    for(const kk of expanded){
      const r = Math.floor(kk/SIZE), c = kk%SIZE;
      if(grid[r][c].c!==null || grid[r][c].sp==="b"){
        grid[r][c] = {c:null, sp:null};
        count++;
      }
    }
    score += count * 12 * Math.max(1, combo);

    if(cell.sp==="w") sfxBomb(); else sfxSpecial();
    render();
    await sleep(140);
    dropDownAndFill();
    render();
    await sleep(120);

    checkBOM();
  }

  async function maybeTriggerSpecialOnSwap(a,b){
    const ca = grid[a.r][a.c];
    const cb = grid[b.r][b.c];

    // colorbomb combos
    if(ca.sp==="b" && cb.sp==="b"){
      await triggerClearAll();
      return true;
    }
    if(ca.sp==="b" && cb.sp!=="b"){
      await triggerColorBombAt(a, cb.c);
      return true;
    }
    if(cb.sp==="b" && ca.sp!=="b"){
      await triggerColorBombAt(b, ca.c);
      return true;
    }

    // special + special
    if(ca.sp && cb.sp && ca.sp!=="b" && cb.sp!=="b"){
      await triggerSpecialAt(a);
      await triggerSpecialAt(b);
      return true;
    }
    return false;
  }

  /* ===== cascades ===== */
  async function resolveCascades(initialMatches=null){
    combo = 0;
    let matches = initialMatches || findAllMatches();

    while(matches.groups.length>0){
      combo++;
      showComboFloat();

      const specialsToCreate = computeSpecialCreations(matches);

      const toClear = new Set();
      for(const g of matches.groups){
        for(const pos of g.cells) toClear.add(k(pos.r,pos.c));
      }

      const expanded = await expandByTriggeredSpecials(toClear);
      const preserve = new Set(specialsToCreate.map(s=> k(s.r,s.c)));

      const clearedCount = applyClear(expanded, preserve);

      // create specials
      for(const s of specialsToCreate){
        grid[s.r][s.c] = { c: s.color, sp: s.sp };
      }

      // scoring: base * cleared * combo (with a little candy-ish scaling)
      const base = 10;
      const gain = clearedCount * base * combo;
      score += gain;

      sfxPop(Math.min(6, clearedCount));
      if(specialsToCreate.length>0) sfxSpecial();

      render();
      checkBOM();

      await sleep(120);
      dropDownAndFill();
      render();
      await sleep(120);

      matches = findAllMatches();
    }
  }

  /* ===== moves / hint / shuffle ===== */
  function findAnyMove(){
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const dirs = [[0,1],[1,0]];
        for(const [dr,dc] of dirs){
          const rr=r+dr, cc=c+dc;
          if(!inBounds(rr,cc)) continue;

          const A = grid[r][c], B = grid[rr][cc];
          // colorbomb swap always valid
          if(A.sp==="b" || B.sp==="b") return [{r,c},{r:rr,c:cc}];

          swapCells({r,c},{r:rr,c:cc});
          const m = findAllMatches();
          swapCells({r,c},{r:rr,c:cc});

          if(m.groups.length>0) return [{r,c},{r:rr,c:cc}];
        }
      }
    }
    return null;
  }

  function clearHints(){
    for(const el of domCells) el.classList.remove("hint");
  }

  function showHint(){
    if(gameState!==STATE.RUNNING) return;
    if(busy) return;
    clearHints();
    const move = findAnyMove();
    if(!move){
      doShuffle(true);
      return;
    }
    for(const p of move){
      domCells[k(p.r,p.c)].classList.add("hint");
    }
    playTone({freq:620, dur:0.08, type:"triangle", gain:0.06, slide:1.12});
  }

  function doShuffle(fromAuto=false){
    if(gameState!==STATE.RUNNING) return;
    if(busy) return;
    busy = true;
    clearHints();
    selected = null;

    const bag = [];
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++) bag.push(grid[r][c]);
    }
    for(let i=bag.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [bag[i],bag[j]] = [bag[j],bag[i]];
    }
    let idx=0;
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++) grid[r][c] = bag[idx++];
    }

    // avoid instant huge matches: allow a little, but try a few times
    let guard = 0;
    while(findAllMatches().groups.length>0 && guard<4){
      guard++;
      for(let i=bag.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [bag[i],bag[j]] = [bag[j],bag[i]];
      }
      idx=0;
      for(let r=0;r<SIZE;r++){
        for(let c=0;c<SIZE;c++) grid[r][c] = bag[idx++];
      }
    }

    sfxShuffle();
    render();

    setTimeout(()=>{
      busy = false;
      ensurePlayableOrShuffle();
      if(fromAuto) showHint();
    }, 120);
  }

  function ensurePlayableOrShuffle(){
    const move = findAnyMove();
    if(!move) doShuffle(true);
  }

  /* ===== swap ===== */
  async function trySwap(a,b){
    if(gameState!==STATE.RUNNING) return;
    if(busy) return;
    busy = true;

    swapCells(a,b);
    render();
    sfxSwap();

    // handle specials swap
    const specialTriggered = await maybeTriggerSpecialOnSwap(a,b);
    if(specialTriggered){
      steps++; // successful action
      render();
      await resolveCascades();
      busy = false;
      ensurePlayableOrShuffle();
      return;
    }

    const matches = findAllMatches();
    if(matches.groups.length===0){
      swapCells(a,b);
      render();
      sfxBad();
      busy = false;
      return;
    }

    steps++; // successful action
    render();

    await resolveCascades(matches);
    busy = false;
    ensurePlayableOrShuffle();
  }

  /* ===== controls ===== */
  function newBoard(){
    makeEmptyGrid();
    fillRandomNoMatches();
    selected = null;
    busy = false;
    render();
    ensurePlayableOrShuffle();
  }

  function newGame(){
    // reset
    score = 0;
    combo = 0;
    steps = 0;
    elapsedMs = 0;
    nextBom = 10000;
    bomShowing = false;
    refreshUsed = false;
    bombOverlayEl.style.display = "none";

    newBoard();
    setState(STATE.IDLE);
  }

  function startGame(){
    if(gameState!==STATE.IDLE && gameState!==STATE.ENDED) return;
    // if ended, start fresh
    if(gameState===STATE.ENDED){
      score = 0;
      combo = 0;
      steps = 0;
      elapsedMs = 0;
      nextBom = 10000;
      bomShowing = false;
      refreshUsed = false;
      bombOverlayEl.style.display = "none";
      newBoard();
    }
    setState(STATE.RUNNING);
    startTimer();
    render();
  }

  function togglePause(){
    if(gameState===STATE.RUNNING){
      setState(STATE.PAUSED);
      stopTimer();
    }else if(gameState===STATE.PAUSED){
      setState(STATE.RUNNING);
      startTimer();
    }
  }

  function endGame(){
    if(gameState!==STATE.RUNNING && gameState!==STATE.PAUSED) return;
    stopTimer();
    setState(STATE.ENDED);
    clearHints();
    selected = null;
    render();

    // only here: save top3
    saveCurrentToTop3();
  }

  function refreshBoardOnce(){
    if(gameState!==STATE.RUNNING) return;
    if(refreshUsed) return;
    refreshUsed = true;
    btnRefresh.disabled = true;
    // keep specials in bag (like shuffle), but stronger re-random
    doShuffle(false);
  }

  /* ===== wire ===== */
  btnStart.addEventListener("click", ()=> startGame());
  btnPause.addEventListener("click", ()=> togglePause());
  btnEnd.addEventListener("click", ()=> endGame());

  btnHint.addEventListener("click", ()=> showHint());
  btnShuffle.addEventListener("click", ()=> doShuffle(false));
  btnRefresh.addEventListener("click", ()=> refreshBoardOnce());

  soundOnEl.addEventListener("change", ()=>{
    if(soundOnEl.checked){
      ensureAudio();
      playTone({freq:660, dur:0.08, type:"triangle", gain:0.06, slide:1.2});
    }
  });

  /* ===== start ===== */
  createDom();
  renderTop3();
  newGame(); // idle ready
})();