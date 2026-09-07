"use strict";

document.addEventListener("DOMContentLoaded", () => {
  if (!window.FictionData) {
    console.error("[CurrencyBook] FictionData 載入失敗。");
    alert("資料模組載入失敗，請重新整理頁面後再試。");
    return;
  }

  const APP_ID = "sbs_acc_currency_book";
  const VERSION = 1;
  const NAMESPACE = "sbs-acc-currency-book-v1";
  const CURRENCIES = ["JPY", "USD", "EUR", "CNY", "HKD"];

  const db = FictionData.create({
    namespace: NAMESPACE
  });

  const records = db.collection("records", {
    normalize(record) {
      return {
        ...record,
        date: String(record.date || ""),
        type: record.type === "sell" ? "sell" : "buy",
        currency: CURRENCIES.includes(record.currency) ? record.currency : "JPY",
        rate: Number(record.rate),
        foreignAmount: Number(record.foreignAmount),
        twdAmount: Number(record.twdAmount),
        note: String(record.note || "").trim()
      };
    }
  });

  const state = {
    currency: "ALL",
    sortMode: null,
    sortDirection: "asc",
    editingId: null,
    lastEditedAmount: "foreign",
    pendingConfirm: null
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const els = {
    addRecordBtn: $("#addRecordBtn"),
    exportBtn: $("#exportBtn"),
    importBtn: $("#importBtn"),
    importFile: $("#importFile"),
    currencyTabs: $("#currencyTabs"),
    filterDescription: $("#filterDescription"),
    summaryGrid: $("#summaryGrid"),
    recordCount: $("#recordCount"),
    recordList: $("#recordList"),
    recordsEmpty: $("#recordsEmpty"),
    sortDirectionBtn: $("#sortDirectionBtn"),
    clearSortBtn: $("#clearSortBtn"),
    sortHint: $("#sortHint"),
    clearAllBtn: $("#clearAllBtn"),

    recordModal: $("#recordModal"),
    recordModalTitle: $("#recordModalTitle"),
    closeRecordModalBtn: $("#closeRecordModalBtn"),
    cancelRecordBtn: $("#cancelRecordBtn"),
    recordForm: $("#recordForm"),
    recordId: $("#recordId"),
    tradeDate: $("#tradeDate"),
    tradeCurrency: $("#tradeCurrency"),
    tradeRate: $("#tradeRate"),
    foreignAmount: $("#foreignAmount"),
    twdAmount: $("#twdAmount"),
    foreignAmountLabel: $("#foreignAmountLabel"),
    tradeNote: $("#tradeNote"),
    calcNote: $("#calcNote"),
    formError: $("#formError"),

    confirmModal: $("#confirmModal"),
    confirmTitle: $("#confirmTitle"),
    confirmMessage: $("#confirmMessage"),
    confirmCancelBtn: $("#confirmCancelBtn"),
    confirmOkBtn: $("#confirmOkBtn"),

    toast: $("#toast")
  };

  let toastTimer = null;

  init();

  async function init() {
    bindEvents();
    resetForm();
    await render();
  }

  function bindEvents() {
    els.addRecordBtn.addEventListener("click", () => openRecordModal());

    els.closeRecordModalBtn.addEventListener("click", closeRecordModal);
    els.cancelRecordBtn.addEventListener("click", closeRecordModal);

    els.recordModal.addEventListener("click", event => {
      if (event.target === els.recordModal) closeRecordModal();
    });

    els.confirmModal.addEventListener("click", event => {
      if (event.target === els.confirmModal) closeConfirmModal();
    });

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;

      if (!els.confirmModal.hidden) {
        closeConfirmModal();
      } else if (!els.recordModal.hidden) {
        closeRecordModal();
      }
    });

    els.recordForm.addEventListener("submit", saveRecord);

    els.tradeCurrency.addEventListener("change", () => {
      updateForeignAmountLabel();
    });

    els.tradeRate.addEventListener("input", recalculateFromLastEdited);

    els.foreignAmount.addEventListener("input", () => {
      state.lastEditedAmount = "foreign";
      calculateTwdFromForeign();
    });

    els.twdAmount.addEventListener("input", () => {
      state.lastEditedAmount = "twd";
      calculateForeignFromTwd();
    });

    els.currencyTabs.addEventListener("click", async event => {
      const button = event.target.closest("[data-currency]");
      if (!button) return;

      state.currency = button.dataset.currency;
      updateCurrencyTabs();
      await render();
    });

    $$(".sort-button").forEach(button => {
      button.addEventListener("click", async () => {
        const mode = button.dataset.sort;

        if (state.sortMode === mode) {
          state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
        } else {
          state.sortMode = mode;
          state.sortDirection = "asc";
        }

        updateSortControls();
        await render();
      });
    });

    els.sortDirectionBtn.addEventListener("click", async () => {
      if (!state.sortMode) {
        state.sortMode = "amount";
      }

      state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      updateSortControls();
      await render();
    });

    els.clearSortBtn.addEventListener("click", async () => {
      state.sortMode = null;
      state.sortDirection = "asc";
      updateSortControls();
      await render();
    });

    els.recordList.addEventListener("click", async event => {
      const editButton = event.target.closest("[data-action='edit']");
      const deleteButton = event.target.closest("[data-action='delete']");

      if (editButton) {
        const record = await records.get(editButton.dataset.id);
        if (record) openRecordModal(record);
        return;
      }

      if (deleteButton) {
        const record = await records.get(deleteButton.dataset.id);
        if (!record) return;

        openConfirmModal({
          title: "刪除這筆交易？",
          message: `${formatDate(record.date)}｜${record.currency}｜${record.type === "buy" ? "買入" : "賣出"}。刪除後無法復原。`,
          okText: "確定刪除",
          onConfirm: async () => {
            await records.remove(record.id);
            showToast("已刪除交易紀錄。");
            await render();
          }
        });
      }
    });

    els.exportBtn.addEventListener("click", exportJson);

    els.importBtn.addEventListener("click", () => {
      els.importFile.value = "";
      els.importFile.click();
    });

    els.importFile.addEventListener("change", handleImportFile);

    els.clearAllBtn.addEventListener("click", () => {
      openConfirmModal({
        title: "清除全部紀錄？",
        message: "所有外幣交易紀錄都會刪除。這個操作無法復原，建議先匯出 JSON 備份。",
        okText: "清除全部",
        onConfirm: async () => {
          await records.clear();
          showToast("全部紀錄已清除。");
          await render();
        }
      });
    });

    els.confirmCancelBtn.addEventListener("click", closeConfirmModal);

    els.confirmOkBtn.addEventListener("click", async () => {
      const action = state.pendingConfirm;
      closeConfirmModal();

      if (typeof action === "function") {
        await action();
      }
    });
  }

  async function render() {
    const allRecords = await records.all();
    const currencyRecords = filterByCurrency(allRecords);

    renderSummary(currencyRecords);
    renderRecords(applySort(currencyRecords));
    updateFilterDescription(currencyRecords.length);
    updateSortControls();
  }

  function filterByCurrency(items) {
    if (state.currency === "ALL") return [...items];

    return FictionData.utils.filter(items, {
      equals: {
        currency: state.currency
      }
    });
  }

  function applySort(items) {
    if (!state.sortMode) {
      return FictionData.utils.sort(items, {
        field: "date",
        direction: "desc",
        type: "date",
        compare: (a, b) => {
          const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();

          if (dateDiff !== 0) return dateDiff;

          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        }
      });
    }

    let source = [...items];
    let field = "twdAmount";

    if (state.sortMode === "buyRate") {
      source = source.filter(item => item.type === "buy");
      field = "rate";
    } else if (state.sortMode === "sellRate") {
      source = source.filter(item => item.type === "sell");
      field = "rate";
    }

    return FictionData.utils.sort(source, {
      field,
      direction: state.sortDirection,
      type: "number"
    });
  }

  function renderSummary(items) {
    const buyItems = items.filter(item => item.type === "buy");
    const sellItems = items.filter(item => item.type === "sell");

    const buyTwd = sum(buyItems, "twdAmount");
    const sellTwd = sum(sellItems, "twdAmount");

    if (state.currency === "ALL") {
      els.summaryGrid.innerHTML = [
        summaryCard("買入 TWD", formatMoney(buyTwd, "TWD"), `${buyItems.length} 筆`),
        summaryCard("賣出 TWD", formatMoney(sellTwd, "TWD"), `${sellItems.length} 筆`)
      ].join("");

      return;
    }

    const buyForeign = sum(buyItems, "foreignAmount");
    const sellForeign = sum(sellItems, "foreignAmount");
    const balance = buyForeign - sellForeign;

    els.summaryGrid.innerHTML = [
      summaryCard("買入 TWD", formatMoney(buyTwd, "TWD"), `${buyItems.length} 筆`),
      summaryCard("賣出 TWD", formatMoney(sellTwd, "TWD"), `${sellItems.length} 筆`),
      summaryCard(`買入 ${state.currency}`, formatMoney(buyForeign, state.currency)),
      summaryCard(`賣出 ${state.currency}`, formatMoney(sellForeign, state.currency)),
      summaryCard(`${state.currency} 餘額`, formatMoney(balance, state.currency), "買入 − 賣出")
    ].join("");
  }

  function renderRecords(items) {
    els.recordCount.textContent = `${items.length} 筆`;
    els.recordsEmpty.hidden = items.length > 0;

    els.recordList.innerHTML = items.map(record => {
      const typeLabel = record.type === "buy" ? "買入" : "賣出";
      const note = record.note
        ? `<p class="record-note">${escapeHtml(record.note)}</p>`
        : "";

      return `
        <article class="record-card">
          <div class="record-type ${record.type}">${typeLabel}</div>

          <div class="record-main">
            <div class="record-title">
              <strong>${escapeHtml(record.currency)}</strong>
              <span>匯率 ${formatRate(record.rate)}</span>
              <span class="record-date">${formatDate(record.date)}</span>
            </div>

            <div class="record-amounts">
              <span>${formatMoney(record.foreignAmount, record.currency)}</span>
              <span>${formatMoney(record.twdAmount, "TWD")}</span>
            </div>

            ${note}
          </div>

          <div class="record-actions">
            <button
              class="icon-button"
              type="button"
              data-action="edit"
              data-id="${escapeHtml(record.id)}"
              aria-label="編輯這筆紀錄"
              title="編輯"
            >✎</button>

            <button
              class="icon-button"
              type="button"
              data-action="delete"
              data-id="${escapeHtml(record.id)}"
              aria-label="刪除這筆紀錄"
              title="刪除"
            >×</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function updateFilterDescription(count) {
    if (state.currency === "ALL") {
      els.filterDescription.textContent =
        `目前顯示全部 ${count} 筆紀錄；統計只合計 TWD。`;
      return;
    }

    els.filterDescription.textContent =
      `目前只顯示 ${state.currency}，共 ${count} 筆；統計同時顯示 TWD 與外幣金額。`;
  }

  function updateCurrencyTabs() {
    $$("[data-currency]").forEach(button => {
      const active = button.dataset.currency === state.currency;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateSortControls() {
    $$(".sort-button").forEach(button => {
      const active = button.dataset.sort === state.sortMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    els.sortDirectionBtn.textContent =
      state.sortDirection === "asc" ? "由低到高 ↑" : "由高到低 ↓";

    if (!state.sortMode) {
      els.sortHint.textContent =
        "預設依日期由新到舊；「實際金額」以 TWD 金額排序。";
    } else if (state.sortMode === "buyRate") {
      els.sortHint.textContent =
        `目前只列買入紀錄，依買入匯率${state.sortDirection === "asc" ? "由低到高" : "由高到低"}。`;
    } else if (state.sortMode === "sellRate") {
      els.sortHint.textContent =
        `目前只列賣出紀錄，依賣出匯率${state.sortDirection === "asc" ? "由低到高" : "由高到低"}。`;
    } else {
      els.sortHint.textContent =
        `目前依實際 TWD 金額${state.sortDirection === "asc" ? "由低到高" : "由高到低"}。`;
    }
  }

  function openRecordModal(record = null) {
    state.editingId = record?.id || null;
    state.lastEditedAmount = "foreign";
    hideFormError();

    if (record) {
      els.recordModalTitle.textContent = "編輯交易";
      els.recordId.value = record.id;
      els.tradeDate.value = record.date;
      els.tradeCurrency.value = record.currency;
      els.tradeRate.value = cleanNumber(record.rate);
      els.foreignAmount.value = cleanNumber(record.foreignAmount);
      els.twdAmount.value = cleanNumber(record.twdAmount);
      els.tradeNote.value = record.note || "";

      const typeInput = $(`input[name="tradeType"][value="${record.type}"]`);
      if (typeInput) typeInput.checked = true;
    } else {
      resetForm();
    }

    updateForeignAmountLabel();
    els.recordModal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => els.tradeDate.focus());
  }

  function closeRecordModal() {
    els.recordModal.hidden = true;
    document.body.style.overflow = "";
    hideFormError();
  }

  function resetForm() {
    state.editingId = null;
    state.lastEditedAmount = "foreign";

    els.recordModalTitle.textContent = "新增交易";
    els.recordId.value = "";
    els.tradeDate.value = todayISO();
    els.tradeCurrency.value =
      state.currency !== "ALL" ? state.currency : "JPY";
    els.tradeRate.value = "";
    els.foreignAmount.value = "";
    els.twdAmount.value = "";
    els.tradeNote.value = "";

    const buyInput = $('input[name="tradeType"][value="buy"]');
    if (buyInput) buyInput.checked = true;

    updateForeignAmountLabel();
    hideFormError();
  }

  async function saveRecord(event) {
    event.preventDefault();
    hideFormError();

    const date = els.tradeDate.value;
    const type = $('input[name="tradeType"]:checked')?.value;
    const currency = els.tradeCurrency.value;
    const rate = Number(els.tradeRate.value);
    const foreignAmount = Number(els.foreignAmount.value);
    const twdAmount = Number(els.twdAmount.value);
    const note = els.tradeNote.value.trim();

    if (!date) {
      return showFormError("請選擇交易日期。");
    }

    if (!["buy", "sell"].includes(type)) {
      return showFormError("請選擇買入或賣出。");
    }

    if (!CURRENCIES.includes(currency)) {
      return showFormError("請選擇外幣。");
    }

    if (!Number.isFinite(rate) || rate <= 0) {
      return showFormError("請手動輸入大於 0 的實際成交匯率。");
    }

    if (!Number.isFinite(foreignAmount) || foreignAmount <= 0) {
      return showFormError("外幣金額必須大於 0。");
    }

    if (!Number.isFinite(twdAmount) || twdAmount <= 0) {
      return showFormError("TWD 金額必須大於 0。");
    }

    const payload = {
      date,
      type,
      currency,
      rate,
      foreignAmount,
      twdAmount,
      note
    };

    try {
      if (state.editingId) {
        await records.update(state.editingId, payload);
        showToast("交易紀錄已更新。");
      } else {
        await records.add(payload);
        showToast("交易紀錄已新增。");
      }

      closeRecordModal();
      resetForm();
      await render();
    } catch (error) {
      console.error("[CurrencyBook] 儲存失敗：", error);
      showFormError("儲存失敗，請稍後再試。");
    }
  }

  function updateForeignAmountLabel() {
    els.foreignAmountLabel.textContent =
      `${els.tradeCurrency.value || "外幣"} 金額`;
  }

  function recalculateFromLastEdited() {
    if (state.lastEditedAmount === "twd") {
      calculateForeignFromTwd();
    } else {
      calculateTwdFromForeign();
    }
  }

  function calculateTwdFromForeign() {
    const rate = Number(els.tradeRate.value);
    const foreign = Number(els.foreignAmount.value);

    if (!Number.isFinite(rate) || rate <= 0 ||
        !Number.isFinite(foreign) || foreign < 0) {
      return;
    }

    els.twdAmount.value = cleanNumber(roundTo(foreign * rate, 4));
  }

  function calculateForeignFromTwd() {
    const rate = Number(els.tradeRate.value);
    const twd = Number(els.twdAmount.value);

    if (!Number.isFinite(rate) || rate <= 0 ||
        !Number.isFinite(twd) || twd < 0) {
      return;
    }

    els.foreignAmount.value = cleanNumber(roundTo(twd / rate, 6));
  }

  function exportJson() {
    records.all()
      .then(data => {
        const payload = {
          meta: {
            app: APP_ID,
            version: VERSION,
            exportedAt: new Date().toISOString()
          },
          records: data
        };

        const filename = `sbs_acc_currency_book_backup_${todayISO()}.json`;
        downloadJson(filename, payload);
        showToast("JSON 備份已匯出。");
      })
      .catch(error => {
        console.error("[CurrencyBook] 匯出失敗：", error);
        showToast("匯出失敗。");
      });
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const imported = Array.isArray(parsed) ? parsed : parsed?.records;

        if (!Array.isArray(imported)) {
          throw new Error("JSON 中找不到 records 陣列。");
        }

        const normalized = imported.map(validateImportedRecord);

        openConfirmModal({
          title: "匯入並取代目前資料？",
          message: `檔案內有 ${normalized.length} 筆紀錄。匯入後會取代目前瀏覽器中的全部外幣紀錄。`,
          okText: "確定匯入",
          onConfirm: async () => {
            await records.replace(normalized);
            showToast(`已匯入 ${normalized.length} 筆紀錄。`);
            await render();
          }
        });
      } catch (error) {
        console.error("[CurrencyBook] 匯入失敗：", error);
        showToast(`匯入失敗：${error.message || "檔案格式不正確"}`);
      } finally {
        els.importFile.value = "";
      }
    };

    reader.onerror = () => {
      els.importFile.value = "";
      showToast("讀取檔案失敗。");
    };

    reader.readAsText(file, "utf-8");
  }

  function validateImportedRecord(raw, index) {
    if (!raw || typeof raw !== "object") {
      throw new Error(`第 ${index + 1} 筆資料格式不正確。`);
    }

    const date = String(raw.date || "");
    const type = raw.type;
    const currency = raw.currency;
    const rate = Number(raw.rate);
    const foreignAmount = Number(raw.foreignAmount);
    const twdAmount = Number(raw.twdAmount);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`第 ${index + 1} 筆日期格式不正確。`);
    }

    if (!["buy", "sell"].includes(type)) {
      throw new Error(`第 ${index + 1} 筆買賣類型不正確。`);
    }

    if (!CURRENCIES.includes(currency)) {
      throw new Error(`第 ${index + 1} 筆幣別不支援。`);
    }

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`第 ${index + 1} 筆匯率不正確。`);
    }

    if (!Number.isFinite(foreignAmount) || foreignAmount <= 0) {
      throw new Error(`第 ${index + 1} 筆外幣金額不正確。`);
    }

    if (!Number.isFinite(twdAmount) || twdAmount <= 0) {
      throw new Error(`第 ${index + 1} 筆 TWD 金額不正確。`);
    }

    return {
      ...raw,
      date,
      type,
      currency,
      rate,
      foreignAmount,
      twdAmount,
      note: String(raw.note || "").trim()
    };
  }

  function openConfirmModal({ title, message, okText = "確定", onConfirm }) {
    state.pendingConfirm = onConfirm;
    els.confirmTitle.textContent = title;
    els.confirmMessage.textContent = message;
    els.confirmOkBtn.textContent = okText;
    els.confirmModal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => els.confirmCancelBtn.focus());
  }

  function closeConfirmModal() {
    els.confirmModal.hidden = true;
    state.pendingConfirm = null;

    if (els.recordModal.hidden) {
      document.body.style.overflow = "";
    }
  }

  function showFormError(message) {
    els.formError.textContent = message;
    els.formError.hidden = false;
  }

  function hideFormError() {
    els.formError.hidden = true;
    els.formError.textContent = "";
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;

    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 2400);
  }

  function summaryCard(label, value, subvalue = "") {
    return `
      <article class="summary-card">
        <p class="label">${escapeHtml(label)}</p>
        <p class="value">${escapeHtml(value)}</p>
        ${subvalue ? `<p class="subvalue">${escapeHtml(subvalue)}</p>` : ""}
      </article>
    `;
  }

  function sum(items, field) {
    return items.reduce((total, item) => {
      const value = Number(item[field]);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function formatMoney(value, currency) {
    const number = Number(value) || 0;
    const maximumFractionDigits = currency === "TWD" || currency === "JPY" ? 2 : 4;

    return `${currency} ${new Intl.NumberFormat("zh-TW", {
      minimumFractionDigits: 0,
      maximumFractionDigits
    }).format(number)}`;
  }

  function formatRate(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "—";

    return new Intl.NumberFormat("zh-TW", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8
    }).format(number);
  }

  function formatDate(value) {
    if (!value) return "";

    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;

    return `${year}/${month}/${day}`;
  }

  function todayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
      .toISOString()
      .slice(0, 10);
  }

  function downloadJson(filename, data) {
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function roundTo(value, digits) {
    const factor = 10 ** digits;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function cleanNumber(value) {
    if (!Number.isFinite(Number(value))) return "";
    return String(Number(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
