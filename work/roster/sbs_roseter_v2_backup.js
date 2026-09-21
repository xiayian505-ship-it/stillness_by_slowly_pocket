(() => {
  'use strict';

  const storage = window.ShiftRosterStorage;
  if (!storage) return;

  const importButton = document.getElementById('importJsonButton');
  const downloadButton = document.getElementById('downloadJsonButton');
  const importInput = document.getElementById('importJsonInput');
  const importConfirmDialog = document.getElementById('importConfirmDialog');
  const importConfirmMessage = document.getElementById('importConfirmMessage');
  const importConfirmCancel = document.getElementById('importConfirmCancel');
  const importConfirmApply = document.getElementById('importConfirmApply');
  const cleanupButton = document.getElementById('cleanupHistoryButton');
  const cleanupDialog = document.getElementById('cleanupHistoryDialog');
  const cleanupBeforeMonth = document.getElementById('cleanupBeforeMonth');
  const cleanupCancel = document.getElementById('cleanupCancel');
  const cleanupConfirm = document.getElementById('cleanupConfirm');
  const cleanupMessage = document.getElementById('cleanupMessage');

  let pendingImport = null;

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function makeTimestamp(date = new Date()) {
    return [
      date.getFullYear(),
      pad2(date.getMonth() + 1),
      pad2(date.getDate())
    ].join('') + '_' + pad2(date.getHours()) + pad2(date.getMinutes());
  }

  function makeBackupFileName() {
    return `EliteHotel_${makeTimestamp()}.json`;
  }

  function downloadText(text, fileName, type = 'application/json;charset=utf-8') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function saveCurrentMonthFirst() {
    if (typeof window.ShiftRosterApp?.saveCurrentMonth === 'function') {
      window.ShiftRosterApp.saveCurrentMonth();
    }
  }

  function downloadBackup() {
    saveCurrentMonthFirst();
    const payload = storage.exportPayload();
    downloadText(`${JSON.stringify(payload, null, 2)}\n`, makeBackupFileName());
  }

  function closeImportConfirm() {
    importConfirmDialog.hidden = true;
    pendingImport = null;
  }

  function showImportConfirm(payload, fileName) {
    pendingImport = payload;
    importConfirmMessage.textContent = `即將匯入「${fileName}」。\n\n匯入後會覆蓋目前本機所有班表資料與設定。建議先下載 JSON 備份。`;
    importConfirmDialog.hidden = false;
    requestAnimationFrame(() => importConfirmCancel.focus());
  }

  async function readImportFile(file) {
    if (!file) return;
    if (!/\.json$/i.test(file.name || '')) {
      window.alert('只能匯入 .json 班表備份檔。未匯入任何資料。');
      return;
    }

    let payload;
    try {
      const text = (await file.text()).replace(/^\uFEFF/, '');
      payload = JSON.parse(text);
    } catch (_error) {
      window.alert('JSON 無法解析。未匯入任何資料。');
      return;
    }

    const validation = storage.validateBackup(payload);
    if (!validation.ok) {
      window.alert(`${validation.error}\n\n未匯入任何資料。`);
      return;
    }

    showImportConfirm(validation.value, file.name || 'JSON 備份');
  }

  function applyImport() {
    if (!pendingImport) return closeImportConfirm();
    try {
      storage.replaceAll(pendingImport);
      pendingImport = null;
      importConfirmDialog.hidden = true;
      if (typeof window.ShiftRosterApp?.reloadFromStorage === 'function') {
        window.ShiftRosterApp.reloadFromStorage();
      }
      window.alert('JSON 匯入完成，已套用備份資料。');
    } catch (error) {
      console.error(error);
      pendingImport = null;
      importConfirmDialog.hidden = true;
      window.alert(`匯入失敗，原本本機資料已保留。\n${error?.message || '未知錯誤'}`);
    }
  }


  function openCleanupDialog() {
    cleanupMessage.textContent = '選定月份以前的歷史班表會被刪除。建議先下載 JSON 備份。';
    cleanupDialog.hidden = false;
    requestAnimationFrame(() => cleanupBeforeMonth.focus());
  }

  function closeCleanupDialog() {
    cleanupDialog.hidden = true;
  }

  function confirmCleanup() {
    const cutoff = cleanupBeforeMonth.value;
    if (!storage.parseMonthId(cutoff)) {
      cleanupMessage.textContent = '請先選擇有效月份。';
      cleanupBeforeMonth.focus();
      return;
    }

    const removed = storage.removeMonthsBefore(cutoff);
    cleanupDialog.hidden = true;
    if (removed.length) {
      window.alert(`已清除 ${removed.length} 個歷史月份：${removed[0]} ～ ${removed[removed.length - 1]}。`);
    } else {
      window.alert(`沒有 ${cutoff} 以前的歷史月份需要清除。`);
    }
  }

  if (importButton && importInput) {
    importButton.disabled = false;
    importButton.removeAttribute('title');
    importButton.addEventListener('click', () => {
      importInput.value = '';
      importInput.click();
    });
    importInput.addEventListener('change', () => {
      const file = importInput.files?.[0];
      readImportFile(file);
    });
  }

  if (downloadButton) {
    downloadButton.disabled = false;
    downloadButton.removeAttribute('title');
    downloadButton.addEventListener('click', downloadBackup);
  }

  importConfirmCancel?.addEventListener('click', closeImportConfirm);
  importConfirmApply?.addEventListener('click', applyImport);
  cleanupButton?.addEventListener('click', openCleanupDialog);
  cleanupCancel?.addEventListener('click', closeCleanupDialog);
  cleanupConfirm?.addEventListener('click', confirmCleanup);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (importConfirmDialog && !importConfirmDialog.hidden) closeImportConfirm();
    else if (cleanupDialog && !cleanupDialog.hidden) closeCleanupDialog();
  });

  window.ShiftRosterBackup = Object.freeze({
    makeTimestamp,
    makeBackupFileName,
    downloadBackup
  });
})();
