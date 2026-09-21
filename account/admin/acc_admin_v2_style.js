/* 共付日常 v2：純 UI 互動（權限 / 資料邏輯不放這裡） */
window.AccAdminV2Style={
  bindAccessTabs(){
    const tabs=[...document.querySelectorAll('[data-access-tab]')];
    const panels=[...document.querySelectorAll('[data-access-panel]')];
    tabs.forEach(tab=>tab.addEventListener('click',()=>{
      const key=tab.dataset.accessTab;
      tabs.forEach(x=>x.setAttribute('aria-selected',x===tab?'true':'false'));
      panels.forEach(p=>p.hidden=p.dataset.accessPanel!==key);
    }));
  }
};
