document.addEventListener("DOMContentLoaded", ()=>{

  const grid  = document.getElementById("grid");
  const stage = document.getElementById("stage");

  if(!grid) return;

  /* =====================
     風格按鈕切換
  ===================== */
  document.querySelectorAll("[data-style]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      loadStyle(btn.dataset.style);
    });
  });

  /* =====================
     背景切換
  ===================== */
  document.querySelectorAll("[data-bg]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      stage.className = "bg-" + btn.dataset.bg;
    });
  });

  /* =====================
     核心載入引擎
  ===================== */
  function loadStyle(name){

    // 🧹 清畫面
    grid.innerHTML = "";

    // 🗑 移除舊風格 script（關鍵）
    const old = document.getElementById("dynamic-style");
    if(old) old.remove();

    // 🚀 載入新風格 JS
    const script = document.createElement("script");
script.src = `./base_${name}.js?t=` + Date.now();
    script.id  = "dynamic-style";

    script.onload = ()=>{
      if(!window.STYLE_DATA) return;

      STYLE_DATA.colors.forEach(hex=>{
        const box = document.createElement("div");
        box.className = "swatch";
        box.style.background = hex;
        box.textContent = hex;
        box.onclick = ()=>navigator.clipboard.writeText(hex);
        grid.appendChild(box);
      });
    };

    document.body.appendChild(script);
  }

  /* 預設載入 */
  loadStyle("black");
});