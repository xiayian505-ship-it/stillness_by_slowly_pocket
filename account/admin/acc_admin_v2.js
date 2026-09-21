document.addEventListener("DOMContentLoaded", async ()=>{
  /* =========================================================
     慢慢｜共付日常 acc_admin_v2.js
     - 本機帳本仍可獨立使用，不依賴雲端初始化
     - 共享帳本以 URL 的 book id 指定帳本，再用共享密碼取得 90 天編輯資格
     - Supabase Auth 使用背景 anonymous session，不要求 Email／帳號登入
     - 唯讀分享使用 URL 的 book + view token；後端只授予該帳本 SELECT
     - Email 申請流程目前不實作
     - 帳本核心 records / names / adjust / currencyBook 維持既有格式
  ========================================================= */
  const RETAIN_DAYS=365;
  const STORE_NAMESPACE="sbs-duo-book-v2";
  const STATE_ID="main";
  const SUPABASE_URL="https://bkjqaetxwvcdciieevvs.supabase.co";
  const SUPABASE_KEY="sb_publishable_dAHoIimWgbGAF2wtIVSZfg_V8rzc200";
  if(!window.DateTime||!window.Timestamp||!window.Money||!window.Currency||!window.DataBackup||!window.RealtimeSync||!window.FictionChange||!window.FictionStorage){
    alert("共用模組載入失敗，請重新整理後再試。");
    return;
  }
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const calendarGrid=$("#calendarGrid"), monthTitle=$(".month-title"), navBtns=$$(".nav-btn");
  const prevBtn=navBtns[0], nextBtn=navBtns[1], refreshBtn=$(".refresh"), clearAllBtn=$("#clearAllBtn");
  const exportBtn=$("#exportBtn"), importBtn=$("#importBtn"), fileInput=$("#fileInput");
  const inputA=$("#nameA"), inputB=$("#nameB"), sumAB=$("#sumAB"), sumBA=$("#sumBA"), finalResult=$("#finalResult"), currencyStats=$("#currencyStats");
  const adjustSide=$("#adjustSide"), adjustAmount=$("#adjustAmount"), adjustCancelBtn=$("#adjustCancelBtn"), adjustConfirmBtn=$("#adjustConfirmBtn");
  const modal=$("#detailModal"), modalDate=$("#modalDate"), closeBtn=$("#detailModal .close"), listA=$("#listA"), listB=$("#listB"), addBtns=$$(".add");
  const editModal=$("#editModal"), editTitleEl=editModal?.querySelector(".danger-title"), editItem=$("#editItem"), editAmount=$("#editAmount"), editCancel=$("#editCancel"), editOk=$("#editOk"), editCurrency=$("#editCurrency"), editRate=$("#editRate");
  const dangerModal=$("#dangerModal"), dangerTitle=dangerModal?.querySelector(".danger-title"), dangerText=dangerModal?.querySelector(".danger-text"), dangerCancel=$("#dangerCancelBtn"), dangerConfirm=$("#dangerOkBtn");
  const settleCurrency=$("#settleCurrency"), applyBtn=$("#applyCurrencyBtn");
  const manageBookBtn=$("#manageBookBtn"), manageBookModal=$("#manageBookModal"), manageBookClose=$("#manageBookClose");
  const bookContext=$("#bookContext"), editorUnlockForm=$("#editorUnlockForm"), editorBookPassword=$("#editorBookPassword"), editorAccessMessage=$("#editorAccessMessage");
  const bookEntryMenu=$("#bookEntryMenu"), enterLocalBookBtn=$("#enterLocalBookBtn"), enterCloudBookBtn=$("#enterCloudBookBtn"), enterAdminModeBtn=$("#enterAdminModeBtn"), cloudBookPanel=$("#cloudBookPanel"), adminLoginPanel=$("#adminLoginPanel"), adminToolsPanel=$("#adminToolsPanel");
  const adminLoginForm=$("#adminLoginForm"), adminEmail=$("#adminEmail"), adminPassword=$("#adminPassword"), adminLoginMessage=$("#adminLoginMessage"), adminStatus=$("#adminStatus"), leaveAdminModeBtn=$("#leaveAdminModeBtn");
  const adminBookSelect=$("#adminBookSelect"), adminBookMessage=$("#adminBookMessage"), adminReadonlyTools=$("#adminReadonlyTools");
  const resetReadonlyLinkBtn=$("#resetReadonlyLinkBtn"), copyReadonlyLinkBtn=$("#copyReadonlyLinkBtn"), readonlyShareLink=$("#readonlyShareLink");

  const fakeSets=[
    {native:settleCurrency,root:$("#settleCurrencyFake"),trigger:$("#settleCurrencyTrigger"),menu:$("#settleCurrencyMenu"),label:$("#settleCurrencyLabel"),opts:$$("#settleCurrencyMenu .fake-select-option")},
    {native:editCurrency,root:$("#editCurrencyFake"),trigger:$("#editCurrencyTrigger"),menu:$("#editCurrencyMenu"),label:$("#editCurrencyLabel"),opts:$$("#editCurrencyMenu .fake-select-option")}
  ];
  const adjustFake={root:$("#adjustSideFake"),trigger:$("#adjustSideTrigger"),menu:$("#adjustSideMenu"),label:$("#adjustSideLabel"),opts:$$("#adjustSideMenu .fake-select-option")};

  const pad=n=>String(n).padStart(2,"0");
  const clone=o=>typeof structuredClone==="function"?structuredClone(o):JSON.parse(JSON.stringify(o));
  const plain=o=>!!o&&typeof o==="object"&&!Array.isArray(o);
  const esc=v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const validDate=k=>DateTime.parseDateKey(k)!==null;
  function validRecords(o){return plain(o)&&Object.entries(o).every(([d,rows])=>validDate(d)&&Array.isArray(rows)&&rows.every(r=>plain(r)&&["a_to_b","b_to_a"].includes(r.type)&&Number.isFinite(Number(r.amount))&&Number(r.amount)>0));}
  function validCurrency(o){return plain(o)&&Object.entries(o).every(([d,rows])=>validDate(d)&&Array.isArray(rows)&&rows.every(c=>c==null||(plain(c)&&typeof c.currency==="string"&&Number(c.rate)>0&&Number(c.baseTWD)>=0)));}
  function normalize(raw){const s=plain(raw)?raw:{};return {records:validRecords(s.records)?s.records:{},names:plain(s.names)?{A:String(s.names.A||"A"),B:String(s.names.B||"B")}:{A:"A",B:"B"},adjust:plain(s.adjust)?s.adjust:{},currencyBook:validCurrency(s.currencyBook)?s.currencyBook:{}};}

  /* ===== v2 Storage boundary：Local + shared cloud book ===== */
  const localStore=FictionStorage.create({namespace:STORE_NAMESPACE});
  const localState=localStore.collection("state");
  const bookChange=FictionChange.create({name:"sbs-duo-book-v2"});
  const supabase=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY) || null;

  const activeBook={mode:"local",id:"",title:"本機帳本",role:"local"};
  let records={},names={A:"A",B:"B"},adjust={},currencyBook={},saveQueue=Promise.resolve();
  let realtimeChannel=null;
  const now=new Date(); let viewYear=now.getFullYear(),viewMonth=now.getMonth();
  const monthPrefix=()=>`${viewYear}-${pad(viewMonth+1)}-`, monthKey=()=>`${viewYear}-${pad(viewMonth+1)}`;
  const isCloud=()=>activeBook.mode==="cloud";
  const canEdit=()=>activeBook.role!=="viewer";
  const urlParams=()=>new URLSearchParams(location.search);
  const urlBookId=()=>urlParams().get("book")?.trim()||"";
  const urlViewToken=()=>urlParams().get("view")?.trim()||"";

  function localSnapshot(){return clone({id:STATE_ID,records,names,adjust,currencyBook});}
  function prune(){
    let changed=false; const today=DateTime.dateKey();
    for(const obj of [records,currencyBook])Object.keys(obj).forEach(k=>{const age=DateTime.diffDays(k,today);if(age!==null&&age>RETAIN_DAYS){delete obj[k];changed=true;}});
    return changed;
  }

  async function loadActive(){
    if(isCloud()){
      if(!supabase||!activeBook.id)throw new Error("cloud unavailable");
      const {data,error}=await supabase.from("books").select("state").eq("id",activeBook.id).single();
      if(error)throw error;
      const s=normalize(data?.state);
      records=s.records; names=s.names; adjust=s.adjust; currencyBook=s.currencyBook;
      return;
    }
    const s=normalize(await localState.get(STATE_ID));
    records=s.records; names=s.names; adjust=s.adjust; currencyBook=s.currencyBook;
  }

  function saveState(type="save"){
    prune();
    const op=Timestamp.create();
    const state=clone({records,names,adjust,currencyBook});
    saveQueue=saveQueue.catch(()=>{}).then(async()=>{
      if(isCloud()){
        const {error}=await supabase.from("books").update({state}).eq("id",activeBook.id);
        if(error)throw error;
      }else{
        await localState.upsert({id:STATE_ID,...state});
        bookChange.emit({type,collection:"state",operationId:op});
      }
    }).catch(error=>{
      console.error("[共付日常 v2] 儲存失敗",error);
      alert(isCloud()?"共享帳本儲存失敗，請確認連線或重新輸入共享密碼。":"本機帳本儲存失敗，請確認瀏覽器儲存空間後再試。");
    });
    return saveQueue;
  }

  async function stopRealtime(){
    if(!realtimeChannel||!supabase)return;
    const channel=realtimeChannel;
    realtimeChannel=null;
    try{await supabase.removeChannel(channel);}catch(error){console.warn("[共付日常 v2] Realtime 關閉失敗",error);}
  }

  async function startRealtime(){
    await stopRealtime();
    if(!isCloud()||!supabase||!activeBook.id)return;

    const bookId=activeBook.id;
    realtimeChannel=supabase
      .channel(`book:${bookId}`)
      .on("postgres_changes",{
        event:"UPDATE",
        schema:"public",
        table:"books",
        filter:`id=eq.${bookId}`
      },payload=>{
        if(!isCloud()||activeBook.id!==bookId)return;
        const s=normalize(payload?.new?.state);
        records=s.records;
        names=s.names;
        adjust=s.adjust;
        currencyBook=s.currencyBook;
        syncNameInputs();
        updateLabels();
        renderCalendar();
        const openDate=modal?.dataset.date;
        if(openDate&&!modal?.classList.contains("hidden"))renderDetail(openDate);
      })
      .subscribe(status=>{
        if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){
          console.warn("[共付日常 v2] Realtime 訂閱異常",status);
        }
      });
  }

  function getAdj(){const a=adjust[monthKey()];return {side:a?.side==="B"?"B":"A",amount:Money.toNumber(a?.amount,0)};}
  function setAdj(side,amount){adjust[monthKey()]={side:side==="B"?"B":"A",amount:Money.toNumber(amount,0)};}
  let liveRate={};
  async function refreshRate(c){try{const r=await Currency.fetchRateToTWD(c);liveRate[c]=r;return r;}catch{return null;}}
  const displayRate=c=>liveRate[c]||Currency.getRateToTWD(c);
  function lockRate(date,i,c,userRate,amount){const u=Money.toNumber(userRate,NaN),rate=Number.isFinite(u)&&u>0?u:displayRate(c),baseTWD=Currency.foreignToTWD(amount,rate);currencyBook[date]??=[];currencyBook[date][i]={currency:c,rate,baseTWD};}
  function daily(date){let A=0,B=0;(records[date]||[]).forEach((r,i)=>{if(r.deleted)return;const c=currencyBook[date]?.[i],v=c&&Number.isFinite(Number(c.baseTWD))?Money.toNumber(c.baseTWD,0):Money.toNumber(r.amount,0);if(r.type==="a_to_b")A+=v;else B+=v;});return {A,B};}
  function settlement(){let A_TWD=0,B_TWD=0,p=monthPrefix();Object.keys(records).forEach(d=>{if(!d.startsWith(p))return;(records[d]||[]).forEach((r,i)=>{if(r.deleted)return;const c=currencyBook[d]?.[i],v=c&&Number.isFinite(Number(c.baseTWD))?Money.toNumber(c.baseTWD,0):Money.toNumber(r.amount,0);if(r.type==="a_to_b")A_TWD+=v;else B_TWD+=v;});});const a=getAdj();if(a.side==="A")A_TWD+=a.amount;else B_TWD+=a.amount;return {A_TWD,B_TWD,diff:A_TWD-B_TWD};}
  function updateSummary(){const {A_TWD,B_TWD,diff}=settlement();if(sumAB)sumAB.textContent=Money.formatNumber(A_TWD,{maximumFractionDigits:0});if(sumBA)sumBA.textContent=Money.formatNumber(B_TWD,{maximumFractionDigits:0});const c=settleCurrency?.value||"TWD",rate=displayRate(c),val=c==="TWD"?Math.abs(diff):Math.abs(Currency.twdToForeign(diff,rate));const f=Money.formatNumber(val,{minimumFractionDigits:2,maximumFractionDigits:2});if(finalResult)finalResult.textContent=diff>0?`${names.B} 應給 ${names.A} ${f} ${c}`:diff<0?`${names.A} 應給 ${names.B} ${f} ${c}`:"目前平衡";if(currencyStats)currencyStats.textContent=c==="TWD"?"結算基準：TWD":`${liveRate[c]?"即時匯率":"系統備用匯率"}：1 ${c} ≈ ${rate.toFixed(3)} TWD`;}
  function updateLabels(){const la=sumAB?.parentElement,lb=sumBA?.parentElement;if(la?.childNodes[0])la.childNodes[0].textContent=`${names.A} 先付：TWD `;if(lb?.childNodes[0])lb.childNodes[0].textContent=`${names.B} 先付：TWD `;const h=$$(".detail-section h3");if(h[0])h[0].textContent=`${names.A} 先付`;if(h[1])h[1].textContent=`${names.B} 先付`;syncAdjustFake();updateSummary();}
  function syncAdjust(){const a=getAdj();if(adjustSide)adjustSide.value=a.side;if(adjustAmount)adjustAmount.value=a.amount||0;syncAdjustFake();const t=$(".adjust-title");if(t)t.style.color=a.side==="A"?"#879886":"#b9867e";}
  function renderCalendar(){if(!calendarGrid)return;calendarGrid.innerHTML="";const first=new Date(viewYear,viewMonth,1).getDay(),days=new Date(viewYear,viewMonth+1,0).getDate();for(let i=0;i<first;i++){const e=document.createElement("div");e.className="calendar-day empty";calendarGrid.appendChild(e);}for(let d=1;d<=days;d++){const date=`${viewYear}-${pad(viewMonth+1)}-${pad(d)}`,t=daily(date),b=document.createElement("button");b.type="button";b.className="calendar-day";b.dataset.date=date;b.innerHTML=`<span class="day-number">${d}</span><span class="day-totals"><span class="day-total colA"><span class="day-name">${esc(names.A)}</span><span class="day-amount">${Money.formatNumber(t.A,{maximumFractionDigits:0})}</span></span><span class="day-total colB"><span class="day-name">${esc(names.B)}</span><span class="day-amount">${Money.formatNumber(t.B,{maximumFractionDigits:0})}</span></span></span>`;calendarGrid.appendChild(b);}if(monthTitle)monthTitle.textContent=`${viewYear} 年 ${viewMonth+1} 月`;syncAdjust();updateSummary();}

  let editAction=null;
  function openEdit({title,item="",amount="",onOpen,onOk}){if(!editModal)return;editTitleEl.textContent=title||"新增紀錄";editItem.value=item;editAmount.value=amount;let touched=false;editRate.oninput=()=>touched=true;editCurrency.onchange=async()=>{syncFake(fakeSets[1]);if(touched)return;const c=editCurrency.value;if(c==="TWD")editRate.value="1";else{const r=await refreshRate(c);if(r!=null&&!touched)editRate.value=r.toFixed(3);}};editAction={onOk};editModal.classList.remove("hidden");onOpen?.();setTimeout(()=>editItem.focus(),0);}
  function closeEdit(){editModal?.classList.add("hidden");editAction=null;}
  editCancel&&(editCancel.onclick=closeEdit);editOk&&(editOk.onclick=()=>{if(!editAction)return;const item=editItem.value.trim(),amount=Money.toNumber(editAmount.value,NaN);if(!Number.isFinite(amount)||amount<=0){editAmount.focus();return;}editAction.onOk({item,amount});closeEdit();});
  function renderDetail(date){
    listA.innerHTML="";listB.innerHTML="";
    (records[date]||[]).forEach((r,i)=>{
      const div=document.createElement("div"),c=currencyBook[date]?.[i],cur=c?.currency||"TWD",label=`${esc(r.item||"懶得打")}  ${Money.cleanNumber(r.amount)} ${esc(cur)}`;
      if(r.deleted){div.classList.add("is-history");div.innerHTML=`<span>${label}</span><span class="history-tag">歷史</span>`;}
      else if(!canEdit()){div.innerHTML=`<span>${label}</span>`;}
      else{div.innerHTML=`<span>${label}</span><button data-m="overwrite">修改會覆蓋</button><button data-m="preserve">修改仍保留</button>`;div.querySelectorAll("button").forEach(btn=>btn.onclick=()=>openEdit({title:btn.dataset.m==="overwrite"?"編輯（改覆蓋）":"編輯（改保留）",item:r.item||"",amount:r.amount,onOpen:()=>{editCurrency.value=c?.currency||"TWD";syncFake(fakeSets[1]);editRate.value=c?.rate??"";},onOk:({item,amount})=>{const cur=editCurrency.value||"TWD",rate=editRate.value;if(btn.dataset.m==="overwrite"){r.item=item;r.amount=amount;r.deleted=false;lockRate(date,i,cur,rate,amount);}else{r.deleted=true;records[date].push({type:r.type,item,amount,deleted:false});lockRate(date,records[date].length-1,cur,rate,amount);}saveState("records-change");renderDetail(date);renderCalendar();}}));}
      (r.type==="a_to_b"?listA:listB).appendChild(div);
    });
  }
  function addRecord(type){if(!canEdit())return;const date=modal?.dataset.date;if(!date)return;openEdit({title:"新增紀錄",onOpen:()=>{editCurrency.value="TWD";syncFake(fakeSets[1]);editRate.value="1";},onOk:({item,amount})=>{records[date]??=[];records[date].push({type,item,amount,deleted:false});lockRate(date,records[date].length-1,editCurrency.value||"TWD",editRate.value,amount);saveState("records-add");renderDetail(date);renderCalendar();}});}
  if(addBtns.length>=2){addBtns[0].onclick=()=>addRecord("a_to_b");addBtns[1].onclick=()=>addRecord("b_to_a");}
  calendarGrid?.addEventListener("click",e=>{const day=e.target.closest(".calendar-day[data-date]");if(!day)return;modal.dataset.date=day.dataset.date;modalDate.textContent=`${day.dataset.date} 明細`;renderDetail(day.dataset.date);modal.classList.remove("hidden");});closeBtn&&(closeBtn.onclick=()=>modal.classList.add("hidden"));
  prevBtn&&(prevBtn.onclick=()=>{if(--viewMonth<0){viewMonth=11;viewYear--;}renderCalendar();});nextBtn&&(nextBtn.onclick=()=>{if(++viewMonth>11){viewMonth=0;viewYear++;}renderCalendar();});

  let dangerAction=null;function openDanger({title,textHtml,onConfirm}){dangerTitle.textContent=title;dangerText.innerHTML=textHtml;dangerAction=onConfirm;dangerModal.classList.remove("hidden");}function closeDanger(){dangerModal.classList.add("hidden");dangerAction=null;}dangerCancel&&(dangerCancel.onclick=closeDanger);dangerConfirm&&(dangerConfirm.onclick=()=>{dangerAction?.();closeDanger();});
  refreshBtn&&(refreshBtn.onclick=()=>{if(!canEdit())return;openDanger({title:"清空本月帳本",textHtml:`這會刪除 <b>${viewYear} 年 ${viewMonth+1} 月</b> 的所有明細與本月帳外調整。`,onConfirm:()=>{const p=monthPrefix();Object.keys(records).forEach(k=>k.startsWith(p)&&delete records[k]);Object.keys(currencyBook).forEach(k=>k.startsWith(p)&&delete currencyBook[k]);delete adjust[monthKey()];saveState("clear-month");renderCalendar();}});});
  clearAllBtn&&(clearAllBtn.onclick=()=>{if(!canEdit())return;openDanger({title:"清空全部帳本",textHtml:"這會清除目前帳本的所有記錄、匯率資料與帳外調整，是否刪除？",onConfirm:()=>{records={};currencyBook={};adjust={};saveState("clear-all");renderCalendar();}});});

  /* ===== JSON 備份版本資訊 =====
     exportedAt：DataBackup 自動產生，代表「下載備份」的時間。
     bookUpdatedAt：雲端 books.updated_at，代表「這份帳本內容最後寫入雲端」的時間。
     版本新舊判斷只比較 bookUpdatedAt，不拿 exportedAt 冒充資料修改時間。
     Timestamp.create() 只用於檔名，保持可排序且不改動共用模組。
  ===== */
  function exportAll(){
    const payload=DataBackup.createPayload({
      app:"sbs_duo_book",
      version:"1.1",
      data:{records,names,adjust,currencyBook},
      extraMeta:{bookTitle:activeBook.title,mode:activeBook.mode,bookId:activeBook.id||undefined}
    });
    DataBackup.downloadJson(`sbs_duo_book_backup_${Timestamp.create()}.json`,payload);
  }
  function normAdj(v){if(!plain(v))return{};const out={};Object.entries(v).forEach(([m,a])=>{if(/^\d{4}-\d{2}$/.test(m)&&plain(a))out[m]={side:a.side==="B"?"B":"A",amount:Money.toNumber(a.amount,0)};});return out;}
  function validTime(value){const t=Date.parse(value);return Number.isFinite(t)?t:null;}
  async function persistImportedState(next){
    if(isCloud()){
      const {error}=await supabase.from("books").update({state:clone(next)}).eq("id",activeBook.id);
      if(error)throw error;
    }else{
      await localState.upsert(clone({id:STATE_ID,...next}));
      bookChange.emit({type:"import",collection:"state",operationId:Timestamp.create()});
    }
  }
  async function importFile(file){
    try{
      const obj=await DataBackup.readJsonFile(file);
      const data=DataBackup.extractData(obj,{allowRaw:false});
      if(!plain(data)||!validRecords(data.records)||!validCurrency(data.currencyBook)||!plain(data.names)||!plain(data.adjust))throw new Error("invalid backup data");

      const next={
        records:clone(data.records),
        currencyBook:clone(data.currencyBook),
        names:{A:String(data.names.A||"A"),B:String(data.names.B||"B")},
        adjust:normAdj(data.adjust)
      };

      if(!confirm(`確定要用這份備份覆蓋目前${isCloud()?"共享":"本機"}帳本嗎？`))return;

      // 先寫入儲存層，成功後才替換畫面中的帳本；失敗時原畫面資料不變。
      await persistImportedState(next);
      records=next.records;
      currencyBook=next.currencyBook;
      names=next.names;
      adjust=next.adjust;
      syncNameInputs();
      updateLabels();
      renderCalendar();
    }catch(error){
      console.error("[共付日常] 匯入失敗",error);

      alert("匯入失敗：備份格式不正確，或帳本無法寫入儲存空間。原資料沒有變更。");
    }
  }
  exportBtn&&(exportBtn.onclick=exportAll);if(importBtn&&fileInput){importBtn.onclick=()=>fileInput.click();fileInput.onchange=()=>{const f=fileInput.files?.[0];if(f)importFile(f);fileInput.value="";};}
  function syncNameInputs(){inputA.value=names.A==="A"?"":names.A;inputB.value=names.B==="B"?"":names.B;}
  if(inputA)inputA.oninput=()=>{if(!canEdit())return;names.A=inputA.value||"A";saveState("names-change");updateLabels();renderCalendar();};if(inputB)inputB.oninput=()=>{if(!canEdit())return;names.B=inputB.value||"B";saveState("names-change");updateLabels();renderCalendar();};

  function syncFake(x){if(!x.native||!x.label)return;x.label.textContent=x.native.value;x.opts.forEach(b=>b.setAttribute("aria-selected",b.dataset.value===x.native.value?"true":"false"));}
  function closeFake(x){if(x.menu)x.menu.hidden=true;if(x.trigger)x.trigger.setAttribute("aria-expanded","false");}
  function bindFake(x){if(!x.native||!x.trigger||!x.menu)return;syncFake(x);x.trigger.onclick=e=>{e.stopPropagation();const open=x.trigger.getAttribute("aria-expanded")==="true";fakeSets.forEach(closeFake);closeAdjust();x.menu.hidden=open;x.trigger.setAttribute("aria-expanded",open?"false":"true");};x.opts.forEach(b=>b.onclick=()=>{x.native.value=b.dataset.value;syncFake(x);x.native.dispatchEvent(new Event("change",{bubbles:true}));closeFake(x);x.trigger.focus();});}
  fakeSets.forEach(bindFake);
  function syncAdjustFake(){if(!adjustSide||!adjustFake.label)return;const v=adjustSide.value==="B"?"B":"A";adjustFake.label.textContent=v==="A"?`${names.A} 多付`:`${names.B} 多付`;adjustFake.root.classList.toggle("is-a",v==="A");adjustFake.root.classList.toggle("is-b",v==="B");adjustFake.opts.forEach(b=>{b.textContent=b.dataset.value==="A"?`${names.A} 多付`:`${names.B} 多付`;b.setAttribute("aria-selected",b.dataset.value===v?"true":"false");});}
  function closeAdjust(){if(adjustFake.menu)adjustFake.menu.hidden=true;adjustFake.trigger?.setAttribute("aria-expanded","false");}
  if(adjustFake.trigger)adjustFake.trigger.onclick=e=>{e.stopPropagation();const open=adjustFake.trigger.getAttribute("aria-expanded")==="true";fakeSets.forEach(closeFake);adjustFake.menu.hidden=open;adjustFake.trigger.setAttribute("aria-expanded",open?"false":"true");};adjustFake.opts.forEach(b=>b.onclick=()=>{adjustSide.value=b.dataset.value==="B"?"B":"A";adjustSide.dispatchEvent(new Event("change",{bubbles:true}));closeAdjust();});
  document.addEventListener("click",()=>{fakeSets.forEach(closeFake);closeAdjust();});document.addEventListener("keydown",e=>{if(e.key==="Escape"){fakeSets.forEach(closeFake);closeAdjust();}});
  let adjustEditBaseline=null;
  function beginAdjustEdit(){if(adjustEditBaseline===null)adjustEditBaseline=clone(getAdj());}
  function finishAdjustEdit(){adjustEditBaseline=null;}
  adjustSide&&(adjustSide.onchange=()=>{if(!canEdit())return;beginAdjustEdit();const a=getAdj();setAdj(adjustSide.value,a.amount);saveState("adjust-change");syncAdjust();updateSummary();});
  adjustAmount&&(adjustAmount.oninput=()=>{if(!canEdit())return;beginAdjustEdit();const a=getAdj();setAdj(a.side,Money.toNumber(adjustAmount.value,0));saveState("adjust-change");updateSummary();});
  adjustConfirmBtn&&(adjustConfirmBtn.onclick=()=>{if(!canEdit())return;finishAdjustEdit();syncAdjust();if(adjustAmount)adjustAmount.value="0";updateSummary();});
  adjustCancelBtn&&(adjustCancelBtn.onclick=()=>{if(!canEdit())return;if(adjustEditBaseline!==null){setAdj(adjustEditBaseline.side,adjustEditBaseline.amount);finishAdjustEdit();saveState("adjust-cancel");}syncAdjust();updateSummary();});
  settleCurrency&&(settleCurrency.onchange=()=>{syncFake(fakeSets[0]);updateSummary();});applyBtn&&(applyBtn.onclick=async()=>{applyBtn.disabled=true;try{await refreshRate(settleCurrency.value||"TWD");}finally{applyBtn.disabled=false;updateSummary();}});

  /* ===== v2 shared-book entry ===== */
  function setMessage(text="",kind="info"){
    if(!editorAccessMessage)return;
    editorAccessMessage.textContent=text;
    editorAccessMessage.dataset.kind=kind;
  }
  function renderAccessState(){
    document.body.dataset.bookRole=activeBook.role;
    if(!bookContext)return;
    bookContext.innerHTML=isCloud()?`<strong>共享帳本</strong>｜${esc(activeBook.id)}`:"<strong>本機帳本</strong>｜資料只存在這台裝置";
  }
  async function ensureAnonymousSession(){
    if(!supabase)throw new Error("Supabase SDK unavailable");
    const {data:{session},error}=await supabase.auth.getSession();
    if(error)throw error;
    if(session)return session;
    const {data,error:signError}=await supabase.auth.signInAnonymously();
    if(signError)throw signError;
    return data.session;
  }
  async function enterReadonlyBook(token){
    const bookId=urlBookId();
    if(!bookId||!token)throw new Error("invalid readonly link");
    await ensureAnonymousSession();
    const {data,error}=await supabase.rpc("open_readonly_book",{p_book_id:bookId,p_view_token:token});
    if(error)throw error;
    const state=normalize(data);
    activeBook.mode="cloud"; activeBook.id=bookId; activeBook.title="唯讀帳本"; activeBook.role="viewer";
    records=state.records; names=state.names; adjust=state.adjust; currencyBook=state.currencyBook;
    syncNameInputs(); updateLabels(); renderCalendar(); renderAccessState();
    await startRealtime();
  }
  async function enterSharedBook(password){
    const bookId=urlBookId();
    if(!bookId)throw new Error("missing book id");
    const session=await ensureAnonymousSession();
    console.info("[共付日常 v2] 共享帳本驗證身分",{
      userId:session?.user?.id||null,
      isAnonymous:session?.user?.is_anonymous===true,
      email:session?.user?.email||null
    });
    const {error}=await supabase.rpc("open_shared_book",{p_book_id:bookId,p_password:password});
    if(error)throw error;
    activeBook.mode="cloud"; activeBook.id=bookId; activeBook.title="共享帳本"; activeBook.role="editor";
    await loadActive();
    syncNameInputs(); updateLabels(); renderCalendar(); renderAccessState();
    await startRealtime();
  }
  const ADMIN_UIDS=new Set([
    "372c6a7f-4e6b-49fa-8228-183b46cbdede",
    "bd126b9b-aa23-42e0-85f5-4560cab8fc57",
    "7348ca2f-147d-4a3b-b9d2-a854c4a12430"
  ]);
  function showManagePanel(panel="menu"){
    if(bookEntryMenu)bookEntryMenu.hidden=panel!=="menu";
    if(cloudBookPanel)cloudBookPanel.hidden=panel!=="cloud";
    if(adminLoginPanel)adminLoginPanel.hidden=panel!=="admin-login";
    if(adminToolsPanel)adminToolsPanel.hidden=panel!=="admin-tools";
    if(panel==="cloud")setTimeout(()=>editorBookPassword?.focus(),0);
    if(panel==="admin-login")setTimeout(()=>adminEmail?.focus(),0);
  }
  async function loadAdminBooks(){
    if(!supabase||!adminBookSelect)return;
    adminBookSelect.innerHTML='<option value="">載入帳本中……</option>';
    adminBookSelect.disabled=true;
    if(adminReadonlyTools)adminReadonlyTools.hidden=true;
    if(adminBookMessage)adminBookMessage.textContent="";
    if(readonlyShareLink)readonlyShareLink.textContent="";
    if(copyReadonlyLinkBtn){copyReadonlyLinkBtn.hidden=true;copyReadonlyLinkBtn.dataset.url="";}
    try{
      const {data,error}=await supabase.rpc("list_admin_books");
      if(error)throw error;
      const books=data||[];
      adminBookSelect.innerHTML='<option value="">請選擇帳本</option>'+books.map(book=>{
        const names=book.state?.names||{};
        const title=[names.a||names.A,names.b||names.B].filter(Boolean).join("／")||"未命名帳本";
        return `<option value="${esc(book.book_id)}">${esc(title)}｜${esc(book.book_id)}</option>`;
      }).join("");
      adminBookSelect.disabled=false;
      if(adminBookMessage)adminBookMessage.textContent=books.length?"請先選擇要管理的帳本。":"目前沒有可管理的雲端帳本。";
    }catch(error){
      console.error("[共付日常 v2] 管理帳本清單載入失敗",error);
      adminBookSelect.innerHTML='<option value="">無法載入帳本</option>';
      if(adminBookMessage)adminBookMessage.textContent="目前無法載入可管理的雲端帳本。";
    }
  }
  function buildReadonlyShareUrl(bookId,token){
    const shareUrl=new URL(location.href);
    shareUrl.search="";
    shareUrl.searchParams.set("book",bookId);
    shareUrl.searchParams.set("view",token);
    return shareUrl.toString();
  }
  adminBookSelect?.addEventListener("change",async()=>{
    const bookId=adminBookSelect.value;
    if(adminReadonlyTools)adminReadonlyTools.hidden=!bookId;
    if(adminBookMessage)adminBookMessage.textContent=bookId?"已選擇管理帳本。":"請先選擇要管理的帳本。";
    if(readonlyShareLink)readonlyShareLink.textContent="";
    if(copyReadonlyLinkBtn){copyReadonlyLinkBtn.hidden=true;copyReadonlyLinkBtn.dataset.url="";}
    if(resetReadonlyLinkBtn)resetReadonlyLinkBtn.textContent="產生網址";
    if(!bookId||!supabase)return;
    if(readonlyShareLink)readonlyShareLink.textContent="正在讀取既有唯讀網址……";
    try{
      const {data,error}=await supabase.rpc("get_admin_readonly_token",{p_book_id:bookId});
      if(error)throw error;
      if(data){
        const shareUrl=buildReadonlyShareUrl(bookId,data);
        if(readonlyShareLink)readonlyShareLink.textContent=shareUrl;
        if(copyReadonlyLinkBtn){copyReadonlyLinkBtn.hidden=false;copyReadonlyLinkBtn.dataset.url=shareUrl;}
        if(resetReadonlyLinkBtn)resetReadonlyLinkBtn.textContent="重製網址";
      }else{
        if(readonlyShareLink)readonlyShareLink.textContent="這本帳本尚未產生唯讀網址。";
      }
    }catch(error){
      console.error("[共付日常 v2] 既有唯讀網址讀取失敗",error);
      if(readonlyShareLink)readonlyShareLink.textContent="目前無法讀取既有唯讀網址。";
    }
  });
  function openManageBook(){
    manageBookModal?.classList.remove("hidden");
    const menu=manageBookBtn?.closest("details"); if(menu)menu.open=false;
    showManagePanel("menu");
  }
  function closeManageBook(){manageBookModal?.classList.add("hidden");showManagePanel("menu");}
  manageBookBtn&&(manageBookBtn.onclick=openManageBook);
  manageBookClose&&(manageBookClose.onclick=closeManageBook);
  manageBookModal?.addEventListener("click",e=>{if(e.target===manageBookModal)closeManageBook();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!manageBookModal?.classList.contains("hidden"))closeManageBook();});
  $$('[data-manage-back]').forEach(btn=>btn.onclick=()=>showManagePanel("menu"));
  enterCloudBookBtn&&(enterCloudBookBtn.onclick=()=>showManagePanel("cloud"));
  enterAdminModeBtn&&(enterAdminModeBtn.onclick=async()=>{
    if(!supabase){if(adminLoginMessage)adminLoginMessage.textContent="目前無法連線到管理服務。";showManagePanel("admin-login");return;}
    const {data:{session}}=await supabase.auth.getSession();
    if(session?.user?.id&&ADMIN_UIDS.has(session.user.id)){
      if(adminStatus)adminStatus.textContent=`已登入：${session.user.email||"管理者"}`;
      showManagePanel("admin-tools");
      await loadAdminBooks();
    }else showManagePanel("admin-login");
  });
  enterLocalBookBtn&&(enterLocalBookBtn.onclick=async()=>{
    await stopRealtime();
    activeBook.mode="local"; activeBook.id=""; activeBook.title="本機帳本"; activeBook.role="local";
    await loadActive(); syncNameInputs(); updateLabels(); renderCalendar(); renderAccessState();
    editorBookPassword.value="";setMessage("");closeManageBook();
  });
  adminLoginForm?.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!supabase)return;
    const submit=adminLoginForm.querySelector('button[type="submit"]');
    if(submit)submit.disabled=true;
    if(adminLoginMessage)adminLoginMessage.textContent="正在登入管理模式……";
    try{
      const {data,error}=await supabase.auth.signInWithPassword({email:adminEmail.value.trim(),password:adminPassword.value});
      if(error)throw error;
      if(!data.user?.id||!ADMIN_UIDS.has(data.user.id)){
        await supabase.auth.signOut();
        throw new Error("not admin");
      }
      adminPassword.value="";
      if(adminLoginMessage)adminLoginMessage.textContent="";
      if(adminStatus)adminStatus.textContent=`已登入：${data.user.email||"管理者"}`;
      showManagePanel("admin-tools");
      await loadAdminBooks();
    }catch(error){
      console.error("[共付日常 v2] 管理者登入失敗",error);
      if(adminLoginMessage)adminLoginMessage.textContent="管理者帳號或密碼不正確。";
    }finally{if(submit)submit.disabled=false;}
  });
  leaveAdminModeBtn&&(leaveAdminModeBtn.onclick=async()=>{
    try{await supabase?.auth.signOut();}catch(error){console.warn("[共付日常 v2] 管理模式登出失敗",error);}
    if(adminEmail)adminEmail.value="";if(adminPassword)adminPassword.value="";if(adminStatus)adminStatus.textContent="";
    showManagePanel("menu");
  });

  editorUnlockForm?.addEventListener("submit",async e=>{
    e.preventDefault();
    const password=editorBookPassword.value;
    if(!urlBookId()){setMessage("這個網址沒有帳本識別碼（book）。請使用該帳本的共享網址。","error");return;}
    if(!password){setMessage("請輸入帳本共享密碼。","error");return;}
    const submit=editorUnlockForm.querySelector('button[type="submit"]');
    if(submit)submit.disabled=true;
    setMessage("正在驗證共享帳本……","info");
    try{
      await enterSharedBook(password);
      editorBookPassword.value=""; setMessage(""); closeManageBook();
    }catch(error){
      console.error("[共付日常 v2] 共享帳本進入失敗",{
        message:error?.message||String(error),
        code:error?.code||null,
        details:error?.details||null,
        hint:error?.hint||null,
        raw:error
      });
      const detail=[error?.code,error?.message].filter(Boolean).join("｜");
      setMessage(error?.message==="missing book id"
        ?"這個網址沒有帳本識別碼（book）。"
        :`共享帳本驗證失敗${detail?`：${detail}`:"。"}`,"error");
    }finally{if(submit)submit.disabled=false;}
  });
  resetReadonlyLinkBtn&&(resetReadonlyLinkBtn.onclick=async()=>{
    const bookId=adminBookSelect?.value||"";
    if(!bookId){if(readonlyShareLink)readonlyShareLink.textContent="請先選擇要分享的雲端帳本。";return;}
    resetReadonlyLinkBtn.disabled=true;
    if(readonlyShareLink)readonlyShareLink.textContent="正在產生唯讀網址……";
    try{
      const {data,error}=await supabase.rpc("reset_readonly_book_token",{p_book_id:bookId});
      if(error)throw error;
      const shareUrl=buildReadonlyShareUrl(bookId,data);
      if(readonlyShareLink)readonlyShareLink.textContent=shareUrl;
      if(copyReadonlyLinkBtn){copyReadonlyLinkBtn.hidden=false;copyReadonlyLinkBtn.dataset.url=shareUrl;}
      if(resetReadonlyLinkBtn)resetReadonlyLinkBtn.textContent="重製網址";
    }catch(error){
      console.error("[共付日常 v2] 唯讀網址產生失敗",error);
      if(readonlyShareLink)readonlyShareLink.textContent="只有管理帳號可以產生／重設唯讀網址。";
    }finally{resetReadonlyLinkBtn.disabled=false;}
  });
  copyReadonlyLinkBtn&&(copyReadonlyLinkBtn.onclick=async()=>{
    const value=copyReadonlyLinkBtn.dataset.url||""; if(!value)return;
    try{await navigator.clipboard.writeText(value);if(readonlyShareLink)readonlyShareLink.textContent=`已複製：${value}`;}catch{if(readonlyShareLink)readonlyShareLink.textContent=value;}
  });

  if(urlViewToken()){
    try{
      await enterReadonlyBook(urlViewToken());
    }catch(error){
      console.error("[共付日常 v2] 唯讀帳本開啟失敗",error);
      await loadActive();
      syncNameInputs(); updateLabels(); renderCalendar(); renderAccessState();
      setMessage("唯讀網址無效、已被重設，或目前無法連線。","error");
      openManageBook();
    }
  }else{
    await loadActive();
    const changed=prune(); if(changed)await saveState("prune-on-load");
    syncNameInputs(); updateLabels(); renderCalendar(); renderAccessState();
  }
});
