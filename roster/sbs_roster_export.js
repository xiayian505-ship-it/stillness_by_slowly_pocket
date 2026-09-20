(() => {
  'use strict';

  const exportButton = document.getElementById('exportPngButton');
  const sheet = document.getElementById('sheet');
  if (!exportButton || !sheet) return;

  const SCALE = 2;
  const DEFAULT_LINE = '#1b1b1b';
  const TRANSPARENT = new Set(['transparent', 'rgba(0, 0, 0, 0)', 'rgba(0,0,0,0)']);

  function getRect(element, rootRect) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
      right: rect.right - rootRect.left,
      bottom: rect.bottom - rootRect.top
    };
  }

  function isVisible(element) {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0;
  }

  function parsePx(value, fallback = 0) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeColor(value, fallback = null) {
    if (!value || TRANSPARENT.has(value.trim())) return fallback;
    return value;
  }

  function applyFont(context, element, fallbackSize = 14) {
    const style = getComputedStyle(element);
    const fontStyle = style.fontStyle || 'normal';
    const fontVariant = style.fontVariant || 'normal';
    const fontWeight = style.fontWeight || '400';
    const fontSize = style.fontSize || `${fallbackSize}px`;
    const fontFamily = style.fontFamily || 'sans-serif';
    context.font = `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize} ${fontFamily}`;
    context.fillStyle = normalizeColor(style.color, '#111') || '#111';
    return style;
  }

  function drawBackground(context, element, rootRect, fallback = null) {
    if (!isVisible(element)) return;
    const rect = getRect(element, rootRect);
    const style = getComputedStyle(element);
    const background = normalizeColor(style.backgroundColor, fallback);
    if (!background) return;
    context.save();
    context.fillStyle = background;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.restore();
  }

  function drawElementBorders(context, element, rootRect, fallbackColor = DEFAULT_LINE) {
    if (!isVisible(element)) return;
    const rect = getRect(element, rootRect);
    const style = getComputedStyle(element);
    const sides = [
      ['Top', rect.x, rect.y, rect.right, rect.y],
      ['Right', rect.right, rect.y, rect.right, rect.bottom],
      ['Bottom', rect.x, rect.bottom, rect.right, rect.bottom],
      ['Left', rect.x, rect.y, rect.x, rect.bottom]
    ];

    context.save();
    context.lineCap = 'butt';

    for (const [side, x1, y1, x2, y2] of sides) {
      const width = parsePx(style[`border${side}Width`]);
      const borderStyle = style[`border${side}Style`];
      if (!width || borderStyle === 'none' || borderStyle === 'hidden') continue;
      context.beginPath();
      context.lineWidth = width;
      context.strokeStyle = normalizeColor(style[`border${side}Color`], fallbackColor) || fallbackColor;
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    }

    context.restore();
  }

  function drawBox(context, element, rootRect, options = {}) {
    drawBackground(context, element, rootRect, options.backgroundFallback || null);
    if (options.border !== false) drawElementBorders(context, element, rootRect, options.borderColor || DEFAULT_LINE);
  }

  function getHorizontalTextX(style, rect) {
    const align = style.textAlign;
    if (align === 'left' || align === 'start') return rect.x + parsePx(style.paddingLeft, 0);
    if (align === 'right' || align === 'end') return rect.right - parsePx(style.paddingRight, 0);
    return rect.x + rect.width / 2;
  }

  function getCanvasTextAlign(style) {
    const align = style.textAlign;
    if (align === 'left' || align === 'start') return 'left';
    if (align === 'right' || align === 'end') return 'right';
    return 'center';
  }

  function drawSpacedText(context, text, centerX, centerY, letterSpacing = 0) {
    const chars = Array.from(text || '');
    if (!chars.length) return;
    if (!letterSpacing) {
      context.textAlign = 'center';
      context.fillText(text, centerX, centerY);
      return;
    }

    const widths = chars.map(char => context.measureText(char).width);
    const total = widths.reduce((sum, width) => sum + width, 0) + letterSpacing * Math.max(chars.length - 1, 0);
    let x = centerX - total / 2;
    context.textAlign = 'left';
    chars.forEach((char, index) => {
      context.fillText(char, x, centerY);
      x += widths[index] + letterSpacing;
    });
  }

  function drawElementText(context, element, rootRect, textOverride = null, options = {}) {
    if (!element || !isVisible(element)) return;
    const text = textOverride ?? element.textContent ?? '';
    if (!String(text).length && !options.allowEmpty) return;

    const rect = getRect(element, rootRect);
    const style = applyFont(context, element, options.fallbackSize || 14);
    const letterSpacing = parsePx(style.letterSpacing, 0);

    context.save();
    applyFont(context, element, options.fallbackSize || 14);
    context.textBaseline = 'middle';
    context.textAlign = getCanvasTextAlign(style);

    const x = options.center === true ? rect.x + rect.width / 2 : getHorizontalTextX(style, rect);
    const y = rect.y + rect.height / 2 + (options.yOffset || 0);

    if ((style.textAlign === 'center' || options.center === true) && letterSpacing > 0.1) {
      drawSpacedText(context, String(text), rect.x + rect.width / 2, y, letterSpacing);
    } else {
      context.fillText(String(text), x, y, Math.max(0, rect.width - 2));
    }

    context.restore();
  }

  function drawInputValue(context, input, rootRect) {
    if (!input || !isVisible(input)) return;
    const rect = getRect(input, rootRect);
    const style = applyFont(context, input, 14);
    const value = input.value || '';
    if (!value) return;

    context.save();
    applyFont(context, input, 14);
    context.textBaseline = 'middle';
    context.textAlign = getCanvasTextAlign(style);
    const x = getHorizontalTextX(style, rect);
    const y = rect.y + rect.height / 2;
    context.fillText(value, x, y, Math.max(0, rect.width - 2));
    context.restore();
  }

  function drawVerticalText(context, element, rootRect, textOverride = null) {
    if (!element || !isVisible(element)) return;
    const text = String(textOverride ?? element.textContent ?? '');
    if (!text) return;

    const rect = getRect(element, rootRect);
    const style = applyFont(context, element, 14);
    const chars = Array.from(text);
    const fontSize = parsePx(style.fontSize, 14);
    const letterSpacing = parsePx(style.letterSpacing, 0);
    const step = Math.max(fontSize + letterSpacing, rect.height / Math.max(chars.length, 1));
    const totalHeight = step * chars.length;
    let y = rect.y + Math.max((rect.height - totalHeight) / 2, 0) + step / 2;

    context.save();
    applyFont(context, element, 14);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const x = rect.x + rect.width / 2;
    for (const char of chars) {
      context.fillText(char, x, y);
      y += step;
    }
    context.restore();
  }

  function drawOuterBorder(context, element, rootRect, width = 2, color = DEFAULT_LINE) {
    const rect = getRect(element, rootRect);
    context.save();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    context.restore();
  }

  function drawScheduleTable(context, rootRect) {
    const table = document.getElementById('scheduleTable');
    if (!table) return;

    table.querySelectorAll('th, td').forEach(cell => drawBox(context, cell, rootRect));

    table.querySelectorAll('.header-label, .date-cell, .weekday-cell, .shift-label, .shift-code, .vacation-label')
      .forEach(element => drawElementText(context, element, rootRect, null, { center: true }));

    table.querySelectorAll('.shift-input').forEach(input => drawInputValue(context, input, rootRect));

    table.querySelectorAll('.vacation-cell').forEach(cell => {
      const miniWeekday = cell.querySelector('.mini-weekday');
      const inputs = cell.querySelector('.vacation-inputs');

      if (miniWeekday) {
        drawBackground(context, miniWeekday, rootRect, '#fff');
        drawElementBorders(context, miniWeekday, rootRect);
        drawElementText(context, miniWeekday, rootRect, null, { center: true });
      }

      cell.querySelectorAll('.vacation-input').forEach(input => drawInputValue(context, input, rootRect));

      if (inputs?.classList.contains('is-blocked')) {
        const rect = getRect(inputs, rootRect);
        context.save();
        context.strokeStyle = DEFAULT_LINE;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(rect.x + 1, rect.bottom - 1);
        context.lineTo(rect.right - 1, rect.y + 1);
        context.stroke();
        context.restore();
      }
    });

    drawOuterBorder(context, table, rootRect, 2);
  }

  function drawLowerTable(context, rootRect) {
    const table = document.getElementById('lowerTable');
    if (!table) return;

    table.querySelectorAll('td, th').forEach(cell => drawBox(context, cell, rootRect));

    table.querySelectorAll('.name-row').forEach(row => {
      const rect = getRect(row, rootRect);
      const style = getComputedStyle(row);
      const bottom = parsePx(style.borderBottomWidth, 0);
      if (bottom > 0) {
        context.save();
        context.strokeStyle = normalizeColor(style.borderBottomColor, DEFAULT_LINE) || DEFAULT_LINE;
        context.lineWidth = bottom;
        context.beginPath();
        context.moveTo(rect.x, rect.bottom);
        context.lineTo(rect.right, rect.bottom);
        context.stroke();
        context.restore();
      }
    });

    table.querySelectorAll('.name-letter').forEach(element => drawElementText(context, element, rootRect, null, { center: true }));
    table.querySelectorAll('.name-input, .special-leave-input').forEach(input => drawInputValue(context, input, rootRect));
    table.querySelectorAll('.special-leave-input').forEach(input => {
      const rect = getRect(input, rootRect);
      context.save();
      context.strokeStyle = DEFAULT_LINE;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(rect.x, rect.y);
      context.lineTo(rect.x, rect.bottom);
      context.stroke();
      context.restore();
    });

    table.querySelectorAll('.lower-date-label').forEach(element => {
      if ((element.textContent || '').trim()) drawElementText(context, element, rootRect, null, { center: true });
    });

    // 下方長條備註：粉／灰底實際時間、假別、開會與自由備註。
    table.querySelectorAll('.day-note-line').forEach(element => {
      const style = getComputedStyle(element);
      if ((style.writingMode || '').startsWith('vertical')) {
        drawVerticalText(context, element, rootRect, element.textContent || '');
      } else {
        drawElementText(context, element, rootRect, null, { center: true, fallbackSize: 11 });
      }
    });

    const rect = getRect(table, rootRect);
    context.save();
    context.strokeStyle = DEFAULT_LINE;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(rect.x, rect.y);
    context.lineTo(rect.x, rect.bottom);
    context.moveTo(rect.right, rect.y);
    context.lineTo(rect.right, rect.bottom);
    context.lineTo(rect.x, rect.bottom);
    context.stroke();
    context.restore();
  }

  function drawSummary(context, rootRect) {
    const grid = document.getElementById('summaryGrid');
    if (!grid) return;

    grid.querySelectorAll('.summary-item').forEach(item => {
      drawBox(context, item, rootRect, { backgroundFallback: '#fff' });
      item.querySelectorAll('.summary-name, .summary-count').forEach(span => drawElementText(context, span, rootRect));
    });

    const rect = getRect(grid, rootRect);
    context.save();
    context.strokeStyle = DEFAULT_LINE;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(rect.x, rect.y);
    context.lineTo(rect.x, rect.bottom);
    context.lineTo(rect.right, rect.bottom);
    context.lineTo(rect.right, rect.y);
    context.stroke();
    context.restore();
  }

  function drawSideNote(context, rootRect) {
    const note = sheet.querySelector('.side-note');
    if (!note) return;

    drawBackground(context, note, rootRect, '#fff');
    drawElementBorders(context, note, rootRect);

    note.querySelectorAll('.side-note-text').forEach(element => drawVerticalText(context, element, rootRect));

    const number = note.querySelector('.side-note-number');
    if (number) drawVerticalText(context, number, rootRect, number.textContent || '');
  }

  async function drawRosterToCanvas() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (document.fonts?.ready) {
      try { await document.fonts.ready; } catch (_) { /* ignore */ }
    }

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const rootRect = sheet.getBoundingClientRect();
    const width = Math.ceil(rootRect.width);
    const height = Math.ceil(rootRect.height);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * SCALE));
    canvas.height = Math.max(1, Math.round(height * SCALE));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('瀏覽器無法建立 Canvas');

    context.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    context.imageSmoothingEnabled = true;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);

    const titleMonth = sheet.querySelector('.sheet-month');
    const title = sheet.querySelector('.sheet-title h1');
    const timestamp = sheet.querySelector('.output-timestamp');
    if (titleMonth) drawElementText(context, titleMonth, rootRect, null, { center: true });
    if (title) drawElementText(context, title, rootRect, null, { center: true });
    if (timestamp && !timestamp.hidden) drawElementText(context, timestamp, rootRect);

    drawScheduleTable(context, rootRect);
    drawLowerTable(context, rootRect);
    drawSummary(context, rootRect);
    drawSideNote(context, rootRect);

    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG 產生失敗'));
      }, 'image/png');
    });
  }

  function getFileName(date = new Date()) {
    const pad2 = (value) => String(value).padStart(2, '0');
    const stamp = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}_${pad2(date.getHours())}${pad2(date.getMinutes())}`;
    return `EliteHotel_${stamp}.png`;
  }

  async function createPngBlob() {
    const canvas = await drawRosterToCanvas();
    return canvasToBlob(canvas);
  }

  function downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function printPreviewUrl(url) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('瀏覽器阻擋了列印視窗，請允許彈出視窗後再試一次。');
      return;
    }

    const safeTitle = getFileName().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<title>${safeTitle}</title>
<style>
  @page { size: A4 landscape; margin: 6mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { display: flex; align-items: flex-start; justify-content: center; }
  img { width: 100%; height: auto; display: block; }
</style>
</head>
<body>
<img id="printImage" src="${url}" alt="排班表 PNG">
<script>
  const image = document.getElementById('printImage');
  image.addEventListener('load', () => {
    setTimeout(() => { window.focus(); window.print(); }, 50);
  });
<\/script>
</body>
</html>`);
    printWindow.document.close();
  }

  let currentPreviewUrl = '';
  let currentPreviewBlob = null;

  function closePreview() {
    const preview = document.getElementById('pngPreviewOverlay');
    if (preview) preview.remove();

    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = '';
    }
    currentPreviewBlob = null;
  }

  function showPreview(blob) {
    closePreview();

    currentPreviewBlob = blob;
    currentPreviewUrl = URL.createObjectURL(blob);

    const overlay = document.createElement('div');
    overlay.id = 'pngPreviewOverlay';
    overlay.className = 'png-preview-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'PNG 預覽');

    overlay.innerHTML = `
      <div class="png-preview-panel">
        <div class="png-preview-head">
          <strong>PNG 預覽</strong>
          <button class="png-preview-close" type="button" aria-label="關閉預覽">×</button>
        </div>
        <div class="png-preview-stage">
          <img class="png-preview-image" alt="目前排班表 PNG 預覽">
        </div>
        <div class="png-preview-actions">
          <button class="png-preview-download" type="button">下載 PNG</button>
          <button class="png-preview-print" type="button">列印</button>
        </div>
      </div>`;

    const image = overlay.querySelector('.png-preview-image');
    const closeButton = overlay.querySelector('.png-preview-close');
    const downloadButton = overlay.querySelector('.png-preview-download');
    const printButton = overlay.querySelector('.png-preview-print');

    image.src = currentPreviewUrl;

    closeButton.addEventListener('click', closePreview);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closePreview();
    });

    downloadButton.addEventListener('click', () => {
      if (currentPreviewBlob) downloadBlob(currentPreviewBlob);
    });

    printButton.addEventListener('click', () => {
      if (currentPreviewUrl) printPreviewUrl(currentPreviewUrl);
    });

    document.body.appendChild(overlay);
    closeButton.focus();
  }

  async function previewPng() {
    const canvas = await drawRosterToCanvas();
    const blob = await canvasToBlob(canvas);
    showPreview(blob);
    return { canvas, blob };
  }

  exportButton.addEventListener('click', async () => {
    if (exportButton.disabled) return;

    exportButton.disabled = true;
    const originalText = exportButton.textContent;
    exportButton.textContent = '準備輸出…';
    let cleanupTimestamp = null;

    try {
      if (window.ShiftRosterOutput?.prepare) {
        cleanupTimestamp = await window.ShiftRosterOutput.prepare();
      }
      exportButton.textContent = '繪製預覽…';
      await previewPng();
    } catch (error) {
      console.error(error);
      window.alert(`PNG 預覽產生失敗：${error?.message || '未知錯誤'}`);
    } finally {
      if (typeof cleanupTimestamp === 'function') cleanupTimestamp();
      exportButton.disabled = false;
      exportButton.textContent = originalText;
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.getElementById('pngPreviewOverlay')) {
      closePreview();
    }
  });

  window.ShiftRosterExport = Object.freeze({
    drawRosterToCanvas,
    createPngBlob,
    previewPng,
    closePreview
  });
})();
