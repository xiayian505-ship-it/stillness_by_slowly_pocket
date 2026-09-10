document.addEventListener("DOMContentLoaded", async ()=>{
  /* =========================================================
     慢慢｜雙人記帳本 acc_admin_v1.js
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
  const STORE_NAMESPACE="sbs-duo-book-v1";
  const STATE_ID="main";
  if(!window.DateTime||!window.Timestamp||!window.Money||!window.Currency||!window.DataBackup||!window.RealtimeSync||!window.FictionChange||!window.FictionStorage||!window.AuthPermissionUI){
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
  const adjustSide=$("#adjustSide"), adjustAmount=$("#adjustAmount");
  const modal=$("#detailModal"), modalDate=$("#modalDate"), closeBtn=$("#detailModal .close"), listA=$("#listA"), listB=$("#listB"), addBtns=$$(".add");
  const editModal=$("#editModal"), editTitleEl=editModal?.querySelector(".danger-title"), editItem=$("#editItem"), editAmount=$("#editAmount"), editCancel=$("#editCancel"), editOk=$("#editOk"), editCurrency=$("#editCurrency"), editRate=$("#editRate");
  const dangerModal=$("#dangerModal"), dangerTitle=dangerModal?.querySelector(".danger-title"), dangerText=dangerModal?.querySelector(".danger-text"), dangerCancel=$("#dangerCancelBtn"), dangerConfirm=$("#dangerOkBtn");
  const settleCurrency=$("#settleCurrency"), applyBtn=$("#applyCurrencyBtn");
  const manageBookBtn=$("#manageBookBtn"), manageBookModal=$("#manageBookModal"), manageBookClose=$("#manageBookClose");

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

  /* ===== Storage / Auth boundary =====
     AuthPermissionUI：只負責登入表單與登入/登出狀態 UI。
     Supabase Auth：負責 Email + Password 驗證、Session 與登出。
     Supabase books：已登入後只讀寫目前 user.id 對應的唯一帳本。
     FictionStorage：未登入時使用本機帳本。

     SECURITY BOUNDARY：
     - 前端不保存密碼。
     - Publishable key 可以存在瀏覽器；真正資料權限由 books RLS 保護。
     - books.owner_id 必須等於 auth.uid()，且 owner_id 已設 UNIQUE。
     - Secret key / service_role 絕對不可放前端。
  ===== */
  const localStore=FictionStorage.create({namespace:STORE_NAMESPACE});
  const localState=localStore.collection("state");
  const bookChange=FictionChange.create({name:"sbs-duo-book-v1"});

  const SupabaseBookAdapter={
    async loadOrCreate(userId){
      if(!userId)throw new Error("missing authenticated user id");

      const {data,error}=await supabaseClient
        .from("books")
        .select("id,state,created_at,updated_at")
        .eq("owner_id",userId)
        .maybeSingle();

      if(error)throw error;
      if(data){
        return {
          state:normalize(data.state),
          updatedAt:data.updated_at||null
        };
      }

      const emptyState=normalize({});
      const {data:created,error:createError}=await supabaseClient
        .from("books")
        .insert({
          owner_id:userId,
          state:emptyState
        })
        .select("id,state,created_at,updated_at")
        .single();

      if(createError){
        // 若同一帳號在另一分頁同時完成首次建立，UNIQUE 可能先被另一邊搶到。
        if(createError.code==="23505"){
          const {data:retry,error:retryError}=await supabaseClient
            .from("books")
            .select("id,state,created_at,updated_at")
            .eq("owner_id",userId)
            .single();
          if(retryError)throw retryError;
          return {
            state:normalize(retry.state),
            updatedAt:retry.updated_at||null
          };
        }
        throw createError;
      }

      return {
        state:normalize(created.state),
        updatedAt:created.updated_at||null
      };
    },

    async save(userId,state,expectedUpdatedAt=null){
      if(!userId)throw new Error("missing authenticated user id");

      let query=supabaseClient
        .from("books")
        .update({state})
        .eq("owner_id",userId);

      // 樂觀鎖：只有雲端仍是本機已知版本時才允許整包 state 覆蓋。
      if(expectedUpdatedAt){
        query=query.eq("updated_at",expectedUpdatedAt);
      }

      const {data,error}=await query
        .select("updated_at")
        .maybeSingle();

      if(error)throw error;

      if(!data){
        const conflict=new Error("book version conflict");
        conflict.code="BOOK_VERSION_CONFLICT";
        throw conflict;
      }

      return data.updated_at||null;
    }
  };

  let session={isAuthenticated:false,email:"",userId:""};
  let bookUpdatedAt=null;
  let realtimeSync=null;
  let stateEpoch=0;
  let cloudSaveErrorNotified=false;
  let records={},names={A:"A",B:"B"},adjust={},currencyBook={},saveQueue=Promise.resolve();
  const now=new Date(); let viewYear=now.getFullYear(),viewMonth=now.getMonth();
  const monthPrefix=()=>`${viewYear}-${pad(viewMonth+1)}-`, monthKey=()=>`${viewYear}-${pad(viewMonth+1)}`;

  function localSnapshot(){return clone({id:STATE_ID,records,names,adjust,currencyBook});}
  function cloudSnapshot(){return clone({records,names,adjust,currencyBook});}

  function prune(){
    let changed=false;
    const today=DateTime.dateKey();
    for(const obj of [records,currencyBook]){
      Object.keys(obj).forEach(k=>{
        const age=DateTime.diffDays(k,today);
        if(age!==null&&age>RETAIN_DAYS){
          delete obj[k];
          changed=true;
        }
      });
    }
    return changed;
  }

  async function loadActive(){
    let s;
    if(session.isAuthenticated){
      const cloud=await SupabaseBookAdapter.loadOrCreate(session.userId);
      s=cloud.state;
      bookUpdatedAt=cloud.updatedAt;
    }else{
      s=normalize(await localState.get(STATE_ID));
      bookUpdatedAt=null;
    }

    records=s.records;
    names=s.names;
    adjust=s.adjust;
    currencyBook=s.currencyBook;
  }

  /* ===== Realtime / shared-book sync =====
     RealtimeSync 只負責跨裝置事件與版本判斷。
     帳本本身負責：
     - 收到遠端 state 後套用資料並重畫
     - save 時用 updated_at 做 optimistic locking
     - 登入開始訂閱、登出解除訂閱
  ===== */
  function applyBookState(state,updatedAt,{emitType="remote-sync"}={}){
    const next=normalize(state);
    records=next.records;
    names=next.names;
    adjust=next.adjust;
    currencyBook=next.currencyBook;
    bookUpdatedAt=updatedAt||null;
    stateEpoch+=1;

    realtimeSync?.setKnownVersion(bookUpdatedAt);

    syncNameInputs();
    updateLabels();
    renderCalendar();

    if(modal&&!modal.classList.contains("hidden")&&modal.dataset.date){
      renderDetail(modal.dataset.date);
    }

    bookChange.emit({
      type:emitType,
      collection:"state",
      operationId:Timestamp.create()
    });
  }

  async function reloadCloudBook(emitType="remote-reload"){
    if(!session.isAuthenticated||!session.userId)return false;

    const cloud=await SupabaseBookAdapter.loadOrCreate(session.userId);
    applyBookState(cloud.state,cloud.updatedAt,{emitType});
    return true;
  }

  async function stopRealtime(){
    const sync=realtimeSync;
    realtimeSync=null;

    if(sync){
      await sync.destroy();
    }
  }

  async function startRealtime(){
    if(!session.isAuthenticated||!session.userId)return;

    await stopRealtime();

    const targetUserId=session.userId;
    const sync=RealtimeSync.create({
      client:supabaseClient,
      table:"books",
      event:"UPDATE",
      filter:`owner_id=eq.${targetUserId}`,
      versionField:"updated_at",
      knownVersion:bookUpdatedAt,

      async onRemote(event){
        // 若登入狀態已切換，不接受舊訂閱殘留事件。
        if(!session.isAuthenticated||session.userId!==targetUserId)return;

        // 等目前已排入的本機存檔完成，避免自己的 UPDATE 回來時重複套用。
        await saveQueue.catch(()=>{});

        if(!session.isAuthenticated||session.userId!==targetUserId)return;

        const comparison=RealtimeSync.compareVersion(event.version,bookUpdatedAt);
        if(comparison!==null&&comparison<=0){
          sync.setKnownVersion(bookUpdatedAt);
          return;
        }

        applyBookState(event.record?.state,event.version,{emitType:"remote-sync"});
        cloudSaveErrorNotified=false;
      },

      async onReconnect(){
        if(!session.isAuthenticated||session.userId!==targetUserId)return;
        await saveQueue.catch(()=>{});
        if(!session.isAuthenticated||session.userId!==targetUserId)return;
        await reloadCloudBook("realtime-reconnect");
      },

      onStatus({status,error}){
        if(error)console.error("[共付日常] Realtime 狀態錯誤",status,error);
      }
    });

    realtimeSync=sync;
    sync.setKnownVersion(bookUpdatedAt);
    await sync.subscribe();
  }

  function saveState(type="save"){
    prune();
    const op=Timestamp.create();
    const authenticated=session.isAuthenticated;
    const userId=session.userId;
    const localSnap=localSnapshot();
    const cloudSnap=cloudSnapshot();
    const queuedEpoch=stateEpoch;

    saveQueue=saveQueue.catch(()=>{}).then(async()=>{
      // 遠端資料若已在等待期間套用，這份舊快照不得再回頭覆蓋新版。
      if(authenticated&&queuedEpoch!==stateEpoch){
        return;
      }

      if(authenticated){
        const expectedUpdatedAt=bookUpdatedAt;
        const updatedAt=await SupabaseBookAdapter.save(
          userId,
          cloudSnap,
          expectedUpdatedAt
        );

        bookUpdatedAt=updatedAt;
        realtimeSync?.setKnownVersion(bookUpdatedAt);
      }else{
        await localState.upsert(localSnap);
      }

      cloudSaveErrorNotified=false;
      bookChange.emit({type,collection:"state",operationId:op});
    }).catch(async e=>{
      console.error("[共付日常] 儲存失敗",e);

      if(authenticated&&e?.code==="BOOK_VERSION_CONFLICT"){
        try{
          await reloadCloudBook("version-conflict-reload");
          alert("另一個裝置剛剛已更新帳本。\n\n已重新載入雲端最新版；這次修改沒有覆蓋對方資料，請再操作一次。");
        }catch(reloadError){
          console.error("[共付日常] 衝突後重新載入失敗",reloadError);
          alert("偵測到另一個裝置已更新帳本，但重新載入最新版失敗。請重新整理後再繼續操作。");
        }
        return;
      }

      if(authenticated&&!cloudSaveErrorNotified){
        cloudSaveErrorNotified=true;
        alert("雲端帳本儲存失敗。畫面上的變更可能尚未寫入雲端，請確認網路後再試。");
      }
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
  function renderDetail(date){listA.innerHTML="";listB.innerHTML="";(records[date]||[]).forEach((r,i)=>{const div=document.createElement("div"),c=currencyBook[date]?.[i],cur=c?.currency||"TWD",label=`${esc(r.item||"懶得打")}  ${Money.cleanNumber(r.amount)} ${esc(cur)}`;if(r.deleted){div.classList.add("is-history");div.innerHTML=`<span>${label}</span><span class="history-tag">歷史</span>`;}else{div.innerHTML=`<span>${label}</span><button data-m="overwrite">修改會覆蓋</button><button data-m="preserve">修改仍保留</button>`;div.querySelectorAll("button").forEach(btn=>btn.onclick=()=>openEdit({title:btn.dataset.m==="overwrite"?"編輯（改覆蓋）":"編輯（改保留）",item:r.item||"",amount:r.amount,onOpen:()=>{editCurrency.value=c?.currency||"TWD";syncFake(fakeSets[1]);editRate.value=c?.rate??"";},onOk:({item,amount})=>{const cur=editCurrency.value||"TWD",rate=editRate.value;if(btn.dataset.m==="overwrite"){r.item=item;r.amount=amount;r.deleted=false;lockRate(date,i,cur,rate,amount);}else{r.deleted=true;records[date].push({type:r.type,item,amount,deleted:false});lockRate(date,records[date].length-1,cur,rate,amount);}saveState("records-change");renderDetail(date);renderCalendar();}}));}(r.type==="a_to_b"?listA:listB).appendChild(div);});}
  function addRecord(type){const date=modal?.dataset.date;if(!date)return;openEdit({title:"新增紀錄",onOpen:()=>{editCurrency.value="TWD";syncFake(fakeSets[1]);editRate.value="1";},onOk:({item,amount})=>{records[date]??=[];records[date].push({type,item,amount,deleted:false});lockRate(date,records[date].length-1,editCurrency.value||"TWD",editRate.value,amount);saveState("records-add");renderDetail(date);renderCalendar();}});}
  if(addBtns.length>=2){addBtns[0].onclick=()=>addRecord("a_to_b");addBtns[1].onclick=()=>addRecord("b_to_a");}
  calendarGrid?.addEventListener("click",e=>{const day=e.target.closest(".calendar-day[data-date]");if(!day)return;modal.dataset.date=day.dataset.date;modalDate.textContent=`${day.dataset.date} 明細`;renderDetail(day.dataset.date);modal.classList.remove("hidden");});closeBtn&&(closeBtn.onclick=()=>modal.classList.add("hidden"));
  prevBtn&&(prevBtn.onclick=()=>{if(--viewMonth<0){viewMonth=11;viewYear--;}renderCalendar();});nextBtn&&(nextBtn.onclick=()=>{if(++viewMonth>11){viewMonth=0;viewYear++;}renderCalendar();});

  let dangerAction=null;function openDanger({title,textHtml,onConfirm}){dangerTitle.textContent=title;dangerText.innerHTML=textHtml;dangerAction=onConfirm;dangerModal.classList.remove("hidden");}function closeDanger(){dangerModal.classList.add("hidden");dangerAction=null;}dangerCancel&&(dangerCancel.onclick=closeDanger);dangerConfirm&&(dangerConfirm.onclick=()=>{dangerAction?.();closeDanger();});
  refreshBtn&&(refreshBtn.onclick=()=>openDanger({title:"清空本月帳本",textHtml:`這會刪除 <b>${viewYear} 年 ${viewMonth+1} 月</b> 的所有明細與本月帳外調整。`,onConfirm:()=>{const p=monthPrefix();Object.keys(records).forEach(k=>k.startsWith(p)&&delete records[k]);Object.keys(currencyBook).forEach(k=>k.startsWith(p)&&delete currencyBook[k]);delete adjust[monthKey()];saveState("clear-month");renderCalendar();}}));
  clearAllBtn&&(clearAllBtn.onclick=()=>openDanger({title:"清空全部帳本",textHtml:"這會清除目前帳本的所有記錄、匯率資料與帳外調整，是否刪除？",onConfirm:()=>{records={};currencyBook={};adjust={};saveState("clear-all");renderCalendar();}}));

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
      extraMeta:{bookUpdatedAt:session.isAuthenticated?bookUpdatedAt:null}
    });
    DataBackup.downloadJson(`sbs_duo_book_backup_${Timestamp.create()}.json`,payload);
  }
  function normAdj(v){if(!plain(v))return{};const out={};Object.entries(v).forEach(([m,a])=>{if(/^\d{4}-\d{2}$/.test(m)&&plain(a))out[m]={side:a.side==="B"?"B":"A",amount:Money.toNumber(a.amount,0)};});return out;}
  function validTime(value){const t=Date.parse(value);return Number.isFinite(t)?t:null;}
  async function persistImportedState(next){
    if(session.isAuthenticated){
      const updatedAt=await SupabaseBookAdapter.save(
        session.userId,
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

      if(session.isAuthenticated){
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
  if(inputA)inputA.oninput=()=>{names.A=inputA.value||"A";saveState("names-change");updateLabels();renderCalendar();};if(inputB)inputB.oninput=()=>{names.B=inputB.value||"B";saveState("names-change");updateLabels();renderCalendar();};

  function syncFake(x){if(!x.native||!x.label)return;x.label.textContent=x.native.value;x.opts.forEach(b=>b.setAttribute("aria-selected",b.dataset.value===x.native.value?"true":"false"));}
  function closeFake(x){if(x.menu)x.menu.hidden=true;if(x.trigger)x.trigger.setAttribute("aria-expanded","false");}
  function bindFake(x){if(!x.native||!x.trigger||!x.menu)return;syncFake(x);x.trigger.onclick=e=>{e.stopPropagation();const open=x.trigger.getAttribute("aria-expanded")==="true";fakeSets.forEach(closeFake);closeAdjust();x.menu.hidden=open;x.trigger.setAttribute("aria-expanded",open?"false":"true");};x.opts.forEach(b=>b.onclick=()=>{x.native.value=b.dataset.value;syncFake(x);x.native.dispatchEvent(new Event("change",{bubbles:true}));closeFake(x);x.trigger.focus();});}
  fakeSets.forEach(bindFake);
  function syncAdjustFake(){if(!adjustSide||!adjustFake.label)return;const v=adjustSide.value==="B"?"B":"A";adjustFake.label.textContent=v==="A"?`${names.A} 多付`:`${names.B} 多付`;adjustFake.root.classList.toggle("is-a",v==="A");adjustFake.root.classList.toggle("is-b",v==="B");adjustFake.opts.forEach(b=>{b.textContent=b.dataset.value==="A"?`${names.A} 多付`:`${names.B} 多付`;b.setAttribute("aria-selected",b.dataset.value===v?"true":"false");});}
  function closeAdjust(){if(adjustFake.menu)adjustFake.menu.hidden=true;adjustFake.trigger?.setAttribute("aria-expanded","false");}
  if(adjustFake.trigger)adjustFake.trigger.onclick=e=>{e.stopPropagation();const open=adjustFake.trigger.getAttribute("aria-expanded")==="true";fakeSets.forEach(closeFake);adjustFake.menu.hidden=open;adjustFake.trigger.setAttribute("aria-expanded",open?"false":"true");};adjustFake.opts.forEach(b=>b.onclick=()=>{adjustSide.value=b.dataset.value==="B"?"B":"A";adjustSide.dispatchEvent(new Event("change",{bubbles:true}));closeAdjust();});
  document.addEventListener("click",()=>{fakeSets.forEach(closeFake);closeAdjust();});document.addEventListener("keydown",e=>{if(e.key==="Escape"){fakeSets.forEach(closeFake);closeAdjust();}});
  adjustSide&&(adjustSide.onchange=()=>{const a=getAdj();setAdj(adjustSide.value,a.amount);saveState("adjust-change");syncAdjust();updateSummary();});adjustAmount&&(adjustAmount.oninput=()=>{const a=getAdj();setAdj(a.side,Money.toNumber(adjustAmount.value,0));saveState("adjust-change");updateSummary();});
  settleCurrency&&(settleCurrency.onchange=()=>{syncFake(fakeSets[0]);updateSummary();});applyBtn&&(applyBtn.onclick=async()=>{applyBtn.disabled=true;try{await refreshRate(settleCurrency.value||"TWD");}finally{applyBtn.disabled=false;updateSummary();}});

  /* ===== Auth / Permission UI =====
     軍火庫 Auth_permission_ui.js 負責 UI。
     Supabase Auth 負責真實登入 / Session / 登出。
     已登入後載入自己的 Supabase books row；登出後切回 Guest 本機帳本。
  ===== */
  let authUI=null;

  function setSessionFromSupabase(sbSession){
    const user=sbSession?.user||null;
    session={
      isAuthenticated:!!user,
      email:String(user?.email||""),
      userId:String(user?.id||"")
    };
  }

  function renderAuthUI(){
    const loggedIn=session.isAuthenticated;
    authUI?.setState({
      role:loggedIn?"authenticated":"guest",
      permissions:loggedIn?["authenticated"]:["guest"],
      displayName:session.email||"",
      statusText:loggedIn?`已登入｜${session.email}`:"未登入｜本機帳本",
      permissionText:loggedIn?"雲端帳本模式":"本機帳本模式"
    });
  }

  function afterAuthChange(){
    syncNameInputs();
    updateLabels();
    renderCalendar();
    renderAuthUI();
  }

  function openManageBook(){
    if(!manageBookModal)return;
    manageBookModal.classList.remove("hidden");
    const menu=manageBookBtn?.closest("details");
    if(menu)menu.open=false;
    if(!session.isAuthenticated)setTimeout(()=>$("#loginAccount")?.focus(),0);
  }
  function closeManageBook(){manageBookModal?.classList.add("hidden");}
  manageBookBtn&&(manageBookBtn.onclick=openManageBook);
  manageBookClose&&(manageBookClose.onclick=closeManageBook);
  manageBookModal?.addEventListener("click",e=>{if(e.target===manageBookModal)closeManageBook();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!manageBookModal?.classList.contains("hidden"))closeManageBook();});

  authUI=AuthPermissionUI.create({
    root:"#authPermissionRoot",
    loginErrorText:"登入失敗，請確認 Email 與密碼。",
    onLogin:async({account,password},ui)=>{
      // SECURITY BOUNDARY：帳密只交給 Supabase Auth，不自行保存。
      const {data,error}=await supabaseClient.auth.signInWithPassword({
        email:String(account||"").trim(),
        password:String(password||"")
      });
      if(error)throw error;

      setSessionFromSupabase(data.session);
      await loadActive();
      const pruned=prune();
      if(pruned)await saveState("prune-after-login");
      await startRealtime();
      ui.clearPassword();
      ui.clearMessage();
      afterAuthChange();
      closeManageBook();
    },
    onLogout:async(ui)=>{
      await saveQueue.catch(()=>{});
      await stopRealtime();

      const {error}=await supabaseClient.auth.signOut();
      if(error)throw error;

      setSessionFromSupabase(null);
      stateEpoch+=1;
      await loadActive();
      ui.clearCredentials();
      ui.clearMessage();
      afterAuthChange();
    }
  });

  // 頁面重新整理後，從 Supabase 取回既有 Session。
  const {data:sessionData,error:sessionError}=await supabaseClient.auth.getSession();
  if(sessionError){
    console.error("[共付日常] 讀取 Supabase Session 失敗",sessionError);
    authUI.setMessage("登入狀態讀取失敗，請重新整理後再試。","error");
  }else{
    setSessionFromSupabase(sessionData.session);
  }

  await loadActive();
  const prunedOnInit=prune();
  if(prunedOnInit)await saveState("prune-on-init");
  if(session.isAuthenticated)await startRealtime();
  syncNameInputs();
  fakeSets.forEach(syncFake);
  updateLabels();
  renderCalendar();
  renderAuthUI();
});
