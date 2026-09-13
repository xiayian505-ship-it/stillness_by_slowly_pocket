"use strict";

/* =========================================================
   剁手清單 v2
   - CSS / UI class 契約沿用既有版本
   - HTML / JS 重建
   - 通用能力交給「慢慢的倉庫」
   - 宿主只保留商品資料、頁面狀態與畫面組裝
   ========================================================= */


/* ---------------------------------------------------------
   App 設定
   --------------------------------------------------------- */

const APP = {
  key: "impulse-list-v2",
  collection: "products",
  imageDb: "impulse_list_v2_images",
  imageStore: "images"
};

const PRODUCT_STATUS = [
  { id: "wanted", label: "想買" },
  { id: "watching", label: "觀望" },
  { id: "purchased", label: "已買" },
  { id: "abandoned", label: "放棄" }
];

const PRODUCT_CATEGORIES = [
  {
    id: "merch",
    label: "周邊",
    tree: [
      { id: "doll", label: "娃", options: ["官方", "同人", "我也不知道"] },
      { id: "stand", label: "立牌", options: ["官方", "同人", "我也不知道"] },
      { id: "badge", label: "徽章", options: ["官方", "同人", "我也不知道"] },
      { id: "card", label: "卡牌", options: ["官方", "同人", "我也不知道"] },
      { id: "paper", label: "紙片", options: ["官方", "同人", "我也不知道"] },
      { id: "practical", label: "實用", options: ["官方", "同人", "我也不知道"] },
      { label: "我也不知道", value: "我也不知道" }
    ]
  },
  {
    id: "books",
    label: "書籍",
    tree: [
      { label: "官方", value: "官方" },
      { label: "同人", value: "同人" },
      { label: "官方同人", value: "官方同人" },
      { label: "我也不知道", value: "我也不知道" }
    ]
  },
  {
    id: "games",
    label: "遊戲",
    tree: [
      { id: "game-base", label: "遊戲本體", options: ["實體", "數位", "我也不知道"] },
      {
        id: "topup",
        label: "課金",
        options: ["訂閱／週期權益", "抽卡／貨幣", "DLC／追加內容", "我也不知道"]
      },
      {
        id: "game-accessories",
        label: "設備／配件",
        options: ["手把", "充電座", "收納包", "我也不知道"]
      },
      { label: "我也不知道", value: "我也不知道" }
    ]
  },
  {
    id: "bonus",
    label: "贈品才是本體",
    tree: [
      { label: "購買贈品", value: "購買贈品" },
      { label: "滿額贈", value: "滿額贈" },
      { label: "加價購", value: "加價購" },
      { label: "活動特典", value: "活動特典" },
      { label: "我也不知道", value: "我也不知道" }
    ]
  },
  {
    id: "digital",
    label: "3C",
    tree: [
      {
        id: "keyboard",
        label: "鍵盤",
        options: ["機械鍵盤", "一般鍵盤", "摺疊鍵盤", "我也不知道"]
      },
      { label: "我也不知道", value: "我也不知道" }
    ]
  },
  {
    id: "baking",
    label: "烘焙／料理小物",
    tree: [
      { label: "模具", value: "模具" },
      { label: "烤盤", value: "烤盤" },
      { label: "包裝", value: "包裝" },
      { label: "配件／耗材", value: "配件／耗材" },
      { label: "我也不知道", value: "我也不知道" }
    ]
  },
  {
    id: "unknown",
    label: "我也不知道該怎麼分類",
    tree: [
      {
        label: "我也不知道該怎麼分類",
        value: "我也不知道該怎麼分類"
      }
    ]
  }
];


/* ---------------------------------------------------------
   軍火庫實例
   --------------------------------------------------------- */

let productCollection;
let productImageStore;
let appToast;
let formStatusSelection;
let formCategorySelection;
let formCategoryGroupExpansion;
let formCategoryBranchExpansion;
let formSectionExpansion;
let formFavoriteInstance;
let effectPreference;


/* ---------------------------------------------------------
   App State
   --------------------------------------------------------- */

let products = [];

const viewState = {
  status: "all",
  search: "",
  favoriteOnly: false,
  sort: "newest",
  categories: new Set(),
  openCategoryId: "",
  openSubcategoryIds: new Set(),
  activeProductId: ""
};

const formState = {
  draft: null,
  pendingImageBlob: null,
  removeImage: false,
  statusOpen: false
};

const objectUrls = {
  preview: "",
  cards: []
};


/* ---------------------------------------------------------
   DOM / 小工具
   --------------------------------------------------------- */

const $ = selector => document.querySelector(selector);


function statusLabel(statusId) {
  return PRODUCT_STATUS.find(status => status.id === statusId)?.label || statusId;
}

function parseTags(value) {
  return String(value || "")
    .split(/[,，]/)
    .map(tag => tag.trim())
    .filter(Boolean);
}

function hasMoney(value) {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(Number(value))
  );
}


function revokeObjectUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

function clearPreviewUrl() {
  revokeObjectUrl(objectUrls.preview);
  objectUrls.preview = "";
}

function clearCardUrls() {
  objectUrls.cards.forEach(revokeObjectUrl);
  objectUrls.cards = [];
}

function setInputValue(selector, value) {
  const element = $(selector);
  if (element) element.value = value ?? "";
}


/* ---------------------------------------------------------
   軍火庫依賴
   --------------------------------------------------------- */

function assertDependencies() {
  const missing = [];

  if (!window.Timestamp?.create) missing.push("Timestamp");
  if (!window.TreeSelection?.create) missing.push("TreeSelection");
  if (!window.Preference?.create) missing.push("Preference");
  if (!window.FictionStorage?.create) missing.push("FictionStorage");
  if (!window.FictionSearch?.search) missing.push("FictionSearch");
  if (!window.FictionFilter?.filter) missing.push("FictionFilter");
  if (!window.FictionSort?.sort) missing.push("FictionSort");
  if (!window.Money) missing.push("Money");
  if (
    !window.DataBackup?.readJsonFile ||
    !window.DataBackup?.extractData ||
    !window.DataBackup?.createPayload ||
    !window.DataBackup?.downloadJson ||
    !window.DataBackup?.todayISO
  ) {
    missing.push("DataBackup");
  }
  if (!window.ImportRollback?.create) missing.push("ImportRollback");
  if (!window.SafeImport?.run) missing.push("SafeImport");
  if (!window.BlobDataUrl?.toDataUrl || !window.BlobDataUrl?.toBlob) missing.push("BlobDataUrl");
  if (!window.ImageResize?.resize) missing.push("ImageResize");
  if (!window.ImageStorage?.create) missing.push("ImageStorage");
  if (!window.SlowlyFavorite?.createAll) missing.push("SlowlyFavorite");
  if (!window.HtmlEscape?.escape) missing.push("HtmlEscape");
  if (!window.SlowlyToast?.create) missing.push("SlowlyToast");
  if (!window.SlowlySelect?.createAll) missing.push("SlowlySelect");
  if (!window.SlowlyDate?.createAll) missing.push("SlowlyDate");
  if (!window.SlowlyCustomFile?.initAll || !window.SlowlyCustomFile?.reset) {
    missing.push("SlowlyCustomFile");
  }

  if (missing.length) {
    throw new Error(`軍火庫模組載入失敗：${missing.join("、")}`);
  }
}


/* ---------------------------------------------------------
   Product Model
   --------------------------------------------------------- */

function normalizeProduct(product = {}) {
  const categories = Array.isArray(product.categories)
    ? [...new Set(product.categories.map(String).filter(Boolean))]
    : [];

  const status = PRODUCT_STATUS.some(item => item.id === product.status)
    ? product.status
    : "wanted";

  return {
    id: String(product.id || ""),
    name: String(product.name || "").trim(),
    status,
    source: String(product.source || ""),
    categories,
    tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
    currentPrice: product.currentPrice ?? "",
    currency: String(product.currency || "TWD"),
    budget: product.budget ?? "",
    budgetCurrency: String(product.budgetCurrency || "TWD"),
    lastPurchaseDate: String(product.lastPurchaseDate || ""),
    note: String(product.note || ""),
    favorite: Boolean(product.favorite),
    imageId: String(product.imageId || ""),
    purchasePrice: product.purchasePrice ?? "",
    purchaseCurrency: String(product.purchaseCurrency || "TWD"),
    purchaseDate: String(product.purchaseDate || ""),
    purchaseStore: String(product.purchaseStore || ""),
    purchaseNote: String(product.purchaseNote || ""),
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString()
  };
}

function createProductDraft() {
  return normalizeProduct({
    status: "wanted",
    currency: "TWD",
    budgetCurrency: "TWD",
    purchaseCurrency: "TWD"
  });
}

async function loadProducts() {
  products = (await productCollection.all()).map(normalizeProduct);
  renderApp();
}


/* ---------------------------------------------------------
   Product Query
   ---------------------------------------------------------
   宿主只負責組合查詢條件；
   搜尋、篩選、排序交給「慢慢的倉庫」細項模組。
   --------------------------------------------------------- */

function getVisibleProducts() {
  let result = FictionSearch.search(
    products,
    viewState.search,
    [
      "name",
      "source",
      "categories",
      "note",
      "tags",
      "purchaseStore"
    ]
  );

  result = FictionFilter.filter(result, {
    equals: {
      status: viewState.status === "all"
        ? null
        : viewState.status
    },
    boolean: {
      favorite: viewState.favoriteOnly
        ? true
        : null
    },
    containsAll: {
      categories: [...viewState.categories]
    }
  });

  result = FictionSort.sort(result, {
    field: "createdAt",
    direction: viewState.sort === "newest"
      ? "desc"
      : "asc",
    type: "date"
  });

  return result;
}


/* ---------------------------------------------------------
   Render：統計 / 篩選
   --------------------------------------------------------- */

function renderStats() {
  $("#statWanted").textContent =
    products.filter(product => product.status === "wanted").length;

  $("#statWatching").textContent =
    products.filter(product => product.status === "watching").length;

  $("#statPurchased").textContent =
    products.filter(product => product.status === "purchased").length;

  const spentTwd = Money.sum(
    products.filter(
      product =>
        product.status === "purchased" &&
        product.purchaseCurrency === "TWD"
    ),
    product => product.purchasePrice
  );

  $("#statSpent").textContent = Money.formatNumber(spentTwd, {
    maximumFractionDigits: 0
  });
}

function renderStatusFilters() {
  $("#statusFilters").innerHTML = [
    {
      id: "favorite",
      label: "★ 最愛",
      active: viewState.favoriteOnly
    },
    {
      id: "all",
      label: "全部",
      active: !viewState.favoriteOnly && viewState.status === "all"
    },
    ...PRODUCT_STATUS.map(status => ({
      ...status,
      active: !viewState.favoriteOnly && viewState.status === status.id
    }))
  ]
    .map(filter => `
      <button
        class="status-filter ${filter.active ? "active" : ""}"
        data-view-filter="${filter.id}"
        type="button"
      >
        ${HtmlEscape.escape(filter.label)}
      </button>
    `)
    .join("");

  $("#newestSortBtn").classList.toggle(
    "active",
    viewState.sort === "newest"
  );

  $("#oldestSortBtn").classList.toggle(
    "active",
    viewState.sort === "oldest"
  );
}


/* ---------------------------------------------------------
   Category Helpers
   --------------------------------------------------------- */

function categoryValue(group, item, option = "") {
  if (item.value) return item.value;
  return `${item.label}／${option}`;
}

function valuesInCategoryGroup(group) {
  const values = [];

  group.tree.forEach(item => {
    if (Array.isArray(item.options)) {
      item.options.forEach(option => {
        values.push(categoryValue(group, item, option));
      });
      return;
    }

    if (item.value) values.push(item.value);
  });

  return values;
}


/* ---------------------------------------------------------
   Render：側欄分類
   --------------------------------------------------------- */

function renderSidebarCategories() {
  const categoryBox = $("#sidebarCategories");
  const activeFilterBox = $("#sidebarActiveFilters");

  categoryBox.innerHTML = PRODUCT_CATEGORIES.map(group => {
    const selectedCount = valuesInCategoryGroup(group)
      .filter(value => viewState.categories.has(value))
      .length;

    const groupOpen = viewState.openCategoryId === group.id;

    return `
      <div class="sidebar-category-group">
        <button
          class="sidebar-category-toggle"
          type="button"
          data-category-group="${HtmlEscape.escape(group.id)}"
        >
          <span>
            ${HtmlEscape.escape(group.label)}
            ${selectedCount
              ? `<span class="subcategory-count">${selectedCount}</span>`
              : ""}
          </span>

          <span class="sidebar-category-symbol">
            ${groupOpen ? "−" : "+"}
          </span>
        </button>

        <div class="sidebar-category-children ${groupOpen ? "show" : ""}">
          ${group.tree.map(item => renderSidebarCategoryItem(group, item)).join("")}
        </div>
      </div>
    `;
  }).join("");

  const activeCategories = [...viewState.categories];

  activeFilterBox.classList.toggle(
    "show",
    activeCategories.length > 0
  );

  activeFilterBox.innerHTML = activeCategories.length
    ? `
      <div class="sidebar-active-title">已選分類</div>

      ${activeCategories.map(value => `
        <button
          class="sidebar-active-chip"
          type="button"
          data-sidebar-category="${HtmlEscape.escape(value)}"
        >
          ${HtmlEscape.escape(value)} ×
        </button>
      `).join("")}

      <button class="sidebar-clear-all" id="clearCategoryBtn" type="button">
        清除分類
      </button>
    `
    : "";
}

function renderSidebarCategoryItem(group, item) {
  if (!Array.isArray(item.options)) {
    return `
      <button
        class="sidebar-child ${viewState.categories.has(item.value) ? "active" : ""}"
        type="button"
        data-sidebar-category="${HtmlEscape.escape(item.value)}"
      >
        ${HtmlEscape.escape(item.label)}
      </button>
    `;
  }

  const branchKey = `${group.id}:${item.id}`;
  const branchOpen = viewState.openSubcategoryIds.has(branchKey);

  const selectedCount = item.options
    .map(option => categoryValue(group, item, option))
    .filter(value => viewState.categories.has(value))
    .length;

  return `
    <div class="sidebar-subcategory-group">
      <button
        class="sidebar-subcategory-toggle"
        type="button"
        data-category-branch="${HtmlEscape.escape(branchKey)}"
      >
        <span>
          ${HtmlEscape.escape(item.label)}
          ${selectedCount
            ? `<span class="subcategory-count">${selectedCount}</span>`
            : ""}
        </span>

        <span class="sidebar-subcategory-symbol">
          ${branchOpen ? "−" : "+"}
        </span>
      </button>

      <div class="sidebar-subcategory-children ${branchOpen ? "show" : ""}">
        ${item.options.map(option => {
          const value = categoryValue(group, item, option);

          return `
            <button
              class="sidebar-child sidebar-grandchild ${viewState.categories.has(value) ? "active" : ""}"
              type="button"
              data-sidebar-category="${HtmlEscape.escape(value)}"
            >
              ${HtmlEscape.escape(option)}
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function toggleSidebarCategory(value) {
  if (viewState.categories.has(value)) {
    viewState.categories.delete(value);
  } else {
    viewState.categories.add(value);
  }

  renderApp();
}


/* ---------------------------------------------------------
   Render：商品牆
   --------------------------------------------------------- */

async function renderProductGrid() {
  clearCardUrls();

  const visibleProducts = getVisibleProducts();

  $("#resultCount").textContent =
    visibleProducts.length === products.length
      ? `${visibleProducts.length} 個項目`
      : `${visibleProducts.length} 個項目／共 ${products.length} 個`;

  const grid = $("#productGrid");

  if (!visibleProducts.length) {
    grid.innerHTML = `
      <div class="empty">
        <strong>目前沒有符合條件的商品</strong>
        先新增一個，或換個搜尋條件。
      </div>
    `;
    return;
  }

  grid.innerHTML = visibleProducts.map(product => `
    <div class="electric-card-wrap slowly-electric-border ${product.favorite && effectPreference?.get() ? "is-active" : ""}">
      <article class="card" data-open-id="${HtmlEscape.escape(product.id)}">
      <div class="fav-wrap">
        <button
          class="fav-btn slowly-favorite"
          data-slowly-favorite="${HtmlEscape.escape(product.id)}"
          aria-pressed="${product.favorite ? "true" : "false"}"
          aria-label="最愛"
        ></button>
      </div>

      <div class="thumb" data-image-id="${HtmlEscape.escape(product.imageId)}">
        <span class="placeholder">◇</span>
      </div>

      <div class="card-body">
        <div class="card-name">${HtmlEscape.escape(product.name || "未命名")}</div>

        <div class="card-meta">
          <span class="card-meta-status">${HtmlEscape.escape(statusLabel(product.status))}</span>
          ${hasMoney(product.currentPrice)
            ? `
              <span class="card-meta-separator"> | </span><span class="card-meta-price">${HtmlEscape.escape(Money.formatNumber(product.currentPrice, { maximumFractionDigits: 2 }))} ${HtmlEscape.escape(product.currency === "TWD" ? "NTD" : product.currency)}</span>
            `
            : ""}
        </div>
      </div>
      </article>
    </div>
  `).join("");

  SlowlyFavorite.createAll(
    "#productGrid [data-slowly-favorite]",
    {
      render({ element, active }) {
        element.textContent = active ? "★" : "☆";
      }
    }
  );

  await Promise.all(
    [...grid.querySelectorAll("[data-image-id]")].map(loadProductCardImage)
  );
}

async function loadProductCardImage(box) {
  const imageId = box.dataset.imageId;
  if (!imageId) return;

  const blob = await productImageStore.getBlob(imageId).catch(() => null);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  objectUrls.cards.push(url);

  box.innerHTML = `<img src="${url}" alt="">`;
}

function renderApp() {
  renderStats();
  renderStatusFilters();
  renderSidebarCategories();
  renderProductGrid();
}


/* ---------------------------------------------------------
   Favorite
   --------------------------------------------------------- */

async function updateProductFavorite(productId, active) {
  const product = products.find(
    item => String(item.id) === String(productId)
  );

  if (!product) return;

  await productCollection.update(productId, {
    favorite: Boolean(active),
    updatedAt: new Date().toISOString()
  });

  await loadProducts();
}


/* ---------------------------------------------------------
   商品詳情
   --------------------------------------------------------- */

async function openProductDetail(productId) {
  closeProductDetail();

  viewState.activeProductId = productId;

  const product = products.find(
    item => String(item.id) === String(productId)
  );

  if (!product) return;

  let imageUrl = "";

  if (product.imageId) {
    const blob = await productImageStore
      .getBlob(product.imageId)
      .catch(() => null);

    if (blob) {
      imageUrl = URL.createObjectURL(blob);
      objectUrls.preview = imageUrl;
    }
  }

  $("#detailBody").innerHTML = `
    <div class="detail-hero">
      ${imageUrl
        ? `<img src="${imageUrl}" alt="${HtmlEscape.escape(product.name)}">`
        : `<span class="placeholder">◇</span>`}
    </div>

    <h2 class="detail-title">${HtmlEscape.escape(product.name)}</h2>

    <div class="detail-sub">
      ${HtmlEscape.escape(statusLabel(product.status))}
      ${product.categories.length
        ? ` | ${product.categories.map(HtmlEscape.escape).join("、")}`
        : ""}
      ${product.favorite ? " | ★ 最愛" : ""}
    </div>

    <div class="detail-grid">
      <div class="detail-row">
        <span>目前價格</span>
        <b>
          ${hasMoney(product.currentPrice)
            ? HtmlEscape.escape(Money.formatMoney(product.currentPrice, product.currency))
            : "—"}
        </b>
      </div>

      <div class="detail-row">
        <span>預算</span>
        <b>
          ${hasMoney(product.budget)
            ? HtmlEscape.escape(Money.formatMoney(product.budget, product.budgetCurrency))
            : "—"}
        </b>
      </div>

      <div class="detail-row">
        <span>最後可購買日</span>
        <b>${HtmlEscape.escape(product.lastPurchaseDate || "—")}</b>
      </div>

      <div class="detail-row">
        <span>剁手來源</span>
        <b>${HtmlEscape.escape(product.source || "—")}</b>
      </div>

      ${hasMoney(product.purchasePrice)
        ? `
          <div class="detail-row">
            <span>實際購入價</span>
            <b>
              ${HtmlEscape.escape(
                Money.formatMoney(
                  product.purchasePrice,
                  product.purchaseCurrency
                )
              )}
            </b>
          </div>
        `
        : ""}

      ${product.purchaseStore
        ? `
          <div class="detail-row">
            <span>購入通路</span>
            <b>${HtmlEscape.escape(product.purchaseStore)}</b>
          </div>
        `
        : ""}
    </div>

    ${product.tags.length
      ? `<div class="note"># ${product.tags.map(HtmlEscape.escape).join("　# ")}</div>`
      : ""}

    ${product.note
      ? `<div class="note">${HtmlEscape.escape(product.note)}</div>`
      : ""}

    ${product.purchaseNote
      ? `<div class="note">購買紀錄：${HtmlEscape.escape(product.purchaseNote)}</div>`
      : ""}
  `;

  $("#detailDialog").showModal();
}

function closeProductDetail() {
  if ($("#detailDialog").open) {
    $("#detailDialog").close();
  }

  clearPreviewUrl();
  viewState.activeProductId = "";
}


/* ---------------------------------------------------------
   商品表單：分類
   --------------------------------------------------------- */

function createProductCategoryTreeState() {
  const selected = formState.draft?.categories || [];

  formCategorySelection = TreeSelection.create({
    selected
  });

  formCategoryGroupExpansion = TreeSelection.create({
    expansion: "single"
  });

  formCategoryBranchExpansion = TreeSelection.create({
    expansion: "single"
  });

  // 編輯既有商品時，若已有分類，先把第一個已選項目的路徑展開。
  const firstSelected = selected[0];
  if (!firstSelected) return;

  for (const group of PRODUCT_CATEGORIES) {
    for (const item of group.tree) {
      if (Array.isArray(item.options)) {
        const matched = item.options.some(option =>
          categoryValue(group, item, option) === firstSelected
        );

        if (matched) {
          formCategoryGroupExpansion.expand(group.id);
          formCategoryBranchExpansion.expand(`${group.id}:${item.id}`);
          return;
        }
      } else if (item.value === firstSelected) {
        formCategoryGroupExpansion.expand(group.id);
        return;
      }
    }
  }
}

function renderProductCategoryEditor() {
  const box = $("#categoryTree");
  const draft = formState.draft;

  if (!box || !draft || !formCategorySelection) return;

  box.innerHTML = PRODUCT_CATEGORIES.map(group => {
    const groupOpen = formCategoryGroupExpansion.isExpanded(group.id);
    const selectedCount = valuesInCategoryGroup(group)
      .filter(value => formCategorySelection.has(value))
      .length;

    return `
      <div class="form-tree-group ${groupOpen ? "is-open" : ""}">
        <button
          class="form-tree-toggle"
          type="button"
          data-form-tree-group="${HtmlEscape.escape(group.id)}"
          aria-expanded="${groupOpen}"
        >
          <span>${HtmlEscape.escape(group.label)}</span>
          <span class="form-tree-meta">
            ${selectedCount ? `<span class="form-tree-count">${selectedCount}</span>` : ""}
            <span class="form-tree-symbol">${groupOpen ? "−" : "+"}</span>
          </span>
        </button>

        <div class="form-tree-children ${groupOpen ? "show" : ""}">
          ${group.tree.map(item => renderProductCategoryTreeItem(group, item)).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function renderProductCategoryTreeItem(group, item) {
  if (!Array.isArray(item.options)) {
    return renderProductCategoryLeaf(item.value, item.label);
  }

  const branchKey = `${group.id}:${item.id}`;
  const branchOpen = formCategoryBranchExpansion.isExpanded(branchKey);
  const selectedCount = item.options
    .map(option => categoryValue(group, item, option))
    .filter(value => formCategorySelection.has(value))
    .length;

  return `
    <div class="form-tree-branch ${branchOpen ? "is-open" : ""}">
      <button
        class="form-tree-branch-toggle"
        type="button"
        data-form-tree-branch="${HtmlEscape.escape(branchKey)}"
        aria-expanded="${branchOpen}"
      >
        <span>${HtmlEscape.escape(item.label)}</span>
        <span class="form-tree-meta">
          ${selectedCount ? `<span class="form-tree-count">${selectedCount}</span>` : ""}
          <span class="form-tree-symbol">${branchOpen ? "−" : "+"}</span>
        </span>
      </button>

      <div class="form-tree-leaves ${branchOpen ? "show" : ""}">
        ${item.options.map(option => {
          const value = categoryValue(group, item, option);
          return renderProductCategoryLeaf(value, option);
        }).join("")}
      </div>
    </div>
  `;
}

function renderProductCategoryLeaf(value, label) {
  const active = formCategorySelection.has(value);

  return `
    <button
      class="form-tree-leaf ${active ? "active" : ""}"
      type="button"
      data-category-value="${HtmlEscape.escape(value)}"
      aria-pressed="${active}"
    >
      <span class="form-tree-check" aria-hidden="true">${active ? "✓" : ""}</span>
      <span>${HtmlEscape.escape(label)}</span>
    </button>
  `;
}

function toggleDraftCategory(value) {
  formCategorySelection.toggle(value);
  formState.draft.categories = formCategorySelection.getSelected();
  renderProductCategoryEditor();
  renderFormSectionDisclosures();
}

function toggleProductCategoryGroup(groupId) {
  const opening = !formCategoryGroupExpansion.isExpanded(groupId);
  formCategoryGroupExpansion.toggleExpanded(groupId);

  if (opening) {
    formCategoryBranchExpansion.collapseAll();
  }

  renderProductCategoryEditor();
}

function toggleProductCategoryBranch(branchKey) {
  formCategoryBranchExpansion.toggleExpanded(branchKey);
  renderProductCategoryEditor();
}


/* ---------------------------------------------------------
   商品表單：外層收合 / 最愛
   --------------------------------------------------------- */

function createProductFormSectionState() {
  formSectionExpansion = TreeSelection.create({
    expansion: "multiple"
  });
}

function formSectionSummary(sectionId) {
  const draft = formState.draft;
  if (!draft) return "未設定";

  if (sectionId === "price") {
    if (hasMoney(draft.currentPrice)) {
      return Money.formatMoney(draft.currentPrice, draft.currency);
    }
    if (hasMoney(draft.budget)) {
      return `預算 ${Money.formatMoney(draft.budget, draft.budgetCurrency)}`;
    }
    return "未設定";
  }

  if (sectionId === "temptation") {
    const parts = [];
    if (draft.source) parts.push(draft.source);
    if (draft.tags?.length) parts.push(`${draft.tags.length} 個標籤`);
    if (!parts.length && draft.lastPurchaseDate) parts.push(draft.lastPurchaseDate);
    if (!parts.length && draft.note) parts.push("有備註");
    return parts.join(" | ") || "未設定";
  }

  if (sectionId === "category") {
    const categories = draft.categories || [];
    if (!categories.length) return "未設定";
    if (categories.length <= 2) return categories.join("、");
    return `${categories.slice(0, 2).join("、")} +${categories.length - 2}`;
  }

  if (sectionId === "purchase") {
    const parts = [];
    if (hasMoney(draft.purchasePrice)) {
      parts.push(Money.formatMoney(draft.purchasePrice, draft.purchaseCurrency));
    }
    if (draft.purchaseDate) parts.push(draft.purchaseDate);
    if (!parts.length && draft.purchaseStore) parts.push(draft.purchaseStore);
    if (!parts.length && draft.purchaseNote) parts.push("有備註");
    return parts.join(" | ") || "未設定";
  }

  return "未設定";
}

function renderFormSectionDisclosures() {
  if (!formSectionExpansion) return;

  ["price", "temptation", "category", "purchase"].forEach(sectionId => {
    const open = formSectionExpansion.isExpanded(sectionId);
    const toggle = document.querySelector(`[data-form-section-toggle="${sectionId}"]`);
    const panel = document.querySelector(`[data-form-section-panel="${sectionId}"]`);
    const summary = document.querySelector(`[data-form-section-summary="${sectionId}"]`);
    const symbol = document.querySelector(`[data-form-section-symbol="${sectionId}"]`);

    if (toggle) toggle.setAttribute("aria-expanded", String(open));
    if (panel) panel.classList.toggle("show", open);
    if (summary) summary.textContent = formSectionSummary(sectionId);
    if (symbol) symbol.textContent = open ? "−" : "+";
  });
}

function toggleProductFormSection(sectionId) {
  if (!formSectionExpansion) createProductFormSectionState();
  syncProductDraftFromForm();
  formSectionExpansion.toggleExpanded(sectionId);
  renderFormSectionDisclosures();
}

function createProductFormFavorite() {
  const button = $("#formFavoriteBtn");
  if (!button || !formState.draft) return;

  formFavoriteInstance = SlowlyFavorite.create(button, {
    render({ element, active }) {
      element.textContent = active ? "★" : "☆";
      element.setAttribute("aria-label", active ? "取消最愛" : "加入最愛");
    },
    onChange({ active }) {
      if (formState.draft) formState.draft.favorite = active;
    }
  });

  formFavoriteInstance.set(formState.draft.favorite, { silent: true });
}

/* ---------------------------------------------------------
   商品表單：狀態
   --------------------------------------------------------- */

function createProductStatusTreeState() {
  formStatusSelection = TreeSelection.create({
    selected: [formState.draft?.status || "wanted"]
  });
}

function renderProductStatusEditor() {
  if (!formStatusSelection) createProductStatusTreeState();

  const host = $("#formStatuses");
  const current =
    PRODUCT_STATUS.find(status =>
      formStatusSelection.has(status.id)
    ) || PRODUCT_STATUS[0];

  host.innerHTML = `
    <button
      type="button"
      class="form-disclosure-toggle"
      data-form-status-toggle
      aria-expanded="${formState.statusOpen}"
    >
      <span class="form-disclosure-label">狀態</span>
      <span class="form-disclosure-value">${current.label}</span>
      <span class="form-disclosure-symbol" aria-hidden="true">
        ${formState.statusOpen ? "−" : "+"}
      </span>
    </button>

    <div class="form-disclosure-panel${formState.statusOpen ? " show" : ""}">
      <div class="form-status-tree" role="listbox" aria-label="狀態">
        ${PRODUCT_STATUS.map(status => {
          const active = formStatusSelection.has(status.id);

          return `
            <div
              class="form-status-tree-row${active ? " active" : ""}"
              data-form-status="${status.id}"
              role="option"
              aria-selected="${active}"
              tabindex="0"
            >
              <span class="form-status-tree-mark" aria-hidden="true">${active ? "✓" : ""}</span>
              <span class="form-status-tree-label">${status.label}</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

/* ---------------------------------------------------------
   商品表單：開關 / Draft
   --------------------------------------------------------- */

function syncProductDraftFromForm() {
  const draft = formState.draft;
  if (!draft) return;

  draft.name = $("#nameInput").value.trim();
  draft.source = $("#sourceInput").value.trim();
  draft.currentPrice =
    $("#priceInput").value === ""
      ? ""
      : Number($("#priceInput").value);

  draft.currency =
    $("#currencySelect").value || "TWD";

  draft.budget =
    $("#budgetInput").value === ""
      ? ""
      : Number($("#budgetInput").value);

  draft.budgetCurrency =
    $("#budgetCurrencySelect").value || "TWD";

  draft.lastPurchaseDate =
    $("#lastPurchaseDateInput").value;

  draft.tags =
    parseTags($("#tagsInput").value);

  draft.note =
    $("#noteInput").value.trim();

  draft.purchasePrice =
    $("#purchasePriceInput").value === ""
      ? ""
      : Number($("#purchasePriceInput").value);

  draft.purchaseCurrency =
    $("#purchaseCurrencySelect").value || "TWD";

  draft.purchaseDate =
    $("#purchaseDateInput").value;

  draft.purchaseStore =
    $("#purchaseStoreInput").value.trim();

  draft.purchaseNote =
    $("#purchaseNoteInput").value.trim();
}

function fillProductForm(draft) {
  setInputValue("#nameInput", draft.name);
  setInputValue("#sourceInput", draft.source);
  setInputValue("#priceInput", draft.currentPrice);
  setInputValue("#currencySelect", draft.currency);
  setInputValue("#budgetInput", draft.budget);
  setInputValue("#budgetCurrencySelect", draft.budgetCurrency);
  setInputValue("#lastPurchaseDateInput", draft.lastPurchaseDate);
  setInputValue("#tagsInput", draft.tags.join(", "));
  setInputValue("#noteInput", draft.note);
  setInputValue("#purchasePriceInput", draft.purchasePrice);
  setInputValue("#purchaseCurrencySelect", draft.purchaseCurrency);
  setInputValue("#purchaseDateInput", draft.purchaseDate);
  setInputValue("#purchaseStoreInput", draft.purchaseStore);
  setInputValue("#purchaseNoteInput", draft.purchaseNote);
}

async function openProductForm(productId = "") {
  closeProductDetail();

  formState.pendingImageBlob = null;
  formState.removeImage = false;
  formState.statusOpen = false;
  formSectionExpansion = TreeSelection.create({ expansion: "multiple" });
  clearPreviewUrl();

  const existingProduct = productId
    ? products.find(item => String(item.id) === String(productId))
    : null;

  formState.draft = existingProduct
    ? normalizeProduct(existingProduct)
    : createProductDraft();

  $("#formTitle").textContent =
    existingProduct ? "編輯商品" : "新增商品";

  $("#deleteBtn").hidden = !existingProduct;

  fillProductForm(formState.draft);
  createProductFormFavorite();
  renderFormSectionDisclosures();
  createProductStatusTreeState();
  renderProductStatusEditor();
  createProductCategoryTreeState();
  renderProductCategoryEditor();

  $("#imageInfo").textContent =
    "圖片會先由 Image Resize 壓縮，再存進 IndexedDB。";

  SlowlyCustomFile.reset("#productFile");

  await renderProductImagePreview();

  $("#formDialog").showModal();

  const formSheet = $("#productForm");
  const formBody = $("#formDialog .sheet-body");

  formSheet.scrollTop = 0;
  formBody.scrollTop = 0;

  SlowlySelect.createAll().forEach(instance => instance.sync());
  SlowlyDate.createAll().forEach(instance => instance.sync());

  setTimeout(() => {
    if (!existingProduct) {
      formSheet.scrollTop = 0;
      formBody.scrollTop = 0;
      $("#nameInput")?.focus({ preventScroll: true });
    }
  }, 0);
}

function resetProductFormState() {
  formState.draft = null;
  formState.pendingImageBlob = null;
  formState.removeImage = false;
  formState.statusOpen = false;
  formStatusSelection = null;
  formCategorySelection = null;
  formCategoryGroupExpansion = null;
  formCategoryBranchExpansion = null;
  formSectionExpansion = null;
  formFavoriteInstance = null;
  clearPreviewUrl();
}


/* ---------------------------------------------------------
   商品圖片
   --------------------------------------------------------- */

async function renderProductImagePreview() {
  clearPreviewUrl();

  const preview = $("#imagePreview");
  const removeButton = $("#removeImageBtn");

  preview.innerHTML = '<span class="placeholder">◇</span>';
  removeButton.hidden = true;

  let blob = null;

  if (formState.pendingImageBlob) {
    blob = formState.pendingImageBlob;
  } else if (
    formState.draft?.imageId &&
    !formState.removeImage
  ) {
    blob = await productImageStore
      .getBlob(formState.draft.imageId)
      .catch(() => null);
  }

  if (!blob) return;

  objectUrls.preview = URL.createObjectURL(blob);

  preview.innerHTML = `
    <img src="${objectUrls.preview}" alt="預覽">
  `;

  removeButton.hidden = false;
}

async function handleProductImage(file) {
  if (!file || !formState.draft) return;

  try {
    // 先同步文字欄位，避免換圖片時把尚未儲存的輸入洗掉。
    syncProductDraftFromForm();

    const result = await ImageResize.resize(file, {
      maxWidth: 900,
      maxHeight: 900,
      type: "image/webp",
      quality: 0.82
    });

    formState.pendingImageBlob = result.blob;
    formState.removeImage = false;

    $("#imageInfo").textContent =
      `${Money.formatNumber(file.size / 1024, { maximumFractionDigits: 0 })} KB` +
      ` → ${Money.formatNumber(result.outputBytes / 1024, { maximumFractionDigits: 0 })} KB` +
      ` | ${result.width}×${result.height}`;

    await renderProductImagePreview();
  } catch (error) {
    console.error(error);
    appToast.show(error.message || "圖片處理失敗");
  }
}


/* ---------------------------------------------------------
   商品 CRUD
   --------------------------------------------------------- */

async function saveProduct(event) {
  event.preventDefault();

  syncProductDraftFromForm();

  const draft = formState.draft;

  if (!draft?.name) {
    $("#nameInput").focus();
    appToast.show("商品名稱是唯一必填欄位");
    return;
  }

  const existingProduct = draft.id
    ? products.find(item => String(item.id) === String(draft.id))
    : null;

  const oldImageId = existingProduct?.imageId || "";
  let newImageId = "";

  try {
    if (formState.pendingImageBlob) {
      newImageId = await productImageStore.save(
        formState.pendingImageBlob,
        {
          kind: "product",
          name: draft.name
        }
      );
    }

    draft.imageId = formState.pendingImageBlob
      ? newImageId
      : formState.removeImage
        ? ""
        : oldImageId;

    draft.updatedAt = new Date().toISOString();
    let changeType;

    if (draft.id) {
      await productCollection.update(
        draft.id,
        normalizeProduct(draft)
      );

      changeType = "update";
    } else {
      draft.id = Timestamp.create();
      draft.createdAt = new Date().toISOString();

      await productCollection.add(
        normalizeProduct(draft)
      );

      changeType = "add";
    }

    if (oldImageId && oldImageId !== draft.imageId) {
      await productImageStore
        .remove(oldImageId)
        .catch(() => {});
    }

    formState.pendingImageBlob = null;
    formState.removeImage = false;

    $("#formDialog").close();

    clearPreviewUrl();
    await loadProducts();

    appToast.show(
      changeType === "add"
        ? "已加入剁手清單"
        : "商品已更新"
    );
  } catch (error) {
    if (newImageId) {
      await productImageStore
        .remove(newImageId)
        .catch(() => {});
    }

    console.error(error);
    appToast.show(error.message || "儲存失敗");
  }
}

async function deleteProduct() {
  const draft = formState.draft;

  if (!draft?.id) return;

  if (!confirm(`確定刪除「${draft.name}」？`)) {
    return;
  }

  const deleted = await productCollection.remove(draft.id);

  if (deleted && draft.imageId) {
    await productImageStore
      .remove(draft.imageId)
      .catch(() => {});
  }

  $("#formDialog").close();

  clearPreviewUrl();
  await loadProducts();

  appToast.show("商品已刪除");
}


/* ---------------------------------------------------------
   Backup
   --------------------------------------------------------- */


async function exportBackup() {
  const data = [];

  for (const product of products) {
    let imageData = "";

    if (product.imageId) {
      const blob = await productImageStore
        .getBlob(product.imageId)
        .catch(() => null);

      if (blob) {
        imageData = await BlobDataUrl.toDataUrl(blob);
      }
    }

    data.push({
      ...product,
      imageData
    });
  }

  const payload = DataBackup.createPayload({
    app: APP.key,
    version: 2,
    data,
    extraMeta: {
      storage: "FictionStorage + ImageStorage"
    }
  });

  DataBackup.downloadJson(
    `impulse-list_v2_${DataBackup.todayISO()}.json`,
    payload
  );

  appToast.show("備份已匯出");
}

async function importBackup(file) {
  try {
    const parsed = await DataBackup.readJsonFile(file);
    const incomingProducts = DataBackup.extractData(parsed);

    if (!Array.isArray(incomingProducts)) {
      throw new Error("備份資料不是陣列");
    }

    if (
      !confirm(
        `匯入 ${incomingProducts.length} 筆資料？目前資料會被覆蓋。`
      )
    ) {
      return;
    }

    const importedImageIds = new Set();

    const importRollback = ImportRollback.create({
      capture: async () => {
        const oldProducts = await productCollection.all();
        const oldImages = [];

        for (const product of oldProducts) {
          if (!product.imageId) continue;

          const blob = await productImageStore
            .getBlob(product.imageId)
            .catch(() => null);

          if (!blob) continue;

          oldImages.push({
            id: product.imageId,
            blob,
            name: product.name
          });
        }

        return {
          products: oldProducts,
          images: oldImages
        };
      },

      restore: async snapshot => {
        for (const imageId of importedImageIds) {
          await productImageStore
            .remove(imageId)
            .catch(() => {});
        }

        await productCollection.clear();

        const restoredImageIds = new Map();

        for (const image of snapshot.images) {
          await productImageStore
            .remove(image.id)
            .catch(() => {});

          const restoredId = await productImageStore.save(
            image.blob,
            {
              id: image.id,
              kind: "product",
              name: image.name
            }
          );

          restoredImageIds.set(
            image.id,
            restoredId
          );
        }

        for (const oldProduct of snapshot.products) {
          const product = {
            ...oldProduct
          };

          if (
            product.imageId &&
            restoredImageIds.has(product.imageId)
          ) {
            product.imageId =
              restoredImageIds.get(product.imageId);
          }

          await productCollection.add(product);
        }
      }
    });

    await importRollback.capture();

    const result = await SafeImport.run({
      prepare: async () => {
        return incomingProducts.map(rawProduct => {
          const product = normalizeProduct(rawProduct);

          if (!product.id) {
            product.id = Timestamp.create();
          }

          return {
            product,
            imageBlob: rawProduct.imageData
              ? BlobDataUrl.toBlob(rawProduct.imageData)
              : null
          };
        });
      },

      validate: prepared => {
        if (!Array.isArray(prepared)) {
          return false;
        }

        return prepared.every(item =>
          item &&
          item.product &&
          typeof item.product === "object" &&
          typeof item.product.id === "string" &&
          item.product.id.length > 0 &&
          (
            item.imageBlob === null ||
            item.imageBlob instanceof Blob
          )
        );
      },

      commit: async prepared => {
        const oldProducts = await productCollection.all();

        for (const product of oldProducts) {
          if (product.imageId) {
            await productImageStore
              .remove(product.imageId)
              .catch(() => {});
          }
        }

        await productCollection.clear();

        for (const item of prepared) {
          const product = item.product;

          if (item.imageBlob) {
            product.imageId = await productImageStore.save(
              item.imageBlob,
              {
                kind: "product",
                name: product.name
              }
            );

            importedImageIds.add(product.imageId);
          }

          await productCollection.add(product);
        }

        return prepared.length;
      },

      rollback: async context => {
        await importRollback.rollback(context);
      }
    });

    if (!result.ok) {
      throw result.error || new Error("匯入失敗");
    }

    importRollback.release();

    await loadProducts();

    appToast.show(`已匯入 ${result.value} 筆資料`);
  } catch (error) {
    console.error(error);
    appToast.show(error.message || "匯入失敗");
  }
}


/* ---------------------------------------------------------
   UI State
   --------------------------------------------------------- */

function resetViewState() {
  viewState.status = "all";
  viewState.search = "";
  viewState.favoriteOnly = false;
  viewState.sort = "newest";
  viewState.categories.clear();
  viewState.openCategoryId = "";
  viewState.openSubcategoryIds.clear();

  $("#searchInput").value = "";
  $("#searchClear").classList.remove("show");

  renderApp();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ---------------------------------------------------------
   Events
   --------------------------------------------------------- */

function bindEvents() {
  $("#homeBtn").addEventListener("click", resetViewState);

  $("#addBtn").addEventListener("click", () => {
    openProductForm();
  });

  $("#detailCloseBtn").addEventListener(
    "click",
    closeProductDetail
  );

  $("#detailEditBtn").addEventListener("click", () => {
    openProductForm(viewState.activeProductId);
  });

  $("#formCloseBtn").addEventListener("click", () => {
    $("#formDialog").close();
  });

  $("#formCancelBtn").addEventListener("click", () => {
    $("#formDialog").close();
  });

  $("#productForm").addEventListener(
    "submit",
    saveProduct
  );

  $("#deleteBtn").addEventListener(
    "click",
    deleteProduct
  );

  $("#statusFilters").addEventListener("click", event => {
    const button = event.target.closest("[data-view-filter]");
    if (!button) return;

    const filterId = button.dataset.viewFilter;

    if (filterId === "favorite") {
      viewState.favoriteOnly = true;
      viewState.status = "all";
    } else {
      viewState.favoriteOnly = false;
      viewState.status = filterId;
    }

    renderApp();
  });

  $("#newestSortBtn").addEventListener("click", () => {
    viewState.sort = "newest";
    renderApp();
  });

  $("#oldestSortBtn").addEventListener("click", () => {
    viewState.sort = "oldest";
    renderApp();
  });

  $("#productForm").addEventListener("click", event => {
    const toggle = event.target.closest("[data-form-section-toggle]");
    if (!toggle) return;

    toggleProductFormSection(toggle.dataset.formSectionToggle);
  });

  $("#productForm").addEventListener("input", event => {
    if (!event.target.closest(".form-disclosure-panel")) return;
    syncProductDraftFromForm();
    renderFormSectionDisclosures();
  });

  $("#productForm").addEventListener("change", event => {
    if (!event.target.closest(".form-disclosure-panel")) return;
    syncProductDraftFromForm();
    renderFormSectionDisclosures();
  });

  $("#formStatuses").addEventListener("click", event => {
    const toggle = event.target.closest("[data-form-status-toggle]");

    if (toggle) {
      formState.statusOpen = !formState.statusOpen;
      renderProductStatusEditor();
      return;
    }

    const row = event.target.closest("[data-form-status]");
    if (!row || !formState.draft) return;

    syncProductDraftFromForm();

    const statusId = row.dataset.formStatus;

    formStatusSelection.replaceSelected([statusId]);
    formState.draft.status = formStatusSelection.getSelected()[0];
    formState.statusOpen = false;

    renderProductStatusEditor();
  });

  $("#formStatuses").addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const row = event.target.closest("[data-form-status]");
    if (!row) return;

    event.preventDefault();
    row.click();
  });

  $("#sidebarCategories").addEventListener("click", event => {
    const groupButton =
      event.target.closest("[data-category-group]");

    if (groupButton) {
      const categoryId =
        groupButton.dataset.categoryGroup;

      viewState.openCategoryId =
        viewState.openCategoryId === categoryId
          ? ""
          : categoryId;

      renderSidebarCategories();
      return;
    }

    const branchButton =
      event.target.closest("[data-category-branch]");

    if (branchButton) {
      const branchKey =
        branchButton.dataset.categoryBranch;

      if (viewState.openSubcategoryIds.has(branchKey)) {
        viewState.openSubcategoryIds.delete(branchKey);
      } else {
        viewState.openSubcategoryIds.add(branchKey);
      }

      renderSidebarCategories();
      return;
    }

    const categoryButton =
      event.target.closest("[data-sidebar-category]");

    if (categoryButton) {
      toggleSidebarCategory(
        categoryButton.dataset.sidebarCategory
      );
    }
  });

  $("#sidebarActiveFilters").addEventListener("click", event => {
    const clearButton =
      event.target.closest("#clearCategoryBtn");

    if (clearButton) {
      viewState.categories.clear();
      renderApp();
      return;
    }

    const categoryButton =
      event.target.closest("[data-sidebar-category]");

    if (categoryButton) {
      toggleSidebarCategory(
        categoryButton.dataset.sidebarCategory
      );
    }
  });

  $("#categoryTree").addEventListener("click", event => {
    if (!formState.draft) return;

    const groupButton =
      event.target.closest("[data-form-tree-group]");

    if (groupButton) {
      toggleProductCategoryGroup(
        groupButton.dataset.formTreeGroup
      );
      return;
    }

    const branchButton =
      event.target.closest("[data-form-tree-branch]");

    if (branchButton) {
      toggleProductCategoryBranch(
        branchButton.dataset.formTreeBranch
      );
      return;
    }

    const button =
      event.target.closest("[data-category-value]");

    if (!button) return;

    syncProductDraftFromForm();
    toggleDraftCategory(button.dataset.categoryValue);
  });

  $("#searchInput").addEventListener("input", event => {
    viewState.search = event.target.value;

    $("#searchClear").classList.toggle(
      "show",
      Boolean(viewState.search)
    );

    renderProductGrid();
  });

  $("#searchClear").addEventListener("click", () => {
    $("#searchInput").value = "";
    viewState.search = "";
    $("#searchClear").classList.remove("show");

    renderProductGrid();
  });

  $("#productGrid").addEventListener("click", event => {
    if (event.target.closest("[data-slowly-favorite]")) {
      return;
    }

    const card = event.target.closest("[data-open-id]");

    if (card) {
      openProductDetail(card.dataset.openId);
    }
  });

  $("#productGrid").addEventListener(
    "slowlyfavoritechange",
    event => {
      event.stopPropagation();

      updateProductFavorite(
        event.detail.id,
        event.detail.active
      );
    }
  );

  $("#imageInput").addEventListener("change", event => {
    handleProductImage(event.target.files?.[0]);
  });

  $("#removeImageBtn").addEventListener(
    "click",
    async () => {
      syncProductDraftFromForm();

      formState.pendingImageBlob = null;
      formState.removeImage = true;

      $("#imageInfo").textContent =
        "圖片將在儲存後移除。";

      await renderProductImagePreview();
    }
  );

  $("#settingsBtn").addEventListener("click", () => {
    const panel = $("#settingsPanel");
    const open = panel.hidden;

    panel.hidden = !open;
    $("#settingsBtn").setAttribute("aria-expanded", String(open));
  });

  $("#effectsToggle").addEventListener("change", event => {
    effectPreference.set(event.target.checked);
    renderProductGrid();
  });

  document.addEventListener("click", event => {
    const settings = event.target.closest(".footer-settings");

    if (!settings) {
      $("#settingsPanel").hidden = true;
      $("#settingsBtn").setAttribute("aria-expanded", "false");
    }
  });

  $("#importBtn").addEventListener("click", () => {
    $("#importInput").click();
  });

  $("#exportBtn").addEventListener(
    "click",
    exportBackup
  );

  $("#importInput").addEventListener(
    "change",
    async event => {
      const file = event.target.files?.[0];

      if (file) {
        await importBackup(file);
      }

      event.target.value = "";
    }
  );

  $("#detailDialog").addEventListener(
    "close",
    clearPreviewUrl
  );

  $("#formDialog").addEventListener(
    "close",
    resetProductFormState
  );
}


/* ---------------------------------------------------------
   Init
   --------------------------------------------------------- */

async function init() {
  try {
    assertDependencies();

    const productStore = FictionStorage.create({
      namespace: APP.key
    });

    productCollection =
      productStore.collection(APP.collection);

    productImageStore = ImageStorage.create({
      dbName: APP.imageDb,
      storeName: APP.imageStore
    });

    effectPreference = Preference.create({
      key: `${APP.key}:effects`,
      defaultValue: true
    });

    $("#effectsToggle").checked = effectPreference.get();

    bindEvents();

    appToast = SlowlyToast.create("#toast", {
      duration: 1800
    });

    SlowlyCustomFile.initAll();
    SlowlySelect.createAll();
    SlowlyDate.createAll();

    await loadProducts();
  } catch (error) {
    console.error(error);

    document.body.innerHTML = `
      <main style="padding:24px;font-family:system-ui">
        <h1>剁手清單無法啟動</h1>
        <p>${HtmlEscape.escape(error.message)}</p>
        <p>請確認軍火庫模組可連線。</p>
      </main>
    `;
  }
}

init();
