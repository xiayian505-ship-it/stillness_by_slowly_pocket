/* =========================================================
   路況即時通｜hiway.js
   - 系統交流道（國道 × 國道）第一批
   - 預留未來補一般交流道
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

/* ===== 時間 ===== */
function updateTime(){
  const now = new Date();
  document.getElementById("timeText").innerText =
    "目前時間：" + now.toLocaleString("zh-TW");
}
updateTime();


/* ===== 系統交流道資料（真正的） =====
   定義：國道 × 國道
   未來可擴充：
   city: {
     system: [...],
     key: [...],
     normal: [...]
   }
*/
const INTERCHANGES = {
  台北: {
    system: [
      {
        name: "台北系統交流道",
        highways: ["國道1號", "國道3號"],
        lat: 25.083,
        lng: 121.567,
        zoom: 12
      }
    ]
  },

  新北: {
    system: [
      {
        name: "五股系統交流道",
        highways: ["國道1號", "國道3號"],
        lat: 25.082,
        lng: 121.435,
        zoom: 12
      }
    ]
  },

  新竹: {
    system: [
      {
        name: "新竹系統交流道",
        highways: ["國道1號", "國道3號"],
        lat: 24.831,
        lng: 121.009,
        zoom: 12
      }
    ]
  },

  台中: {
    system: [
      {
        name: "台中系統交流道",
        highways: ["國道1號", "國道4號"],
        lat: 24.190,
        lng: 120.616,
        zoom: 12
      },
      {
        name: "霧峰系統交流道",
        highways: ["國道3號", "國道6號"],
        lat: 24.046,
        lng: 120.695,
        zoom: 12
      }
    ]
  },

  高雄: {
    system: [
      {
        name: "高雄系統交流道",
        highways: ["國道1號", "國道10號"],
        lat: 22.703,
        lng: 120.348,
        zoom: 12
      }
    ]
  }
};

const CITY_CENTER = {
  台北:   { lat:25.03, lng:121.56, zoom:11 },
  新北:   { lat:25.01, lng:121.46, zoom:11 },
  基隆:   { lat:25.13, lng:121.74, zoom:12 },
  桃園:   { lat:24.99, lng:121.30, zoom:11 },
  新竹:   { lat:24.80, lng:120.97, zoom:12 },
  苗栗:   { lat:24.56, lng:120.82, zoom:12 },
  台中:   { lat:24.15, lng:120.67, zoom:11 },
  彰化:   { lat:24.08, lng:120.54, zoom:12 },
  南投:   { lat:23.96, lng:120.97, zoom:11 },
  雲林:   { lat:23.71, lng:120.54, zoom:12 },
  嘉義:   { lat:23.48, lng:120.45, zoom:12 },
  台南:   { lat:22.99, lng:120.20, zoom:11 },
  高雄:   { lat:22.63, lng:120.30, zoom:11 },
  屏東:   { lat:22.67, lng:120.48, zoom:11 },
  宜蘭:   { lat:24.75, lng:121.75, zoom:11 },
  花蓮:   { lat:23.99, lng:121.60, zoom:11 },
  台東:   { lat:22.76, lng:121.14, zoom:11 }
};


/* ===== 區域展開 / 收合 ===== */
const regionBox = document.getElementById("regions");
const toggleBtn = document.getElementById("toggleRegionBtn");

toggleBtn.onclick = () => {
  regionBox.classList.toggle("hidden");
};


/* 點區域 → 展開縣市 */
/* 點區域 → 展開縣市（只做 UI） */
document.querySelectorAll("[data-region]").forEach(btn=>{
  btn.onclick = ()=>{
    const id = btn.dataset.region;
    document.querySelectorAll(".city-list")
      .forEach(el => el.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  };
});


/* ===== 系統交流道顯示 ===== */
function renderSystemInterchanges(city){
  const card = document.getElementById("interchangeCard");
  const box  = document.getElementById("interchangeList");

  if(!card || !box) return;

  box.innerHTML = "";

  const cityData = INTERCHANGES[city];
  if(!cityData || !cityData.system || cityData.system.length === 0){
    card.classList.add("hidden");
    return;
  }

  cityData.system.forEach(item=>{
    const btn = document.createElement("button");
    btn.textContent = item.name;
    btn.title = item.highways.join(" × ");

btn.onclick = ()=>{
  document.getElementById("currentText").innerText =
    `目前路況｜${city}｜${item.name}`;

  if (window.map) {
    map.setCenter({ lat: item.lat, lng: item.lng });
    map.setZoom(item.zoom);
  }
};

    box.appendChild(btn);
  });

  card.classList.remove("hidden");
}


/* 點縣市 → 更新標題、收合、顯示系統交流道 */
document.querySelectorAll("[data-city]").forEach(btn=>{
  btn.onclick = ()=>{
    const city = btn.dataset.city;

    document.getElementById("currentText").innerText =
      "目前路況｜" + city;

    regionBox.classList.add("hidden");
    document.querySelectorAll(".city-list")
      .forEach(el=>el.classList.add("hidden"));

    renderSystemInterchanges(city);

const center = CITY_CENTER[city];
if (window.map && center) {
  map.setCenter({ lat:center.lat, lng:center.lng });
  map.setZoom(center.zoom);
}
    
  };
});


/* ===== 重新整理鎖（30 分鐘，靜默） ===== */
const REFRESH_LOCK_MIN = 30;
const REFRESH_KEY = "traffic_refresh_lock";
const refreshBtn = document.getElementById("refreshBtn");

const last = localStorage.getItem(REFRESH_KEY);
if(last && (Date.now() - Number(last)) < REFRESH_LOCK_MIN * 60000){
  refreshBtn.disabled = true;
}

refreshBtn.onclick = ()=>{
  if(refreshBtn.disabled) return;
  localStorage.setItem(REFRESH_KEY, Date.now());
  refreshBtn.disabled = true;
  location.reload();
};
});