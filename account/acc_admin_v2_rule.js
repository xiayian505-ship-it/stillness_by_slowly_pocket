(() => {
  "use strict";

  function initRuleBook(){
    const systemButtons=document.querySelector(".system-buttons");
    const clearMonthBtn=systemButtons?.querySelector(".refresh");
    const manageBookBtn=document.querySelector("#manageBookBtn");

    if(!systemButtons||!clearMonthBtn||!manageBookBtn)return;
    if(document.querySelector("#ruleBookBtn"))return;

    // 資料選單順序：匯出 → 匯入 → 清空本月 → 詳閱共付 → 管理帳本 → 清空帳本
    systemButtons.insertBefore(clearMonthBtn,manageBookBtn);

    const ruleBtn=document.createElement("button");
    ruleBtn.type="button";
    ruleBtn.id="ruleBookBtn";
    ruleBtn.textContent="詳閱共付";
    systemButtons.insertBefore(ruleBtn,manageBookBtn);

    const modal=document.createElement("div");
    modal.id="ruleBookModal";
    modal.className="danger-modal hidden";
    modal.setAttribute("role","dialog");
    modal.setAttribute("aria-modal","true");
    modal.setAttribute("aria-labelledby","ruleBookTitle");

    modal.innerHTML=`
      <div class="danger-card rule-book-card">
        <div class="modal-head">
          <span id="ruleBookTitle">詳閱共付</span>
          <button type="button" id="ruleBookClose" class="close" aria-label="關閉">×</button>
        </div>

        <nav class="rule-book-tabs" role="tablist" aria-label="詳閱共付分類">
          <button type="button" class="rule-book-tab" role="tab" aria-selected="true" aria-controls="ruleBookLedgerPanel" data-rule-tab="ledger">帳本</button>
          <button type="button" class="rule-book-tab" role="tab" aria-selected="false" aria-controls="ruleBookManagePanel" data-rule-tab="manage">管理</button>
        </nav>

        <section id="ruleBookLedgerPanel" class="rule-book-panel" role="tabpanel" data-rule-panel="ledger">
          <div class="rule-book-rules">
            <p>帳本明細保留 365 天</p>
            <hr>
            <p>所有幣別統一換算為 TWD 後計算<br>結算結果可換算為指定幣別顯示</p>
            <hr>
            <p>即時匯率由 ExchangeRate-API 提供<br>外幣紀錄保留記帳時匯率<br>結算匯率以套用當下匯率計算</p>
            <hr>
            <p>帳外調整僅影響當月結算</p>
            <hr>
          </div>
        </section>

        <section id="ruleBookManagePanel" class="rule-book-panel" role="tabpanel" data-rule-panel="manage" hidden>
          <div class="rule-book-rules">
            <p>同 Email 只能申請一次<br>管理密碼無法更改<br>設定後自行保管</p>
            <hr>
            <p>每個 Email 最多建立 3 本雲端帳本<br>每本獨立設定共享密碼<br>每本獨立設定唯讀網址</p>
            <hr>
            <p>持有唯讀網址<br>可進入帳本</p>
            <p>輸入共享密碼<br>可編輯帳本</p>
            <hr>
          </div>
        </section>

        <div class="rule-book-signature">慢 慢 | stillness by slowly</div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn=modal.querySelector("#ruleBookClose");
    const tabs=[...modal.querySelectorAll("[data-rule-tab]")];
    const panels=[...modal.querySelectorAll("[data-rule-panel]")];

    function showTab(name){
      tabs.forEach(tab=>{
        const active=tab.dataset.ruleTab===name;
        tab.setAttribute("aria-selected",String(active));
        tab.tabIndex=active?0:-1;
      });
      panels.forEach(panel=>{
        panel.hidden=panel.dataset.rulePanel!==name;
      });
    }

    function openRule(){
      modal.classList.remove("hidden");
      showTab("ledger");
      const menu=ruleBtn.closest("details");
      if(menu)menu.open=false;
      setTimeout(()=>closeBtn?.focus(),0);
    }

    function closeRule(){
      modal.classList.add("hidden");
      ruleBtn.focus();
    }

    ruleBtn.addEventListener("click",openRule);
    closeBtn?.addEventListener("click",closeRule);

    tabs.forEach((tab,index)=>{
      tab.addEventListener("click",()=>showTab(tab.dataset.ruleTab));
      tab.addEventListener("keydown",event=>{
        if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;
        event.preventDefault();
        const step=event.key==="ArrowRight"?1:-1;
        const next=(index+step+tabs.length)%tabs.length;
        tabs[next].focus();
        showTab(tabs[next].dataset.ruleTab);
      });
    });

    modal.addEventListener("click",event=>{
      if(event.target===modal)closeRule();
    });

    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&!modal.classList.contains("hidden"))closeRule();
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",initRuleBook,{once:true});
  }else{
    initRuleBook();
  }
})();
