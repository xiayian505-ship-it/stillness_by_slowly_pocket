document.addEventListener("DOMContentLoaded", async ()=>{
  /* =========================================================
     慢慢｜雙人記帳本 acc_admin_v2.js
     - 未登入：本機 FictionStorage 正常使用
     - 登入介面：直接使用慢慢軍火庫 Auth_permission_ui.js
     - 本版不保留假帳號、假 Session、假雲端資料或 admin / role 測試
     - 登入 / Session / 登出：已接 Supabase Auth
     - 已登入：Supabase books table，一個帳號只讀寫自己的帳本
     - 未登入：本機 FictionStorage
     - 第一次登入若沒有 books row，會自動建立空帳本
     - 帳本核心（records / names / adjust / currencyBook）維持不動
  ========================================================= */
  const RETAIN_DAYS=365;
  const STORE_NAMESPACE="sbs-duo-book-v2";
  const STATE_ID="main";
  if(!window.DateTime||!window.Timestamp||!window.Money||!window.Currency||!window.DataBackup||!window.RealtimeSync||!window.FictionChange||!window.FictionStorage){
    alert("共用模組載入失敗，請重新整理後再試。");
    return;
  }
  if(!window.supabase?.createClient||!window.SBS_SUPABASE_CONFIG?.url||!window.SBS_SUPABASE_CONFIG?.publishableKey){
    alert("Supabase 設定載入失敗，請確認 SDK 與 /setting/supabase_config.js。");
    return;
  }

  const supabaseClient=window.supabase.createClient(
    window.SBS_SUPABASE_CONFIG.url,
    window.SBS_SUPABASE_CONFIG.publishableKey
  );

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
  const bookContext=$("#bookContext"), editorUnlockForm=$("#editorUnlockForm"), editorBookPassword=$("#editorBookPassword"), editorAccessMessage=$("#editorAccessMessage"), useLocalBookBtn=$("#useLocalBookBtn");
  const rootLoginForm=$("#rootLoginForm"), rootEmail=$("#rootEmail"), rootPassword=$("#rootPassword"), rootLoginMessage=$("#rootLoginMessage"), rootLoggedOut=$("#rootLoggedOut"), rootLoggedIn=$("#rootLoggedIn"), rootStatus=$("#rootStatus"), rootLogoutBtn=$("#rootLogoutBtn"), rootBooks=$("#rootBooks"), newBookTitle=$("#newBookTitle"), newBookPassword=$("#newBookPassword"), createBookBtn=$("#createBookBtn"), rootActionMessage=$("#rootActionMessage"), activeBookShare=$("#activeBookShare");

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

  /* ===== v2 Storage / Permission boundary =====
     Root：Supabase Email + Password，擁有多本 books。
     Editor：匿名 Auth session + RPC 驗證「帳本共用密碼」，只取得該 book 的 editor access。
     Viewer：匿名 Auth session + 分享 token，只取得該 book 的 viewer access。
     Local：保留 v1 本機帳本，不碰雲端。

     SECURITY BOUNDARY：密碼 hash / viewer token 放 book_secrets，不放 books；
     真正讀寫權限由 RLS + book_access 控制，前端只負責操作介面。
  ===== */
  const localStore=FictionStorage.create({namespace:STORE_NAMESPACE});
  const localState=localStore.collection("state");
  const bookChange=FictionChange.create({name:"sbs-duo-book-v2"});
  const ACTIVE_KEY="sbs-duo-book-v2-active";

  const SupabaseBookAdapter={
    async load(bookId){
      if(!bookId)throw new Error("missing book id");
      const {data,error}=await supabaseClient.from("books").select("id,title,state,owner_id,created_at,updated_at").eq("id",bookId).single();
      if(error)throw error;
      return {id:data.id,title:data.title||"共付日常",ownerId:data.owner_id,state:normalize(data.state),updatedAt:data.updated_at||null};
    },
    async save(bookId,state,expectedUpdatedAt=null){
      if(!bookId)throw new Error("missing book id");
      let query=supabaseClient.from("books").update({state}).eq("id",bookId);
      if(expectedUpdatedAt)query=query.eq("updated_at",expectedUpdatedAt);
      const {data,error}=await query.select("updated_at").maybeSingle();
      if(error)throw error;
      if(!data){const conflict=new Error("book version conflict");conflict.code="BOOK_VERSION_CONFLICT";throw conflict;}
      return data.updated_at||null;
    }
  };

  let authSession=null;
  let rootSession={isRoot:false,email:"",userId:""};
  let activeBook={mode:"local",id:"",title:"本機帳本",role:"local",viewerToken:""};
  let bookUpdatedAt=null,realtimeSync=null,stateEpoch=0,cloudSaveErrorNotified=false;
  let records={},names={A:"A",B:"B"},adjust={},currencyBook={},saveQueue=Promise.resolve();
  const now=new Date(); let viewYear=now.getFullYear(),viewMonth=now.getMonth();
  const monthPrefix=()=>`${viewYear}-${pad(viewMonth+1)}-`, monthKey=()=>`${viewYear}-${pad(viewMonth+1)}`;
  const isCloud=()=>activeBook.mode==="cloud"&&!!activeBook.id;
  const canEdit=()=>activeBook.role==="root"||activeBook.role==="editor"||activeBook.role==="local";
  const isViewer=()=>activeBook.role==="viewer";

  function localSnapshot(){return clone({id:STATE_ID,records,names,adjust,currencyBook});}
  function cloudSnapshot(){return clone({records,names,adjust,currencyBook});}
  function rememberActive(){sessionStorage.setItem(ACTIVE_KEY,JSON.stringify(activeBook));}
  function forgetActive(){sessionStorage.removeItem(ACTIVE_KEY);}

  function prune(){
    let changed=false; const today=DateTime.dateKey();
    for(const obj of [records,currencyBook])Object.keys(obj).forEach(k=>{const age=DateTime.diffDays(k,today);if(age!==null&&age>RETAIN_DAYS){delete obj[k];changed=true;}});
    return changed;
  }

  async function loadActive(){
    let s;
    if(isCloud()){
      const cloud=await SupabaseBookAdapter.load(activeBook.id);
      activeBook.title=cloud.title; s=cloud.state; bookUpdatedAt=cloud.updatedAt;
    }else{
      s=normalize(await localState.get(STATE_ID)); bookUpdatedAt=null;
    }
    records=s.records; names=s.names; adjust=s.adjust; currencyBook=s.currencyBook;
  }

  function applyBookState(state,updatedAt,{emitType="remote-sync"}={}){
    const next=normalize(state); records=next.records; names=next.names; adjust=next.adjust; currencyBook=next.currencyBook;
    bookUpdatedAt=updatedAt||null; stateEpoch+=1; realtimeSync?.setKnownVersion(bookUpdatedAt);
    syncNameInputs(); updateLabels(); renderCalendar();
    if(modal&&!modal.classList.contains("hidden")&&modal.dataset.date)renderDetail(modal.dataset.date);
    bookChange.emit({type:emitType,collection:"state",operationId:Timestamp.create()});
  }

  async function reloadCloudBook(emitType="remote-reload"){
    if(!isCloud())return false;
    const cloud=await SupabaseBookAdapter.load(activeBook.id); activeBook.title=cloud.title;
    applyBookState(cloud.state,cloud.updatedAt,{emitType}); renderAccessState(); return true;
  }
  async function stopRealtime(){const sync=realtimeSync;realtimeSync=null;if(sync)await sync.destroy();}
  async function startRealtime(){
    if(!isCloud())return; await stopRealtime();
    const targetBookId=activeBook.id;
    const sync=RealtimeSync.create({client:supabaseClient,table:"books",event:"UPDATE",filter:`id=eq.${targetBookId}`,versionField:"updated_at",knownVersion:bookUpdatedAt,
      async onRemote(event){if(!isCloud()||activeBook.id!==targetBookId)return;await saveQueue.catch(()=>{});if(!isCloud()||activeBook.id!==targetBookId)return;const comparison=RealtimeSync.compareVersion(event.version,bookUpdatedAt);if(comparison!==null&&comparison<=0){sync.setKnownVersion(bookUpdatedAt);return;}applyBookState(event.record?.state,event.version,{emitType:"remote-sync"});cloudSaveErrorNotified=false;},
      async onReconnect(){if(!isCloud()||activeBook.id!==targetBookId)return;await saveQueue.catch(()=>{});if(isCloud()&&activeBook.id===targetBookId)await reloadCloudBook("realtime-reconnect");},
      onStatus({status,error}){if(error)console.error("[共付日常 v2] Realtime 狀態錯誤",status,error);}
    });
    realtimeSync=sync; sync.setKnownVersion(bookUpdatedAt); await sync.subscribe();
  }

  function saveState(type="save"){
    if(!canEdit())return Promise.resolve();
    prune(); const op=Timestamp.create(), cloud=isCloud(), bookId=activeBook.id, localSnap=localSnapshot(), cloudSnap=cloudSnapshot(), queuedEpoch=stateEpoch;
    saveQueue=saveQueue.catch(()=>{}).then(async()=>{
      if(cloud&&queuedEpoch!==stateEpoch)return;
      if(cloud){const updatedAt=await SupabaseBookAdapter.save(bookId,cloudSnap,bookUpdatedAt);bookUpdatedAt=updatedAt;realtimeSync?.setKnownVersion(bookUpdatedAt);}else await localState.upsert(localSnap);
      cloudSaveErrorNotified=false; bookChange.emit({type,collection:"state",operationId:op});
    }).catch(async e=>{
      console.error("[共付日常 v2] 儲存失敗",e);
      if(cloud&&e?.code==="BOOK_VERSION_CONFLICT"){try{await reloadCloudBook("version-conflict-reload");alert("另一個裝置剛剛已更新帳本。\n\n已重新載入雲端最新版；這次修改沒有覆蓋對方資料，請再操作一次。");}catch(reloadError){console.error(reloadError);alert("偵測到另一個裝置已更新帳本，但重新載入失敗。請重新整理後再試。");}return;}
      if(cloud&&!cloudSaveErrorNotified){cloudSaveErrorNotified=true;alert("雲端帳本儲存失敗。畫面上的變更可能尚未寫入雲端，請確認權限與網路後再試。");}
    });
    return saveQueue;
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
      extraMeta:{bookUpdatedAt:isCloud()?bookUpdatedAt:null,bookId:isCloud()?activeBook.id:null,bookTitle:activeBook.title,role:activeBook.role}
    });
    DataBackup.downloadJson(`sbs_duo_book_backup_${Timestamp.create()}.json`,payload);
  }
  function normAdj(v){if(!plain(v))return{};const out={};Object.entries(v).forEach(([m,a])=>{if(/^\d{4}-\d{2}$/.test(m)&&plain(a))out[m]={side:a.side==="B"?"B":"A",amount:Money.toNumber(a.amount,0)};});return out;}
  function validTime(value){const t=Date.parse(value);return Number.isFinite(t)?t:null;}
  async function persistImportedState(next){
    if(isCloud()){
      if(!canEdit())throw new Error("viewer cannot import");
      const updatedAt=await SupabaseBookAdapter.save(
        activeBook.id,
        clone(next),
        bookUpdatedAt
      );
      bookUpdatedAt=updatedAt;
      realtimeSync?.setKnownVersion(bookUpdatedAt);
    }else{
      await localState.upsert(clone({id:STATE_ID,...next}));
    }
    cloudSaveErrorNotified=false;
    bookChange.emit({type:"import",collection:"state",operationId:Timestamp.create()});
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

      if(isCloud()){
        const backupTime=validTime(obj?.meta?.bookUpdatedAt);
        const cloudTime=validTime(bookUpdatedAt);
        let message;

        if(backupTime!==null&&cloudTime!==null){
          if(backupTime<cloudTime){
            message="雲端帳本比這份備份新。\n\n匯入會用較舊的備份覆蓋目前雲端帳本，確定要還原嗎？";
          }else if(backupTime>cloudTime){
            message="這份備份比目前雲端帳本新。\n\n確定要用備份覆蓋目前雲端帳本嗎？";
          }else{
            message="這份備份與目前雲端帳本的版本時間相同。\n\n仍要用備份覆蓋目前帳本嗎？";
          }
        }else{
          message="這份備份缺少可比較的帳本更新時間，無法判斷版本先後。\n\n仍要匯入並覆蓋目前雲端帳本嗎？";
        }
        if(!confirm(message))return;
      }else if(!confirm("確定要用這份備份覆蓋目前本機帳本嗎？")){
        return;
      }

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

      if(error?.code==="BOOK_VERSION_CONFLICT"){
        try{
          await reloadCloudBook("import-conflict-reload");
          alert("匯入期間另一個裝置已更新帳本。\n\n為避免覆蓋較新的雲端資料，本次匯入已取消並重新載入最新版。若仍要還原備份，請再匯入一次。");
        }catch(reloadError){
          console.error("[共付日常] 匯入衝突後重新載入失敗",reloadError);
          alert("匯入已取消：偵測到雲端版本變更，但重新載入最新版失敗。請重新整理後再試。");
        }
        return;
      }

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
  adjustConfirmBtn&&(adjustConfirmBtn.onclick=()=>{if(!canEdit())return;finishAdjustEdit();syncAdjust();updateSummary();});
  adjustCancelBtn&&(adjustCancelBtn.onclick=()=>{if(!canEdit())return;if(adjustEditBaseline!==null){setAdj(adjustEditBaseline.side,adjustEditBaseline.amount);finishAdjustEdit();saveState("adjust-cancel");}syncAdjust();updateSummary();});
  settleCurrency&&(settleCurrency.onchange=()=>{syncFake(fakeSets[0]);updateSummary();});applyBtn&&(applyBtn.onclick=async()=>{applyBtn.disabled=true;try{await refreshRate(settleCurrency.value||"TWD");}finally{applyBtn.disabled=false;updateSummary();}});

  /* ===== v2 Access / Root / Editor / Viewer ===== */
  function setMessage(el,text="",kind="error"){if(!el)return;el.textContent=text;el.dataset.kind=kind;}
  function sbErrorCode(error){return String(error?.message||error||"").replace(/^.*?(ROOT_REQUIRED|TITLE_REQUIRED|PASSWORD_TOO_SHORT|PASSWORD_ALREADY_USED|INVALID_BOOK_PASSWORD|INVALID_VIEW_LINK|AUTH_SESSION_REQUIRED).*$/,"$1");}
  async function ensureAnonymousSession(){
    const {data}=await supabaseClient.auth.getSession();
    if(data?.session){authSession=data.session;return data.session;}
    const result=await supabaseClient.auth.signInAnonymously(); if(result.error)throw result.error; authSession=result.data.session; return authSession;
  }
  function syncRootSession(sbSession){
    authSession=sbSession||null; const u=sbSession?.user; const anonymous=!!u?.is_anonymous||u?.app_metadata?.provider==="anonymous";
    rootSession={isRoot:!!u&&!anonymous&&!!u.email,email:String(u?.email||""),userId:String(u?.id||"")};
  }
  function applyPermissionUI(){
    document.body.dataset.bookRole=activeBook.role||"none";
    const editable=canEdit();
    [inputA,inputB,adjustAmount].forEach(el=>{if(el)el.readOnly=!editable;});
    if(adjustSide)adjustSide.disabled=!editable;
    if(bookContext)bookContext.innerHTML=`<strong>${esc(activeBook.title||"未選帳本")}</strong>｜${activeBook.role==="root"?"Root":activeBook.role==="editor"?"Editor 可編輯":activeBook.role==="viewer"?"Viewer 唯讀":"本機帳本"}`;
  }
  function renderAccessState(){
    applyPermissionUI();
    if(rootLoggedOut)rootLoggedOut.hidden=rootSession.isRoot;
    if(rootLoggedIn)rootLoggedIn.hidden=!rootSession.isRoot;
    if(rootStatus)rootStatus.textContent=rootSession.isRoot?`已登入｜${rootSession.email}`:"";
    if(activeBookShare){
      const show=rootSession.isRoot&&activeBook.role==="root"&&activeBook.viewerToken;
      activeBookShare.hidden=!show;
      if(show){const url=new URL(location.href);url.search="";url.searchParams.set("view",activeBook.viewerToken);activeBookShare.textContent=`Viewer 分享網址：${url.toString()}`;}
    }
  }
  async function switchToLocal(){await saveQueue.catch(()=>{});await stopRealtime();activeBook={mode:"local",id:"",title:"本機帳本",role:"local",viewerToken:""};forgetActive();stateEpoch+=1;await loadActive();syncNameInputs();updateLabels();renderCalendar();renderAccessState();}
  async function switchToCloud({id,title,role,viewerToken=""}){await saveQueue.catch(()=>{});await stopRealtime();activeBook={mode:"cloud",id:String(id),title:String(title||"共付日常"),role:String(role),viewerToken:String(viewerToken||"")};rememberActive();stateEpoch+=1;await loadActive();const changed=prune();if(changed&&canEdit())await saveState("prune-after-switch");await startRealtime();syncNameInputs();updateLabels();renderCalendar();renderAccessState();}

  async function listRootBooks(){
    if(!rootSession.isRoot||!rootBooks)return;
    rootBooks.innerHTML="讀取中…";
    const {data,error}=await supabaseClient.from("books").select("id,title,updated_at,book_secrets(viewer_token,editor_password_hash)").eq("owner_id",rootSession.userId).order("created_at",{ascending:true});
    if(error){rootBooks.textContent="帳本清單讀取失敗";console.error(error);return;}
    rootBooks.innerHTML="";
    if(!data?.length){rootBooks.textContent="目前還沒有雲端帳本。";return;}
    data.forEach(book=>{
      const secret=Array.isArray(book.book_secrets)?book.book_secrets[0]:book.book_secrets;
      const row=document.createElement("div");row.className="root-book-row";
      const left=document.createElement("div");left.innerHTML=`<div class="root-book-title">${esc(book.title||"共付日常")}</div><div class="root-book-meta">${secret?.editor_password_hash?"Editor 密碼已設定":"尚未設定 Editor 密碼"}</div>`;
      const actions=document.createElement("div");actions.className="root-book-actions";
      const open=document.createElement("button");open.type="button";open.textContent="開啟";open.onclick=()=>switchToCloud({id:book.id,title:book.title,role:"root",viewerToken:secret?.viewer_token||""}).then(closeManageBook).catch(e=>alert(e.message));
      const pass=document.createElement("button");pass.type="button";pass.textContent="改共用密碼";pass.onclick=async()=>{const p=prompt("新的 Editor 共用密碼（至少 4 碼）");if(p==null)return;const {error}=await supabaseClient.rpc("sbs_set_editor_password",{p_book_id:book.id,p_editor_password:p});if(error){alert(sbErrorCode(error)==="PASSWORD_ALREADY_USED"?"這組密碼已被其他帳本使用。":"密碼設定失敗。");return;}await listRootBooks();};
      const rotate=document.createElement("button");rotate.type="button";rotate.textContent="換 Viewer 網址";rotate.onclick=async()=>{if(!confirm("舊的 Viewer 分享網址會立刻失效，確定更換？"))return;const {data,error}=await supabaseClient.rpc("sbs_rotate_viewer_token",{p_book_id:book.id});if(error){alert("Viewer 網址更換失敗。");return;}if(activeBook.id===book.id){activeBook.viewerToken=String(data||"");rememberActive();renderAccessState();}await listRootBooks();};
      actions.append(open,pass,rotate);row.append(left,actions);rootBooks.appendChild(row);
    });
  }

  function openManageBook(){if(!manageBookModal)return;manageBookModal.classList.remove("hidden");const menu=manageBookBtn?.closest("details");if(menu)menu.open=false;if(rootSession.isRoot)listRootBooks();else setTimeout(()=>editorBookPassword?.focus(),0);renderAccessState();}
  function closeManageBook(){manageBookModal?.classList.add("hidden");}
  manageBookBtn&&(manageBookBtn.onclick=openManageBook); manageBookClose&&(manageBookClose.onclick=closeManageBook);
  manageBookModal?.addEventListener("click",e=>{if(e.target===manageBookModal)closeManageBook();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!manageBookModal?.classList.contains("hidden"))closeManageBook();});
  window.AccAdminV2Style?.bindAccessTabs?.();

  editorUnlockForm?.addEventListener("submit",async e=>{
    e.preventDefault();setMessage(editorAccessMessage,"正在找帳本…","info");
    try{await ensureAnonymousSession();const {data,error}=await supabaseClient.rpc("sbs_unlock_book",{p_editor_password:editorBookPassword.value});if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row)throw new Error("INVALID_BOOK_PASSWORD");editorBookPassword.value="";await switchToCloud({id:row.book_id,title:row.title,role:"editor"});setMessage(editorAccessMessage,"");closeManageBook();}catch(error){console.error(error);setMessage(editorAccessMessage,sbErrorCode(error)==="INVALID_BOOK_PASSWORD"?"找不到這把帳本鑰匙。":"進入帳本失敗，請稍後再試。");}
  });
  useLocalBookBtn&&(useLocalBookBtn.onclick=()=>switchToLocal().then(closeManageBook));

  rootLoginForm?.addEventListener("submit",async e=>{
    e.preventDefault();setMessage(rootLoginMessage,"登入中…","info");
    try{await stopRealtime();const {data,error}=await supabaseClient.auth.signInWithPassword({email:rootEmail.value.trim(),password:rootPassword.value});if(error)throw error;syncRootSession(data.session);rootPassword.value="";setMessage(rootLoginMessage,"");renderAccessState();await listRootBooks();}catch(error){console.error(error);setMessage(rootLoginMessage,"Root 登入失敗，請確認 Email 與密碼。");}
  });
  rootLogoutBtn&&(rootLogoutBtn.onclick=async()=>{await saveQueue.catch(()=>{});await stopRealtime();await supabaseClient.auth.signOut();syncRootSession(null);await ensureAnonymousSession();syncRootSession((await supabaseClient.auth.getSession()).data.session);await switchToLocal();renderAccessState();});

  createBookBtn&&(createBookBtn.onclick=async()=>{
    const title=newBookTitle.value.trim(),password=newBookPassword.value;
    setMessage(rootActionMessage,"建立中…","info");
    const {data,error}=await supabaseClient.rpc("sbs_create_book",{p_title:title,p_editor_password:password});
    if(error){const code=sbErrorCode(error);setMessage(rootActionMessage,code==="PASSWORD_ALREADY_USED"?"這組 Editor 密碼已被其他帳本使用。":code==="PASSWORD_TOO_SHORT"?"Editor 密碼至少 4 碼。":code==="TITLE_REQUIRED"?"請輸入帳本名稱。":"建立帳本失敗。");return;}
    const row=Array.isArray(data)?data[0]:data;newBookTitle.value="";newBookPassword.value="";setMessage(rootActionMessage,"建立完成。","ok");await listRootBooks();if(row)await switchToCloud({id:row.book_id,title:row.title,role:"root",viewerToken:row.viewer_token});
  });

  // 初始化先沿用 v1 原則：本機帳本一定先能畫出來。
  // Supabase / 權限初始化即使失敗，也不能拖垮日曆與本機記帳。
  await switchToLocal();

  // 再初始化 Root session / 匿名 session / Viewer 分享網址 / 上次開啟帳本。
  const sessionResult=await supabaseClient.auth.getSession();
  if(sessionResult.error)console.error("[共付日常 v2] Session 讀取失敗",sessionResult.error);
  if(sessionResult.data?.session){
    syncRootSession(sessionResult.data.session);
  }else{
    try{
      await ensureAnonymousSession();
      syncRootSession((await supabaseClient.auth.getSession()).data.session);
    }catch(error){
      console.error("[共付日常 v2] 匿名 Session 初始化失敗；保留本機帳本",error);
      syncRootSession(null);
    }
  }

  const viewToken=new URL(location.href).searchParams.get("view");
  let restored=false;
  if(viewToken){
    try{const {data,error}=await supabaseClient.rpc("sbs_open_viewer",{p_viewer_token:viewToken});if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(row){await switchToCloud({id:row.book_id,title:row.title,role:row.role||"viewer"});restored=true;}}catch(error){console.error(error);alert("這個 Viewer 分享網址無效或已失效。");}
  }
  if(!restored){
    try{
      const saved=JSON.parse(sessionStorage.getItem(ACTIVE_KEY)||"null");
      if(saved?.mode==="cloud"&&saved.id){
        // Root 重整時把自己的 active role 恢復成 root；匿名 session 則沿用 editor/viewer access。
        const role=rootSession.isRoot?"root":saved.role;
        await switchToCloud({...saved,role});restored=true;
      }
    }catch(error){console.warn("[共付日常 v2] 上次帳本無法恢復",error);forgetActive();}
  }
  if(!restored)await switchToLocal();
  renderAccessState(); if(rootSession.isRoot)listRootBooks();

});
