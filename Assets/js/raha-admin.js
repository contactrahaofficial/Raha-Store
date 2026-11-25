/**
 * RAHA — JEWELLERY FOR THE MODERN MINIMALISTS (ESTD 2026)
 * Full-Stack Supabase Admin Command Center (Orders, Products, Images, SKUs, Website CMS)
 */
(function () {
  'use strict';

  var CMS_STORE_KEY = 'raha_cms_store_v1';
  var CMS_ORDERS_KEY = 'raha_cms_orders_v1';
  var ADMIN_AUTH_KEY = 'raha_admin_session_v1';

  var catalog = [];
  var settings = {};
  var pages = {};
  var orders = [];
  var activeCategoryFilter = 'all';
  var activeOrderFilter = 'all';
  var activeOrderType = 'all'; // 'all', 'cod', 'online'
  var editingProductId = null;
  var editingProductGallery = [];
  var editingProductReviews = [];

  var EMPTY_IMG_PLACEHOLDER = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='none' viewBox='0 0 24 24' stroke='%23555'%3E%3Crect width='24' height='24' fill='%231a1418'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) { resolve(e.target.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatPKR(amount) {
    var num = Math.round(Number(amount) || 0);
    return 'Rs ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(msg, isError) {
    var t = document.getElementById('admin-toast');
    if (!t) return;
    t.textContent = msg;
    t.style.borderColor = isError ? '#e57373' : 'var(--raha-gold)';
    t.style.color = isError ? '#ffcdd2' : 'var(--raha-gold-light)';
    t.classList.add('is-visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () {
      t.classList.remove('is-visible');
    }, 3200);
  }

  /* ========================================================================
     1. INITIALIZATION & DATA LOADING (SUPABASE + LOCAL FALLBACK)
     ======================================================================== */
  async function loadAllAdminData() {
    var defaultCat = window.RAHA_DEFAULT_CATALOG || window.RAHA_CATALOG || [];
    catalog = JSON.parse(JSON.stringify(defaultCat));

    try {
      var srvRes = await fetch('/api/store-data');
      if (srvRes.ok) {
        var srvData = await srvRes.json();
        if (srvData && Array.isArray(srvData.catalog) && srvData.catalog.length > 0) {
          catalog = srvData.catalog;
        }
        if (srvData && srvData.settings) settings = srvData.settings;
        if (srvData && srvData.pages) pages = srvData.pages;
      }
    } catch (e) {}

    try {
      var localRaw = localStorage.getItem(CMS_STORE_KEY);
      if (localRaw) {
        var parsed = JSON.parse(localRaw);
        if (parsed && Array.isArray(parsed.catalog) && parsed.catalog.length > 0) {
          catalog = parsed.catalog;
        }
        if (parsed && parsed.settings) settings = parsed.settings;
        if (parsed && parsed.pages) pages = parsed.pages;
      }
    } catch (e) {}

    if (window.RahaSupabase) {
      updateSupabaseStatusBadge();
      var remoteState = await window.RahaSupabase.fetchStorefrontState(true);
      if (remoteState) {
        if (Array.isArray(remoteState.catalog) && remoteState.catalog.length > 0) {
          catalog = remoteState.catalog;
        }
        if (remoteState.settings) settings = remoteState.settings;
        if (remoteState.pages) pages = remoteState.pages;
      }
      orders = await window.RahaSupabase.fetchOrders();
    }

    renderKpis();
    renderOrdersTab();
    renderProductsTab();
    renderRestockTab();
    populateSettingsForm();
    populatePagesEditor();
    autoHealHeavySupabaseImages();
  }

  var _autoHealRunning = false;
  async function autoHealHeavySupabaseImages() {
    if (_autoHealRunning || !window.RahaSupabase || typeof window.RahaSupabase.optimizeExistingSupabaseImage !== 'function') return;
    var items = Array.isArray(catalog) ? catalog : [];
    if (items.length === 0) return;
    _autoHealRunning = true;
    try {
      var verifiedCache = {};
      try {
        verifiedCache = JSON.parse(localStorage.getItem('raha_verified_fast_imgs_v1') || '{}') || {};
      } catch (e) {}

      var urlMap = {};
      var converted = 0;
      var savedKB = 0;
      async function checkAndFix(u) {
        if (!u || typeof u !== 'string' || u.indexOf('raha-media/') === -1) return u;
        if (verifiedCache[u]) return u; // Already verified fast — 0 network requests on future visits!
        if (urlMap[u]) return urlMap[u];
        var res = await window.RahaSupabase.optimizeExistingSupabaseImage(u);
        if (res && res.changed && res.url) {
          urlMap[u] = res.url;
          verifiedCache[res.url] = 1;
          converted++;
          savedKB += Math.max(0, (res.beforeKB || 0) - (res.afterKB || 0));
          return res.url;
        }
        urlMap[u] = u;
        if (!res || !res.error) {
          verifiedCache[u] = 1;
        }
        return u;
      }
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        var changed = false;
        if (p.img) {
          var nImg = await checkAndFix(p.img);
          if (nImg !== p.img) { p.img = nImg; changed = true; }
        }
        if (p.hoverImg) {
          var nHov = await checkAndFix(p.hoverImg);
          if (nHov !== p.hoverImg) { p.hoverImg = nHov; changed = true; }
        }
        if (Array.isArray(p.gallery)) {
          for (var g = 0; g < p.gallery.length; g++) {
            if (p.gallery[g] && p.gallery[g].src) {
              var nG = await checkAndFix(p.gallery[g].src);
              if (nG !== p.gallery[g].src) { p.gallery[g].src = nG; changed = true; }
            }
          }
        }
        if (Array.isArray(p.customReviews)) {
          for (var r = 0; r < p.customReviews.length; r++) {
            if (p.customReviews[r] && p.customReviews[r].img) {
              var nR = await checkAndFix(p.customReviews[r].img);
              if (nR !== p.customReviews[r].img) { p.customReviews[r].img = nR; changed = true; }
            }
          }
        }
        if (changed) {
          try { await window.RahaSupabase.upsertProduct(p, catalog, settings, pages); } catch (e) {}
        }
      }
      try {
        localStorage.setItem('raha_verified_fast_imgs_v1', JSON.stringify(verifiedCache));
      } catch (e) {}
      if (converted > 0) {
        try {
          if (window.RahaSupabase.cache) window.RahaSupabase.cache.clear();
          sessionStorage.removeItem('raha_cache_storefront_state_v3');
          localStorage.setItem(CMS_STORE_KEY, JSON.stringify({ catalog: catalog, settings: settings, pages: pages }));
        } catch (e) {}
        renderProductsTab();
        showToast('Auto-compressed ' + converted + ' heavy photo(s) — saved ' + (savedKB / 1024).toFixed(1) + ' MB!');
      }
    } catch (e) {
      console.warn('Auto image heal warning:', e);
    } finally {
      _autoHealRunning = false;
    }
  }

  function updateSupabaseStatusBadge() {
    var badge = document.getElementById('admin-sb-status');
    if (!badge) return;
    badge.innerHTML = '● Cloud Storefront Synchronized';
    badge.style.color = '#81c784';
    badge.style.borderColor = 'rgba(129,199,132,0.4)';
  }

  function renderKpis() {
    var totalOrdersEl = document.getElementById('kpi-total-orders');
    var onlineOrdersEl = document.getElementById('kpi-online-orders');
    var pendingOrdersEl = document.getElementById('kpi-pending-orders');
    var revenueEl = document.getElementById('kpi-total-revenue');
    var productsCountEl = document.getElementById('kpi-total-products');
    var restockKpiEl = document.getElementById('kpi-restock-count');
    var restockBadgeEl = document.getElementById('admin-restock-tab-badge');
    var restockFilterBadge = document.getElementById('admin-prod-filter-restock-count');
    var countAllEl = document.getElementById('count-all-orders');
    var countCodEl = document.getElementById('count-cod-orders');
    var countOnlineEl = document.getElementById('count-online-orders');

    var codCount = 0;
    var onlineCount = 0;
    var pendingCount = 0;
    var revenue = 0;

    orders.forEach(function (o) {
      var isOnline = (o.orderId && o.orderId.indexOf('RAHA-ONL') !== -1) ||
                     (o.paymentMethod && o.paymentMethod.indexOf('Online') !== -1) ||
                     (o.orderType === 'online');
      if (isOnline) onlineCount++;
      else codCount++;

      if ((o.status || 'Pending') === 'Pending') pendingCount++;
      if (o.status !== 'Cancelled' && o.status !== 'Refunded' && o.paymentStatus !== 'Refunded') revenue += (Number(o.total) || 0);
    });

    var restockCount = 0;
    var activeProductsCount = 0;
    catalog.forEach(function (p) {
      var stock = p.stock !== undefined ? Number(p.stock) : 15;
      if (stock <= 0) {
        restockCount++;
      } else {
        activeProductsCount++;
      }
    });

    if (totalOrdersEl) totalOrdersEl.textContent = codCount;
    if (onlineOrdersEl) onlineOrdersEl.textContent = onlineCount;
    if (countAllEl) countAllEl.textContent = orders.length;
    if (countCodEl) countCodEl.textContent = codCount;
    if (countOnlineEl) countOnlineEl.textContent = onlineCount;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingCount;
    if (revenueEl) revenueEl.textContent = formatPKR(revenue);
    if (productsCountEl) productsCountEl.textContent = activeProductsCount;
    if (restockKpiEl) restockKpiEl.textContent = restockCount;
    if (restockBadgeEl) restockBadgeEl.textContent = restockCount;
    if (restockFilterBadge) restockFilterBadge.textContent = restockCount;
  }

  /* ========================================================================
     2. TAB 01: ORDERS & CASH ON DELIVERY / ONLINE ORDERS MANAGER
     ======================================================================== */
  function renderOrdersTab() {
    var container = document.getElementById('admin-orders-list');
    var searchIn = document.getElementById('admin-order-search');
    if (!container) return;

    var q = searchIn ? (searchIn.value || '').trim().toLowerCase() : '';

    var filtered = orders.filter(function (o) {
      if (!o || typeof o !== 'object') return false;
      var cust = o.customer || {};
      // Filter out any blank, phantom, or corrupt orders without customer info or cart items
      var hasName = String(cust.name || '').trim().length >= 2;
      var hasPhone = String(cust.phone || '').trim().length >= 5;
      var hasItems = Array.isArray(o.items) && o.items.length > 0;
      if (!hasName || !hasPhone || !hasItems) return false;

      var isOnline = (o.orderId && o.orderId.indexOf('RAHA-ONL') !== -1) ||
                     (o.paymentMethod && o.paymentMethod.indexOf('Online') !== -1) ||
                     (o.orderType === 'online');

      if (activeOrderType === 'cod' && isOnline) return false;
      if (activeOrderType === 'online' && !isOnline) return false;

      var stMatch = (activeOrderFilter === 'all') || ((o.status || 'Pending').toLowerCase() === activeOrderFilter.toLowerCase());
      if (!stMatch) return false;
      if (!q) return true;
      var hay = (o.orderId + ' ' + (cust.name || '') + ' ' + (cust.phone || '') + ' ' + (cust.email || '') + ' ' + (cust.city || '') + ' ' + (cust.address || '')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    if (filtered.length === 0) {
      var emptyMsg = activeOrderType === 'online'
        ? 'No Online WhatsApp orders match this view. When buyers submit an online payment checkout on the store, they will appear here with verification controls.'
        : (activeOrderType === 'cod'
          ? 'No Cash on Delivery orders match this view.'
          : 'No orders match this view.');
      container.innerHTML =
        '<div style="text-align:center;padding:56px 20px;border-radius:22px;background:var(--bg-card);border:1px solid var(--border-subtle);">' +
          '<h3 style="font-family:var(--font-serif);font-size:26px;font-weight:400;margin-bottom:8px;">No Orders Match This View</h3>' +
          '<p style="color:var(--text-secondary);font-size:13.5px;margin-bottom:18px;">' + emptyMsg + '</p>' +
          '<div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">' +
            '<button type="button" class="raha-btn raha-btn--glass" id="admin-create-sample-order-btn">+ Simulate COD Order</button>' +
            '<button type="button" class="raha-btn raha-btn--glass" id="admin-create-sample-online-btn" style="border-color:rgba(100,181,246,0.4);color:#64b5f6;">+ Simulate Online Order</button>' +
          '</div>' +
        '</div>';
      var sampleBtn = document.getElementById('admin-create-sample-order-btn');
      if (sampleBtn) sampleBtn.addEventListener('click', createSampleTestOrder);
      var sampleOnlineBtn = document.getElementById('admin-create-sample-online-btn');
      if (sampleOnlineBtn) sampleOnlineBtn.addEventListener('click', createSampleOnlineOrder);
      return;
    }

    var html = '';
    filtered.forEach(function (o) {
      var cust = o.customer || {};
      var status = o.status || 'Pending';
      var statusColor =
        status === 'Delivered' ? '#81c784' :
        status === 'Dispatched' ? '#64b5f6' :
        status === 'Confirmed' ? 'var(--raha-gold)' :
        status === 'Cancelled' ? '#e57373' : '#ffb74d';

      var isOnline = (o.orderId && o.orderId.indexOf('RAHA-ONL') !== -1) ||
                     (o.paymentMethod && o.paymentMethod.indexOf('Online') !== -1) ||
                     (o.orderType === 'online');
      var payStatus = o.paymentStatus || (o.adminNote && o.adminNote.indexOf('[PAYMENT: REFUNDED]') !== -1 ? 'Refunded' : (o.adminNote && o.adminNote.indexOf('[PAYMENT: CLEARED]') !== -1 ? 'Cleared / Paid' : (isOnline ? 'Pending Verification' : 'Cash on Delivery')));
      var isPayCleared = (payStatus === 'Cleared / Paid');
      var isPayRefunded = (payStatus === 'Refunded');
      var payColor = isPayCleared ? '#81c784' : (isPayRefunded ? '#e57373' : '#ffb74d');

      var itemsHtml = '';
      (o.items || []).forEach(function (it) {
        itemsHtml +=
          '<div style="display:grid;grid-template-columns:46px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-subtle);">' +
            '<img src="' + escapeHtml(it.img || 'Assets/Main Raha logo with slogan (The actual logo).webp') + '" alt="" style="width:46px;height:46px;border-radius:8px;object-fit:cover;">' +
            '<div style="min-width:0;overflow-wrap:anywhere;">' +
              '<div style="font-size:13.5px;font-weight:600;color:var(--text-primary);">' + escapeHtml(it.title) + '</div>' +
              '<div style="font-family:var(--font-mono);font-size:10.5px;color:var(--raha-gold);">SKU: ' + escapeHtml(it.sku || it.id) + ' • ' + escapeHtml(it.variant || 'Gold Plated') + ' × ' + (Number(it.qty) || 1) + '</div>' +
            '</div>' +
            '<div style="font-family:var(--font-mono);font-size:12.5px;color:var(--text-primary);white-space:nowrap;text-align:right;">' + formatPKR((Number(it.price) || 0) * (Number(it.qty) || 1)) + '</div>' +
          '</div>';
      });

      var cleanPhone = String(cust.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.indexOf('03') === 0) cleanPhone = '92' + cleanPhone.slice(1);
      var waMsg = isOnline
        ? 'Assalam-o-Alaikum ' + (cust.name || '') + '! This is Raha Jewel Studio regarding your Online Payment Order ' + o.orderId + ' (' + formatPKR(o.total) + '). Order status: ' + status + ' • Payment status: ' + payStatus + '.'
        : 'Assalam-o-Alaikum ' + (cust.name || '') + '! This is Raha Jewel Studio regarding your Cash on Delivery Order ' + o.orderId + ' (' + formatPKR(o.total) + '). Your order status is now: ' + status + '.';
      var waCustomerUrl = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(waMsg);

      var safeOrderId = escapeHtml(o.orderId);
      var safeStatus = escapeHtml(status);

      var typeBadge = isOnline
        ? '<span style="font-family:var(--font-mono);font-size:10.5px;padding:3px 9px;border-radius:100px;border:1px solid rgba(100,181,246,0.5);color:#64b5f6;background:rgba(100,181,246,0.12);">💳 Online (WhatsApp)</span>'
        : '<span style="font-family:var(--font-mono);font-size:10.5px;padding:3px 9px;border-radius:100px;border:1px solid rgba(214,183,138,0.4);color:var(--raha-gold);background:rgba(214,183,138,0.08);">📦 COD Order</span>';

      var paymentLifecycleCtrl = isOnline
        ? '<select class="raha-cod-select" data-order-payment="' + safeOrderId + '" style="width:auto;padding:5px 10px;font-size:11px;border-color:' + payColor + ';color:' + payColor + ';background:#1a1518;">' +
            '<option value="Pending Verification"' + (payStatus === 'Pending Verification' ? ' selected' : '') + '>Payment: ⏳ Pending Verification</option>' +
            '<option value="Cleared / Paid"' + (payStatus === 'Cleared / Paid' ? ' selected' : '') + '>Payment: ✓ Cleared / Paid</option>' +
            '<option value="Refunded"' + (payStatus === 'Refunded' ? ' selected' : '') + '>Payment: ↺ Refunded</option>' +
          '</select>'
        : '';

      html +=
        '<article class="admin-order-card" style="' + (isOnline ? 'border-color:rgba(100,181,246,0.3);' : '') + '">' +
          '<div class="admin-order-card__head">' +
            '<div>' +
              '<span style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:' + (isOnline ? '#64b5f6' : 'var(--raha-gold)') + ';">' + safeOrderId + '</span>' +
              '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin-left:12px;">' + escapeHtml(o.createdAt || '') + '</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
              typeBadge +
              '<span style="font-family:var(--font-mono);font-size:11px;padding:4px 10px;border-radius:100px;border:1px solid ' + statusColor + ';color:' + statusColor + ';">● ' + safeStatus + '</span>' +
              paymentLifecycleCtrl +
              '<select class="raha-cod-select" data-order-status="' + safeOrderId + '" style="width:auto;padding:6px 12px;font-size:11.5px;">' +
                ['Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled', 'Refunded'].map(function (st) {
                  return '<option value="' + st + '"' + (st === status ? ' selected' : '') + '>Set: ' + st + '</option>';
                }).join('') +
              '</select>' +
              '<button type="button" class="raha-btn raha-btn--glass" data-delete-order="' + safeOrderId + '" style="padding:6px 12px;font-size:10px;border-color:rgba(229,115,115,0.4);color:#e57373;">Delete</button>' +
            '</div>' +
          '</div>' +
          '<div class="admin-order-card__grid">' +
            '<div class="admin-order-meta-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;min-width:0;">' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Customer Name</span><span class="raha-spec-cell__v">' + escapeHtml(cust.name || '—') + '</span></div>' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Phone / WhatsApp No.</span><span class="raha-spec-cell__v"><a href="' + waCustomerUrl + '" target="_blank" rel="noopener" style="color:' + (isOnline ? '#64b5f6' : 'var(--raha-gold)') + ';">' + escapeHtml(cust.phone || '—') + ' ↗</a></span></div>' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Email Address</span><span class="raha-spec-cell__v">' + escapeHtml(cust.email || '—') + '</span></div>' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Delivery City</span><span class="raha-spec-cell__v" style="color:var(--raha-gold);">' + escapeHtml(cust.city || '—') + '</span></div>' +
              '<div class="raha-spec-cell" style="grid-column:1 / -1;"><span class="raha-spec-cell__k">Full Delivery Street Address</span><span class="raha-spec-cell__v">' + escapeHtml(cust.address || '—') + (cust.notes ? ' (Note: ' + escapeHtml(cust.notes) + ')' : '') + '</span></div>' +
            '</div>' +
            '<div style="min-width:0;background:rgba(13,10,12,0.45);padding:14px 16px;border-radius:16px;border:1px solid var(--border-subtle);display:flex;flex-direction:column;justify-content:space-between;">' +
              '<div>' + itemsHtml + '</div>' +
              '<div style="padding-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font-family:var(--font-mono);font-size:13.5px;font-weight:600;">' +
                '<span>' + (isOnline ? 'Total Online Bill:' : 'Total COD Payable:') + '</span>' +
                '<span style="color:' + (isOnline ? '#64b5f6' : 'var(--raha-gold)') + ';font-size:16px;white-space:nowrap;">' + formatPKR(o.total) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</article>';
    });

    container.innerHTML = html;

    container.querySelectorAll('[data-order-status]').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var oid = sel.getAttribute('data-order-status');
        var newSt = sel.value;
        var targetOrder = null;
        orders.forEach(function (o) {
          if (o.orderId === oid) targetOrder = o;
        });
        var prevSt = targetOrder ? (targetOrder.status || 'Pending') : 'Pending';

        await window.RahaSupabase.updateOrderStatus(oid, newSt);
        if (targetOrder) targetOrder.status = newSt;

        /* Inventory Sync: Restore stock when order is Cancelled; re-deduct if un-cancelled */
        var stockDeltaDir = 0;
        if (prevSt !== 'Cancelled' && newSt === 'Cancelled') {
          stockDeltaDir = 1; // Restore stock
        } else if (prevSt === 'Cancelled' && newSt !== 'Cancelled') {
          stockDeltaDir = -1; // Re-deduct stock
        }

        if (stockDeltaDir !== 0 && targetOrder && Array.isArray(targetOrder.items)) {
          var touchedProducts = [];
          targetOrder.items.forEach(function (oi) {
            for (var ci = 0; ci < catalog.length; ci++) {
              if (catalog[ci].id === oi.id) {
                var prod = catalog[ci];
                var qty = Math.max(1, Number(oi.qty) || 1);
                var curStock = (prod.stock !== undefined && prod.stock !== null) ? Number(prod.stock) : 15;
                prod.stock = Math.max(0, curStock + (stockDeltaDir * qty));
                if (Array.isArray(prod.customSkus) && prod.customSkus.length > 0) {
                  prod.customSkus[0]._productStock = prod.stock;
                  prod.customSkus.forEach(function (cs) {
                    var csSuff = String(cs.suffix || '').toUpperCase();
                    var csName = String(cs.name || '').toLowerCase();
                    var iSku = String(oi.sku || '').toUpperCase();
                    var iVar = String(oi.variant || '').toLowerCase();
                    if (prod.customSkus.length === 1 || (csSuff && iSku.indexOf(csSuff) !== -1) || (csName && iVar.indexOf(csName) !== -1)) {
                      var curCs = (cs.stock !== undefined && cs.stock !== null) ? Number(cs.stock) : curStock;
                      cs.stock = Math.max(0, curCs + (stockDeltaDir * qty));
                    }
                  });
                }
                if (touchedProducts.indexOf(prod) === -1) touchedProducts.push(prod);
                break;
              }
            }
          });

          try {
            if (window.RahaSupabase && window.RahaSupabase.cache && typeof window.RahaSupabase.cache.clear === 'function') {
              window.RahaSupabase.cache.clear();
            }
            sessionStorage.removeItem('raha_cache_storefront_state_v3');
            localStorage.setItem(CMS_STORE_KEY, JSON.stringify({ catalog: catalog, settings: settings, pages: pages }));
          } catch (cErr) {}

          for (var tp = 0; tp < touchedProducts.length; tp++) {
            try {
              await window.RahaSupabase.upsertProduct(touchedProducts[tp], catalog, settings, pages);
            } catch (upErr) {}
          }
          renderProductsTab();
          renderRestockTab();
        }

        renderKpis();
        renderOrdersTab();
        if (stockDeltaDir === 1) {
          showToast('Order ' + oid + ' cancelled — item stock restored back to inventory.');
        } else if (stockDeltaDir === -1) {
          showToast('Order ' + oid + ' reactivated (' + newSt + ') — item stock deducted from inventory.');
        } else {
          showToast('Order ' + oid + ' status updated to ' + newSt);
        }
      });
    });

    container.querySelectorAll('[data-order-payment]').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var oid = sel.getAttribute('data-order-payment');
        var newPaySt = sel.value;
        await window.RahaSupabase.updateOrderStatus(oid, null, null, newPaySt);
        orders.forEach(function (o) {
          if (o.orderId === oid) {
            o.paymentStatus = newPaySt;
            var base = (o.adminNote || '').replace(/\[PAYMENT:[^\]]+\]/g, '').trim();
            var tag = (newPaySt === 'Cleared / Paid') ? '[PAYMENT: CLEARED]' : (newPaySt === 'Refunded' ? '[PAYMENT: REFUNDED]' : '[PAYMENT: PENDING_VERIFICATION]');
            o.adminNote = (base ? base + ' ' : '') + tag;
          }
        });
        renderKpis();
        renderOrdersTab();
        showToast('Order ' + oid + ' payment marked as ' + newPaySt);
      });
    });

    container.querySelectorAll('[data-delete-order]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var oid = btn.getAttribute('data-delete-order');
        await window.RahaSupabase.deleteOrder(oid);
        orders = orders.filter(function (o) { return o.orderId !== oid; });
        renderKpis();
        renderOrdersTab();
        showToast('Order ' + oid + ' removed');
      });
    });
  }

  async function createSampleTestOrder() {
    var sample = {
      orderId: 'RAHA-COD-' + Math.floor(10000 + Math.random() * 90000),
      createdAt: new Date().toLocaleString(),
      status: 'Pending',
      paymentMethod: 'Cash on Delivery (COD)',
      customer: {
        name: 'Ayesha Khan',
        phone: '+92 300 8234567',
        email: 'ayesha.khan@example.com',
        city: 'Karachi',
        address: 'House 14-B, Street 6, Phase 6, DHA Karachi (Near Bukhari Commercial)',
        notes: 'Please call before arriving at gate'
      },
      items: [
        {
          id: 'ear-01',
          sku: 'RAHA-EAR-01-GLD-STD',
          title: 'Aether Sculpted Gold Drop Hoops',
          variant: 'Gold Plated • STD',
          price: 2450,
          qty: 1,
          img: 'Assets/Main Raha logo with slogan (The actual logo).webp'
        },
        {
          id: 'ring-01',
          sku: 'RAHA-RNG-01-GLD-US7',
          title: 'Vanguard Signet Dome Ring',
          variant: 'Gold Plated • US7',
          price: 2250,
          qty: 1,
          img: 'Assets/Main Raha logo with slogan (The actual logo).webp'
        }
      ],
      subtotal: 4700,
      shipping: 0,
      total: 4700
    };
    await window.RahaSupabase.createOrder(sample);
    orders.unshift(sample);
    renderKpis();
    renderOrdersTab();
    showToast('Sample COD order created!');
  }

  async function createSampleOnlineOrder() {
    var sample = {
      orderId: 'RAHA-ONL-' + Math.floor(10000 + Math.random() * 90000),
      createdAt: new Date().toLocaleString(),
      status: 'Pending',
      paymentMethod: 'Online Payment (WhatsApp)',
      paymentStatus: 'Pending Verification',
      orderType: 'online',
      adminNote: '[PAYMENT: PENDING_VERIFICATION]',
      customer: {
        name: 'Zainab Fatima',
        phone: '+92 321 4567890',
        email: 'zainab.fatima@example.com',
        city: 'Lahore',
        address: 'Apartment 402, Block G, Gulberg III, Lahore (Near Main Market)',
        notes: 'Kindly send Raast / Bank details on WhatsApp for immediate transfer'
      },
      items: [
        {
          id: 'neck-01',
          sku: 'RAHA-NCK-01-GLD',
          title: 'Celeste Luminary Herringbone Choker',
          variant: 'Gold Plated • 16-inch',
          price: 3200,
          qty: 1,
          img: 'Assets/Main Raha logo with slogan (The actual logo).webp'
        }
      ],
      subtotal: 3200,
      shipping: 250,
      total: 3450
    };
    await window.RahaSupabase.createOrder(sample);
    orders.unshift(sample);
    renderKpis();
    renderOrdersTab();
    showToast('Sample Online Order created!');
  }

  /* ========================================================================
     3. TAB 02: PRODUCTS, IMAGES & SKU MANAGER
     ======================================================================== */
  function renderProductsTab() {
    var grid = document.getElementById('admin-products-grid');
    var searchIn = document.getElementById('admin-product-search');
    if (!grid) return;

    var q = searchIn ? (searchIn.value || '').trim().toLowerCase() : '';
    var filtered = catalog.filter(function (p) {
      var pStock = p.stock !== undefined ? Number(p.stock) : 15;
      if (activeCategoryFilter === 'restock') {
        if (pStock > 0) return false;
      } else if (activeCategoryFilter === 'low') {
        if (pStock <= 0 || pStock > 5) return false;
      } else if (activeCategoryFilter !== 'all') {
        if ((p.categorySlug || '').toLowerCase() !== activeCategoryFilter) return false;
      }
      if (!q) return true;
      var hay = (p.id + ' ' + p.skuBase + ' ' + p.title + ' ' + p.subtitle + ' ' + p.category).toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    var html = '';
    filtered.forEach(function (p) {
      var skuCount = (Array.isArray(p.customSkus) && p.customSkus.length > 0) ? p.customSkus.length : 4;
      var galCount = (Array.isArray(p.gallery) && p.gallery.length > 0) ? p.gallery.length : 5;
      var pStock = p.stock !== undefined ? Number(p.stock) : 15;
      var stockPill = '';
      if (pStock <= 0) {
        stockPill = '<span style="font-family:var(--font-mono);font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(229,115,115,0.18);border:1px solid rgba(229,115,115,0.4);color:#ffcdd2;font-weight:600;">● Out of Stock (0)</span>';
      } else if (pStock <= 5) {
        stockPill = '<span style="font-family:var(--font-mono);font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(214,183,138,0.18);border:1px solid rgba(214,183,138,0.4);color:var(--raha-gold);font-weight:600;">⚡ Low Stock (' + pStock + ' left)</span>';
      } else {
        stockPill = '<span style="font-family:var(--font-mono);font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(129,199,132,0.14);border:1px solid rgba(129,199,132,0.35);color:#81c784;">● ' + pStock + ' in Stock</span>';
      }

      html +=
        '<div class="admin-prod-card">' +
          '<div style="position:relative;aspect-ratio:1/1;background:#161114;overflow:hidden;border-radius:16px;margin-bottom:12px;border:1px solid var(--border-subtle);">' +
            '<img src="' + p.img + '" alt="' + p.title + '" style="width:100%;height:100%;object-fit:cover;display:block;' + (pStock <= 0 ? 'filter:grayscale(60%);' : '') + '">' +
            '<span class="raha-badge" style="position:absolute;top:10px;left:10px;">' + (pStock <= 0 ? 'Depleted' : (p.badge || 'Raha')) + '</span>' +
            '<span style="position:absolute;bottom:10px;right:10px;padding:4px 8px;border-radius:6px;background:rgba(13,10,12,0.85);font-family:var(--font-mono);font-size:9.5px;color:var(--raha-gold);">' + p.skuBase + '</span>' +
          '</div>' +
          '<div style="flex:1;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:6px;flex-wrap:wrap;">' +
              '<span style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-muted);">' + p.category + ' • ' + skuCount + ' SKUs</span>' +
              stockPill +
            '</div>' +
            '<h4 style="font-family:var(--font-serif);font-size:20px;font-weight:500;color:var(--text-primary);margin-bottom:6px;line-height:1.25;">' + p.title + '</h4>' +
            '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px;">' +
              '<span style="font-family:var(--font-mono);font-size:15px;font-weight:600;color:var(--raha-gold);">' + formatPKR(p.price) + '</span>' +
              '<del style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">' + formatPKR(p.compare) + '</del>' +
            '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;">' +
            '<button type="button" class="raha-btn raha-btn--primary" data-edit-prod="' + p.id + '" style="padding:10px 14px;font-size:10.5px;">Edit Piece / Stock</button>' +
            '<a href="product.html?id=' + encodeURIComponent(p.id) + '" target="_blank" class="raha-btn raha-btn--glass" style="padding:10px 12px;font-size:10.5px;text-decoration:none;" title="Preview on Store">↗</a>' +
            '<button type="button" class="raha-btn raha-btn--glass" data-del-prod="' + p.id + '" style="padding:10px 12px;font-size:10.5px;border-color:rgba(229,115,115,0.4);color:#e57373;" title="Remove Product">✕</button>' +
          '</div>' +
        '</div>';
    });

    grid.innerHTML = html;

    grid.querySelectorAll('[data-edit-prod]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openProductEditorModal(btn.getAttribute('data-edit-prod'));
      });
    });

    grid.querySelectorAll('[data-edit-reviews]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid = btn.getAttribute('data-edit-reviews');
        openProductEditorModal(pid);
        setTimeout(function () {
          var sec = document.getElementById('ep-reviews-section');
          if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      });
    });

    grid.querySelectorAll('[data-del-prod]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var pid = btn.getAttribute('data-del-prod');
        catalog = catalog.filter(function (item) { return item.id !== pid; });
        await window.RahaSupabase.deleteProduct(pid, catalog, settings, pages);
        renderKpis();
        renderProductsTab();
        renderRestockTab();
        showToast('Removed product ' + pid + ' from store');
      });
    });
  }

  /* ========================================================================
     3B. TAB 03: RESTOCK PRODUCTS CMS & QUICK REPLENISHMENT
     ======================================================================== */
  function renderRestockTab() {
    var grid = document.getElementById('admin-restock-grid');
    var searchIn = document.getElementById('admin-restock-search');
    if (!grid) return;

    var q = searchIn ? (searchIn.value || '').trim().toLowerCase() : '';
    var depleted = catalog.filter(function (p) {
      var st = p.stock !== undefined ? Number(p.stock) : 15;
      if (st > 0) return false;
      if (!q) return true;
      var hay = (p.id + ' ' + p.skuBase + ' ' + p.title + ' ' + p.category).toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    if (depleted.length === 0) {
      grid.innerHTML =
        '<div style="grid-column:1 / -1;text-align:center;padding:60px 20px;border-radius:22px;background:var(--bg-card);border:1px solid var(--border-subtle);">' +
          '<div style="font-size:36px;margin-bottom:12px;">✨</div>' +
          '<h3 style="font-family:var(--font-serif);font-size:26px;font-weight:400;margin-bottom:8px;color:var(--raha-gold);">All Pieces Fully In Stock</h3>' +
          '<p style="color:var(--text-secondary);font-size:13.5px;max-width:560px;margin:0 auto 18px;">There are no out-of-stock products right now. When an item or its SKUs sell down to 0 units from orders, it is automatically removed from public buyer discovery and queued here for replenishment.</p>' +
          '<button type="button" class="raha-btn raha-btn--glass" onclick="document.querySelector(\'[data-admin-tab=products]\').click();">Browse All Products &rarr;</button>' +
        '</div>';
      return;
    }

    var html = '';
    depleted.forEach(function (p) {
      var skus = Array.isArray(p.customSkus) && p.customSkus.length > 0 ? p.customSkus : [];
      var skuBreakdown = '';
      if (skus.length > 0) {
        skuBreakdown = '<div style="margin:10px 0;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,0.3);border:1px solid var(--border-subtle);font-size:11px;">' +
          '<div style="font-family:var(--font-mono);font-size:9.5px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;">SKU Variant Stocks:</div>' +
          skus.map(function (sk) {
            var skst = sk.stock !== undefined ? Number(sk.stock) : 0;
            return '<div style="display:flex;justify-content:space-between;padding:2px 0;">' +
              '<span style="color:var(--text-secondary);">' + sk.name + ' (' + (sk.suffix || '') + '):</span>' +
              '<span style="font-family:var(--font-mono);' + (skst <= 0 ? 'color:#e57373;font-weight:600;' : 'color:#81c784;') + '">' + skst + ' units</span>' +
            '</div>';
          }).join('') +
        '</div>';
      }

      html +=
        '<div class="admin-prod-card" style="border-color:rgba(229,115,115,0.35);">' +
          '<div style="position:relative;aspect-ratio:1/1;background:#161114;overflow:hidden;border-radius:16px;margin-bottom:12px;border:1px solid var(--border-subtle);">' +
            '<img src="' + p.img + '" alt="' + p.title + '" style="width:100%;height:100%;object-fit:cover;display:block;filter:grayscale(60%);">' +
            '<span style="position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:100px;background:rgba(229,115,115,0.92);color:#120e11;font-family:var(--font-mono);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">● Sold Out (0 Left)</span>' +
            '<span style="position:absolute;bottom:10px;right:10px;padding:4px 8px;border-radius:6px;background:rgba(13,10,12,0.85);font-family:var(--font-mono);font-size:9.5px;color:var(--raha-gold);">' + p.skuBase + '</span>' +
          '</div>' +
          '<div style="flex:1;">' +
            '<div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#e57373;margin-bottom:4px;">Hidden from Storefront (0 Stock)</div>' +
            '<h4 style="font-family:var(--font-serif);font-size:20px;font-weight:500;color:var(--text-primary);margin-bottom:6px;line-height:1.25;">' + p.title + '</h4>' +
            '<div style="font-family:var(--font-mono);font-size:14px;color:var(--raha-gold);margin-bottom:6px;">' + formatPKR(p.price) + '</div>' +
            skuBreakdown +
          '</div>' +
          '<div style="padding-top:12px;border-top:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:8px;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<label style="font-family:var(--font-mono);font-size:10.5px;color:var(--text-muted);white-space:nowrap;">Units to Add:</label>' +
              '<input type="number" min="1" value="15" class="raha-cod-input raha-restock-qty-in" data-input-prod-id="' + p.id + '" style="padding:6px 10px;font-size:12px;font-family:var(--font-mono);width:100px;">' +
            '</div>' +
            '<button type="button" class="raha-btn raha-btn--primary raha-do-restock-btn" data-restock-id="' + p.id + '" style="padding:10px 14px;font-size:11px;width:100%;">' +
              '<span>+ Restock &amp; Republish Live</span>' +
            '</button>' +
          '</div>' +
        '</div>';
    });

    grid.innerHTML = html;

    grid.querySelectorAll('.raha-do-restock-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var pid = btn.getAttribute('data-restock-id');
        var input = grid.querySelector('.raha-restock-qty-in[data-input-prod-id="' + pid + '"]');
        var qty = input ? Math.max(1, Number(input.value) || 15) : 15;
        await performRestock(pid, qty);
      });
    });
  }

  async function performRestock(productId, quantity) {
    showToast('Restocking piece and republishing live...');
    var target = null;
    catalog.forEach(function (p) {
      if (p.id === productId) {
        target = p;
        p.stock = (Number(p.stock) || 0) + quantity;
        if (Array.isArray(p.customSkus)) {
          p.customSkus.forEach(function (sk) {
            sk.stock = (Number(sk.stock) || 0) + quantity;
          });
        }
      }
    });

    try {
      var hdrs = (window.RahaSupabase && typeof window.RahaSupabase.getAuthHeaders === 'function')
        ? window.RahaSupabase.getAuthHeaders()
        : { 'Content-Type': 'application/json', 'X-Raha-Admin': '1' };
      await fetch('/api/restock-product', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ productId: productId, quantity: quantity })
      });
    } catch (e) {
      console.warn('Backend restock sync note:', e);
    }

    try {
      if (target && window.RahaSupabase && typeof window.RahaSupabase.upsertProduct === 'function') {
        await window.RahaSupabase.upsertProduct(target, catalog, settings, pages);
      }
    } catch (err) {
      console.warn('Supabase restock sync note:', err);
    }

    renderKpis();
    renderProductsTab();
    renderRestockTab();
    showToast('✓ Restocked "' + (target ? target.title : productId) + '" (+' + quantity + ' units). Piece is now live on storefront!');
  }

  async function performBulkRestock() {
    var depleted = catalog.filter(function (p) {
      return (p.stock !== undefined ? Number(p.stock) : 15) <= 0;
    });
    if (depleted.length === 0) {
      showToast('All pieces are already in stock!');
      return;
    }
    showToast('Restocking ' + depleted.length + ' pieces (+15 units each)...');
    var hdrs = (window.RahaSupabase && typeof window.RahaSupabase.getAuthHeaders === 'function')
      ? window.RahaSupabase.getAuthHeaders()
      : { 'Content-Type': 'application/json', 'X-Raha-Admin': '1' };
    for (var i = 0; i < depleted.length; i++) {
      var p = depleted[i];
      p.stock = 15;
      if (Array.isArray(p.customSkus)) {
        p.customSkus.forEach(function (sk) { sk.stock = 15; });
      }
      try {
        await fetch('/api/restock-product', {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify({ productId: p.id, quantity: 15 })
        });
      } catch (e) {}
      if (window.RahaSupabase && typeof window.RahaSupabase.upsertProduct === 'function') {
        try { await window.RahaSupabase.upsertProduct(p, catalog, settings, pages); } catch (e) {}
      }
    }
    renderKpis();
    renderProductsTab();
    renderRestockTab();
    showToast('✓ Successfully restocked ' + depleted.length + ' pieces! All are republished live.');
  }

  /* Open Add / Edit Product & SKU Studio Modal */
  function openProductEditorModal(prodId) {
    var modal = document.getElementById('admin-product-modal');
    var modalTitle = document.getElementById('admin-prod-modal-title');
    if (!modal) return;

    var prod = null;
    if (prodId) {
      for (var i = 0; i < catalog.length; i++) {
        if (catalog[i].id === prodId) {
          prod = JSON.parse(JSON.stringify(catalog[i]));
          break;
        }
      }
    }

    var isNewProduct = !prod;
    if (!prod) {
      var newId = 'item-' + Date.now().toString().slice(-4);
      prod = {
        id: newId,
        skuBase: '',
        title: '',
        subtitle: '',
        price: '',
        compare: '',
        stock: '',
        rating: '5.0',
        reviews: 0,
        badge: '',
        material: '',
        category: 'Earrings',
        categorySlug: 'earrings',
        subdept: '',
        img: '',
        hoverImg: '',
        gallery: [],
        customSkus: [],
        customSizes: [],
        weight: '',
        dimensions: '',
        featuredOnHome: false
      };
      editingProductId = null;
      if (modalTitle) modalTitle.textContent = 'Add New Jewellery Piece & SKUs';
    } else {
      editingProductId = prod.id;
      if (modalTitle) modalTitle.textContent = 'Edit Piece: ' + prod.title + ' (' + prod.skuBase + ')';
      if (!Array.isArray(prod.customSkus)) {
        prod.customSkus = [];
      }
    }

    document.getElementById('ep-id').value = prod.id;
    document.getElementById('ep-sku').value = prod.skuBase || '';
    document.getElementById('ep-title').value = prod.title || '';
    document.getElementById('ep-category').value = prod.categorySlug || 'earrings';
    document.getElementById('ep-subdept').value = prod.subdept || '';
    document.getElementById('ep-price').value = prod.price !== undefined && prod.price !== '' ? prod.price : '';
    document.getElementById('ep-compare').value = prod.compare !== undefined && prod.compare !== '' ? prod.compare : '';
    if (document.getElementById('ep-stock')) {
      document.getElementById('ep-stock').value = prod.stock !== undefined && prod.stock !== '' ? prod.stock : (isNewProduct ? '' : 15);
    }
    document.getElementById('ep-badge').value = prod.badge || '';
    document.getElementById('ep-material').value = prod.material || '';
    document.getElementById('ep-subtitle').value = prod.subtitle || '';
    document.getElementById('ep-dimensions').value = prod.dimensions || '';
    document.getElementById('ep-weight').value = prod.weight || '';
    document.getElementById('ep-featured').checked = Boolean(prod.featuredOnHome);

    editingProductGallery = Array.isArray(prod.gallery) && prod.gallery.length > 0
      ? JSON.parse(JSON.stringify(prod.gallery))
      : (prod.img ? [{ src: prod.img, tag: '01 Gold Plated', label: 'Gold Plated Studio View' }] : []);
    renderDynamicGalleryInModal();

    editingProductReviews = (Array.isArray(prod.customReviews) && prod.customReviews.length > 0)
      ? JSON.parse(JSON.stringify(prod.customReviews))
      : [];
    renderReviewsInModal();

    var sizesArr = Array.isArray(prod.customSizes) && prod.customSizes.length > 0
      ? prod.customSizes.map(function (s) { return typeof s === 'string' ? s : s.label; })
      : [];
    document.getElementById('ep-sizes').value = sizesArr.join(', ');

    renderSkuRowsInModal(prod.customSkus);

    modal.classList.add('is-open');
  }

  function renderDynamicGalleryInModal() {
    var countEl = document.getElementById('ep-gallery-count');
    var grid = document.getElementById('ep-dynamic-gallery-grid');
    if (!grid) return;

    if (countEl) countEl.textContent = editingProductGallery.length;

    if (editingProductGallery.length === 0) {
      grid.innerHTML =
        '<div style="grid-column:1 / -1;text-align:center;padding:36px 16px;border-radius:16px;border:1px dashed var(--border-subtle);background:rgba(255,255,255,0.02);">' +
          '<p style="font-size:14px;color:var(--text-muted);margin-bottom:6px;">No photos attached to this product.</p>' +
          '<p style="font-size:12px;color:var(--text-secondary);">Click "+ Upload Photo(s)" above to upload as many pictures as you want.</p>' +
        '</div>';
      return;
    }

    var html = '';
    editingProductGallery.forEach(function (g, idx) {
      var isCover = (idx === 0);
      html +=
        '<div class="admin-dynamic-img-card" data-img-idx="' + idx + '" style="position:relative;background:var(--bg-card);border:1px solid ' + (isCover ? 'var(--raha-gold)' : 'var(--border-subtle)') + ';border-radius:16px;overflow:hidden;padding:10px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:var(--shadow-card);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<span style="font-family:var(--font-mono);font-size:9.5px;padding:3px 8px;border-radius:100px;' + (isCover ? 'background:var(--raha-gold);color:#120e11;font-weight:700;' : 'background:rgba(255,255,255,0.06);color:var(--text-muted);') + '">' +
              (isCover ? '★ Cover' : '#' + (idx + 1)) +
            '</span>' +
            '<button type="button" class="admin-del-img-btn" data-del-gallery-idx="' + idx + '" style="background:rgba(229,115,115,0.18);border:1px solid rgba(229,115,115,0.45);color:#ffcdd2;border-radius:8px;padding:3px 8px;font-size:10px;font-weight:600;cursor:pointer;" title="Delete this image completely">' +
              '✕ Delete' +
            '</button>' +
          '</div>' +
          '<div style="aspect-ratio:1/1;border-radius:10px;overflow:hidden;background:#181316;margin-bottom:8px;border:1px solid var(--border-subtle);">' +
            '<img class="ep-gallery-thumb-img" data-thumb-idx="' + idx + '" src="' + (g.src || EMPTY_IMG_PLACEHOLDER) + '" alt="' + String(g.label || g.tag || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:cover;display:block;">' +
          '</div>' +
          '<input type="text" class="raha-cod-input ep-gallery-src-input" data-src-idx="' + idx + '" value="' + (g.src || '') + '" placeholder="Image URL / Path" style="font-size:10px;font-family:var(--font-mono);padding:5px 8px;margin-bottom:6px;">' +
          '<input type="text" class="raha-cod-input ep-gallery-tag-input" data-tag-idx="' + idx + '" value="' + (g.tag || ('Photo ' + (idx + 1))) + '" placeholder="Angle / Finish Tag" style="font-size:10.5px;padding:5px 8px;margin-bottom:8px;">' +
          '<div>' +
            (!isCover
              ? '<button type="button" class="raha-btn raha-btn--glass admin-make-cover-btn" data-cover-gallery-idx="' + idx + '" style="width:100%;padding:5px;font-size:9.5px;">Set as Cover</button>'
              : '<div style="font-family:var(--font-mono);font-size:9.5px;color:var(--raha-gold);text-align:center;padding:4px 0;">Primary Display</div>') +
          '</div>' +
        '</div>';
    });

    grid.innerHTML = html;

    grid.querySelectorAll('[data-del-gallery-idx]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var rmIdx = Number(btn.getAttribute('data-del-gallery-idx'));
        var removed = editingProductGallery.splice(rmIdx, 1)[0];
        renderDynamicGalleryInModal();
        if (removed && removed.src && window.RahaSupabase && typeof window.RahaSupabase.deleteImageFile === 'function') {
          showToast('Removing image file...');
          await window.RahaSupabase.deleteImageFile(removed.src);
        }
        showToast('Image deleted from product');
      });
    });

    grid.querySelectorAll('[data-cover-gallery-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cIdx = Number(btn.getAttribute('data-cover-gallery-idx'));
        var item = editingProductGallery.splice(cIdx, 1)[0];
        editingProductGallery.unshift(item);
        renderDynamicGalleryInModal();
        showToast('Moved to Cover Photo position');
      });
    });

    grid.querySelectorAll('.ep-gallery-src-input').forEach(function (inEl) {
      inEl.addEventListener('input', function () {
        var sIdx = Number(inEl.getAttribute('data-src-idx'));
        var val = inEl.value.trim();
        if (editingProductGallery[sIdx]) {
          editingProductGallery[sIdx].src = val;
          var thumb = grid.querySelector('.ep-gallery-thumb-img[data-thumb-idx="' + sIdx + '"]');
          if (thumb) thumb.src = val || EMPTY_IMG_PLACEHOLDER;
        }
      });
    });

    grid.querySelectorAll('.ep-gallery-tag-input').forEach(function (inEl) {
      inEl.addEventListener('input', function () {
        var tIdx = Number(inEl.getAttribute('data-tag-idx'));
        if (editingProductGallery[tIdx]) {
          editingProductGallery[tIdx].tag = inEl.value.trim();
        }
      });
    });

    grid.querySelectorAll('.ep-gallery-thumb-img').forEach(function (img) {
      img.onerror = function () {
        this.onerror = null;
        this.src = EMPTY_IMG_PLACEHOLDER;
      };
    });
  }

  function syncImagePreviewThumbnails() {
    var pairs = [
      ['ep-img-main', 'ep-prev-main'],
      ['ep-img-hover', 'ep-prev-hover'],
      ['ep-img-slv', 'ep-prev-slv'],
      ['ep-img-rsg', 'ep-prev-rsg'],
      ['ep-img-macro', 'ep-prev-macro']
    ];
    pairs.forEach(function (pair) {
      var input = document.getElementById(pair[0]);
      var img = document.getElementById(pair[1]);
      if (input && img) {
        var v = input.value.trim();
        img.src = v ? v : EMPTY_IMG_PLACEHOLDER;
      }
    });
  }

  function renderSkuRowsInModal(skus) {
    var wrap = document.getElementById('ep-sku-rows');
    if (!wrap) return;
    if (!skus || skus.length === 0) {
      wrap.innerHTML =
        '<div style="text-align:center;padding:18px 14px;border-radius:12px;border:1px dashed var(--border-subtle);background:rgba(255,255,255,0.02);font-size:12px;color:var(--text-muted);">' +
          'No SKU finish variants added yet. Click <strong>"+ Add SKU Option"</strong> above to add custom finishes, or leave empty to use your Base Price &amp; Stock automatically.' +
        '</div>';
      return;
    }
    var html = '';
    (skus || []).forEach(function (sk, idx) {
      var skPrice = (sk.price !== undefined && sk.price !== '') ? sk.price : '';
      var skCompare = (sk.compare !== undefined && sk.compare !== '') ? sk.compare : '';
      var skStock = (sk.stock !== undefined && sk.stock !== '') ? sk.stock : '';
      html +=
        '<div class="ep-sku-row" style="display:grid;grid-template-columns:80px 1.1fr 1fr 90px 90px 80px auto;gap:8px;align-items:center;margin-bottom:8px;">' +
          '<input type="text" class="raha-cod-input ep-sku-suffix" placeholder="Code (GLD)" value="' + (sk.suffix || '') + '">' +
          '<input type="text" class="raha-cod-input ep-sku-name" placeholder="Finish Name" value="' + (sk.name || '') + '">' +
          '<input type="text" class="raha-cod-input ep-sku-desc" placeholder="Sub-description" value="' + (sk.desc || '') + '">' +
          '<input type="number" class="raha-cod-input ep-sku-price" placeholder="Price PKR" value="' + skPrice + '">' +
          '<input type="number" class="raha-cod-input ep-sku-compare" placeholder="Compare PKR" value="' + skCompare + '">' +
          '<input type="number" class="raha-cod-input ep-sku-stock" min="0" placeholder="Stock" value="' + skStock + '">' +
          '<button type="button" class="raha-btn raha-btn--glass ep-sku-remove" data-rm-idx="' + idx + '" style="padding:8px 12px;color:#e57373;">✕</button>' +
        '</div>';
    });
    wrap.innerHTML = html;

    wrap.querySelectorAll('.ep-sku-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = collectSkusFromModal();
        var rmIdx = Number(btn.getAttribute('data-rm-idx'));
        current.splice(rmIdx, 1);
        renderSkuRowsInModal(current);
      });
    });
  }

  function collectSkusFromModal() {
    var rows = document.querySelectorAll('#ep-sku-rows .ep-sku-row');
    var list = [];
    var orbs = ['raha-metal-orb--gld', 'raha-metal-orb--slv', 'raha-metal-orb--rsg', 'raha-metal-orb--gft'];
    var imgIndices = [0, 1, 2, 4];
    var fallbackPrice = Number(document.getElementById('ep-price') && document.getElementById('ep-price').value) || 0;
    var fallbackCompare = Number(document.getElementById('ep-compare') && document.getElementById('ep-compare').value) || 0;
    var fallbackStock = Number(document.getElementById('ep-stock') && document.getElementById('ep-stock').value) || 10;
    rows.forEach(function (row, idx) {
      var suffix = row.querySelector('.ep-sku-suffix').value.trim() || ('SKU' + (idx + 1));
      var name = row.querySelector('.ep-sku-name').value.trim() || ('Finish ' + (idx + 1));
      var desc = row.querySelector('.ep-sku-desc').value.trim() || 'Signature Raha Finish';
      var price = Number(row.querySelector('.ep-sku-price').value) || fallbackPrice;
      var compare = Number(row.querySelector('.ep-sku-compare').value) || fallbackCompare;
      var stockRaw = row.querySelector('.ep-sku-stock') ? row.querySelector('.ep-sku-stock').value.trim() : '';
      var stockVal = stockRaw !== '' ? Number(stockRaw) : fallbackStock;
      list.push({
        suffix: suffix.toUpperCase(),
        orbClass: orbs[idx % orbs.length],
        name: name,
        desc: desc,
        price: price,
        compare: compare,
        stock: isNaN(stockVal) ? fallbackStock : Math.max(0, stockVal),
        imgIdx: imgIndices[idx % imgIndices.length]
      });
    });
    return list;
  }

  /* ========================================================================
     VERIFIED COLLECTOR REVIEWS STUDIO (UPLOAD CUSTOMER REVIEWS & PHOTOS)
     ======================================================================== */
  function renderReviewsInModal() {
    var countEl = document.getElementById('ep-reviews-count');
    var listEl = document.getElementById('ep-reviews-list');
    if (!listEl) return;

    if (countEl) countEl.textContent = editingProductReviews.length;

    if (editingProductReviews.length === 0) {
      listEl.innerHTML =
        '<div style="text-align:center;padding:32px 16px;border-radius:14px;border:1px dashed var(--border-subtle);background:rgba(255,255,255,0.02);">' +
          '<p style="font-size:13.5px;color:var(--text-muted);margin-bottom:6px;">No customer reviews uploaded yet for this piece.</p>' +
          '<p style="font-size:12px;color:var(--text-secondary);">Click "+ Add Customer Review" above to upload authentic customer feedback, 5-star ratings, and customer wear photos.</p>' +
        '</div>';
      return;
    }

    var html = '';
    editingProductReviews.forEach(function (rev, idx) {
      var rVal = Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5)));
      var starStr = '★★★★★'.slice(0, rVal) + '☆☆☆☆☆'.slice(0, 5 - rVal);
      html +=
        '<div class="admin-review-card" data-rev-idx="' + idx + '" style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:var(--shadow-card);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-subtle);padding-bottom:10px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<span style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--raha-gold);padding:3px 8px;border-radius:100px;background:rgba(214,183,138,0.12);border:1px solid rgba(214,183,138,0.3);">' +
                'Review #' + (idx + 1) +
              '</span>' +
              '<span style="color:var(--raha-gold);letter-spacing:2px;font-size:12px;">' + starStr + '</span>' +
            '</div>' +
            '<button type="button" class="admin-del-rev-btn" data-del-rev-idx="' + idx + '" style="background:rgba(229,115,115,0.18);border:1px solid rgba(229,115,115,0.45);color:#ffcdd2;border-radius:8px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer;">' +
              '✕ Delete Review' +
            '</button>' +
          '</div>' +

          '<div class="raha-cod-field-row" style="grid-template-columns: 1.5fr 1.5fr 1fr 1fr;">' +
            '<div class="raha-cod-field">' +
              '<label class="raha-cod-label">Customer Name *</label>' +
              '<input type="text" class="raha-cod-input ep-rev-author" value="' + (rev.author || '').replace(/"/g, '&quot;') + '" placeholder="e.g. Ayesha K." required>' +
            '</div>' +
            '<div class="raha-cod-field">' +
              '<label class="raha-cod-label">City / Verification Badge</label>' +
              '<input type="text" class="raha-cod-input ep-rev-city" value="' + (rev.city || 'Lahore • Verified Buyer').replace(/"/g, '&quot;') + '" placeholder="e.g. Karachi • Verified Buyer">' +
            '</div>' +
            '<div class="raha-cod-field">' +
              '<label class="raha-cod-label">Star Rating</label>' +
              '<select class="raha-cod-select ep-rev-rating">' +
                '<option value="5"' + (rVal === 5 ? ' selected' : '') + '>★★★★★ (5 Stars)</option>' +
                '<option value="4"' + (rVal === 4 ? ' selected' : '') + '>★★★★☆ (4 Stars)</option>' +
                '<option value="3"' + (rVal === 3 ? ' selected' : '') + '>★★★☆☆ (3 Stars)</option>' +
                '<option value="2"' + (rVal === 2 ? ' selected' : '') + '>★★☆☆☆ (2 Stars)</option>' +
                '<option value="1"' + (rVal === 1 ? ' selected' : '') + '>★☆☆☆☆ (1 Star)</option>' +
              '</select>' +
            '</div>' +
            '<div class="raha-cod-field">' +
              '<label class="raha-cod-label">Date / Relative Time</label>' +
              '<input type="text" class="raha-cod-input ep-rev-date" value="' + (rev.date || '2 days ago').replace(/"/g, '&quot;') + '" placeholder="e.g. 2 days ago">' +
            '</div>' +
          '</div>' +

          '<div class="raha-cod-field-row" style="grid-template-columns: 2fr 1fr;">' +
            '<div class="raha-cod-field">' +
              '<label class="raha-cod-label">Review Headline / Title</label>' +
              '<input type="text" class="raha-cod-input ep-rev-title" value="' + (rev.title || '').replace(/"/g, '&quot;') + '" placeholder="e.g. Zero tarnish even after daily wear!">' +
            '</div>' +
            '<div class="raha-cod-field">' +
              '<label class="raha-cod-label">Purchased SKU / Finish</label>' +
              '<input type="text" class="raha-cod-input ep-rev-sku" value="' + (rev.sku || 'Gold Plated').replace(/"/g, '&quot;') + '" placeholder="e.g. Gold Plated">' +
            '</div>' +
          '</div>' +

          '<div class="raha-cod-field">' +
            '<label class="raha-cod-label">Customer Feedback &amp; Review Body *</label>' +
            '<textarea class="raha-cod-textarea ep-rev-body" style="min-height:64px;" placeholder="What the buyer said about finish, weight, packaging, or longevity...">' + (rev.body || '') + '</textarea>' +
          '</div>' +

          '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px;border-radius:12px;background:rgba(0,0,0,0.25);border:1px dashed var(--border-subtle);">' +
            '<div style="width:52px;height:52px;border-radius:8px;background:#181316;overflow:hidden;border:1px solid var(--border-subtle);flex-shrink:0;">' +
              '<img class="ep-rev-thumb" src="' + (rev.img || EMPTY_IMG_PLACEHOLDER) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:' + (rev.img ? 'block' : 'none') + ';">' +
            '</div>' +
            '<div style="flex:1;min-width:200px;">' +
              '<label class="raha-cod-label" style="margin-bottom:4px;display:block;">Customer Photo / Wear Attachment (Optional)</label>' +
              '<input type="text" class="raha-cod-input ep-rev-img-input" value="' + (rev.img || '').replace(/"/g, '&quot;') + '" placeholder="Image URL / upload via button on right..." style="font-size:11px;font-family:var(--font-mono);padding:6px 10px;">' +
            '</div>' +
            '<div style="display:flex;gap:8px;">' +
              '<label class="raha-btn raha-btn--glass" style="cursor:pointer;padding:8px 14px;font-size:10.5px;display:inline-flex;align-items:center;gap:6px;">' +
                '<span>📷 Upload Photo</span>' +
                '<input type="file" class="ep-rev-file-input" accept="image/*" style="display:none;" data-rev-file-idx="' + idx + '">' +
              '</label>' +
              (rev.img ? '<button type="button" class="raha-btn raha-btn--glass ep-rev-rm-img-btn" data-rm-img-idx="' + idx + '" style="padding:8px 10px;font-size:10.5px;color:#e57373;">✕ Remove</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.ep-rev-thumb').forEach(function (img) {
      img.onerror = function () {
        this.onerror = null;
        this.src = EMPTY_IMG_PLACEHOLDER;
      };
    });

    // Delete review listener
    listEl.querySelectorAll('.admin-del-rev-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = collectReviewsFromModal();
        var rmIdx = Number(btn.getAttribute('data-del-rev-idx'));
        current.splice(rmIdx, 1);
        editingProductReviews = current;
        renderReviewsInModal();
        showToast('Review removed');
      });
    });

    // Remove photo listener
    listEl.querySelectorAll('.ep-rev-rm-img-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = collectReviewsFromModal();
        var rmIdx = Number(btn.getAttribute('data-rm-img-idx'));
        if (current[rmIdx]) current[rmIdx].img = '';
        editingProductReviews = current;
        renderReviewsInModal();
        showToast('Photo removed from review');
      });
    });

    // Upload photo file listener
    listEl.querySelectorAll('.ep-rev-file-input').forEach(function (fileInput) {
      fileInput.addEventListener('change', async function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var rIdx = Number(fileInput.getAttribute('data-rev-file-idx'));
        var current = collectReviewsFromModal();
        try {
          showToast('⚡ Compressing & uploading review photo...');
          var dataUrl = await readFileAsDataUrl(file);
          var uploadedPath = dataUrl;
          if (window.RahaSupabase && typeof window.RahaSupabase.uploadImage === 'function') {
            uploadedPath = await window.RahaSupabase.uploadImage(file, dataUrl);
          }
          if (current[rIdx]) {
            current[rIdx].img = uploadedPath;
          }
          editingProductReviews = current;
          renderReviewsInModal();
          var revSt = window.RahaSupabase && window.RahaSupabase.lastUploadStats;
          var revStTxt = revSt ? (' (' + revSt.beforeKB + ' KB → ' + revSt.afterKB + ' KB ' + revSt.format + ')') : '';
          showToast('✓ Review photo compressed' + revStTxt + ' & attached! Ready to save.');
        } catch (err) {
          showToast('Failed to upload photo: ' + (err.message || err), true);
        }
      });
    });

    // Live update image URL input listener
    listEl.querySelectorAll('.ep-rev-img-input').forEach(function (input) {
      input.addEventListener('change', function () {
        var card = input.closest('.admin-review-card');
        var thumb = card ? card.querySelector('.ep-rev-thumb') : null;
        if (thumb) {
          thumb.src = input.value.trim() || EMPTY_IMG_PLACEHOLDER;
          thumb.style.display = input.value.trim() ? 'block' : 'none';
        }
      });
    });
  }

  function collectReviewsFromModal() {
    var cards = document.querySelectorAll('#ep-reviews-list .admin-review-card');
    var list = [];
    cards.forEach(function (card, idx) {
      var author = (card.querySelector('.ep-rev-author') ? card.querySelector('.ep-rev-author').value : '').trim();
      var city = (card.querySelector('.ep-rev-city') ? card.querySelector('.ep-rev-city').value : '').trim() || 'Verified Buyer';
      var rating = Number(card.querySelector('.ep-rev-rating') ? card.querySelector('.ep-rev-rating').value : 5) || 5;
      var date = (card.querySelector('.ep-rev-date') ? card.querySelector('.ep-rev-date').value : '').trim() || 'Recently';
      var title = (card.querySelector('.ep-rev-title') ? card.querySelector('.ep-rev-title').value : '').trim();
      var sku = (card.querySelector('.ep-rev-sku') ? card.querySelector('.ep-rev-sku').value : '').trim() || 'Gold Plated';
      var body = (card.querySelector('.ep-rev-body') ? card.querySelector('.ep-rev-body').value : '').trim();
      var img = (card.querySelector('.ep-rev-img-input') ? card.querySelector('.ep-rev-img-input').value : '').trim();

      if (author || body || title) {
        list.push({
          id: 'rev-' + (idx + 1) + '-' + Date.now().toString().slice(-4),
          author: author || 'Verified Collector',
          city: city,
          rating: rating,
          date: date,
          title: title,
          sku: sku,
          body: body,
          img: img
        });
      }
    });
    return list;
  }


  /* Bind File Upload Inputs inside Product Editor Modal */
  function bindImageUploaders() {
    document.querySelectorAll('[data-upload-target]').forEach(function (fileIn) {
      fileIn.addEventListener('change', function () {
        var file = fileIn.files && fileIn.files[0];
        if (!file) return;
        var targetInputId = fileIn.getAttribute('data-upload-target');
        var targetInput = document.getElementById(targetInputId);
        var reader = new FileReader();
        reader.onload = async function (ev) {
          var dataUrl = ev.target.result;
          showToast('Uploading image to storage...');
          var finalPath = await window.RahaSupabase.uploadImage(file, dataUrl);
          if (targetInput) {
            targetInput.value = finalPath;
            syncImagePreviewThumbnails();
          }
          var prevEl = document.getElementById(targetInputId + '-prev');
          if (prevEl) {
            prevEl.src = finalPath;
          }
          showToast('Image uploaded & linked!');
        };
        reader.readAsDataURL(file);
      });
    });

    var multiIn = document.getElementById('ep-multi-upload-input');
    if (multiIn && !multiIn._bound) {
      multiIn._bound = true;
      multiIn.addEventListener('change', async function () {
        var files = Array.prototype.slice.call(multiIn.files || []);
        if (files.length === 0) return;
        var saveBtn = document.querySelector('#admin-product-form button[type="submit"]');
        var origSaveHtml = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span>⚡ Compressing &amp; Uploading Photo(s)...</span>';
        }
        var totalBeforeKB = 0;
        var totalAfterKB = 0;
        try {
          for (var f = 0; f < files.length; f++) {
            var file = files[f];
            showToast('⚡ Compressing & uploading photo ' + (f + 1) + ' of ' + files.length + '...');
            var dataUrl = await readFileAsDataUrl(file);
            var uploadedUrl = await window.RahaSupabase.uploadImage(file, dataUrl);
            var st = window.RahaSupabase && window.RahaSupabase.lastUploadStats;
            if (st) {
              totalBeforeKB += (st.beforeKB || 0);
              totalAfterKB += (st.afterKB || 0);
            }
            var count = editingProductGallery.length + 1;
            editingProductGallery.push({
              src: uploadedUrl,
              tag: '0' + count + ' ' + (count === 1 ? 'Gold Plated' : count === 2 ? 'Silver' : 'Angle ' + count),
              label: file.name
            });
          }
          renderDynamicGalleryInModal();
          var sizeSummary = (totalBeforeKB > 0 && totalAfterKB > 0)
            ? ' (Compressed ' + totalBeforeKB + ' KB → ' + totalAfterKB + ' KB)'
            : '';
          showToast('✓ Added & compressed ' + files.length + ' photo(s)' + sizeSummary + '! Ready to save.');
        } catch (upErr) {
          showToast('Upload failed: ' + (upErr.message || upErr), true);
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = origSaveHtml;
          }
          multiIn.value = '';
        }
      });
    }

    var addUrlBtn = document.getElementById('ep-add-url-img-btn');
    if (addUrlBtn && !addUrlBtn._bound) {
      addUrlBtn._bound = true;
      addUrlBtn.addEventListener('click', function () {
        var url = prompt('Enter or paste image URL / asset path:');
        if (url && url.trim()) {
          var count = editingProductGallery.length + 1;
          editingProductGallery.push({
            src: url.trim(),
            tag: '0' + count + ' Studio View',
            label: 'Studio View'
          });
          renderDynamicGalleryInModal();
          showToast('Photo added to gallery!');
        }
      });
    }

    /* Remove / Delete Image Entirely from Slot & Storage */
    document.querySelectorAll('[data-remove-img]').forEach(function (btn) {
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        var targetInputId = btn.getAttribute('data-remove-img');
        var targetInput = document.getElementById(targetInputId);
        if (!targetInput) return;
        var oldUrl = targetInput.value.trim();
        targetInput.value = '';

        var defaultFallbacks = {
          'set-hero-img': 'Assets/Main Raha logo with slogan (The actual logo).webp',
          'set-cat-earrings': 'Assets/Main Raha logo with slogan (The actual logo).webp',
          'set-cat-necklace': 'Assets/Main Raha logo with slogan (The actual logo).webp',
          'set-cat-rings': 'Assets/Main Raha logo with slogan (The actual logo).webp',
          'set-cat-bracelets': 'Assets/Main Raha logo with slogan (The actual logo).webp',
          'set-cat-anklets': 'Assets/Main Raha logo with slogan (The actual logo).webp'
        };
        if (defaultFallbacks[targetInputId]) {
          targetInput.value = defaultFallbacks[targetInputId];
          var prevImgEl = document.getElementById(targetInputId + '-prev');
          if (prevImgEl) prevImgEl.src = defaultFallbacks[targetInputId];
        }

        if (oldUrl && window.RahaSupabase && typeof window.RahaSupabase.deleteImageFile === 'function') {
          showToast('Deleting image from storage...');
          await window.RahaSupabase.deleteImageFile(oldUrl);
        }
        showToast('Image removed');
      });
    });
  }

  /* ========================================================================
     4. TAB 03 & TAB 04: WEBSITE SETTINGS & POLICY PAGES CMS
     ======================================================================== */
  function renderCityRatesList() {
    var container = document.getElementById('admin-city-rates-list');
    if (!container) return;
    if (!settings.cityShippingRates || typeof settings.cityShippingRates !== 'object') {
      settings.cityShippingRates = {
        'Karachi': 200,
        'Lahore': 250,
        'Islamabad': 280,
        'Rawalpindi': 280,
        'Faisalabad': 280,
        'Multan': 280,
        'Peshawar': 300,
        'Quetta': 320,
        'Hyderabad': 250,
        'Sialkot': 280,
        'Gujranwala': 280,
        'Sukkur': 280
      };
    }
    var rates = settings.cityShippingRates;
    var cities = Object.keys(rates).sort();
    if (cities.length === 0) {
      container.innerHTML = '<div style="grid-column:1/-1;color:var(--text-muted);font-size:12px;padding:12px;">No custom city rates added yet. All cities will use the Default Nationwide Delivery Charge.</div>';
      return;
    }
    var html = '';
    cities.forEach(function (cityName) {
      var fee = rates[cityName];
      html +=
        '<div class="admin-city-rate-card" data-city="' + escapeHtml(cityName) + '" style="background:rgba(18,14,16,0.7);padding:10px 14px;border-radius:12px;border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
          '<div>' +
            '<div style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--raha-gold);">' + escapeHtml(cityName) + '</div>' +
            '<div style="font-size:10px;color:var(--text-muted);">PKR Delivery Fee</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);">Rs</span>' +
            '<input type="number" class="raha-cod-input raha-city-rate-input" data-city-input="' + escapeHtml(cityName) + '" value="' + Number(fee) + '" style="width:75px;padding:4px 8px;font-size:11.5px;text-align:right;">' +
            '<button type="button" class="raha-city-rate-del" data-city-del="' + escapeHtml(cityName) + '" title="Remove custom rate" style="background:none;border:none;color:#e57373;cursor:pointer;padding:2px 6px;font-size:16px;line-height:1;">&times;</button>' +
          '</div>' +
        '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('.raha-city-rate-input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var c = inp.getAttribute('data-city-input');
        var val = Number(inp.value) || 0;
        if (settings.cityShippingRates) {
          settings.cityShippingRates[c] = val;
        }
      });
    });

    container.querySelectorAll('.raha-city-rate-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var c = btn.getAttribute('data-city-del');
        if (settings.cityShippingRates && settings.cityShippingRates[c] !== undefined) {
          delete settings.cityShippingRates[c];
          renderCityRatesList();
          showToast('Removed custom rate for ' + c + ' (now uses default nationwide fee)');
        }
      });
    });
  }

  function populateSettingsForm() {
    document.getElementById('set-marquee').value = settings.announcementText || 'WhatsApp Support: 0326 0870876 | Instagram: @rahajewels.pk | Official Email: contact.rahaofficial@gmail.com | Complimentary Express Delivery on Orders Above Rs 3,500';
    document.getElementById('set-free-ship').value = settings.freeShippingThreshold || 3500;
    document.getElementById('set-std-ship').value = settings.standardShippingFee || 300;
    renderCityRatesList();

    var addCityBtn = document.getElementById('admin-add-city-rate-btn');
    if (addCityBtn && !addCityBtn._bound) {
      addCityBtn._bound = true;
      addCityBtn.addEventListener('click', function () {
        var nameIn = document.getElementById('admin-new-city-name');
        var feeIn = document.getElementById('admin-new-city-fee');
        var cName = nameIn ? nameIn.value.trim() : '';
        var fee = feeIn ? Number(feeIn.value) : 0;
        if (!cName) {
          alert('Please enter a City Name (e.g. Gujrat, Sahiwal, etc.)');
          return;
        }
        if (!settings.cityShippingRates) settings.cityShippingRates = {};
        settings.cityShippingRates[cName] = fee;
        if (nameIn) nameIn.value = '';
        if (feeIn) feeIn.value = '';
        renderCityRatesList();
        showToast('Added delivery charge for ' + cName + ': Rs ' + fee);
      });
    }
    if (settings.whatsappNumber && String(settings.whatsappNumber).indexOf('3352396680') !== -1) settings.whatsappNumber = '923260870876';
    if (settings.announcementText && String(settings.announcementText).indexOf('335') !== -1) settings.announcementText = String(settings.announcementText).replace(/\+?92\s*335\s*2396680|0335\s*2396680/g, '0326 0870876');
    document.getElementById('set-wa-num').value = settings.whatsappNumber || '923260870876';
    document.getElementById('set-hero-title').value = settings.heroTitleHtml || 'Sculpted Light for the <em>Modern Minimalist.</em>';
    document.getElementById('set-hero-sub').value = settings.heroSubtitle || 'Step into Pakistan’s futuristic fine-demi jewellery brand. Waterproof Gold Plated & 925 Sterling Silver silhouettes engineered for effortless daily permanence.';
    document.getElementById('set-hero-heading').value = settings.heroMonolithHeading || 'The Mauve Vault Series';
    document.getElementById('set-hero-img').value = settings.heroEditorialImg || 'Assets/Main Raha logo with slogan (The actual logo).webp';
    var heroPrev = document.getElementById('set-hero-img-prev');
    if (heroPrev) heroPrev.src = document.getElementById('set-hero-img').value;

    var catFields = [
      { id: 'set-cat-earrings', key: 'catImgEarrings', def: 'Assets/Main Raha logo with slogan (The actual logo).webp' },
      { id: 'set-cat-necklace', key: 'catImgNecklace', def: 'Assets/Main Raha logo with slogan (The actual logo).webp' },
      { id: 'set-cat-rings', key: 'catImgRings', def: 'Assets/Main Raha logo with slogan (The actual logo).webp' },
      { id: 'set-cat-bracelets', key: 'catImgBracelets', def: 'Assets/Main Raha logo with slogan (The actual logo).webp' },
      { id: 'set-cat-anklets', key: 'catImgAnklets', def: 'Assets/Main Raha logo with slogan (The actual logo).webp' }
    ];
    catFields.forEach(function (cf) {
      var inp = document.getElementById(cf.id);
      var prv = document.getElementById(cf.id + '-prev');
      var val = settings[cf.key] || cf.def;
      if (inp) {
        inp.value = val;
        if (!inp._prevBound) {
          inp._prevBound = true;
          inp.addEventListener('input', function () {
            if (prv) prv.src = inp.value.trim() || cf.def;
          });
        }
      }
      if (prv) prv.src = val;
    });

    var flagshipLinkInput = document.getElementById('set-flagship-link');
    if (flagshipLinkInput) {
      flagshipLinkInput.value = settings.heroFlagshipLink || 'product.html?id=ear-01';
    }
    var flagshipTextInput = document.getElementById('set-flagship-text');
    if (flagshipTextInput) {
      flagshipTextInput.value = settings.heroFlagshipLinkText || 'Inspect Flagship Piece →';
    }

    var prodOptGroup = document.getElementById('set-flagship-product-options');
    if (prodOptGroup && Array.isArray(catalog)) {
      prodOptGroup.innerHTML = catalog.map(function (p) {
        return '<option value="product.html?id=' + encodeURIComponent(p.id) + '">' + (p.title || p.id) + ' (' + (p.skuBase || p.category || 'Piece') + ')</option>';
      }).join('');
    }

    var flagshipPicker = document.getElementById('set-flagship-picker');
    if (flagshipPicker && !flagshipPicker._bound) {
      flagshipPicker._bound = true;
      flagshipPicker.addEventListener('change', function () {
        if (flagshipPicker.value) {
          if (flagshipLinkInput) flagshipLinkInput.value = flagshipPicker.value;
          var selectedTxt = flagshipPicker.options[flagshipPicker.selectedIndex].text;
          if (flagshipPicker.value.indexOf('product.html') !== -1 && flagshipTextInput) {
            flagshipTextInput.value = 'Inspect ' + selectedTxt.split(' (')[0] + ' →';
          }
        }
      });
    }
  }

  var DEFAULT_PAGES_CONTENT = {
    'about-us': {
      title: 'About Us',
      subtitle: 'Established in 2026, by a woman, for women who know their worth.',
      bodyHtml: '<div class="raha-policy-block"><p class="raha-policy-p" style="font-size:17px;color:var(--text-primary);font-weight:500;">Established in 2026, by a woman, for women who know their worth.</p><p class="raha-policy-p">RAHA was born from a love for timeless beauty, individuality, and the belief that every woman deserves to feel confident and empowered.</p><p class="raha-policy-p">Inspired by modern minimalism, our jewellery brings together effortless elegance, quality, and affordability. We believe feeling beautiful and expressing your individuality shouldn\'t come with a hefty price tag.</p></div><div class="raha-policy-callout" style="text-align:center;"><p style="font-family:var(--font-serif);font-size:30px;font-style:italic;color:var(--raha-gold);margin-bottom:8px;">“We don\'t define beauty. We celebrate yours.”</p><p style="font-family:var(--font-mono);font-size:11.5px;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-primary);">RAHA — Jewellery for the Modern Minimalists.</p></div>'
    },
    'faqs': {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about shopping, materials, nationwide delivery, and jewellery care at RAHA.',
      bodyHtml: '<div class="raha-policy-block"><h3 class="raha-policy-h3">1. Do you have a physical store?</h3><p class="raha-policy-p">Not just yet! We\'re currently an online-only brand. Shop your favourite pieces right here, from the comfort of your home.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">2. What materials are used in your jewellery?</h3><p class="raha-policy-p">We carefully select our jewellery for its style, quality and affordability. Material details are mentioned in individual product descriptions. Most of our pieces are stainless steel and hypoallergenic because we care for you.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">3. Is your jewellery waterproof?</h3><p class="raha-policy-p">Not all pieces are waterproof. We recommend keeping them away from water, perfumes and chemicals.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">4. Do you deliver nationwide?</h3><p class="raha-policy-p">Absolutely! We deliver across Pakistan.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">5. How long does delivery take?</h3><p class="raha-policy-p">Orders usually arrive within 3–7 working days, depending on your location.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">6. What payment methods do you accept?</h3><p class="raha-policy-p">We offer Cash on Delivery and other payment options available at checkout.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">7. Can I return or exchange my order?</h3><p class="raha-policy-p">If you receive a damaged or incorrect item, please contact us. Returns and exchanges are subject to our store policy.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">8. How do I care for my jewellery?</h3><p class="raha-policy-p">Keep your pieces dry, avoid perfumes and chemicals, and store them separately to maintain their shine.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">9. Can I cancel or modify my order?</h3><p class="raha-policy-p">Please contact us as soon as possible. Changes can be made before your order is dispatched.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">10. How can I contact RAHA?</h3><p class="raha-policy-p">We\'re just a message away! Reach us through <a href="https://www.instagram.com/rahajewels.pk?fqnt=eDl6ZzE3NjEwMXFl" target="_blank" rel="noopener" style="color:var(--raha-gold);">Instagram (@rahajewels.pk)</a>, <a href="https://wa.me/923260870876" target="_blank" rel="noopener" style="color:var(--raha-gold);">WhatsApp (0326 0870876)</a> or our gmail (<a href="mailto:contact.rahaofficial@gmail.com" style="color:var(--raha-gold);">contact.rahaofficial@gmail.com</a>). ♡</p></div>'
    },
    'shipping-policy': {
      title: 'Shipping Policy',
      subtitle: "At RAHA, we want your favorite pieces to reach you safely and on time. Here's everything you need to know about our shipping process.",
      bodyHtml: '<div class="raha-policy-block"><h3 class="raha-policy-h3">1. Delivery Coverage</h3><p class="raha-policy-p">We currently offer nationwide delivery across Pakistan.</p></div><div class="raha-policy-block"><h3 class="raha-policy-h3">2. Delivery Time</h3><p class="raha-policy-p">Orders are usually delivered within 3–5 working days, depending on your location and courier availability.</p></div>'
    },
    'refund-policy': {
      title: 'Refund Policy',
      subtitle: 'Our commitment to quality inspection, exchanges, and customer care at RAHA.',
      bodyHtml: '<div class="raha-policy-block"><h3 class="raha-policy-h3">Damages and Issues</h3><p class="raha-policy-p">Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right. The claim must be made within 3 days counting from when it was delivered.</p></div>'
    },
    'terms-and-conditions': {
      title: 'Terms & Conditions',
      subtitle: 'Welcome to RAHA! By browsing our website or placing an order, you agree to the following terms and conditions.',
      bodyHtml: '<div class="raha-policy-block"><h3 class="raha-policy-h3">1. General Information</h3><p class="raha-policy-p">RAHA reserves the right to update product details, prices, promotions and these terms at any time without prior notice.</p></div>'
    }
  };

  function populatePagesEditor() {
    var sel = document.getElementById('admin-page-select');
    if (!sel) return;
    var slug = sel.value || 'about-us';
    var data = (pages && pages[slug]) || DEFAULT_PAGES_CONTENT[slug] || { title: slug, subtitle: '', bodyHtml: '' };
    document.getElementById('admin-page-subtitle').value = data.subtitle || '';
    document.getElementById('admin-page-body').value = data.bodyHtml || '';
  }

  /* ========================================================================
     5. EVENT LISTENERS & FORM SUBMISSIONS
     ======================================================================== */
  function bindEvents() {
    /* Admin Navigation Tabs */
    document.querySelectorAll('[data-admin-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-admin-tab');
        document.querySelectorAll('[data-admin-tab]').forEach(function (b) { b.classList.remove('is-active'); });
        document.querySelectorAll('.admin-tab-panel').forEach(function (p) { p.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var panel = document.getElementById('tab-' + target);
        if (panel) panel.classList.add('is-active');
      });
    });

    /* Order Classification Type Filter (All vs COD vs Online) */
    document.querySelectorAll('[data-order-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-order-type]').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeOrderType = btn.getAttribute('data-order-type');
        renderOrdersTab();
      });
    });

    /* Order Status Filter Pills & Search */
    document.querySelectorAll('[data-order-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-order-filter]').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeOrderFilter = btn.getAttribute('data-order-filter');
        renderOrdersTab();
      });
    });
    var ordSearch = document.getElementById('admin-order-search');
    if (ordSearch) ordSearch.addEventListener('input', renderOrdersTab);

    var addSampleOrderBtn = document.getElementById('admin-top-sample-order-btn');
    if (addSampleOrderBtn) addSampleOrderBtn.addEventListener('click', createSampleTestOrder);

    var addSampleOnlineBtn = document.getElementById('admin-sample-online-order-btn');
    if (addSampleOnlineBtn) addSampleOnlineBtn.addEventListener('click', createSampleOnlineOrder);

    /* Product Category Filter Pills & Search */
    document.querySelectorAll('[data-prod-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-prod-filter]').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeCategoryFilter = btn.getAttribute('data-prod-filter');
        renderProductsTab();
      });
    });
    var prodSearch = document.getElementById('admin-product-search');
    if (prodSearch) prodSearch.addEventListener('input', renderProductsTab);

    /* Restock Search and Restock All button */
    var restockSearch = document.getElementById('admin-restock-search');
    if (restockSearch) restockSearch.addEventListener('input', renderRestockTab);

    var restockAllBtn = document.getElementById('admin-restock-all-btn');
    if (restockAllBtn) restockAllBtn.addEventListener('click', performBulkRestock);

    /* Add New Product Button */
    var addProdBtn = document.getElementById('admin-add-product-btn');
    if (addProdBtn) {
      addProdBtn.addEventListener('click', function () {
        openProductEditorModal(null);
      });
    }

    /* Add SKU Row inside Product Editor Modal */
    var addRevBtn = document.getElementById('ep-add-review-btn');
    if (addRevBtn && !addRevBtn._bound) {
      addRevBtn._bound = true;
      addRevBtn.addEventListener('click', function () {
        var current = collectReviewsFromModal();
        current.unshift({
          id: 'rev-' + Date.now(),
          author: '',
          city: '',
          rating: 5,
          date: '',
          title: '',
          body: '',
          sku: '',
          img: ''
        });
        editingProductReviews = current;
        renderReviewsInModal();
        showToast('Added new review slot. Fill in author & review details!');
      });
    }

    var addSkuBtn = document.getElementById('ep-add-sku-btn');
    if (addSkuBtn) {
      addSkuBtn.addEventListener('click', function () {
        var cur = collectSkusFromModal();
        cur.push({
          suffix: '',
          name: '',
          desc: '',
          price: document.getElementById('ep-price').value.trim() || '',
          compare: document.getElementById('ep-compare').value.trim() || '',
          stock: document.getElementById('ep-stock') ? (document.getElementById('ep-stock').value.trim() || '') : ''
        });
        renderSkuRowsInModal(cur);
      });
    }

    /* Live-sync Base Price & Compare-At Price to SKU rows so card price and PDP price always match */
    var epPriceInput = document.getElementById('ep-price');
    var epCompareInput = document.getElementById('ep-compare');
    if (epPriceInput && !epPriceInput._syncBound) {
      epPriceInput._syncBound = true;
      epPriceInput.addEventListener('input', function () {
        var val = epPriceInput.value.trim();
        if (!val) return;
        document.querySelectorAll('#ep-sku-rows .ep-sku-price').forEach(function (inp) {
          inp.value = val;
        });
      });
    }
    if (epCompareInput && !epCompareInput._syncBound) {
      epCompareInput._syncBound = true;
      epCompareInput.addEventListener('input', function () {
        var val = epCompareInput.value.trim();
        if (!val) return;
        document.querySelectorAll('#ep-sku-rows .ep-sku-compare').forEach(function (inp) {
          inp.value = val;
        });
      });
    }

    /* Close Product Editor Modal */
    document.querySelectorAll('[data-close-prod-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.getElementById('admin-product-modal').classList.remove('is-open');
      });
    });

    /* Save Product Form Submission */
    var prodForm = document.getElementById('admin-product-form');
    if (prodForm) {
      prodForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var id = document.getElementById('ep-id').value.trim() || ('item-' + Date.now());
        var catSlug = document.getElementById('ep-category').value;
        var catMap = {
          earrings: 'Earrings',
          rings: 'Rings',
          anklets: 'Anklets',
          necklace: 'Necklace',
          bracelets: 'Bracelets'
        };
        var mainImg = (editingProductGallery.length > 0 && editingProductGallery[0].src)
          ? editingProductGallery[0].src
          : 'Assets/Main Raha logo with slogan (The actual logo).webp';
        var hoverImg = (editingProductGallery.length > 1 && editingProductGallery[1].src)
          ? editingProductGallery[1].src
          : mainImg;

        var sizesRaw = document.getElementById('ep-sizes').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var prodStockVal = document.getElementById('ep-stock') ? Number(document.getElementById('ep-stock').value) : 15;
        var existingProd = null;
        for (var k = 0; k < catalog.length; k++) {
          if (catalog[k].id === id) {
            existingProd = catalog[k];
            break;
          }
        }
        var collectedRevs = collectReviewsFromModal();

        var basePriceNum = Number(document.getElementById('ep-price').value) || 0;
        var baseCompareNum = Number(document.getElementById('ep-compare').value) || 0;
        var cleanStock = isNaN(prodStockVal) ? 15 : Math.max(0, prodStockVal);
        var collectedSkus = collectSkusFromModal().map(function (sk, sIdx) {
          var isLegacyDefault = (sk.price === 2450 || sk.price === 2550 || sk.price === 2900) && basePriceNum !== sk.price;
          if (sIdx === 0 || isLegacyDefault || !sk.price) {
            sk.price = basePriceNum;
            sk.compare = baseCompareNum;
          }
          return sk;
        });
        if (collectedSkus.length === 0) {
          collectedSkus = [{
            suffix: 'STD',
            orbClass: 'raha-metal-orb--gld',
            name: document.getElementById('ep-title').value.trim() || 'Signature Edition',
            desc: document.getElementById('ep-subdept').value.trim() || 'Signature Raha Finish',
            price: basePriceNum,
            compare: baseCompareNum,
            stock: cleanStock,
            imgIdx: 0
          }];
        }

        var updatedProd = {
          id: id,
          skuBase: document.getElementById('ep-sku').value.trim() || ('RAHA-' + id.toUpperCase()),
          title: document.getElementById('ep-title').value.trim() || 'Untitled Raha Piece',
          subtitle: document.getElementById('ep-subtitle').value.trim(),
          price: basePriceNum,
          compare: baseCompareNum,
          stock: isNaN(prodStockVal) ? 15 : Math.max(0, prodStockVal),
          rating: (function() {
            if (collectedRevs.length === 0) return (existingProd && existingProd.rating) ? existingProd.rating : '5.0';
            var s = 0; collectedRevs.forEach(function(r) { s += (Number(r.rating) || 5); });
            return (s / collectedRevs.length).toFixed(1);
          })(),
          reviews: (function() {
            return collectedRevs.length > 0 ? collectedRevs.length : ((existingProd && existingProd.reviews) ? existingProd.reviews : 24);
          })(),
          badge: document.getElementById('ep-badge').value.trim() || 'Raha Edition',
          material: document.getElementById('ep-material').value.trim() || 'gold',
          category: catMap[catSlug] || 'Earrings',
          categorySlug: catSlug,
          subdept: document.getElementById('ep-subdept').value.trim() || 'Signature Edition',
          img: mainImg,
          hoverImg: hoverImg,
          gallery: editingProductGallery,
          customSkus: collectedSkus,
          customReviews: collectedRevs,
          customSizes: sizesRaw,
          dimensions: document.getElementById('ep-dimensions').value.trim() || 'Standard Raha Fit',
          weight: document.getElementById('ep-weight').value.trim() || '4.0g',
          featuredOnHome: document.getElementById('ep-featured').checked
        };

        var foundIdx = -1;
        for (var i = 0; i < catalog.length; i++) {
          if (catalog[i].id === id) {
            foundIdx = i;
            break;
          }
        }
        if (foundIdx !== -1) {
          catalog[foundIdx] = updatedProd;
        } else {
          catalog.unshift(updatedProd);
        }

        try {
          if (window.RahaSupabase && window.RahaSupabase.cache && typeof window.RahaSupabase.cache.clear === 'function') {
            window.RahaSupabase.cache.clear();
          }
          sessionStorage.removeItem('raha_cache_storefront_state_v3');
        } catch (cErr) {}

        try {
          await window.RahaSupabase.upsertProduct(updatedProd, catalog, settings, pages);
        } catch (err) {
          console.warn('Supabase upsert warning:', err);
        }

        try {
          var hdrs = (window.RahaSupabase && typeof window.RahaSupabase.getAuthHeaders === 'function')
            ? window.RahaSupabase.getAuthHeaders()
            : { 'Content-Type': 'application/json', 'X-Raha-Admin': '1' };
          await fetch('/api/store-data', {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({ catalog: catalog, settings: settings, pages: pages })
          });
        } catch (e) {}

        try {
          localStorage.setItem(CMS_STORE_KEY, JSON.stringify({
            catalog: catalog,
            settings: settings,
            pages: pages,
            savedAt: new Date().toISOString()
          }));
        } catch (e) {}

        document.getElementById('admin-product-modal').classList.remove('is-open');
        renderKpis();
        renderProductsTab();
        renderRestockTab();
        showToast('Saved "' + updatedProd.title + '" with ' + updatedProd.stock + ' stock units!');
      });
    }

    /* Save Website Settings Form */
    var setForm = document.getElementById('admin-settings-form');
    if (setForm) {
      setForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var updatedRates = Object.assign({}, settings.cityShippingRates || {});
        document.querySelectorAll('.raha-city-rate-input').forEach(function (inp) {
          var c = inp.getAttribute('data-city-input');
          var v = Number(inp.value);
          if (c && !isNaN(v)) updatedRates[c] = v;
        });
        settings = {
          announcementText: document.getElementById('set-marquee').value.trim(),
          freeShippingThreshold: Number(document.getElementById('set-free-ship').value) || 3500,
          standardShippingFee: Number(document.getElementById('set-std-ship').value) || 300,
          cityShippingRates: updatedRates,
          whatsappNumber: document.getElementById('set-wa-num').value.trim(),
          heroTitleHtml: document.getElementById('set-hero-title').value.trim(),
          heroSubtitle: document.getElementById('set-hero-sub').value.trim(),
          heroMonolithHeading: document.getElementById('set-hero-heading').value.trim(),
          heroEditorialImg: document.getElementById('set-hero-img').value.trim(),
          heroFlagshipLink: (document.getElementById('set-flagship-link') ? document.getElementById('set-flagship-link').value.trim() : '') || 'product.html?id=ear-01',
          heroFlagshipLinkText: (document.getElementById('set-flagship-text') ? document.getElementById('set-flagship-text').value.trim() : '') || 'Inspect Flagship Piece →',
          catImgEarrings: (document.getElementById('set-cat-earrings') ? document.getElementById('set-cat-earrings').value.trim() : '') || 'Assets/Main Raha logo with slogan (The actual logo).webp',
          catImgNecklace: (document.getElementById('set-cat-necklace') ? document.getElementById('set-cat-necklace').value.trim() : '') || 'Assets/Main Raha logo with slogan (The actual logo).webp',
          catImgRings: (document.getElementById('set-cat-rings') ? document.getElementById('set-cat-rings').value.trim() : '') || 'Assets/Main Raha logo with slogan (The actual logo).webp',
          catImgBracelets: (document.getElementById('set-cat-bracelets') ? document.getElementById('set-cat-bracelets').value.trim() : '') || 'Assets/Main Raha logo with slogan (The actual logo).webp',
          catImgAnklets: (document.getElementById('set-cat-anklets') ? document.getElementById('set-cat-anklets').value.trim() : '') || 'Assets/Main Raha logo with slogan (The actual logo).webp'
        };
        try {
          if (window.RahaSupabase && window.RahaSupabase.cache && typeof window.RahaSupabase.cache.clear === 'function') {
            window.RahaSupabase.cache.clear();
          }
          sessionStorage.removeItem('raha_storefront_state_v6');
        } catch (cErr) {}
        await window.RahaSupabase.saveStoreSettingsAndPages(catalog, settings, pages);
        try {
          var hdrs = (window.RahaSupabase && typeof window.RahaSupabase.getAuthHeaders === 'function')
            ? window.RahaSupabase.getAuthHeaders()
            : { 'Content-Type': 'application/json', 'X-Raha-Admin': '1' };
          await fetch('/api/store-data', {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({ catalog: catalog, settings: settings, pages: pages })
          });
        } catch (fErr) {}
        showToast('Website Hero, Category Cards & Shipping Settings updated live!');
      });
    }

    /* Policy Pages Selector & Save */
    var pgSel = document.getElementById('admin-page-select');
    if (pgSel) {
      pgSel.addEventListener('change', populatePagesEditor);
    }
    var pgForm = document.getElementById('admin-pages-form');
    if (pgForm) {
      pgForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var slug = document.getElementById('admin-page-select').value;
        pages[slug] = {
          title: slug,
          subtitle: document.getElementById('admin-page-subtitle').value.trim(),
          bodyHtml: document.getElementById('admin-page-body').value
        };
        await window.RahaSupabase.saveStoreSettingsAndPages(catalog, settings, pages);
        showToast('Saved "' + slug + '.html" content to Store & Supabase!');
      });
    }

    bindImageUploaders();
  }

  async function checkAdminOwnerAuth() {
    var gate = document.getElementById('admin-auth-gate');
    var gateErr = document.getElementById('admin-gate-error');
    var gateForm = document.getElementById('admin-gate-form');
    var userPill = document.getElementById('admin-user-pill');
    var logoutBtn = document.getElementById('admin-logout-btn');

    if (!gate) return;

    var curUser = null;
    if (window.RahaSupabase && typeof window.RahaSupabase.getAuthUser === 'function') {
      curUser = await window.RahaSupabase.getAuthUser();
    }

    if (curUser && curUser.isOwner) {
      gate.style.display = 'none';
      if (userPill) userPill.textContent = 'Owner: ' + curUser.email;
      await loadAllAdminData();
    } else {
      gate.style.display = 'flex';
    }

    if (gateForm && !gateForm._bound) {
      gateForm._bound = true;
      gateForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = document.getElementById('gate-email').value.trim();
        var pass = document.getElementById('gate-password').value;
        if (!window.RahaSupabase.isOwnerEmail(email)) {
          if (gateErr) {
            gateErr.textContent = 'Access Denied: Only the store owner (contact.rahaofficial@gmail.com) is authorized for Admin controls.';
            gateErr.style.display = 'block';
          }
          return;
        }

        try {
          var res = await window.RahaSupabase.signInCustomer(email, pass);
          if (res && res.user && res.user.isOwner) {
            gate.style.display = 'none';
            if (userPill) userPill.textContent = 'Owner: ' + res.user.email;
            showToast('Welcome back, Store Owner!');
            await loadAllAdminData();
          }
        } catch (err) {
          if (err && (err.message || '').indexOf('Invalid login') !== -1) {
            try {
              var sRes = await window.RahaSupabase.signUpCustomer(email, pass, 'Raha Store Owner');
              if (sRes && sRes.user && sRes.user.isOwner) {
                gate.style.display = 'none';
                if (userPill) userPill.textContent = 'Owner: ' + sRes.user.email;
                showToast('Owner account initialized and signed in!');
                await loadAllAdminData();
                return;
              }
            } catch (sErr) {}
          }
          if (gateErr) {
            gateErr.textContent = 'Login Error: ' + (err.message || 'Invalid password for ' + email);
            gateErr.style.display = 'block';
          }
        }
      });
    }

    var setupBtn = document.getElementById('gate-first-time-setup-btn');
    if (setupBtn && !setupBtn._bound) {
      setupBtn._bound = true;
      setupBtn.addEventListener('click', async function () {
        var email = document.getElementById('gate-email').value.trim();
        var pass = document.getElementById('gate-password').value;
        if (!pass || pass.length < 6) {
          if (gateErr) {
            gateErr.textContent = 'Please type a password (at least 6 characters) in the password field first.';
            gateErr.style.display = 'block';
          }
          document.getElementById('gate-password').focus();
          return;
        }
        try {
          var res = await window.RahaSupabase.signUpCustomer(email, pass, 'Raha Store Owner');
          if (res && res.user && res.user.isOwner) {
            gate.style.display = 'none';
            showToast('Owner password set & signed in!');
            await loadAllAdminData();
          }
        } catch (e) {
          if (gateErr) {
            gateErr.textContent = 'Setup notice: ' + (e.message || e);
            gateErr.style.display = 'block';
          }
        }
      });
    }

    if (logoutBtn && !logoutBtn._bound) {
      logoutBtn._bound = true;
      logoutBtn.addEventListener('click', async function () {
        await window.RahaSupabase.signOutUser();
        gate.style.display = 'flex';
        showToast('Signed out from Admin Portal');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindEvents();
    checkAdminOwnerAuth();
  });
})();


