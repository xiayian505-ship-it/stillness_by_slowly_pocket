(function () {
  "use strict";

  const els = {
    month: { value: "" },
    name: document.getElementById("nameInput"),
    nameResults: document.getElementById("nameResults"),
    days: document.getElementById("daysInput"),
    add: document.getElementById("addPersonBtn"),
    list: document.getElementById("personList"),
    registry: document.getElementById("registryList"),
    formMessage: document.getElementById("formMessage"),
    clear: document.getElementById("clearBtn"),
    openOffday: document.getElementById("openOffdayBtn"),
    offdayDialog: document.getElementById("offdayDialog"),
    offdayTitle: document.getElementById("offdayTitle"),
    monthDialog: document.getElementById("monthDialog"),
    pickerYear: document.getElementById("pickerYear"),
    monthGrid: document.getElementById("monthGrid"),
    prevYear: document.getElementById("prevYearBtn"),
    nextYear: document.getElementById("nextYearBtn"),
    manageDialog: document.getElementById("manageDialog"),
    openManage: document.getElementById("openManageBtn"),
    manageMonthLabel: document.getElementById("manageMonthLabel"),
    calendar: document.getElementById("calendar"),
    dateCard: document.getElementById("dateCard"),
    calendarPanel: document.getElementById("calendarPanel"),
    closeCalendar: document.getElementById("closeCalendarBtn"),
    heroMonth: document.getElementById("heroMonth"),
    heroYear: document.getElementById("heroYear"),
    heroDate: document.getElementById("heroDate"),
    heroLabel: document.getElementById("heroLabel"),
    heroSummary: document.getElementById("heroSummary")
  };

  const requiredGlobals = [
    "Calendar", "SlowlyCalendar", "CalendarInteraction", "DateTime",
    "SelectOrCreate", "DateOverlap", "FictionStorage", "FictionChange", "SlowlySelect",
    "LunarFestivals", "SolarFestivals", "SolarTerms"
  ];

  const missing = requiredGlobals.filter(name => !window[name]);
  if (missing.length) {
    els.formMessage.textContent = "缺少模組：" + missing.join(", ") + "。";
    els.add.disabled = true;
    return;
  }

  const store = FictionStorage.create({ namespace: "slowly-shift-overlap" });
  const peopleCollection = store.collection("people");
  const schedulesCollection = store.collection("schedules");
  const change = FictionChange.create({ name: "shift-overlap" });

  const people = new SelectOrCreate({
    items: [],
    async onCreate(item) {
      return peopleCollection.add(item);
    }
  });

  let monthEntries = [];
  let dateIndex = new Map();
  let pickerYear = todayYear();
  let editingPersonId = null;

  const today = new Date();
  function todayYear(){ return new Date().getFullYear(); }
  els.month.value = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0");

  const calendar = SlowlyCalendar.mount(els.calendar, {
    view: "month",
    date: els.month.value + "-01",
    showLunar: true,
    showFestivals: true,
    showSolarTerms: true
  });
  const interaction = CalendarInteraction.create(calendar);

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function personName(id) {
    return people.findById(id)?.name || `(已刪除人員：${id})`;
  }

  function syncCustomSelects(root = document) {
    root.querySelectorAll("select").forEach(select => {
      if (!select.__slowlySelectInstance) {
        SlowlySelect.create(select, { className: "shift-select" });
      } else {
        select.__slowlySelectInstance.sync();
      }
    });
  }

  function ensureOffdayDetail() {
    let box = els.calendar.querySelector(".host-offday-detail");
    if (!box) {
      box = document.createElement("div");
      box.className = "host-offday-detail";
      box.hidden = true;
      els.calendar.appendChild(box);
    }
    return box;
  }

  function renderOffdayDetail(dateKey) {
    const box = ensureOffdayDetail();
    const entry = dateIndex.get(dateKey);
    if (!entry || !entry.count) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    const names = entry.ids.map(personName);
    box.innerHTML = `
      <div class="host-offday-title">${entry.count >= 2 ? `${entry.count} 人休假一起` : "休假"}</div>
      <div class="host-offday-names">${names.map(escapeHTML).join("、")}</div>
    `;
    box.hidden = false;
  }

  function parseDayNumbers(raw, monthValue) {
    const tokens = String(raw || "").split(/[\s,，、;；]+/).map(v => v.trim()).filter(Boolean);
    const unique = [], seen = new Set(), invalid = [];
    for (const token of tokens) {
      if (!/^\d{1,2}$/.test(token)) { invalid.push(token); continue; }
      const day = Number(token);
      const key = monthValue + "-" + String(day).padStart(2, "0");
      if (!DateTime.parseDateKey(key)) { invalid.push(token); continue; }
      if (!seen.has(day)) { seen.add(day); unique.push(day); }
    }
    unique.sort((a,b) => a-b);
    return { days: unique, invalid };
  }

  function fullDateKeys(days, month = els.month.value) {
    return days.map(day => month + "-" + String(day).padStart(2, "0"));
  }

  async function loadPeople() {
    const records = await peopleCollection.all();
    people.setItems(records);
    renderRegistry();
  }

  async function getMonthRecord(month) {
    return schedulesCollection.find(item => item.month === month);
  }

  async function loadMonth(month = els.month.value) {
    const record = await getMonthRecord(month);
    monthEntries = Array.isArray(record?.entries)
      ? record.entries.map(x => ({ id: x.id, days: Array.isArray(x.days) ? [...x.days] : [] }))
      : [];
    renderPeople();
    rebuildComparison();
  }

  async function saveCurrentMonth() {
    const month = els.month.value;
    if (!month) return;

    const existing = await getMonthRecord(month);
    const payload = { month, entries: monthEntries };

    if (existing) {
      await schedulesCollection.update(existing.id, payload);
    } else if (monthEntries.length) {
      await schedulesCollection.add(payload);
    }

    if (existing && !monthEntries.length) {
      await schedulesCollection.remove(existing.id);
    }

    change.emit({ type: "save", collection: "schedules", month });
  }

  function monthNumber(month) {
    const m = /^(\d{4})-(\d{2})$/.exec(month || "");
    return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null;
  }

  async function cleanupOldSchedules() {
    const current = monthNumber(els.month.value);
    if (current === null) return;

    const records = await schedulesCollection.all();
    let removed = 0;

    for (const record of records) {
      const value = monthNumber(record.month);
      if (value !== null && current - value >= 12) {
        if (await schedulesCollection.remove(record.id)) removed++;
      }
    }

    if (removed) {
      change.emit({ type: "cleanup", collection: "schedules", removed });
    }
  }

  function renderPeople() {
    if (!monthEntries.length) {
      els.list.innerHTML = '<div class="empty-note">本月尚未加入休假。</div>';
      return;
    }
    els.list.innerHTML = monthEntries.map(entry => `
      <div class="person-row compact">
        <button type="button" class="person-name person-edit-link" data-edit-id="${escapeHTML(entry.id)}">${escapeHTML(personName(entry.id))}</button>
        <div class="person-days-inline">${entry.days.join("、")}</div>
      </div>`).join("");
    els.list.querySelectorAll("[data-edit-id]").forEach(button => {
      button.addEventListener("click", () => openOffdayEditor(button.dataset.editId));
    });
  }

  function renderRegistry() {
    const records = people.getItems();
    if (!records.length) {
      els.registry.innerHTML = '<p class="note">目前沒有人員。</p>';
      return;
    }

    els.registry.innerHTML = records.map(item => `
      <div class="person-row">
        <div>
          <span class="person-name">${escapeHTML(item.name)}</span>
        </div>
        <button type="button" data-delete-person="${escapeHTML(item.id)}">刪除</button>
      </div>
    `).join("");

    els.registry.querySelectorAll("[data-delete-person]").forEach(button => {
      button.addEventListener("click", async () => {
        const item = people.findById(button.dataset.deletePerson);
        if (!item) return;
        if (!confirm(`確定刪除「${item.name}」？\n只會從人員名冊移除，不會刪除歷史休假資料。`)) return;
        await peopleCollection.remove(item.id);
        change.emit({ type: "remove", collection: "people", id: item.id });
      });
    });
  }

  function clearNameResults() {
    els.nameResults.innerHTML = "";
    els.nameResults.hidden = true;
  }

  function renderNameResults(results) {
    if (!results.length) { clearNameResults(); return; }
    els.nameResults.innerHTML = results.map(item => `
      <button type="button" data-person-id="${escapeHTML(item.id)}">
        ${escapeHTML(item.name)} <small>#${escapeHTML(item.id)}</small>
      </button>
    `).join("");
    els.nameResults.hidden = false;

    els.nameResults.querySelectorAll("[data-person-id]").forEach(button => {
      button.addEventListener("click", () => {
        const item = people.selectById(button.dataset.personId);
        if (!item) return;
        els.name.value = item.name;
        clearNameResults();
        els.days.focus();
      });
    });
  }

  const MONTH_NAMES = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const WEEK_NAMES = ["週日","週一","週二","週三","週四","週五","週六"];

  function getDateLabel(dateKey) {
    try {
      const lunar = LunarFestivals.getNames(dateKey);
      if (lunar.length) return lunar[0];

      const solar = SolarFestivals.getNames(dateKey);
      if (solar.length) return solar[0];

      const terms = SolarTerms.getByDate(dateKey);
      if (terms.length) return terms[0].name;
    } catch (error) {
      console.warn("日期卡節日查詢失敗：", error);
    }

    const date = DateTime.parseDateKey(dateKey);
    return date ? WEEK_NAMES[date.getDay()] : "";
  }

  function renderHero() {
    const now = new Date();
    const todayKey = DateTime.dateKey(now);
    els.heroMonth.textContent = MONTH_NAMES[now.getMonth()];
    els.heroYear.textContent = now.getFullYear();
    els.heroDate.textContent = now.getDate();
    els.heroLabel.textContent = getDateLabel(todayKey) || WEEK_NAMES[now.getDay()];
  }

  function setCalendarOpen(open) {
    els.calendarPanel.hidden = !open;
    els.dateCard.setAttribute("aria-expanded", String(open));
  }

  function rebuildComparison() {
    if (!monthEntries.length) {
      dateIndex = new Map();
      interaction.setMarkers([]);
      requestAnimationFrame(tuneCalendarChrome);
      els.heroSummary.textContent = "本月還沒有一起休假";
      return;
    }

    const input = monthEntries.map(entry => ({
      id: entry.id,
      dates: fullDateKeys(entry.days)
    }));

    const allDates = DateOverlap.byDate(input);
    dateIndex = new Map(allDates.map(entry => [entry.date, entry]));
    const overlaps = DateOverlap.overlaps(input, { min: 2 });
    interaction.setMarkers(overlaps.map(entry => entry.date));
    requestAnimationFrame(tuneCalendarChrome);

    const stats = DateOverlap.stats(input, { min: 2 });
    els.heroSummary.textContent = stats.overlapDates
      ? `本月 ${stats.overlapDates} 人一樣 · 最多 ${stats.maxOverlap} 人一起`
      : "本月還沒有一起休假";
  }

  change.subscribe(async event => {
    if (event.collection === "people") {
      await loadPeople();
      rebuildComparison();
    }
    if (event.collection === "schedules") {
      await loadMonth(els.month.value);
    }
  });

  els.name.addEventListener("input", () => renderNameResults(people.search(els.name.value)));
  els.name.addEventListener("blur", () => window.setTimeout(clearNameResults, 120));

  els.add.addEventListener("click", async () => {
    els.formMessage.textContent = "";
    const name = els.name.value.trim();
    const month = els.month.value;

    if (!month) { els.formMessage.textContent = "請先選月份。"; return; }
    if (!name) { els.formMessage.textContent = "請輸入姓名。"; return; }

    const parsed = parseDayNumbers(els.days.value, month);
    if (!parsed.days.length) { els.formMessage.textContent = "請輸入至少一個有效休假日。"; return; }
    if (parsed.invalid.length) {
      els.formMessage.textContent = "這個月份沒有這些日期：" + parsed.invalid.join("、");
      return;
    }

    let selected = people.getSelected();
    let created = false;

    if (!selected || String(selected.name).trim() !== name) {
      const result = await people.addOrSelect(name);
      selected = result.item;
      created = result.created;
    }

    if (!selected) { els.formMessage.textContent = "人員建立失敗。"; return; }

    if (created) {
      change.emit({ type: "add", collection: "people", id: selected.id });
    }

    const index = monthEntries.findIndex(entry => String(entry.id) === String(selected.id));
    const nextEntry = { id: selected.id, days: parsed.days };

    if (index >= 0) {
      monthEntries[index] = nextEntry;
      els.formMessage.textContent = `已更新「${selected.name}」的休假日。`;
    } else {
      monthEntries.push(nextEntry);
      els.formMessage.textContent = `已加入「${selected.name}」。`;
    }

    els.name.value = "";
    els.days.value = "";
    people.clearSelection();
    clearNameResults();

    await saveCurrentMonth();
    editingPersonId = null;
    els.offdayDialog.close();
  });

  els.clear.addEventListener("click", async () => {
    if (!monthEntries.length) return;
    const label = formatMonthLabel(els.month.value);
    if (!confirm(`確定刪除 ${label} 的所有休假資料？`)) return;
    monthEntries = [];
    await saveCurrentMonth();
    els.manageDialog.close();
  });



  function formatMonthLabel(value) {
    const m = /^(\d{4})-(\d{2})$/.exec(value || "");
    return m ? `${Number(m[1])} 年 ${Number(m[2])} 月` : value;
  }

  function updateMonthUI() {
    els.manageMonthLabel.textContent = `${formatMonthLabel(els.month.value)}的休假資料。`;
  }

  async function selectMonth(value) {
    els.month.value = value;
    updateMonthUI();
    calendar.setDate(value + "-01");
    requestAnimationFrame(tuneCalendarChrome);
    await cleanupOldSchedules();
    await loadMonth(value);
  }

  function renderMonthPicker() {
    els.pickerYear.textContent = pickerYear;
    const selected = els.month.value;
    els.monthGrid.innerHTML = Array.from({length:12}, (_,i) => {
      const value = `${pickerYear}-${String(i+1).padStart(2,"0")}`;
      return `<button type="button" class="month-option ${value === selected ? "active" : ""}" data-month="${value}">${i+1} 月</button>`;
    }).join("");
    els.monthGrid.querySelectorAll("[data-month]").forEach(btn => btn.addEventListener("click", async () => {
      await selectMonth(btn.dataset.month);
      els.monthDialog.close();
    }));
  }

  function openOffdayEditor(id = null) {
    editingPersonId = id;
    els.formMessage.textContent = "";
    clearNameResults();
    if (id) {
      const entry = monthEntries.find(x => String(x.id) === String(id));
      els.offdayTitle.textContent = "編輯本月休假";
      els.name.value = personName(id).replace(/^\(已刪除人員：.*\)$/, "");
      els.days.value = entry ? entry.days.join(", ") : "";
      const item = people.findById(id);
      if (item) people.selectById(id);
    } else {
      els.offdayTitle.textContent = "本月休假";
      els.name.value = "";
      els.days.value = "";
      people.clearSelection();
    }
    els.offdayDialog.showModal();
    setTimeout(() => els.name.focus(), 50);
  }

  function openMonthPicker() {
    pickerYear = Number(els.month.value.slice(0,4)) || todayYear();
    renderMonthPicker();
    els.monthDialog.showModal();
  }

  function tuneCalendarChrome() {
    const root = els.calendar;
    if (!root) return;
    syncCustomSelects(root);

    // Calendar Component 的大日期展示在這個宿主頁不需要；只隱藏「像日期卡」的區塊，不改元件本體。
    root.querySelectorAll(".sc-date-card,.sc-hero,.sc-date-hero,.sc-current-date,.calendar-hero").forEach(el => {
      el.hidden = true;
    });

    // 把元件自己的月份標題當成月份選擇入口。
    const wanted = formatMonthLabel(els.month.value).replace(/\s/g, "");
    [...root.querySelectorAll("button,[role=button],h2,h3,strong,.sc-title,.sc-month-title")].forEach(el => {
      const text = (el.textContent || "").replace(/\s/g, "");
      if (text === wanted) {
        el.classList.add("host-month-picker");
        el.setAttribute("title", "選擇月份");
      }
    });
  }

  els.calendar.addEventListener("click", e => {
    const target = e.target.closest(".host-month-picker");
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    openMonthPicker();
  });

  els.openOffday.addEventListener("click", () => openOffdayEditor());
  els.prevYear.addEventListener("click", () => { pickerYear--; renderMonthPicker(); });
  els.nextYear.addEventListener("click", () => { pickerYear++; renderMonthPicker(); });
  els.openManage.addEventListener("click", () => { updateMonthUI(); renderRegistry(); els.manageDialog.showModal(); });
  document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => document.getElementById(btn.dataset.close)?.close()));
  [els.offdayDialog, els.monthDialog, els.manageDialog].forEach(dialog => dialog.addEventListener("click", e => {
    if (e.target === dialog) dialog.close();
  }));

  const calendarObserver = new MutationObserver(() => requestAnimationFrame(tuneCalendarChrome));
  calendarObserver.observe(els.calendar, { childList: true, subtree: true });
  requestAnimationFrame(tuneCalendarChrome);

  interaction.subscribe(event => {
    renderOffdayDetail(event.dateKey);
  });

  els.dateCard.addEventListener("click", () => {
    setCalendarOpen(els.calendarPanel.hidden);
  });
  els.dateCard.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setCalendarOpen(els.calendarPanel.hidden);
    }
  });
  els.closeCalendar.addEventListener("click", () => setCalendarOpen(false));

  async function init() {
    syncCustomSelects(document);
    renderHero();
    updateMonthUI();
    setCalendarOpen(false);
    await loadPeople();
    await cleanupOldSchedules();
    await loadMonth(els.month.value);
  }

  init().catch(error => {
    console.error(error);
    els.formMessage.textContent = "初始化失敗：" + (error?.message || String(error));
  });
})();
