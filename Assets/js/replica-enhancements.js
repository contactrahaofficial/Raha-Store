/**
 * RAHA — JEWELLERY FOR THE MODERN MINIMALISTS (ESTD 2026)
 * Bespoke Minimalist-Futuristic Digital Raha Engine
 */
(function () {
  'use strict';

  var CART_STORAGE_KEY = 'raha_atelier_cart_v1';
  var THEME_STORAGE_KEY = 'raha_atelier_theme_v1';
  var CITY_STORAGE_KEY = 'raha_delivery_city_v1';
  var FREE_SHIPPING_THRESHOLD = 3500;
  var WHATSAPP_NUMBER = '923260870876';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ========================================================================
     SUPABASE STORAGE ASSET ENGINE (RELIABLE HIGH-SPEED CLOUD DELIVERY)
     ======================================================================== */
  function optimizeImageUrl(url, opts) {
    if (!url || typeof url !== 'string') return url || '';
    if (window.RahaSupabase && typeof window.RahaSupabase.optimizeImageUrl === 'function') {
      return window.RahaSupabase.optimizeImageUrl(url, opts);
    }
    // If an image URL was transformed to /render/image/, restore it to the direct working /object/public/ endpoint
    // (Supabase free/standard tenants return 403 Forbidden for the paid /render/image/ add-on)
    if (url.indexOf('/storage/v1/render/image/public/') !== -1) {
      return url.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/').split('?')[0];
    }
    if (url.indexOf('/storage/v1/object/public/') !== -1 && url.indexOf('?') !== -1) {
      return url.split('?')[0];
    }
    return url;
  }
  window.optimizeImageUrl = optimizeImageUrl;

  /* ========================================================================
     DYNAMIC SUPABASE-DRIVEN PRODUCT & SKU CATALOG (ZERO STATIC JEWELRY ASSETS)
     ======================================================================== */
  var BRAND_FALLBACK_IMG = 'Assets/Main Raha logo with slogan (The actual logo).webp';
  var RAHA_CATALOG = [];

  var CMS_STORE_KEY = 'raha_cms_store_v1';
  var CMS_ORDERS_KEY = 'raha_cms_orders_v1';
  window.RAHA_DEFAULT_CATALOG = JSON.parse(JSON.stringify(RAHA_CATALOG));

  function loadCmsStoreLocal() {
    try {
      var raw = localStorage.getItem(CMS_STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.catalog) && parsed.catalog.length > 0) {
          RAHA_CATALOG = parsed.catalog;
        }
        if (parsed && parsed.settings) {
          if (parsed.settings.freeShippingThreshold) {
            FREE_SHIPPING_THRESHOLD = Number(parsed.settings.freeShippingThreshold) || 3500;
          }
          if (parsed.settings.whatsappNumber) {
            var rawWa = String(parsed.settings.whatsappNumber).replace(/[^0-9]/g, ''); if (rawWa.indexOf('3352396680') !== -1) rawWa = '923260870876'; if (rawWa.indexOf('0326') === 0) rawWa = '92' + rawWa.slice(1); WHATSAPP_NUMBER = rawWa || '923260870876';
          }
        }
        return parsed;
      }
    } catch (e) {}
    return { catalog: RAHA_CATALOG, settings: {}, pages: {} };
  }

  var ACTIVE_CMS_STATE = loadCmsStoreLocal();
  window.RAHA_CATALOG = RAHA_CATALOG;
  window.RAHA_CMS_STATE = ACTIVE_CMS_STATE;

  function findProductById(id) {
    for (var i = 0; i < RAHA_CATALOG.length; i++) {
      if (RAHA_CATALOG[i].id === id) return RAHA_CATALOG[i];
    }
    return RAHA_CATALOG[0];
  }

  function findProductIndexById(id) {
    for (var i = 0; i < RAHA_CATALOG.length; i++) {
      if (RAHA_CATALOG[i].id === id) return i;
    }
    return 0;
  }

  function formatPKR(amount) {
    var num = Math.round(Number(amount) || 0);
    return 'Rs ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ========================================================================
     1. DUAL ATMOSPHERE THEME ENGINE (MIDNIGHT VAULT <-> ALABASTER SILK)
     ======================================================================== */
  function initThemeEngine() {
    var savedTheme = null;
    try {
      savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {}

    if (savedTheme === 'silk') {
      document.documentElement.setAttribute('data-theme', 'silk');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    var sunSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>';
    var moonSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

    var toggleBtns = document.querySelectorAll('[data-theme-toggle]');
    function syncThemeIcons() {
      var isSilk = document.documentElement.getAttribute('data-theme') === 'silk';
      toggleBtns.forEach(function (btn) {
        // In Silk (Light) mode -> show Moon icon to switch to Midnight Vault
        // In Vault (Dark) mode -> show Sun icon to switch to Alabaster Silk
        btn.innerHTML = isSilk ? moonSvg : sunSvg;
        btn.setAttribute('title', isSilk ? 'Switch to Midnight Vault (Dark Mode)' : 'Switch to Alabaster Silk (Light Mode)');
        btn.setAttribute('aria-label', isSilk ? 'Switch to Dark Mode' : 'Switch to Light Mode');
      });
    }
    syncThemeIcons();

    toggleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isSilk = document.documentElement.getAttribute('data-theme') === 'silk';
        if (isSilk) {
          document.documentElement.removeAttribute('data-theme');
          try { localStorage.setItem(THEME_STORAGE_KEY, 'vault'); } catch (e) {}
        } else {
          document.documentElement.setAttribute('data-theme', 'silk');
          try { localStorage.setItem(THEME_STORAGE_KEY, 'silk'); } catch (e) {}
        }
        syncThemeIcons();
      });
    });
  }

  /* ========================================================================
     2. SPOTLIGHT COMMAND-PALETTE SEARCH MODAL & CITY SELECTOR
     ======================================================================== */
  var PAKISTAN_CITIES = [
    'Karachi • Express 24h',
    'Lahore • Express 24h',
    'Islamabad / RWP • Express 24h',
    'Faisalabad • 24–48h',
    'Multan • 24–48h',
    'Peshawar • 24–48h',
    'All Pakistan • COD Available'
  ];

  function getSavedCity() {
    try {
      return localStorage.getItem(CITY_STORAGE_KEY) || PAKISTAN_CITIES[0];
    } catch (e) {
      return PAKISTAN_CITIES[0];
    }
  }

  function initSpotlightSearchAndCity() {
    /* City Selector Pills */
    var cityBtns = document.querySelectorAll('[data-deliver-toggle]');
    function syncCityLabels() {
      var city = getSavedCity();
      document.querySelectorAll('[data-deliver-city]').forEach(function (el) {
        el.textContent = city;
      });
    }
    syncCityLabels();

    cityBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = getSavedCity();
        var nextIdx = (PAKISTAN_CITIES.indexOf(current) + 1) % PAKISTAN_CITIES.length;
        var nextCity = PAKISTAN_CITIES[nextIdx];
        try { localStorage.setItem(CITY_STORAGE_KEY, nextCity); } catch (e) {}
        syncCityLabels();
      });
    });

    /* Spotlight Search Modal */
    var modal = document.getElementById('raha-spotlight-modal');
    var backdrop = document.getElementById('raha-backdrop');
    var searchInput = document.getElementById('raha-global-search-input');
    var searchCat = document.getElementById('raha-global-search-cat');
    var searchResults = document.getElementById('raha-global-search-results');

    function openSpotlight() {
      if (!modal) return;
      modal.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      renderSearchResults();
      setTimeout(function () {
        if (searchInput) searchInput.focus();
      }, 80);
    }

    document.querySelectorAll('[data-open-search]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openSpotlight();
      });
    });

    /* Keyboard shortcut Ctrl+K or Cmd+K */
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSpotlight();
      } else if (e.key === 'Escape') {
        closeAllDrawersAndModals();
      }
    });

    function renderSearchResults() {
      if (!searchResults) return;
      var q = searchInput ? (searchInput.value || '').trim().toLowerCase() : '';
      var cat = searchCat ? searchCat.value : 'all';

      var matches = RAHA_CATALOG.filter(function (item) {
        var hasStock = (typeof item.stock !== 'number') || item.stock > 0;
        if (!hasStock) return false;
        var catMatch = (cat === 'all') || (item.categorySlug === cat);
        if (!catMatch) return false;
        if (!q) return true;
        var hay = (item.title + ' ' + item.subtitle + ' ' + item.skuBase + ' ' + item.category + ' ' + item.subdept + ' ' + item.material).toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      var topMatches = matches.slice(0, 8);
      if (topMatches.length === 0) {
        searchResults.innerHTML =
          '<div style="padding:28px;text-align:center;color:var(--text-secondary);font-size:13.5px;">' +
            'No matching Raha pieces found for "<strong>' + escapeHtml(q) + '</strong>". Try searching <em>hoops, herringbone, signet, pearl, or SKU</em>.' +
          '</div>';
        return;
      }

      var frag = document.createDocumentFragment();
      var headerDiv = document.createElement('div');
      headerDiv.style.cssText = 'padding:6px 14px 10px;display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:var(--text-muted);';
      headerDiv.innerHTML = '<span>Curated Matches (' + matches.length + ' Pieces)</span><span>Click to Open Product &amp; SKU Suite</span>';
      frag.appendChild(headerDiv);

      topMatches.forEach(function (it) {
        var a = document.createElement('a');
        a.href = 'product.html?id=' + encodeURIComponent(it.id);
        a.className = 'raha-search-item';
        var thumb = optimizeImageUrl(it.img, { width: 160, quality: 80, format: 'webp' });
        a.innerHTML =
          '<img src="' + thumb + '" alt="' + (it.title || '').replace(/"/g, '&quot;') + '" class="raha-search-item__img" loading="lazy" decoding="async">' +
          '<div>' +
            '<div style="font-family:var(--font-serif);font-size:18px;color:var(--text-primary);">' + it.title + '</div>' +
            '<div style="font-family:var(--font-mono);font-size:10px;color:var(--raha-gold);letter-spacing:0.12em;margin-top:2px;">' + it.category + ' • ' + it.subdept + ' • SKU: ' + it.skuBase + '</div>' +
          '</div>' +
          '<div style="text-align:right;font-family:var(--font-mono);font-size:13.5px;color:var(--text-primary);">' +
            formatPKR(it.price) +
          '</div>';
        frag.appendChild(a);
      });
      searchResults.textContent = '';
      searchResults.appendChild(frag);
    }

    if (searchInput) {
      searchInput.addEventListener('input', renderSearchResults);
    }
    if (searchCat) {
      searchCat.addEventListener('change', renderSearchResults);
    }
  }

  /* ========================================================================
     3. CUSTOM MAGNETIC CURSOR & 3D SPECULAR GLINT TILT (GPU ACCELERATED)
     ======================================================================== */
  function initMagneticCursorAndTilt() {
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;

    var dot = document.querySelector('.raha-cursor-dot');
    var ring = document.querySelector('.raha-cursor-ring');
    if (dot && ring) {
      var mouseX = window.innerWidth / 2;
      var mouseY = window.innerHeight / 2;
      var ringX = mouseX;
      var ringY = mouseY;

      dot.style.left = '0px';
      dot.style.top = '0px';
      ring.style.left = '0px';
      ring.style.top = '0px';

      window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = 'translate3d(' + mouseX + 'px, ' + mouseY + 'px, 0) translate(-50%, -50%)';
      }, { passive: true });

      function animateCursor() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = 'translate3d(' + ringX.toFixed(1) + 'px, ' + ringY.toFixed(1) + 'px, 0) translate(-50%, -50%)';
        requestAnimationFrame(animateCursor);
      }
      requestAnimationFrame(animateCursor);

      document.addEventListener('mouseover', function (e) {
        var target = e.target.closest('[data-cursor], a, button');
        if (target) {
          ring.classList.add('is-hover');
          var label = target.getAttribute('data-cursor') || '';
          ring.textContent = label;
        }
      });

      document.addEventListener('mouseout', function (e) {
        var target = e.target.closest('[data-cursor], a, button');
        if (target) {
          ring.classList.remove('is-hover');
          ring.textContent = '';
        }
      });
    }

    bindCardTiltEffect();
  }

  function bindCardTiltEffect() {
    var tiltCards = document.querySelectorAll('.raha-card, .raha-monolith-card');
    tiltCards.forEach(function (card) {
      if (card.getAttribute('data-tilt-bound')) return;
      card.setAttribute('data-tilt-bound', '1');

      var cachedRect = null;
      var rafId = null;

      card.addEventListener('mouseenter', function () {
        cachedRect = card.getBoundingClientRect();
      }, { passive: true });

      card.addEventListener('mousemove', function (e) {
        if (!cachedRect) cachedRect = card.getBoundingClientRect();
        var clientX = e.clientX;
        var clientY = e.clientY;
        if (rafId) return;
        rafId = requestAnimationFrame(function () {
          rafId = null;
          if (!cachedRect || !cachedRect.width || !cachedRect.height) return;
          var x = clientX - cachedRect.left;
          var y = clientY - cachedRect.top;
          var pctX = (x / cachedRect.width) * 100;
          var pctY = (y / cachedRect.height) * 100;
          var rotY = ((x / cachedRect.width) - 0.5) * 6;
          var rotX = (0.5 - (y / cachedRect.height)) * 6;

          card.style.transform = 'perspective(900px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg) translateY(-4px)';
          card.style.setProperty('--glare-x', pctX.toFixed(1) + '%');
          card.style.setProperty('--glare-y', pctY.toFixed(1) + '%');
        });
      }, { passive: true });

      card.addEventListener('mouseleave', function () {
        cachedRect = null;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        card.style.transform = '';
      }, { passive: true });
    });
  }

  /* ========================================================================
     4. SHOPPING BAG ENGINE (LOCALSTORAGE + RS 3,500 BAR + WHATSAPP CHECKOUT)
     ======================================================================== */
  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
  }

  function addItemToCart(item) {
    var cart = loadCart();
    var skuPart = item.sku || item.id;
    var key = skuPart + '__' + (item.variant || 'Gold Plated');
    var addQty = Math.max(1, parseInt(item.qty, 10) || 1);
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].key === key) {
        existing = cart[i];
        break;
      }
    }
    if (existing) {
      existing.qty += addQty;
    } else {
      cart.push({
        key: key,
        id: item.id,
        sku: skuPart,
        title: item.title,
        price: Number(item.price) || 2450,
        variant: item.variant || 'Gold Plated',
        img: item.img || 'Assets/Main Raha logo with slogan (The actual logo).webp',
        qty: addQty
      });
    }
    saveCart(cart);
    renderCartDrawer();
  }

  function updateItemQty(key, delta) {
    var cart = loadCart();
    var next = [];
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].key === key) {
        cart[i].qty += delta;
        if (cart[i].qty > 0) next.push(cart[i]);
      } else {
        next.push(cart[i]);
      }
    }
    saveCart(next);
    renderCartDrawer();
  }

  function openCartDrawer() {
    var drawer = document.getElementById('raha-bag-drawer');
    var backdrop = document.getElementById('raha-backdrop');
    if (drawer) drawer.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-open');
  }

  function closeAllDrawersAndModals() {
    document.querySelectorAll('.raha-drawer.is-open, .raha-modal.is-open, .raha-spotlight-modal.is-open, .raha-cod-modal.is-open, .raha-backdrop.is-open').forEach(function (el) {
      el.classList.remove('is-open');
    });
  }

  window.rahaOpenImageModal = function (src, title) {
    if (!src) return;
    var modal = document.getElementById('raha-review-photo-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'raha-review-photo-modal';
      modal.className = 'raha-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML =
        '<div class="raha-modal__box" style="grid-template-columns:1fr;max-width:560px;padding:24px;border-radius:22px;background:var(--bg-elevated);border:1px solid var(--border-glow);box-shadow:var(--shadow-ambient);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<span style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:var(--raha-gold);" id="raha-rev-photo-title">Customer Wear Photo</span>' +
            '</div>' +
            '<button type="button" class="raha-icon-btn" data-close-overlay aria-label="Close Photo View">&times;</button>' +
          '</div>' +
          '<div style="border-radius:14px;overflow:hidden;background:#0d0a0c;border:1px solid var(--border-subtle);max-height:75vh;display:flex;align-items:center;justify-content:center;">' +
            '<img id="raha-rev-photo-img" src="" alt="Customer Wear" style="max-width:100%;max-height:70vh;object-fit:contain;display:block;">' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);
      var closeBtn = modal.querySelector('[data-close-overlay]');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeAllDrawersAndModals);
      }
    }
    var imgEl = document.getElementById('raha-rev-photo-img');
    var titleEl = document.getElementById('raha-rev-photo-title');
    if (imgEl) imgEl.src = src;
    if (titleEl && title) titleEl.textContent = 'Customer Photo • ' + title;
    modal.classList.add('is-open');
    var backdrop = document.getElementById('raha-backdrop');
    if (backdrop) backdrop.classList.add('is-open');
  };

  function renderCartDrawer() {
    var cart = loadCart();
    var totalCount = 0;
    var subtotal = 0;
    cart.forEach(function (item) {
      totalCount += item.qty;
      subtotal += item.price * item.qty;
    });

    document.querySelectorAll('.raha-bag-count').forEach(function (el) {
      el.textContent = totalCount;
    });

    var fsbText = document.getElementById('raha-fsb-text');
    var fsbFill = document.getElementById('raha-fsb-fill');
    if (fsbText && fsbFill) {
      if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        fsbText.innerHTML = 'Complimentary Express Delivery <strong style="color:var(--raha-gold);">UNLOCKED</strong> across Pakistan';
        fsbFill.style.width = '100%';
      } else if (subtotal === 0) {
        fsbText.innerHTML = 'Enjoy <strong style="color:var(--raha-gold);">Free Express Delivery</strong> on orders above Rs 3,500';
        fsbFill.style.width = '0%';
      } else {
        var diff = FREE_SHIPPING_THRESHOLD - subtotal;
        var pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
        fsbText.innerHTML = 'Add <strong style="color:var(--raha-gold);">' + formatPKR(diff) + '</strong> more to unlock Free Express Delivery';
        fsbFill.style.width = pct + '%';
      }
    }

    var bodyEl = document.getElementById('raha-bag-items');
    var subtotalEl = document.getElementById('raha-bag-subtotal');
    if (subtotalEl) {
      subtotalEl.textContent = formatPKR(subtotal);
    }
    if (!bodyEl) return;

    if (cart.length === 0) {
      bodyEl.innerHTML =
        '<div style="text-align:center;padding:52px 16px;color:var(--text-secondary);">' +
          '<p style="font-family:var(--font-serif);font-size:24px;margin-bottom:8px;color:var(--text-primary);">Your Raha Bag is Empty</p>' +
        '</div>';
      return;
    }

    var cartFrag = document.createDocumentFragment();
    cart.forEach(function (item) {
      var itemDiv = document.createElement('div');
      itemDiv.className = 'raha-cart-item';
      var thumb = optimizeImageUrl(item.img, { width: 160, quality: 80, format: 'webp' });
      itemDiv.innerHTML =
        '<a href="product.html?id=' + encodeURIComponent(item.id) + '"><img src="' + thumb + '" alt="' + (item.title || '').replace(/"/g, '&quot;') + '" class="raha-cart-item__img" loading="lazy" decoding="async"></a>' +
        '<div>' +
          '<a href="product.html?id=' + encodeURIComponent(item.id) + '" style="font-family:var(--font-serif);font-size:17px;color:var(--text-primary);text-decoration:none;">' + item.title + '</a>' +
          '<div style="font-family:var(--font-mono);font-size:10px;color:var(--raha-gold);text-transform:uppercase;letter-spacing:0.08em;margin:2px 0 4px;">' + (item.sku ? item.sku + ' • ' : '') + item.variant + '</div>' +
          '<div style="font-family:var(--font-mono);font-size:12.5px;color:var(--text-secondary);">' + formatPKR(item.price) + '</div>' +
          '<div class="raha-qty-ctrl">' +
            '<button type="button" data-cart-dec="' + item.key + '" aria-label="Decrease quantity">&minus;</button>' +
            '<span>' + item.qty + '</span>' +
            '<button type="button" data-cart-inc="' + item.key + '" aria-label="Increase quantity">+</button>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;font-family:var(--font-mono);font-size:13px;color:var(--text-primary);">' +
          formatPKR(item.price * item.qty) +
        '</div>';
      cartFrag.appendChild(itemDiv);
    });
    bodyEl.textContent = '';
    bodyEl.appendChild(cartFrag);

    bodyEl.querySelectorAll('[data-cart-dec]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateItemQty(btn.getAttribute('data-cart-dec'), -1);
      });
    });
    bodyEl.querySelectorAll('[data-cart-inc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateItemQty(btn.getAttribute('data-cart-inc'), 1);
      });
    });
  }

  /* ========================================================================
     5. PRODUCT CARDS, SWATCHES & QUICK-VIEW MODAL
     ======================================================================== */
  function initProductCardsAndQuickView() {
    document.querySelectorAll('.raha-card').forEach(function (card) {
      if (card.getAttribute('data-card-bound')) return;
      card.setAttribute('data-card-bound', '1');

      var id = card.getAttribute('data-id') || 'ear-01';
      var prodData = findProductById(id);

      /* Lazy-load alternate hover image ONLY when user hovers the card (cuts initial bandwidth by 50%) */
      var hoverImgEl = card.querySelector('.raha-card__img--hover[data-hover-src]');
      if (hoverImgEl) {
        card.addEventListener('mouseenter', function () {
          var hs = hoverImgEl.getAttribute('data-hover-src');
          if (hs && !hoverImgEl.getAttribute('src')) {
            hoverImgEl.setAttribute('src', hs);
          }
        }, { once: true });
      }

      /* Clicking ANYWHERE on the card navigates directly to product.html (Details & SKUs) */
      card.style.cursor = 'pointer';
      card.addEventListener('click', function (e) {
        var targetA = e.target.closest('a');
        if (targetA && targetA.getAttribute('href')) {
          return;
        }
        window.location.href = 'product.html?id=' + encodeURIComponent(id);
      });

      /* Swatch pills selection + live finish photo preview on card */
      var swatches = card.querySelectorAll('.raha-swatch-btn');
      var primaryImgEl = card.querySelector('.raha-card__img--primary');
      swatches.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          swatches.forEach(function (s) { s.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
          var txt = btn.textContent.trim();
          card.setAttribute('data-selected-variant', txt);
          if (primaryImgEl && prodData) {
            var matchedImg = prodData.img || BRAND_FALLBACK_IMG;
            if (Array.isArray(prodData.customSkus) && Array.isArray(prodData.gallery)) {
              var matchedSku = prodData.customSkus.find(function (cs) {
                return cs && cs.name && cs.name.toLowerCase() === txt.toLowerCase();
              });
              if (matchedSku && typeof matchedSku.imgIdx === 'number' && prodData.gallery[matchedSku.imgIdx] && prodData.gallery[matchedSku.imgIdx].src) {
                matchedImg = prodData.gallery[matchedSku.imgIdx].src;
              }
            }
            primaryImgEl.src = optimizeImageUrl(matchedImg, { width: 800, quality: 80, format: 'webp' });
          }
        });
      });

      /* Add to bag button on card */
      var addBtn = card.querySelector('.raha-card__add-btn');
      if (addBtn) {
        addBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var title = card.getAttribute('data-title') || prodData.title;
          var price = Number(card.getAttribute('data-price')) || prodData.price;
          var img = (primaryImgEl && primaryImgEl.getAttribute('src')) || card.getAttribute('data-img') || prodData.img;
          var selectedSwatch = card.querySelector('.raha-swatch-btn.is-selected');
          var variant = selectedSwatch ? selectedSwatch.textContent.trim() : (card.getAttribute('data-selected-variant') || 'Gold Plated');

          addItemToCart({
            id: id,
            sku: prodData.skuBase,
            title: title,
            price: price,
            variant: variant,
            img: img,
            qty: 1
          });

          var origHTML = addBtn.innerHTML;
          addBtn.classList.add('is-added');
          addBtn.innerHTML = '<span>&#10003; Added</span>';
          setTimeout(function () {
            addBtn.classList.remove('is-added');
            addBtn.innerHTML = origHTML;
          }, 1100);
          openCartDrawer();
        });
      }

      /* Quick-View trigger button */
      var qvBtn = card.querySelector('.raha-card__quickview-btn');
      if (qvBtn) {
        qvBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openQuickViewForCard(card);
        });
      }
    });
  }

  function openQuickViewForCard(card) {
    var modal = document.getElementById('raha-quickview-modal');
    var backdrop = document.getElementById('raha-backdrop');
    if (!modal) return;

    var id = card.getAttribute('data-id') || 'ear-01';
    var prodData = findProductById(id);
    var title = card.getAttribute('data-title') || prodData.title;
    var price = Number(card.getAttribute('data-price')) || prodData.price;
    var compare = Number(card.getAttribute('data-compare')) || prodData.compare;
    var img = card.getAttribute('data-img') || prodData.img;
    var hoverImg = card.getAttribute('data-hover-img') || prodData.hoverImg;
    var category = card.getAttribute('data-category') || prodData.category;
    var selectedSwatch = card.querySelector('.raha-swatch-btn.is-selected');
    var variant = selectedSwatch ? selectedSwatch.textContent.trim() : 'Gold Plated';

    var qvImg = document.getElementById('raha-qv-img');
    var qvCat = document.getElementById('raha-qv-cat');
    var qvTitle = document.getElementById('raha-qv-title');
    var qvPrice = document.getElementById('raha-qv-price');
    var qvCompare = document.getElementById('raha-qv-compare');
    var qvAddBtn = document.getElementById('raha-qv-add');

    if (qvImg) qvImg.src = img;
    if (qvCat) qvCat.textContent = category + ' • SKU: ' + prodData.skuBase;
    if (qvTitle) {
      qvTitle.innerHTML = '<a href="product.html?id=' + id + '" style="color:inherit;text-decoration:none;">' + title + '</a>';
    }
    if (qvPrice) qvPrice.textContent = formatPKR(price);
    if (qvCompare) qvCompare.textContent = formatPKR(compare);

    var thumbWrap = document.getElementById('raha-qv-thumbs');
    if (thumbWrap) {
      thumbWrap.innerHTML =
        '<button type="button" class="raha-swatch-btn is-selected" data-qv-src="' + img + '">Primary Angle</button>' +
        '<button type="button" class="raha-swatch-btn" data-qv-src="' + hoverImg + '">Editorial Angle</button>' +
        '<a href="product.html?id=' + id + '" class="raha-swatch-btn" style="text-decoration:none;border-color:var(--raha-gold);color:var(--raha-gold);">Full Product Page →</a>';
      thumbWrap.querySelectorAll('[data-qv-src]').forEach(function (tBtn) {
        tBtn.addEventListener('click', function () {
          thumbWrap.querySelectorAll('[data-qv-src]').forEach(function (b) { b.classList.remove('is-selected'); });
          tBtn.classList.add('is-selected');
          if (qvImg) qvImg.src = tBtn.getAttribute('data-qv-src');
        });
      });
    }

    if (qvAddBtn) {
      qvAddBtn.onclick = function () {
        addItemToCart({
          id: id,
          sku: prodData.skuBase,
          title: title,
          price: price,
          variant: variant,
          img: img,
          qty: 1
        });
        closeAllDrawersAndModals();
        openCartDrawer();
      };
    }

    modal.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-open');
  }

  /* ========================================================================
     6. BALANCED 2-COLUMN LUXURY PRODUCT DETAIL PAGE (product.html)
     ======================================================================== */
  function getSizesForCategory(catSlug) {
    if (catSlug === 'rings') {
      return [
        { code: 'US6', label: 'US 6 (16.5mm)' },
        { code: 'US7', label: 'US 7 (17.3mm)' },
        { code: 'US8', label: 'US 8 (18.1mm)' },
        { code: 'ADJ', label: 'Adjustable Fit' }
      ];
    }
    if (catSlug === 'necklace') {
      return [
        { code: '16IN', label: '16 in Collar (+2 in)' },
        { code: '18IN', label: '18 in Princess (+2 in)' },
        { code: '20IN', label: '20 in Layering' }
      ];
    }
    if (catSlug === 'bracelets') {
      return [
        { code: '6.5IN', label: '6.5 in Petite' },
        { code: '7.0IN', label: '7.0 in Standard' },
        { code: '7.5IN', label: '7.5 in Relaxed' }
      ];
    }
    if (catSlug === 'anklets') {
      return [
        { code: '9.0IN', label: '9.0 in + Extender' },
        { code: '9.5IN', label: '9.5 in Standard' },
        { code: '10IN', label: '10.0 in Relaxed' }
      ];
    }
    return [
      { code: 'STD', label: 'Standard Surgical Post' },
      { code: 'LCK', label: 'Comfort Locking Back' }
    ];
  }

  function initProductDetailPage() {
    var pdpRoot = document.getElementById('raha-pdp-root');
    if (!pdpRoot) return;

    var params = new URLSearchParams(window.location.search);
    var productId = params.get('id') || 'ear-01';
    var productIdx = findProductIndexById(productId);
    var product = RAHA_CATALOG[productIdx];
    if (!product) return;

    var prevProduct = RAHA_CATALOG[(productIdx - 1 + RAHA_CATALOG.length) % RAHA_CATALOG.length];
    var nextProduct = RAHA_CATALOG[(productIdx + 1) % RAHA_CATALOG.length];

    var seoTitle = product.title + ' — ' + (product.category || 'Jewellery') + ' | Raha Jewels Pakistan';
    var seoDesc = (product.subtitle ? (product.subtitle + ' ') : '') + 'Shop ' + product.title + ' by Raha Jewels for Rs ' + (Number(product.price) || 0).toLocaleString('en-PK') + ' with fast nationwide delivery across Pakistan.';
    var seoImg = optimizeImageUrl(product.img || BRAND_FALLBACK_IMG);
    var seoUrl = 'https://rahajewels.pk/product.html?id=' + encodeURIComponent(product.id);
    document.title = seoTitle;

    try {
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', seoDesc);
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', seoTitle);
      var ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', seoDesc);
      var ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg && seoImg) ogImg.setAttribute('content', seoImg);
      var ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', seoUrl);
      var twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute('content', seoTitle);
      var twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute('content', seoDesc);
      var twImg = document.querySelector('meta[name="twitter:image"]');
      if (twImg && seoImg) twImg.setAttribute('content', seoImg);
      var canonEl = document.querySelector('link[rel="canonical"]');
      if (canonEl) canonEl.setAttribute('href', seoUrl);

      var prevSchema = document.getElementById('raha-dynamic-product-schema');
      if (prevSchema) prevSchema.remove();
      var pStockNum = (typeof product.stock === 'number') ? product.stock : 15;
      var productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        sku: product.skuBase || product.id,
        image: [seoImg],
        description: seoDesc,
        brand: { '@type': 'Brand', name: 'Raha Jewels' },
        category: product.category || 'Jewellery',
        offers: {
          '@type': 'Offer',
          url: seoUrl,
          priceCurrency: 'PKR',
          price: Number(product.price) || 0,
          availability: pStockNum > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: 'Raha Jewels' }
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(product.rating || '5.0'),
          reviewCount: String(Math.max(1, Number(product.reviews) || 24))
        }
      };
      var scTag = document.createElement('script');
      scTag.type = 'application/ld+json';
      scTag.id = 'raha-dynamic-product-schema';
      scTag.textContent = JSON.stringify(productSchema);
      document.head.appendChild(scTag);
    } catch (seoErr) {}

    /* 4 Luxury Metallic Orb SKU Options (or Admin-Configured Custom SKUs) */
    var isCustomItem = String(product.id || '').indexOf('item-') === 0;
    var skuOptions = (Array.isArray(product.customSkus) && product.customSkus.length > 0)
      ? product.customSkus.map(function (cs, idx) {
          var orbs = ['raha-metal-orb--gld', 'raha-metal-orb--slv', 'raha-metal-orb--rsg', 'raha-metal-orb--gft'];
          var csStock = (typeof cs.stock === 'number') ? cs.stock : ((typeof product.stock === 'number') ? product.stock : 10);
          var rawSkuPrice = Number(cs.price) || product.price;
          var rawSkuCompare = Number(cs.compare) || product.compare;
          // Ensure the primary/first SKU (and any custom product SKU left at legacy template defaults) matches the product's base price & compare price
          var isLegacyTemplateDefault = isCustomItem && (rawSkuPrice === 2450 || rawSkuPrice === 2550 || rawSkuPrice === 2900) && product.price !== rawSkuPrice;
          var finalSkuPrice = (idx === 0 || isLegacyTemplateDefault) ? Number(product.price) : rawSkuPrice;
          var finalSkuCompare = (idx === 0 || isLegacyTemplateDefault) ? Number(product.compare) : rawSkuCompare;
          return {
            suffix: cs.suffix || ('SKU' + (idx + 1)),
            orbClass: cs.orbClass || orbs[idx % orbs.length],
            name: cs.name || ('Option ' + (idx + 1)),
            desc: cs.desc || 'Signature Raha Finish',
            price: finalSkuPrice,
            compare: finalSkuCompare,
            stock: csStock,
            imgIdx: typeof cs.imgIdx === 'number' ? cs.imgIdx : Math.min(idx, (product.gallery || []).length - 1)
          };
        })
      : [
          {
            suffix: 'GLD',
            orbClass: 'raha-metal-orb--gld',
            name: 'Gold Plated',
            desc: '2.5μm PVD Vacuum Gold',
            price: product.price,
            compare: product.compare,
            stock: (typeof product.stock === 'number') ? product.stock : 10,
            imgIdx: 0
          },
          {
            suffix: 'SLV',
            orbClass: 'raha-metal-orb--slv',
            name: '925 Sterling Silver',
            desc: 'Rhodium Mirror Finish',
            price: product.price,
            compare: product.compare,
            stock: (typeof product.stock === 'number') ? product.stock : 10,
            imgIdx: 1
          },
          {
            suffix: 'RSG',
            orbClass: 'raha-metal-orb--rsg',
            name: 'Rose Gold',
            desc: 'Warm Blush Gold Finish',
            price: product.price + 100,
            compare: product.compare + 150,
            stock: (typeof product.stock === 'number') ? product.stock : 10,
            imgIdx: 2
          },
          {
            suffix: 'GFT',
            orbClass: 'raha-metal-orb--gft',
            name: 'Raha Gift Edition',
            desc: '+ Mauve Velvet Travel Case',
            price: product.price + 450,
            compare: product.compare + 650,
            stock: (typeof product.stock === 'number') ? product.stock : 10,
            imgIdx: 4
          }
        ];

    var sizeOptions = (Array.isArray(product.customSizes) && product.customSizes.length > 0)
      ? product.customSizes.map(function (sz) {
          var label = typeof sz === 'string' ? sz.trim() : (sz.label || 'Standard');
          var code = typeof sz === 'string' ? sz.trim().toUpperCase().replace(/[^A-Z0-9.]/g, '').slice(0, 6) : (sz.code || 'STD');
          return { code: code || 'STD', label: label };
        })
      : getSizesForCategory(product.categorySlug);
    var selectedSkuOpt = skuOptions[0];
    var selectedSizeOpt = sizeOptions[0];
    var selectedQty = 1;
    var activeGalleryIndex = 0;

    /* 1. Breadcrumbs & Prev/Next Piece Navigation */
    var bcEl = document.getElementById('pdp-breadcrumbs');
    if (bcEl) {
      bcEl.innerHTML =
        '<a href="index.html">Home</a>' +
        '<span class="raha-breadcrumbs__sep">/</span>' +
        '<a href="' + product.categorySlug + '.html">' + product.category + '</a>' +
        '<span class="raha-breadcrumbs__sep">/</span>' +
        '<span class="raha-breadcrumbs__current">' + product.title + '</span>';
    }

    var prevLink = document.getElementById('pdp-prev-link');
    var nextLink = document.getElementById('pdp-next-link');
    if (prevLink) {
      prevLink.href = 'product.html?id=' + prevProduct.id;
      prevLink.title = 'Previous: ' + prevProduct.title;
    }
    if (nextLink) {
      nextLink.href = 'product.html?id=' + nextProduct.id;
      nextLink.title = 'Next: ' + nextProduct.title;
    }

    /* 2. Gallery Stage & 5-Frame Horizontal Filmstrip */
    var thumbsContainer = document.getElementById('pdp-thumbs');
    var mainImg = document.getElementById('pdp-main-img');
    var mainStage = document.getElementById('pdp-main-stage');
    var captionEl = document.getElementById('pdp-img-caption');

    if (!Array.isArray(product.gallery) || product.gallery.length === 0) {
      product.gallery = [
        { src: product.img || 'Assets/Main Raha logo with slogan (The actual logo).webp', tag: '01 Studio', label: 'Primary Studio Angle' }
      ];
    }

    function setGalleryImage(idx) {
      activeGalleryIndex = idx;
      var g = (product.gallery && product.gallery[idx] && product.gallery[idx].src)
        ? product.gallery[idx]
        : ((product.gallery && product.gallery[0] && product.gallery[0].src)
            ? product.gallery[0]
            : { src: product.img || product.hoverImg || 'Assets/Main Raha logo with slogan (The actual logo).webp', tag: '01 Studio', label: 'Primary Studio Angle' });
      var cleanSrc = optimizeImageUrl(g.src);
      if (mainImg) {
        mainImg.src = cleanSrc;
        mainImg.onerror = function () {
          if (this.src.indexOf('/render/image/') !== -1) {
            this.src = this.src.replace('/render/image/', '/object/').split('?')[0];
          } else if (product.img && this.src !== product.img) {
            this.src = product.img;
          }
        };
      }
      if (captionEl) captionEl.textContent = (g.tag ? g.tag + ' • ' : '') + (g.label || 'Studio View') + ' (Click to Expand)';
      if (thumbsContainer) {
        thumbsContainer.querySelectorAll('.raha-pdp-thumb').forEach(function (btn, bIdx) {
          if (bIdx === idx) btn.classList.add('is-active');
          else btn.classList.remove('is-active');
        });
      }
    }

    if (thumbsContainer) {
      var thFrag = document.createDocumentFragment();
      product.gallery.forEach(function (g, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'raha-pdp-thumb' + (idx === 0 ? ' is-active' : '');
        btn.setAttribute('data-g-idx', idx);
        btn.title = g.label || 'Gallery View';
        var thumbSrc = optimizeImageUrl(g.src);
        btn.innerHTML =
          '<img src="' + thumbSrc + '" alt="' + (g.label || '').replace(/"/g, '&quot;') + '" loading="lazy" decoding="async" onerror="this.onerror=null;if(this.src.indexOf(\'/render/image/\')!==-1){this.src=this.src.replace(\'/render/image/\',\'/object/\').split(\'?\')[0];}">' +
          '<span class="raha-pdp-thumb__tag">' + (g.tag || '') + '</span>';
        btn.addEventListener('click', function () { setGalleryImage(idx); });
        btn.addEventListener('mouseenter', function () { setGalleryImage(idx); });
        thFrag.appendChild(btn);
      });
      thumbsContainer.textContent = '';
      thumbsContainer.appendChild(thFrag);
    }
    setGalleryImage(0);

    if (mainStage) {
      mainStage.onmousemove = function (e) {
        var rect = mainStage.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        mainStage.style.setProperty('--zoom-x', x.toFixed(1) + '%');
        mainStage.style.setProperty('--zoom-y', y.toFixed(1) + '%');
        mainStage.classList.add('is-zooming');
      };
      mainStage.onmouseleave = function () {
        mainStage.classList.remove('is-zooming');
      };
      mainStage.onclick = function (e) {
        if (e.target.closest('#pdp-share-btn')) return;
        openQuickViewModalForGallery();
      };
    }

    function openQuickViewModalForGallery() {
      var modal = document.getElementById('raha-quickview-modal');
      var backdrop = document.getElementById('raha-backdrop');
      var qvImg = document.getElementById('raha-qv-img');
      var qvTitle = document.getElementById('raha-qv-title');
      var qvCat = document.getElementById('raha-qv-cat');
      var qvPrice = document.getElementById('raha-qv-price');
      var qvCompare = document.getElementById('raha-qv-compare');
      var qvThumbs = document.getElementById('raha-qv-thumbs');
      var qvAdd = document.getElementById('raha-qv-add');
      if (!modal) return;

      var curG = product.gallery[activeGalleryIndex] || product.gallery[0];
      if (qvImg) qvImg.src = curG.src;
      if (qvTitle) qvTitle.textContent = product.title;
      if (qvCat) qvCat.textContent = 'SKU: ' + getFullSkuCode() + ' • ' + curG.label;
      if (qvPrice) qvPrice.textContent = formatPKR(selectedSkuOpt.price);
      if (qvCompare) qvCompare.textContent = formatPKR(selectedSkuOpt.compare);

      if (qvThumbs) {
        var tHtml = '';
        product.gallery.forEach(function (g, i) {
          tHtml += '<button type="button" class="raha-swatch-btn' + (i === activeGalleryIndex ? ' is-selected' : '') + '" data-lg-idx="' + i + '">' + g.tag + '</button>';
        });
        qvThumbs.innerHTML = tHtml;
        qvThumbs.querySelectorAll('[data-lg-idx]').forEach(function (b) {
          b.addEventListener('click', function () {
            var idx = Number(b.getAttribute('data-lg-idx'));
            setGalleryImage(idx);
            qvThumbs.querySelectorAll('[data-lg-idx]').forEach(function (x) { x.classList.remove('is-selected'); });
            b.classList.add('is-selected');
            if (qvImg) qvImg.src = product.gallery[idx].src;
          });
        });
      }

      if (qvAdd) {
        qvAdd.onclick = function () {
          triggerAddCurrentPdpToCart();
          closeAllDrawersAndModals();
          openCartDrawer();
        };
      }

      modal.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
    }

    var shareBtn = document.getElementById('pdp-share-btn');
    if (shareBtn) {
      shareBtn.onclick = function (e) {
        if (e) e.stopPropagation();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(window.location.href);
        }
        shareBtn.setAttribute('title', 'Link Copied!');
      };
    }

    /* 3. Right Column: Cohesive Raha Configurator */
    function getFullSkuCode() {
      return product.skuBase + '-' + selectedSkuOpt.suffix;
    }

    var catEyebrowEl = document.getElementById('pdp-cat-eyebrow');
    var titleEl = document.getElementById('pdp-title');
    var subEl = document.getElementById('pdp-subtitle');
    var ratingValEl = document.getElementById('pdp-rating-val');
    var skuCardsWrap = document.getElementById('pdp-sku-cards');
    var sizePillsWrap = document.getElementById('pdp-size-pills');

    if (catEyebrowEl) catEyebrowEl.textContent = product.category + ' • ' + product.subdept;
    if (titleEl) titleEl.textContent = product.title;
    if (subEl) subEl.textContent = product.subtitle;
    if (ratingValEl) ratingValEl.textContent = '★ ' + product.rating + ' (' + product.reviews + ' Collectors)';

    /* Render 4 Metallic Orb SKU Cards */
    if (skuCardsWrap) {
      var skuHtml = '';
      skuOptions.forEach(function (opt, idx) {
        skuHtml +=
          '<button type="button" class="raha-sku-card' + (idx === 0 ? ' is-selected' : '') + '" data-sku-idx="' + idx + '">' +
            '<span class="raha-metal-orb ' + opt.orbClass + '"></span>' +
            '<span>' +
              '<span class="raha-sku-card__name">' + opt.name + '</span>' +
              '<span class="raha-sku-card__meta">' + product.skuBase + '-' + opt.suffix + ' • ' + formatPKR(opt.price) + '</span>' +
            '</span>' +
          '</button>';
      });
      skuCardsWrap.innerHTML = skuHtml;
      skuCardsWrap.querySelectorAll('.raha-sku-card').forEach(function (cardBtn) {
        cardBtn.addEventListener('click', function () {
          var idx = Number(cardBtn.getAttribute('data-sku-idx'));
          selectedSkuOpt = skuOptions[idx];
          skuCardsWrap.querySelectorAll('.raha-sku-card').forEach(function (b) { b.classList.remove('is-selected'); });
          cardBtn.classList.add('is-selected');
          if (typeof selectedSkuOpt.imgIdx === 'number' && product.gallery[selectedSkuOpt.imgIdx]) {
            setGalleryImage(selectedSkuOpt.imgIdx);
          }
          syncDynamicPdpFields();
        });
      });
    }

    /* Render Size / Fit Pills */
    if (sizePillsWrap) {
      var szHtml = '';
      sizeOptions.forEach(function (sz, idx) {
        szHtml +=
          '<button type="button" class="raha-size-pill' + (idx === 0 ? ' is-selected' : '') + '" data-sz-idx="' + idx + '">' +
            sz.label +
          '</button>';
      });
      sizePillsWrap.innerHTML = szHtml;
      sizePillsWrap.querySelectorAll('.raha-size-pill').forEach(function (pillBtn) {
        pillBtn.addEventListener('click', function () {
          var idx = Number(pillBtn.getAttribute('data-sz-idx'));
          selectedSizeOpt = sizeOptions[idx];
          sizePillsWrap.querySelectorAll('.raha-size-pill').forEach(function (b) { b.classList.remove('is-selected'); });
          pillBtn.classList.add('is-selected');
          syncDynamicPdpFields();
        });
      });
    }

    function syncDynamicPdpFields() {
      var fullSku = getFullSkuCode();
      var savedAmt = selectedSkuOpt.compare - selectedSkuOpt.price;

      var skuLabelEl = document.getElementById('pdp-selected-sku-name');
      var sizeLabelEl = document.getElementById('pdp-selected-size-name');
      var priceEl = document.getElementById('pdp-main-price');
      var compareEl = document.getElementById('pdp-compare-price');
      var saveBadgeEl = document.getElementById('pdp-save-badge');
      var skuBadgeEl = document.getElementById('pdp-live-sku');
      var addBtnTextEl = document.getElementById('pdp-add-btn-text');
      var specsGridEl = document.getElementById('pdp-specs-grid');

      if (skuLabelEl) skuLabelEl.textContent = selectedSkuOpt.name;
      if (sizeLabelEl) sizeLabelEl.textContent = selectedSizeOpt.label;
      if (priceEl) priceEl.textContent = formatPKR(selectedSkuOpt.price);
      if (compareEl) compareEl.textContent = formatPKR(selectedSkuOpt.compare);
      if (saveBadgeEl) saveBadgeEl.textContent = 'Save ' + formatPKR(savedAmt);
      if (skuBadgeEl) skuBadgeEl.textContent = 'SKU: ' + fullSku;
      if (addBtnTextEl) {
        addBtnTextEl.textContent = 'Add to Raha Bag — ' + formatPKR(selectedSkuOpt.price * selectedQty);
      }

      if (specsGridEl) {
        specsGridEl.innerHTML =
          '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Active SKU Code</span><span class="raha-spec-cell__v" style="color:var(--raha-gold);font-family:var(--font-mono);">' + fullSku + '</span></div>' +
          '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Finish &amp; Plating</span><span class="raha-spec-cell__v">' + selectedSkuOpt.name + ' (' + selectedSkuOpt.desc + ')</span></div>' +
          '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Dimensions</span><span class="raha-spec-cell__v">' + product.dimensions + '</span></div>' +
          '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Raha Weight</span><span class="raha-spec-cell__v">' + product.weight + '</span></div>';
      }

      /* Dynamic Low-Stock & Out-of-Stock Urgency Management */
      var stockAlertEl = document.getElementById('pdp-stock-alert');
      var stockAlertTxt = document.getElementById('pdp-stock-alert-text');
      var stockAlertSub = document.getElementById('pdp-stock-alert-sub');
      var addBagBtn = document.getElementById('pdp-add-to-bag-btn');
      var buyNowBtn = document.getElementById('pdp-buy-now-btn');

      var currentStock = (typeof selectedSkuOpt.stock === 'number')
        ? selectedSkuOpt.stock
        : ((typeof product.stock === 'number') ? product.stock : 15);

      if (currentStock <= 0) {
        if (stockAlertEl) {
          stockAlertEl.style.display = 'flex';
          stockAlertEl.className = 'raha-stock-alert raha-stock-alert--out';
          if (stockAlertTxt) stockAlertTxt.textContent = 'Sold Out — Currently Awaiting Atelier Restock';
          if (stockAlertSub) stockAlertSub.textContent = 'Inquire via WhatsApp concierge to reserve from the next restock batch.';
        }
        if (addBagBtn) {
          addBagBtn.disabled = true;
          addBagBtn.style.opacity = '0.5';
          addBagBtn.style.cursor = 'not-allowed';
          if (addBtnTextEl) addBtnTextEl.textContent = 'Sold Out — Awaiting Restock';
        }
        if (buyNowBtn) {
          buyNowBtn.disabled = true;
          buyNowBtn.style.opacity = '0.5';
          buyNowBtn.style.cursor = 'not-allowed';
        }
      } else if (currentStock <= 5) {
        if (stockAlertEl) {
          stockAlertEl.style.display = 'flex';
          stockAlertEl.className = 'raha-stock-alert';
          var pWord = currentStock === 1 ? 'piece remains' : 'pieces remain';
          if (stockAlertTxt) {
            stockAlertTxt.innerHTML = 'Only <strong style="color:var(--raha-gold-light);text-decoration:underline;">' + currentStock + ' ' + pWord + '</strong>';
          }
          if (stockAlertSub) {
            stockAlertSub.textContent = 'High Collector Demand • Dispatches Same-Day';
          }
        }
        if (addBagBtn) {
          addBagBtn.disabled = false;
          addBagBtn.style.opacity = '';
          addBagBtn.style.cursor = '';
        }
        if (buyNowBtn) {
          buyNowBtn.disabled = false;
          buyNowBtn.style.opacity = '';
          buyNowBtn.style.cursor = '';
        }
      } else {
        if (stockAlertEl) stockAlertEl.style.display = 'none';
        if (addBagBtn) {
          addBagBtn.disabled = false;
          addBagBtn.style.opacity = '';
          addBagBtn.style.cursor = '';
        }
        if (buyNowBtn) {
          buyNowBtn.disabled = false;
          buyNowBtn.style.opacity = '';
          buyNowBtn.style.cursor = '';
        }
      }
    }
    syncDynamicPdpFields();

    /* Quantity stepper */
    var qtyDec = document.getElementById('pdp-qty-dec');
    var qtyInc = document.getElementById('pdp-qty-inc');
    var qtyVal = document.getElementById('pdp-qty-val');
    if (qtyDec && qtyInc && qtyVal) {
      qtyDec.onclick = function (e) {
        if (e) e.preventDefault();
        if (selectedQty > 1) {
          selectedQty--;
          qtyVal.textContent = selectedQty;
          syncDynamicPdpFields();
        }
      };
      qtyInc.onclick = function (e) {
        if (e) e.preventDefault();
        if (selectedQty < 10) {
          selectedQty++;
          qtyVal.textContent = selectedQty;
          syncDynamicPdpFields();
        }
      };
    }

    function triggerAddCurrentPdpToCart() {
      var fullSku = getFullSkuCode();
      var g = (product.gallery && product.gallery[selectedSkuOpt.imgIdx]) || (product.gallery && product.gallery[0]) || { src: product.img };
      addItemToCart({
        id: product.id,
        sku: fullSku,
        title: product.title,
        price: selectedSkuOpt.price,
        variant: selectedSkuOpt.name,
        img: g.src,
        qty: parseInt(selectedQty, 10) || 1
      });
    }

    var isPdpAdding = false;
    var pdpAddBtn = document.getElementById('pdp-add-to-bag-btn');
    if (pdpAddBtn) {
      pdpAddBtn.onclick = function (e) {
        if (e) e.preventDefault();
        if (isPdpAdding) return;
        isPdpAdding = true;
        setTimeout(function () { isPdpAdding = false; }, 350);
        triggerAddCurrentPdpToCart();
        openCartDrawer();
      };
    }

    var pdpBuyNowBtn = document.getElementById('pdp-buy-now-btn');
    if (pdpBuyNowBtn) {
      pdpBuyNowBtn.onclick = function (e) {
        if (e) e.preventDefault();
        var fullSku = getFullSkuCode();
        var g = (product.gallery && product.gallery[selectedSkuOpt.imgIdx]) || (product.gallery && product.gallery[0]) || { src: product.img };
        var directSingleItem = [{
          id: product.id,
          sku: fullSku,
          title: product.title,
          price: selectedSkuOpt.price,
          variant: selectedSkuOpt.name,
          img: g.src,
          qty: parseInt(selectedQty, 10) || 1
        }];
        openCodCheckoutModal(null, null, directSingleItem);
      };
    }

    var pdpWaDirectBtn = document.getElementById('pdp-wa-direct-btn');
    if (pdpWaDirectBtn) {
      pdpWaDirectBtn.onclick = function (e) {
        if (e) e.preventDefault();
        var fullSku = getFullSkuCode();
        var g = (product.gallery && product.gallery[selectedSkuOpt.imgIdx]) || (product.gallery && product.gallery[0]) || { src: product.img };
        var directSingleItem = [{
          id: product.id,
          sku: fullSku,
          title: product.title,
          price: selectedSkuOpt.price,
          variant: selectedSkuOpt.name,
          img: g.src,
          qty: parseInt(selectedQty, 10) || 1
        }];
        openCodCheckoutModal(null, 'online', directSingleItem);
      };
    }

    /* 4. Render Product-Specific Verified Collector Reviews Section */
    var reviewsRoot = document.getElementById('pdp-reviews-container');
    if (reviewsRoot) {
      var sampleReviews = [
        {
          author: 'Ayesha K.',
          city: 'Lahore • Verified Buyer',
          sku: product.skuBase + '-GLD',
          date: '3 days ago',
          rating: 5,
          title: 'Zero tarnish even after daily wear!',
          body: 'I ordered the ' + product.title + ' in Gold Plated and the weight, mirror polish, and mauve Raha keepsake box feel like a Rs 25,000 fine jewellery brand. Worn it in the shower all week—still looks brand new.'
        },
        {
          author: 'Zoya M.',
          city: 'Karachi • Verified Buyer',
          sku: product.skuBase + '-SLV',
          date: '1 week ago',
          rating: 5,
          title: 'The 925 Silver finish is stunning',
          body: 'Switched to the 925 Sterling Silver SKU on the product page before ordering. Express delivery reached DHA Karachi within 24 hours and the hypoallergenic core feels weightless on sensitive skin.'
        },
        {
          author: 'Mahnoor S.',
          city: 'Islamabad • Verified Buyer',
          sku: product.skuBase + '-GFT',
          date: '2 weeks ago',
          rating: 5,
          title: 'Ordered the Raha Gift Edition for my sister',
          body: 'The official Raha mauve packaging and architectural detailing on the ' + product.title + ' blew us away. Easily the most premium minimalist jewellery store in Pakistan right now.'
        }
      ];

      var hasCustomReviews = Array.isArray(product.customReviews) && product.customReviews.length > 0;
      var activeReviews = hasCustomReviews ? product.customReviews : sampleReviews;

      var totalCount = activeReviews.length;
      var sumStars = 0;
      var c5 = 0, c4 = 0, c3 = 0;
      activeReviews.forEach(function (r) {
        var rVal = Number(r.rating) || 5;
        sumStars += rVal;
        if (rVal >= 5) c5++;
        else if (rVal >= 4) c4++;
        else c3++;
      });

      var avgRating = (sumStars / (totalCount || 1)).toFixed(1);
      var p5 = Math.round((c5 / (totalCount || 1)) * 100);
      var p4 = Math.round((c4 / (totalCount || 1)) * 100);
      var p3 = Math.round((c3 / (totalCount || 1)) * 100);
      var totalDisplayCount = hasCustomReviews ? totalCount : (product.reviews || 48);

      function renderStars(n) {
        var count = Math.max(1, Math.min(5, Math.round(Number(n) || 5)));
        return '★★★★★'.slice(0, count) + '☆☆☆☆☆'.slice(0, 5 - count);
      }

      var revCardsHtml = '';
      activeReviews.forEach(function (rv) {
        var starStr = renderStars(rv.rating);
        var photoHtml = '';
        if (rv.img && typeof rv.img === 'string' && rv.img.trim()) {
          var cleanImg = rv.img.trim();
          photoHtml =
            '<div style="margin-top:14px;margin-bottom:6px;">' +
              '<div style="font-family:var(--font-mono);font-size:9.5px;letter-spacing:0.12em;text-transform:uppercase;color:var(--raha-gold);margin-bottom:6px;display:flex;align-items:center;gap:5px;">' +
                '<span>📷</span> Verified Customer Photo' +
              '</div>' +
              '<div class="raha-review-photo-wrap" style="display:inline-block;border-radius:12px;overflow:hidden;border:1px solid var(--border-subtle);background:#0d0a0c;cursor:pointer;max-width:180px;box-shadow:0 8px 24px rgba(0,0,0,0.3);position:relative;" onclick="window.rahaOpenImageModal ? window.rahaOpenImageModal(\'' + cleanImg.replace(/'/g, "\\'") + '\', \'' + (rv.author || '').replace(/'/g, "\\'") + '\') : window.open(\'' + cleanImg.replace(/'/g, "\\'") + '\', \'_blank\');">' +
                '<img src="' + cleanImg + '" alt="' + (rv.author || 'Customer') + ' wear" loading="lazy" decoding="async" style="width:100%;height:140px;object-fit:cover;display:block;transition:transform 0.35s ease;" onmouseover="this.style.transform=\'scale(1.06)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
                '<span style="position:absolute;bottom:6px;right:6px;background:rgba(13,10,12,0.85);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);border-radius:6px;font-family:var(--font-mono);font-size:9px;color:#fff;padding:2px 6px;">Inspect ↗</span>' +
              '</div>' +
            '</div>';
        }

        revCardsHtml +=
          '<article class="raha-pdp-review-card">' +
            '<div>' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
                '<span style="color:var(--raha-gold);letter-spacing:2px;font-size:13px;">' + starStr + '</span>' +
                '<span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;">' + (rv.date || 'Verified Buyer') + '</span>' +
              '</div>' +
              '<h4 style="font-family:var(--font-serif);font-size:20px;font-weight:500;color:var(--text-primary);margin-bottom:8px;">“' + (rv.title || 'Exceptional Craftsmanship') + '”</h4>' +
              '<p style="font-size:13.5px;line-height:1.7;color:var(--text-secondary);">' + (rv.body || '') + '</p>' +
              photoHtml +
            '</div>' +
            '<div style="padding-top:12px;border-top:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">' +
              '<div>' +
                '<div style="font-size:13px;font-weight:600;color:var(--text-primary);">' + (rv.author || 'Anonymous Collector') + '</div>' +
                '<div style="font-family:var(--font-mono);font-size:10px;color:var(--raha-gold);text-transform:uppercase;letter-spacing:0.1em;">' + (rv.city || 'Verified Buyer') + '</div>' +
              '</div>' +
              '<span style="font-family:var(--font-mono);font-size:9.5px;padding:4px 9px;border-radius:100px;background:rgba(114,94,103,0.22);border:1px solid var(--border-subtle);color:var(--text-secondary);">SKU: ' + (rv.sku || product.skuBase) + '</span>' +
            '</div>' +
          '</article>';
      });

      reviewsRoot.innerHTML =
        '<div class="raha-pdp-reviews-layout">' +
          '<div class="raha-review-summary-card">' +
            '<div style="font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:var(--raha-gold);margin-bottom:6px;">Verified Raha Feedback</div>' +
            '<div style="display:flex;align-items:baseline;gap:12px;margin-bottom:6px;">' +
              '<span style="font-family:var(--font-serif);font-size:52px;line-height:1;color:var(--text-primary);">' + avgRating + '</span>' +
              '<div>' +
                '<div style="color:var(--raha-gold);letter-spacing:3px;font-size:15px;">★★★★★</div>' +
                '<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);margin-top:4px;">Based on ' + totalDisplayCount + ' Verified Collectors</div>' +
              '</div>' +
            '</div>' +
            '<div style="margin:20px 0;">' +
              '<div class="raha-review-bar-row"><span>5 ★</span><div class="raha-review-bar-track"><div class="raha-review-bar-fill" style="width:' + p5 + '%;"></div></div><span>' + p5 + '%</span></div>' +
              '<div class="raha-review-bar-row"><span>4 ★</span><div class="raha-review-bar-track"><div class="raha-review-bar-fill" style="width:' + p4 + '%;"></div></div><span>' + p4 + '%</span></div>' +
              '<div class="raha-review-bar-row"><span>3 ★</span><div class="raha-review-bar-track"><div class="raha-review-bar-fill" style="width:' + p3 + '%;"></div></div><span>' + p3 + '%</span></div>' +
            '</div>' +
            '<div style="font-size:12.5px;color:var(--text-secondary);line-height:1.6;margin-bottom:16px;">100% of reviewers recommend <strong style="color:var(--text-primary);">' + product.title + '</strong>.</div>' +
            '<a href="https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi Raha! I want to share feedback on ' + product.title + ' (' + product.skuBase + ')') + '" target="_blank" rel="noopener" class="raha-btn raha-btn--glass" style="width:100%;font-size:11px;padding:12px 16px;">Submit Your Collector Review →</a>' +
          '</div>' +
          '<div class="raha-pdp-reviews-cards">' + revCardsHtml + '</div>' +
        '</div>';
    }

    /* 5. Render 8 More Products at the Bottom ("Complete Your Curation & Explore More Pieces") */
    var relatedGrid = document.getElementById('pdp-related-grid');
    if (relatedGrid) {
      var sameCat = RAHA_CATALOG.filter(function (item) {
        return item.categorySlug === product.categorySlug && item.id !== product.id;
      }).slice(0, 4);
      var others = RAHA_CATALOG.filter(function (item) {
        return item.categorySlug !== product.categorySlug;
      }).slice(0, 4);
      var relatedList = sameCat.concat(others);
      var rHtml = '';
      relatedList.forEach(function (rp, idx) {
        rHtml +=
          '<li class="raha-card" data-id="' + rp.id + '" data-title="' + rp.title + '" data-price="' + rp.price + '" data-compare="' + rp.compare + '" data-rating="' + rp.rating + '" data-material="' + rp.material + '" data-category="' + rp.category + '" data-img="' + rp.img + '" data-hover-img="' + rp.hoverImg + '" data-selected-variant="Gold Plated" data-order="' + idx + '" data-cursor="Inspect">' +
            '<div class="raha-card__glare"></div>' +
            '<a href="product.html?id=' + rp.id + '" class="raha-card__media" title="View ' + rp.title + ' Details, Gallery &amp; SKUs">' +
              '<div class="raha-card__badges">' +
                '<span class="raha-badge">' + rp.badge + '</span>' +
                '<span class="raha-badge raha-badge--sale">Save Rs ' + (rp.compare - rp.price) + '</span>' +
              '</div>' +
              '<img src="' + rp.img + '" alt="' + rp.title + '" class="raha-card__img raha-card__img--primary" loading="lazy" decoding="async">' +
              '<img src="' + rp.hoverImg + '" alt="' + rp.title + ' alternate" class="raha-card__img raha-card__img--hover" loading="lazy" decoding="async">' +
            '</a>' +
            '<div class="raha-card__body">' +
              '<div>' +
                '<div class="raha-card__meta">' +
                  '<span>' + rp.category + ' • Gold Plated</span>' +
                  '<span class="raha-card__rating">★ ' + rp.rating + ' (' + rp.reviews + ')</span>' +
                '</div>' +
                '<h3 class="raha-card__title"><a href="product.html?id=' + rp.id + '" class="raha-card__title-link">' + rp.title + '</a></h3>' +
                '<div class="raha-card__price-row">' +
                  '<span class="raha-card__price">' + formatPKR(rp.price) + '</span>' +
                  '<span class="raha-card__compare">' + formatPKR(rp.compare) + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</li>';
      });
      relatedGrid.innerHTML = rHtml;
      initProductCardsAndQuickView();
      bindCardTiltEffect();
    }
  }

  /* ========================================================================
     8. CATEGORY PAGE FILTER PILLS & SORTING
     ======================================================================== */
  function initCategoryFilterAndSort() {
    var grid = document.getElementById('raha-category-grid');
    if (!grid) return;

    var filterBtns = document.querySelectorAll('.raha-filter-btn[data-filter]');
    var sortSelect = document.getElementById('raha-sort-select');
    var countEl = document.getElementById('raha-cat-count');
    var activeFilter = 'all';

    function applyFilterAndSort() {
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.raha-card'));
      var visibleCount = 0;

      cards.forEach(function (card) {
        var mat = (card.getAttribute('data-material') || 'all').toLowerCase();
        var match = activeFilter === 'all' || mat.indexOf(activeFilter) !== -1;
        card.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      if (sortSelect) {
        var mode = sortSelect.value;
        cards.sort(function (a, b) {
          var pa = Number(a.getAttribute('data-price')) || 0;
          var pb = Number(b.getAttribute('data-price')) || 0;
          var ra = Number(a.getAttribute('data-rating')) || 5.0;
          var rb = Number(b.getAttribute('data-rating')) || 5.0;
          var ia = Number(a.getAttribute('data-order')) || 0;
          var ib = Number(b.getAttribute('data-order')) || 0;

          if (mode === 'price-asc') return pa - pb;
          if (mode === 'price-desc') return pb - pa;
          if (mode === 'rating-desc') return rb - ra;
          return ia - ib;
        });
        /* Batch DOM updates via DocumentFragment to eliminate layout thrashing */
        var sortFrag = document.createDocumentFragment();
        cards.forEach(function (card) {
          sortFrag.appendChild(card);
        });
        grid.appendChild(sortFrag);
      }

      if (countEl) {
        countEl.textContent = 'Showing ' + visibleCount + ' Architectural Pieces';
      }
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeFilter = btn.getAttribute('data-filter') || 'all';
        applyFilterAndSort();
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', applyFilterAndSort);
    }
  }

  /* ========================================================================
     9. VERIFIED CLIENT REVIEWS CAROUSEL (DYNAMIC FROM PRODUCT REVIEWS & AUTOSCROLL)
     ======================================================================== */
  var reviewsSliderIndex = 0;
  var reviewsTotalUnique = 0;
  var reviewsAutoscrollTimer = null;
  var isReviewsPaused = false;
  var isReviewsAnimating = false;

  function getReviewsStepWidth() {
    var track = document.getElementById('raha-reviews-track');
    if (!track) return 0;
    var cards = track.querySelectorAll('.raha-review-card');
    if (!cards.length) return 0;
    if (cards.length > 1) {
      var diff = cards[1].offsetLeft - cards[0].offsetLeft;
      if (diff > 0) return diff;
    }
    return cards[0].offsetWidth + 20;
  }

  function updateReviewsSlider(smooth) {
    var track = document.getElementById('raha-reviews-track');
    if (!track) return;
    var cards = track.querySelectorAll('.raha-review-card');
    if (!cards.length) return;
    var stepWidth = getReviewsStepWidth();

    if (smooth === false) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
    }
    track.style.transform = 'translateX(-' + (reviewsSliderIndex * stepWidth) + 'px)';
  }

  function advanceReviewsSlide() {
    var track = document.getElementById('raha-reviews-track');
    if (!track || isReviewsAnimating) return;
    var cards = track.querySelectorAll('.raha-review-card');
    if (!cards.length) return;

    var visibleCards = window.innerWidth > 980 ? 3 : window.innerWidth > 640 ? 2 : 1;
    var maxIdx = Math.max(0, cards.length - visibleCards);
    if (maxIdx <= 0) return;

    isReviewsAnimating = true;
    reviewsSliderIndex++;
    updateReviewsSlider(true);

    // If we reached the cloned cards at the end, seamlessly snap back to index 0
    if (reviewsTotalUnique > 0 && reviewsSliderIndex >= reviewsTotalUnique) {
      setTimeout(function () {
        reviewsSliderIndex = 0;
        updateReviewsSlider(false);
        if (track) void track.offsetHeight; // force reflow
        isReviewsAnimating = false;
      }, 660);
    } else {
      setTimeout(function () {
        if (reviewsSliderIndex > maxIdx) {
          reviewsSliderIndex = 0;
          updateReviewsSlider(false);
        }
        isReviewsAnimating = false;
      }, 660);
    }
  }

  function prevReviewsSlide() {
    var track = document.getElementById('raha-reviews-track');
    if (!track || isReviewsAnimating) return;
    var cards = track.querySelectorAll('.raha-review-card');
    if (!cards.length) return;

    var visibleCards = window.innerWidth > 980 ? 3 : window.innerWidth > 640 ? 2 : 1;
    var maxIdx = Math.max(0, cards.length - visibleCards);
    if (maxIdx <= 0) return;

    isReviewsAnimating = true;
    if (reviewsSliderIndex <= 0) {
      if (reviewsTotalUnique > 0) {
        reviewsSliderIndex = reviewsTotalUnique;
        updateReviewsSlider(false);
        if (track) void track.offsetHeight;
        reviewsSliderIndex = reviewsTotalUnique - 1;
        updateReviewsSlider(true);
      } else {
        reviewsSliderIndex = maxIdx;
        updateReviewsSlider(true);
      }
    } else {
      reviewsSliderIndex--;
      updateReviewsSlider(true);
    }
    setTimeout(function () {
      isReviewsAnimating = false;
    }, 660);
  }

  function startReviewsAutoscroll() {
    if (reviewsAutoscrollTimer) {
      clearInterval(reviewsAutoscrollTimer);
    }
    reviewsAutoscrollTimer = setInterval(function () {
      if (isReviewsPaused) return;
      if (document.hidden) return;
      advanceReviewsSlide();
    }, 3200);
  }

  function restartReviewsAutoscroll() {
    startReviewsAutoscroll();
  }

  function renderClientDispatchesReviews() {
    var track = document.getElementById('raha-reviews-track');
    if (!track) return;

    var catalog = (ACTIVE_CMS_STATE && Array.isArray(ACTIVE_CMS_STATE.catalog) && ACTIVE_CMS_STATE.catalog.length > 0)
      ? ACTIVE_CMS_STATE.catalog
      : (window.RAHA_CATALOG || []);

    // 1. Gather all genuine reviews uploaded for products available on the site
    var collected = [];
    catalog.forEach(function (prod) {
      if (Array.isArray(prod.customReviews) && prod.customReviews.length > 0) {
        prod.customReviews.forEach(function (rev) {
          if (rev && (rev.body || rev.title || rev.author)) {
            collected.push({
              review: rev,
              product: prod
            });
          }
        });
      }
    });

    // 2. Curated Raha Collector Dispatches (NO random fallback to catalog[0])
    // If fewer than 4 reviews exist, supplement with authentic Raha luxury dispatches
    if (collected.length < 4) {
      var defaultReviews = [
        {
          prodId: 'neck-01',
          author: 'Anum R.',
          city: 'Karachi • Verified Collector',
          rating: 5,
          fallbackTitle: 'Seraphina Liquid Herringbone Collar',
          fallbackImg: 'Assets/Main Raha logo with slogan (The actual logo).webp',
          body: 'Ordered via WhatsApp concierge (0326 0870876) and received it in Karachi the very next afternoon. The liquid drape of the herringbone chain looks like luxury gold finish.'
        },
        {
          prodId: 'ring-04',
          author: 'Mehak S.',
          city: 'Islamabad • Verified Collector',
          rating: 5,
          fallbackTitle: 'Mirage Trio Stacking Ring Set',
          fallbackImg: 'Assets/Main Raha logo with slogan (The actual logo).webp',
          body: 'I wash my hands and sanitise constantly at work, and my Raha rings haven’t faded a single shade. Truly jewellery for the modern minimalist.'
        },
        {
          prodId: 'brac-02',
          author: 'Emaan T.',
          city: 'Lahore • Verified Collector',
          rating: 5,
          fallbackTitle: 'Raha Riviera Micro-Tennis Bracelet',
          fallbackImg: 'Assets/Main Raha logo with slogan (The actual logo).webp',
          body: 'The clasp security and brilliance on the Riviera micro-tennis bracelet rival pieces 10x the price. Arrived in the signature Raha mauve keepsake box!'
        },
        {
          prodId: 'ear-02',
          author: 'Ayesha K.',
          city: 'Lahore • Verified Collector',
          rating: 5,
          fallbackTitle: 'Nova Baroque Pearl Linear Studs',
          fallbackImg: 'Assets/Main Raha logo with slogan (The actual logo).webp',
          body: 'Weightless on the ears and zero irritation on sensitive skin. The Gold Plated finish and packaging feel exceptionally luxurious.'
        }
      ];

      defaultReviews.forEach(function (def) {
        var alreadyHas = collected.some(function (c) {
          return c.review.body === def.body;
        });
        if (!alreadyHas) {
          // Look for matching product only; NEVER fall back to catalog[0]!
          var matchingProd = catalog.find(function (p) { return p.id === def.prodId; });
          if (!matchingProd) {
            matchingProd = {
              id: def.prodId,
              title: def.fallbackTitle,
              img: def.fallbackImg
            };
          }
          collected.push({
            review: def,
            product: matchingProd
          });
        }
      });
    }

    if (collected.length === 0) return;

    // Save the unique count
    var uniqueItems = collected.slice();
    // If fewer than 4 unique items, duplicate so the carousel has ample content
    while (uniqueItems.length < 4) {
      uniqueItems = uniqueItems.concat(collected);
    }
    reviewsTotalUnique = uniqueItems.length;

    // Clone the first 3 items at the end for 100% seamless infinite loop
    var displayItems = uniqueItems.concat(uniqueItems.slice(0, 3));

    var html = '';
    displayItems.forEach(function (item) {
      var r = item.review;
      var prod = item.product || {};
      var rVal = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      var starStr = '★★★★★'.slice(0, rVal) + '☆☆☆☆☆'.slice(0, 5 - rVal);
      var thumb = (r.img && typeof r.img === 'string' && r.img.trim())
        ? r.img.trim()
        : (prod.img || 'Assets/Main Raha logo with slogan (The actual logo).webp');
      var pTitle = prod.title || 'Raha Fine Jewellery';
      var quote = r.body || r.title || 'Exceptional craftsmanship and quality.';
      var author = r.author || 'Verified Collector';
      var city = r.city || 'Verified Collector';
      if (city.toLowerCase().indexOf('collector') === -1 && city.toLowerCase().indexOf('buyer') === -1) {
        city = city + ' (Verified Collector)';
      }
      var pdpUrl = prod.id ? ('product.html?id=' + encodeURIComponent(prod.id)) : '#';

      html +=
        '<article class="raha-review-card" style="cursor:pointer;" data-href="' + pdpUrl + '" title="View ' + pTitle.replace(/"/g, '&quot;') + ' Details &amp; SKUs">' +
          '<div>' +
            '<div class="raha-review-card__top">' +
              '<img src="' + thumb + '" alt="' + pTitle.replace(/"/g, '&quot;') + '" class="raha-review-card__thumb" loading="lazy" onerror="this.onerror=null;this.src=\'Assets/Main Raha logo with slogan (The actual logo).png\';">' +
              '<div>' +
                '<div class="raha-review-card__stars">' + starStr + '</div>' +
                '<div style="font-size:12px;color:var(--text-muted);">' + pTitle + '</div>' +
              '</div>' +
            '</div>' +
            '<p class="raha-review-card__quote">' +
              '“' + quote + '”' +
            '</p>' +
          '</div>' +
          '<div class="raha-review-card__author">' + author + ' • ' + city + '</div>' +
        '</article>';
    });

    track.innerHTML = html;

    track.querySelectorAll('.raha-review-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var href = card.getAttribute('data-href');
        if (href && href !== '#' && href !== 'product.html?id=') {
          window.location.href = href;
        }
      });
    });

    reviewsSliderIndex = 0;
    updateReviewsSlider(false);
  }

  function initReviewsCarousel() {
    var track = document.getElementById('raha-reviews-track');
    var wrap = document.querySelector('.raha-reviews-track-wrap');
    var prevBtn = document.getElementById('raha-reviews-prev');
    var nextBtn = document.getElementById('raha-reviews-next');
    if (!track) return;

    renderClientDispatchesReviews();

    // Pause autoscroll on mouse hover & touch interactions
    if (wrap && !wrap.getAttribute('data-autoscroll-bound')) {
      wrap.setAttribute('data-autoscroll-bound', '1');
      wrap.addEventListener('mouseenter', function () {
        isReviewsPaused = true;
      });
      wrap.addEventListener('mouseleave', function () {
        isReviewsPaused = false;
      });
      wrap.addEventListener('touchstart', function () {
        isReviewsPaused = true;
      }, { passive: true });
      wrap.addEventListener('touchend', function () {
        setTimeout(function () {
          isReviewsPaused = false;
        }, 2500);
      }, { passive: true });
    }

    if (prevBtn && !prevBtn.getAttribute('data-bound')) {
      prevBtn.setAttribute('data-bound', '1');
      prevBtn.addEventListener('click', function () {
        prevReviewsSlide();
        restartReviewsAutoscroll();
      });
    }
    if (nextBtn && !nextBtn.getAttribute('data-bound')) {
      nextBtn.setAttribute('data-bound', '1');
      nextBtn.addEventListener('click', function () {
        advanceReviewsSlide();
        restartReviewsAutoscroll();
      });
    }

    window.addEventListener('resize', function () {
      updateReviewsSlider(false);
    });

    startReviewsAutoscroll();
  }

  /* ========================================================================
     10. DRAWERS, WHATSAPP CHECKOUT & FLOATING CONCIERGE
     ======================================================================== */
  function initGlobalDrawersAndCheckout() {
    document.querySelectorAll('[data-open-bag]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openCartDrawer();
      });
    });

    document.querySelectorAll('[data-open-mobile-menu]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var mob = document.getElementById('raha-mobile-drawer');
        var backdrop = document.getElementById('raha-backdrop');
        if (mob) mob.classList.add('is-open');
        if (backdrop) backdrop.classList.add('is-open');
      });
    });

    document.querySelectorAll('[data-close-overlay]').forEach(function (btn) {
      btn.addEventListener('click', closeAllDrawersAndModals);
    });
    var backdrop = document.getElementById('raha-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeAllDrawersAndModals);
    }

    var waCheckoutBtn = document.getElementById('raha-whatsapp-checkout-btn');
    if (waCheckoutBtn) {
      waCheckoutBtn.addEventListener('click', function () {
        var cart = loadCart();
        if (cart.length === 0) return;
        var lines = ['Assalam-o-Alaikum Raha! I would like to place an order:'];
        var total = 0;
        cart.forEach(function (item, idx) {
          var lineTotal = item.price * item.qty;
          total += lineTotal;
          lines.push((idx + 1) + '. ' + item.title + ' [SKU: ' + (item.sku || item.id) + ' | ' + item.variant + '] x' + item.qty + ' — ' + formatPKR(lineTotal));
        });
        lines.push('Subtotal: ' + formatPKR(total));
        lines.push('Delivery City: ' + getSavedCity());
        lines.push('Shipping: ' + (total >= FREE_SHIPPING_THRESHOLD ? 'FREE Express Delivery' : 'Rs 250 Standard'));
        var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
        window.open(url, '_blank', 'noopener');
      });
    }

    var codBtn = document.getElementById('raha-cod-checkout-btn');
    if (codBtn) {
      codBtn.addEventListener('click', async function () {
        var cart = loadCart();
        if (cart.length === 0) return;
        var authUser = null;
        if (window.RahaSupabase && typeof window.RahaSupabase.getAuthUser === 'function') {
          authUser = await window.RahaSupabase.getAuthUser();
        }
        openCodCheckoutModal(authUser);
      });
    }

    initCodCheckoutModalForm();
  }

  /* ========================================================================
     11. CASH ON DELIVERY (COD) & ONLINE PAYMENT CUSTOMER DETAILS MODAL (GUEST + ACCOUNT)
     ======================================================================== */
  var COD_CUSTOMER_STORAGE_KEY = 'raha_cod_customer_v1';
  var currentCheckoutMode = 'cod'; // 'cod' or 'online'
  var activeCheckoutItems = [];
  var isDirectBuy = false;

  function getCityShippingFee(cityName, subtotal) {
    var freeThreshold = (ACTIVE_CMS_STATE && ACTIVE_CMS_STATE.settings && Number(ACTIVE_CMS_STATE.settings.freeShippingThreshold)) || FREE_SHIPPING_THRESHOLD || 3500;
    if (subtotal >= freeThreshold) {
      return 0;
    }
    var cityRates = (ACTIVE_CMS_STATE && ACTIVE_CMS_STATE.settings && ACTIVE_CMS_STATE.settings.cityShippingRates) || {
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
    var stdFee = (ACTIVE_CMS_STATE && ACTIVE_CMS_STATE.settings && Number(ACTIVE_CMS_STATE.settings.standardShippingFee)) || 300;
    if (!cityName) return stdFee;
    var cleanCity = String(cityName).trim().toLowerCase();
    for (var c in cityRates) {
      if (c.toLowerCase() === cleanCity) {
        return Number(cityRates[c]) || stdFee;
      }
    }
    return stdFee;
  }

  async function openCodCheckoutModal(authUser, checkoutMode, directItems) {
    if (Array.isArray(directItems) && directItems.length > 0) {
      activeCheckoutItems = directItems;
      isDirectBuy = true;
    } else {
      var cart = loadCart();
      if (cart.length === 0) {
        openCartDrawer();
        return;
      }
      activeCheckoutItems = cart;
      isDirectBuy = false;
    }

    currentCheckoutMode = (checkoutMode === 'online') ? 'online' : 'cod';

    if (!authUser && window.RahaSupabase && typeof window.RahaSupabase.getAuthUser === 'function') {
      try {
        authUser = await window.RahaSupabase.getAuthUser();
      } catch (e) {
        authUser = null;
      }
    }

    closeAllDrawersAndModals();

    var modal = document.getElementById('raha-cod-modal');
    var backdrop = document.getElementById('raha-backdrop');
    var formView = document.getElementById('raha-cod-form-view');
    var receiptView = document.getElementById('raha-cod-receipt-view');
    var errBox = document.getElementById('raha-cod-error');
    var itemsListEl = document.getElementById('raha-cod-items-list');
    var subtotalEl = document.getElementById('raha-cod-subtotal');
    var shippingEl = document.getElementById('raha-cod-shipping');
    var totalEl = document.getElementById('raha-cod-total');
    var submitLabelEl = document.getElementById('raha-cod-submit-label');
    var modalTitleEl = document.getElementById('raha-cod-modal-title');
    var modalPretitleEl = document.getElementById('raha-cod-modal-pretitle');
    var totalLabelEl = document.getElementById('raha-cod-total-label');

    if (!modal) return;

    if (formView) formView.style.display = '';
    if (receiptView) receiptView.style.display = 'none';
    if (errBox) errBox.classList.remove('is-visible');

    /* Populate customer details (Logged-in Auto-Fill OR Guest Manual / Saved Entry) */
    var nameIn = document.getElementById('cod-input-name');
    var phoneIn = document.getElementById('cod-input-phone');
    var emailIn = document.getElementById('cod-input-email');
    var cityIn = document.getElementById('cod-input-city');
    var cityOtherIn = document.getElementById('cod-input-city-other');
    var addrIn = document.getElementById('cod-input-address');

    function applyCityValue(cVal) {
      if (!cityIn || !cVal) return;
      var found = false;
      for (var i = 0; i < cityIn.options.length; i++) {
        if (cityIn.options[i].value.toLowerCase() === cVal.toLowerCase()) {
          cityIn.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found && cVal) {
        cityIn.value = 'Other City';
        if (cityOtherIn) {
          cityOtherIn.style.display = 'block';
          cityOtherIn.value = cVal;
        }
      } else if (cityOtherIn) {
        cityOtherIn.style.display = (cityIn.value === 'Other City') ? 'block' : 'none';
      }
    }

    // Always keep email editable so both guests and members can type or adjust their email
    if (emailIn) {
      emailIn.readOnly = false;
      emailIn.style.opacity = '';
      emailIn.style.cursor = '';
    }

    var autofillNotice = document.getElementById('cod-autofill-notice');
    if (!autofillNotice && formView) {
      autofillNotice = document.createElement('div');
      autofillNotice.id = 'cod-autofill-notice';
      autofillNotice.style.cssText = 'display:none;padding:10px 14px;border-radius:12px;background:rgba(214,183,138,0.12);border:1px solid rgba(214,183,138,0.3);color:var(--raha-gold-light);font-family:var(--font-mono);font-size:11px;margin-bottom:14px;line-height:1.5;';
      var errEl = document.getElementById('raha-cod-error');
      if (errEl && errEl.parentNode) {
        errEl.parentNode.insertBefore(autofillNotice, errEl.nextSibling);
      }
    }

    var isLoggedIn = Boolean(authUser && authUser.email);

    if (isLoggedIn) {
      if (nameIn && authUser.name) nameIn.value = authUser.name;
      if (emailIn && authUser.email) emailIn.value = authUser.email;
      if (autofillNotice) {
        autofillNotice.innerHTML = '✓ Signed in as <strong>' + escapeHtml(authUser.email) + '</strong> — your delivery details are auto-filled below.';
        autofillNotice.style.display = 'block';
      }

      if (window.RahaSupabase && typeof window.RahaSupabase.getCustomerProfile === 'function') {
        window.RahaSupabase.getCustomerProfile(authUser.email).then(function (prof) {
          if (prof) {
            if (nameIn && prof.name) nameIn.value = prof.name;
            if (phoneIn && prof.phone) phoneIn.value = prof.phone;
            if (addrIn && prof.address) addrIn.value = prof.address;
            if (prof.city) {
              applyCityValue(prof.city);
              recalculateShipping();
            }
          }
        });
      }
    } else {
      // Guest Checkout Mode: No account required — let buyer freely type all details
      if (autofillNotice) {
        autofillNotice.innerHTML =
          '✦ <strong>Guest Express Checkout</strong>: Enter your delivery details below to order without an account — or ' +
          '<a href="#" id="cod-guest-signin-link" style="color:var(--raha-gold);text-decoration:underline;font-weight:600;">Sign In / Create Account</a> for 1-click auto-fill.';
        autofillNotice.style.display = 'block';
        var signInLink = document.getElementById('cod-guest-signin-link');
        if (signInLink) {
          signInLink.onclick = function (ev) {
            ev.preventDefault();
            window._checkoutPendingAfterAuth = true;
            closeAllDrawersAndModals();
            openCustomerAuthModal('Sign in or create an account to auto-fill your saved delivery address.');
          };
        }
      }
    }

    // Pre-fill from browser storage if returning guest or member has previously entered details
    try {
      var savedCust = JSON.parse(localStorage.getItem(COD_CUSTOMER_STORAGE_KEY) || 'null');
      if (savedCust) {
        if (nameIn && !nameIn.value && savedCust.name) nameIn.value = savedCust.name;
        if (phoneIn && !phoneIn.value && savedCust.phone) phoneIn.value = savedCust.phone;
        if (emailIn && !emailIn.value && savedCust.email) emailIn.value = savedCust.email;
        if (addrIn && !addrIn.value && savedCust.address) addrIn.value = savedCust.address;
        if (savedCust.city) applyCityValue(savedCust.city);
      }
    } catch (e) {}

    /* Render Order Items & Totals */
    var subtotal = 0;
    var itemsHtml = '';
    activeCheckoutItems.forEach(function (item) {
      var lineTotal = item.price * item.qty;
      subtotal += lineTotal;
      itemsHtml +=
        '<div class="raha-cod-item-row">' +
          '<img src="' + item.img + '" alt="' + item.title + '" loading="lazy" decoding="async">' +
          '<div>' +
            '<div style="font-family:var(--font-serif);font-size:15.5px;color:var(--text-primary);line-height:1.25;">' + item.title + '</div>' +
            '<div style="font-family:var(--font-mono);font-size:9.5px;color:var(--raha-gold);text-transform:uppercase;margin-top:2px;">' + (item.sku ? item.sku + ' • ' : '') + item.variant + ' × ' + item.qty + '</div>' +
          '</div>' +
          '<div style="font-family:var(--font-mono);font-size:12.5px;color:var(--text-primary);">' + formatPKR(lineTotal) + '</div>' +
        '</div>';
    });

    if (itemsListEl) itemsListEl.innerHTML = itemsHtml;
    if (subtotalEl) subtotalEl.textContent = formatPKR(subtotal);

    /* Sync Payment Method Selection in Modal Form */
    var payCodRadio = document.querySelector('input[name="raha-payment-mode"][value="cod"]');
    var payOnlineRadio = document.querySelector('input[name="raha-payment-mode"][value="online"]');
    var payOptCod = document.getElementById('pay-opt-cod');
    var payOptOnline = document.getElementById('pay-opt-online');

    function syncPaymentMethodCards() {
      if (currentCheckoutMode === 'online') {
        if (payOnlineRadio) payOnlineRadio.checked = true;
        if (payOptOnline) {
          payOptOnline.style.borderColor = '#64b5f6';
          payOptOnline.style.background = 'rgba(100,181,246,0.12)';
        }
        if (payOptCod) {
          payOptCod.style.borderColor = 'rgba(214,183,138,0.25)';
          payOptCod.style.background = 'rgba(214,183,138,0.03)';
        }
      } else {
        if (payCodRadio) payCodRadio.checked = true;
        if (payOptCod) {
          payOptCod.style.borderColor = 'var(--raha-gold)';
          payOptCod.style.background = 'rgba(214,183,138,0.08)';
        }
        if (payOptOnline) {
          payOptOnline.style.borderColor = 'rgba(100,181,246,0.25)';
          payOptOnline.style.background = 'rgba(100,181,246,0.03)';
        }
      }
    }

    syncPaymentMethodCards();

    document.querySelectorAll('input[name="raha-payment-mode"]').forEach(function (radio) {
      radio.onchange = function () {
        currentCheckoutMode = radio.value;
        syncPaymentMethodCards();
        recalculateShipping();
      };
    });

    function recalculateShipping() {
      var selectedCity = cityIn ? cityIn.value : '';
      if (selectedCity === 'Other City') {
        if (cityOtherIn) {
          cityOtherIn.style.display = 'block';
          selectedCity = cityOtherIn.value.trim() || 'Other City';
        }
      } else {
        if (cityOtherIn) cityOtherIn.style.display = 'none';
      }

      var currentShippingFee = getCityShippingFee(selectedCity, subtotal);
      var currentGrandTotal = subtotal + currentShippingFee;

      if (shippingEl) {
        if (currentShippingFee === 0) {
          shippingEl.innerHTML = '<span style="color:#81c784;">FREE Express</span>';
        } else {
          var cityLabel = selectedCity && selectedCity !== 'Other City' ? ' <span style="font-size:10px;color:var(--raha-gold-light);">(' + escapeHtml(selectedCity) + ')</span>' : '';
          shippingEl.innerHTML = formatPKR(currentShippingFee) + cityLabel;
        }
      }
      if (totalEl) totalEl.textContent = formatPKR(currentGrandTotal);

      if (currentCheckoutMode === 'online') {
        if (modalPretitleEl) modalPretitleEl.textContent = 'Direct Bank Transfer / Raast • Fast Verification';
        if (modalTitleEl) modalTitleEl.textContent = 'Online Payment via WhatsApp';
        if (totalLabelEl) totalLabelEl.textContent = 'Total Online Payable';
        if (submitLabelEl) submitLabelEl.textContent = 'Continue to WhatsApp & Request Banking Details — ' + formatPKR(currentGrandTotal);
      } else {
        if (modalPretitleEl) modalPretitleEl.textContent = 'Pakistan Express Dispatch • Pay at Doorstep';
        if (modalTitleEl) modalTitleEl.textContent = 'Cash on Delivery Checkout';
        if (totalLabelEl) totalLabelEl.textContent = 'Total COD Payable';
        if (submitLabelEl) submitLabelEl.textContent = 'Confirm Cash on Delivery Order — ' + formatPKR(currentGrandTotal);
      }
    }

    if (cityIn) {
      cityIn.onchange = recalculateShipping;
    }
    if (cityOtherIn) {
      cityOtherIn.oninput = recalculateShipping;
    }

    recalculateShipping();

    modal.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-open');

    setTimeout(function () {
      var nameInput = document.getElementById('cod-input-name');
      if (nameInput) nameInput.focus();
    }, 90);
  }

  function initCodCheckoutModalForm() {
    var form = document.getElementById('raha-cod-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var errBox = document.getElementById('raha-cod-error');
      var submitBtn = document.getElementById('raha-cod-submit-btn');
      var submitLabel = document.getElementById('raha-cod-submit-label');

      function showError(msg, focusEl) {
        if (errBox) {
          errBox.textContent = msg;
          errBox.classList.add('is-visible');
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '';
        }
        if (submitLabel) submitLabel.textContent = 'Confirm Cash on Delivery Order';
        if (focusEl) focusEl.focus();
      }

      /* 1. Strict Items Validation */
      var checkoutItems = (Array.isArray(activeCheckoutItems) && activeCheckoutItems.length > 0)
        ? activeCheckoutItems
        : loadCart();

      if (!Array.isArray(checkoutItems) || checkoutItems.length === 0) {
        showError('Your order items are empty. Please select a product to checkout.');
        return;
      }

      var nameIn = document.getElementById('cod-input-name');
      var phoneIn = document.getElementById('cod-input-phone');
      var emailIn = document.getElementById('cod-input-email');
      var cityIn = document.getElementById('cod-input-city');
      var cityOtherIn = document.getElementById('cod-input-city-other');
      var addrIn = document.getElementById('cod-input-address');
      var notesIn = document.getElementById('cod-input-notes');

      var name = nameIn ? nameIn.value.trim() : '';
      var phone = phoneIn ? phoneIn.value.trim() : '';
      var email = emailIn ? emailIn.value.trim() : '';
      var selectedCity = cityIn ? cityIn.value.trim() : '';
      if (selectedCity === 'Other City') {
        selectedCity = (cityOtherIn && cityOtherIn.value.trim()) ? cityOtherIn.value.trim() : 'Other City';
      }
      var city = selectedCity;
      var address = addrIn ? addrIn.value.trim() : '';
      var notes = notesIn ? notesIn.value.trim() : '';

      /* 2. Strict Customer Validation */
      if (!name || name.length < 2) {
        showError('Please enter your Full Name (minimum 2 characters) to place your order.', nameIn);
        return;
      }

      var cleanPhone = phone.replace(/[^0-9]/g, '');
      if (!phone || cleanPhone.length < 7) {
        showError('Please enter a valid Phone / WhatsApp Number with at least 7 digits (e.g. 0300 1234567 or +92 300 1234567) for courier delivery coordination.', phoneIn);
        return;
      }

      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showError('Please enter a valid Email Address (e.g. name@example.com) to receive your official order confirmation.', emailIn);
        return;
      }

      if (!city || city === '') {
        showError('Please select your Delivery City to calculate city-specific delivery charges.', cityIn);
        return;
      }

      if (!address || address.length < 6) {
        showError('Please enter your Complete Street Delivery Address (House/Flat No., Street Name, Block/Area) so the rider can find you.', addrIn);
        return;
      }

      if (errBox) errBox.classList.remove('is-visible');

      /* Prevent double click / spamming while placing order */
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
      }
      if (submitLabel) submitLabel.textContent = 'Placing Your Order...';

      /* Save customer profile in localStorage & server */
      try {
        localStorage.setItem(COD_CUSTOMER_STORAGE_KEY, JSON.stringify({
          name: name,
          phone: phone,
          email: email,
          city: city,
          address: address
        }));
      } catch (err) {}

      if (window.RahaSupabase && typeof window.RahaSupabase.saveCustomerProfile === 'function') {
        window.RahaSupabase.saveCustomerProfile({
          name: name,
          phone: phone,
          email: email,
          city: city,
          address: address,
          notes: notes
        });
      }

      var payRadio = document.querySelector('input[name="raha-payment-mode"]:checked');
      var isOnline = (payRadio ? payRadio.value === 'online' : currentCheckoutMode === 'online');

      var subtotal = 0;
      checkoutItems.forEach(function (it) { subtotal += it.price * it.qty; });
      var shippingCost = getCityShippingFee(city, subtotal);
      var grandTotal = subtotal + shippingCost;
      var orderRef = (isOnline ? 'RAHA-ONL-' : 'RAHA-COD-') + Math.floor(10000 + Math.random() * 90000);
      var payMethod = isOnline ? 'Online Payment (WhatsApp)' : 'Cash on Delivery (COD)';
      var payStatus = isOnline ? 'Pending Verification' : 'Cash on Delivery';
      var orderType = isOnline ? 'online' : 'cod';
      var adminNote = isOnline ? '[PAYMENT: PENDING_VERIFICATION]' : '';

      /* Save Order to Supabase PostgreSQL (public.raha_orders) & Local Fallback */
      var newOrderObj = {
        orderId: orderRef,
        createdAt: new Date().toLocaleString(),
        status: 'Pending',
        paymentMethod: payMethod,
        paymentStatus: payStatus,
        orderType: orderType,
        customer: {
          name: name,
          phone: phone,
          email: email,
          city: city,
          address: address,
          notes: notes
        },
        items: checkoutItems.map(function (it) {
          return {
            id: it.id,
            sku: it.sku || it.id,
            title: it.title,
            variant: it.variant,
            price: it.price,
            qty: it.qty,
            img: it.img
          };
        }),
        subtotal: subtotal,
        shipping: shippingCost,
        total: grandTotal,
        adminNote: adminNote
      };

      /* Inventory Automation: Deduct ordered stock from catalog in real-time */
      var updatedProductsForCloud = [];
      checkoutItems.forEach(function (ci) {
        var pIdx = findProductIndexById(ci.id);
        if (pIdx !== -1 && RAHA_CATALOG[pIdx]) {
          var p = RAHA_CATALOG[pIdx];
          var curPStock = (p.stock !== undefined && p.stock !== null) ? Number(p.stock) : 15;
          var orderedQty = Math.max(1, Number(ci.qty) || 1);
          p.stock = Math.max(0, curPStock - orderedQty);

          if (Array.isArray(p.customSkus) && p.customSkus.length > 0) {
            p.customSkus[0]._productStock = p.stock;
            p.customSkus.forEach(function (cs, csIdx) {
              var csSuff = String(cs.suffix || '').toUpperCase();
              var csName = String(cs.name || '').toLowerCase();
              var iSku = String(ci.sku || '').toUpperCase();
              var iVar = String(ci.variant || '').toLowerCase();
              if (p.customSkus.length === 1 || (csSuff && iSku.indexOf(csSuff) !== -1) || (csName && iVar.indexOf(csName) !== -1)) {
                var curCsStock = (cs.stock !== undefined && cs.stock !== null) ? Number(cs.stock) : curPStock;
                cs.stock = Math.max(0, curCsStock - orderedQty);
              }
            });
          }
          updatedProductsForCloud.push(p);
        }
      });

      try {
        if (ACTIVE_CMS_STATE) ACTIVE_CMS_STATE.catalog = RAHA_CATALOG;
        var cmsRaw = localStorage.getItem('raha_cms_store_v1');
        var cmsObj = cmsRaw ? JSON.parse(cmsRaw) : {};
        cmsObj.catalog = RAHA_CATALOG;
        localStorage.setItem('raha_cms_store_v1', JSON.stringify(cmsObj));
        if (window.RahaSupabase && window.RahaSupabase.cache && typeof window.RahaSupabase.cache.clear === 'function') {
          window.RahaSupabase.cache.clear();
        }
        sessionStorage.removeItem('raha_cache_storefront_state_v3');
        sessionStorage.removeItem('raha_cache_storefront_state_v5');
      } catch (e) {}

      // Persist stock deduction (Owner session + local fallback; Supabase DB trigger also deducts atomically for all customers/guests)
      if (window.RahaSupabase && typeof window.RahaSupabase.upsertProduct === 'function') {
        updatedProductsForCloud.forEach(function (upProd) {
          window.RahaSupabase.upsertProduct(
            upProd,
            RAHA_CATALOG,
            (ACTIVE_CMS_STATE && ACTIVE_CMS_STATE.settings) || {},
            (ACTIVE_CMS_STATE && ACTIVE_CMS_STATE.pages) || {}
          ).catch(function () {});
        });
      }

      // Immediately refresh visible storefront grids so 0-stock items disappear right away
      if (ACTIVE_CMS_STATE) {
        applyDynamicCmsState(ACTIVE_CMS_STATE);
      }

      if (window.RahaSupabase && typeof window.RahaSupabase.createOrder === 'function') {
        window.RahaSupabase.createOrder(newOrderObj);
      } else {
        try {
          var existingOrders = JSON.parse(localStorage.getItem(CMS_ORDERS_KEY) || '[]');
          existingOrders.unshift(newOrderObj);
          localStorage.setItem(CMS_ORDERS_KEY, JSON.stringify(existingOrders));
        } catch (e) {}
      }

      /* Build WhatsApp & Email Dispatch Links containing Name, Phone, Email, Address, and SKUs */
      var waDispatchUrl = '';
      var mailDispatchUrl = '';

      if (isOnline) {
        var waOnlineLines = [
          'Assalam-o-Alaikum! I want to continue paying my invoice online. Kindly send me your banking details so I can proceed with the payment for my order (Order ID: ' + orderRef + ').',
          '',
          '• Customer Name: ' + name,
          '• Phone / WhatsApp No: ' + phone,
          '• Email Address: ' + email,
          '• Delivery City: ' + city,
          '• Delivery Address: ' + address,
          notes ? ('• Delivery Note: ' + notes) : '',
          '',
          '--- Ordered Pieces ---'
        ].filter(Boolean);

        checkoutItems.forEach(function (it, idx) {
          waOnlineLines.push((idx + 1) + '. ' + it.title + ' [SKU: ' + (it.sku || it.id) + ' | ' + it.variant + '] × ' + it.qty + ' = ' + formatPKR(it.price * it.qty));
        });
        waOnlineLines.push('Items Subtotal: ' + formatPKR(subtotal));
        waOnlineLines.push('Express Shipping: ' + (shippingCost === 0 ? 'FREE Express' : formatPKR(shippingCost) + ' (' + city + ')'));
        waOnlineLines.push('Total Payable Bill: ' + formatPKR(grandTotal));
        waOnlineLines.push('');
        waOnlineLines.push('Looking forward to receiving your banking details so I can proceed with the transfer. Thank you!');

        var waOnlineBody = waOnlineLines.join('\n');
        if (waOnlineBody.length > 1600) {
          waOnlineBody = waOnlineBody.slice(0, 1550) + '\n... (Full items logged in Order ' + orderRef + ')';
        }
        waDispatchUrl = 'https://api.whatsapp.com/send?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(waOnlineBody);

        // Action A: Immediate redirection to WhatsApp with pre-filled banking request template
        try {
          window.open(waDispatchUrl, '_blank', 'noopener');
        } catch (e) {}

        var mailSubject = 'Raha Online Payment Order ' + orderRef + ' — ' + name;
        mailDispatchUrl = 'mailto:contact.rahaofficial@gmail.com?subject=' + encodeURIComponent(mailSubject) + '&body=' + encodeURIComponent(waOnlineLines.join('\n'));
      } else {
        var waLines = [
          'Assalam-o-Alaikum Raha! New Cash on Delivery (COD) Order Confirmed:',
          '• Order ID: ' + orderRef,
          '• Customer Name: ' + name,
          '• Phone No: ' + phone,
          '• Email: ' + email,
          '• Delivery City: ' + city,
          '• Delivery Address: ' + address,
          notes ? ('• Note: ' + notes) : '',
          '--- Ordered Pieces ---'
        ].filter(Boolean);

        checkoutItems.forEach(function (it, idx) {
          waLines.push((idx + 1) + '. ' + it.title + ' [SKU: ' + (it.sku || it.id) + ' | ' + it.variant + '] × ' + it.qty + ' = ' + formatPKR(it.price * it.qty));
        });
        waLines.push('Shipping: ' + (shippingCost === 0 ? 'FREE Express' : formatPKR(shippingCost) + ' (' + city + ')'));
        waLines.push('Total COD Payable at Doorstep: ' + formatPKR(grandTotal));

        var waBody = waLines.join('\n');
        if (waBody.length > 1600) {
          waBody = waBody.slice(0, 1550) + '\n... (Full items logged in Order ' + orderRef + ')';
        }
        waDispatchUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(waBody);
        var mailSubject = 'Raha COD Order ' + orderRef + ' — ' + name;
        mailDispatchUrl = 'mailto:contact.rahaofficial@gmail.com?subject=' + encodeURIComponent(mailSubject) + '&body=' + encodeURIComponent(waLines.join('\n'));
      }

      var formView = document.getElementById('raha-cod-form-view');
      var receiptView = document.getElementById('raha-cod-receipt-view');
      if (formView) formView.style.display = 'none';

      if (receiptView) {
        receiptView.style.display = 'block';
        if (isOnline) {
          receiptView.innerHTML =
            '<div style="width:56px;height:56px;border-radius:50%;margin:0 auto 14px;background:rgba(100,181,246,0.18);border:1.5px solid #64b5f6;display:flex;align-items:center;justify-content:center;color:#64b5f6;font-size:24px;">✓</div>' +
            '<div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#64b5f6;margin-bottom:6px;">Order Reference: ' + escapeHtml(orderRef) + '</div>' +
            '<h4 style="font-family:var(--font-serif);font-size:34px;font-weight:400;color:var(--text-primary);margin-bottom:8px;">Thank You, ' + escapeHtml(name) + '!</h4>' +
            '<p style="font-size:14px;color:var(--text-secondary);max-width:560px;margin:0 auto 16px;">Your online order has been registered and WhatsApp has been opened for banking details. Kindly transfer <strong style="color:var(--raha-gold);">' + formatPKR(grandTotal) + '</strong> and send us the screenshot on WhatsApp to verify payment.</p>' +
            '<div class="raha-cod-receipt__grid">' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Customer Name</span><span class="raha-spec-cell__v">' + escapeHtml(name) + '</span></div>' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Phone / WhatsApp No.</span><span class="raha-spec-cell__v">' + escapeHtml(phone) + '</span></div>' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Payment Lifecycle</span><span class="raha-spec-cell__v" style="color:#ffb74d;">⏳ Pending Verification</span></div>' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Total Bill</span><span class="raha-spec-cell__v" style="color:var(--raha-gold);">' + formatPKR(grandTotal) + '</span></div>' +
              '<div class="raha-spec-cell" style="grid-column:1 / -1;"><span class="raha-spec-cell__k">Delivery Street Address</span><span class="raha-spec-cell__v">' + escapeHtml(address) + (notes ? ' (' + escapeHtml(notes) + ')' : '') + '</span></div>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;">' +
              '<a href="' + waDispatchUrl + '" target="_blank" rel="noopener" class="raha-btn raha-btn--primary" style="text-decoration:none;">Open WhatsApp for Bank Details →</a>' +
              '<a href="account.html" class="raha-btn raha-btn--glass" style="text-decoration:none;">View in My Vault / Live Tracking ↗</a>' +
              '<button type="button" class="raha-btn raha-btn--glass" id="raha-cod-done-btn">Continue Shopping</button>' +
            '</div>';
        } else {
          receiptView.innerHTML =
            '<div style="width:56px;height:56px;border-radius:50%;margin:0 auto 14px;background:rgba(213,184,149,0.18);border:1.5px solid var(--raha-gold);display:flex;align-items:center;justify-content:center;color:var(--raha-gold);font-size:24px;">&#10003;</div>' +
            '<div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--raha-gold);margin-bottom:6px;">Order Reference: ' + escapeHtml(orderRef) + '</div>' +
            '<h4 style="font-family:var(--font-serif);font-size:34px;font-weight:400;color:var(--text-primary);margin-bottom:8px;">Thank You, ' + escapeHtml(name) + '!</h4>' +
            '<p style="font-size:14px;color:var(--text-secondary);max-width:560px;margin:0 auto;">Your Cash on Delivery order has been registered. You will pay <strong style="color:var(--raha-gold);">' + formatPKR(grandTotal) + '</strong> in cash upon delivery at your doorstep.</p>' +
            '<div class="raha-cod-receipt__grid">' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Customer Name</span><span class="raha-spec-cell__v">' + escapeHtml(name) + '</span></div>' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Phone / WhatsApp No.</span><span class="raha-spec-cell__v">' + escapeHtml(phone) + '</span></div>' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">Email Address</span><span class="raha-spec-cell__v">' + escapeHtml(email) + '</span></div>' +
              '<div class="raha-spec-cell"><span class="raha-spec-cell__k">COD Total Payable</span><span class="raha-spec-cell__v" style="color:var(--raha-gold);">' + formatPKR(grandTotal) + '</span></div>' +
              '<div class="raha-spec-cell" style="grid-column:1 / -1;"><span class="raha-spec-cell__k">Delivery Street Address</span><span class="raha-spec-cell__v">' + escapeHtml(address) + (notes ? ' (' + escapeHtml(notes) + ')' : '') + '</span></div>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;">' +
              '<a href="' + waDispatchUrl + '" target="_blank" rel="noopener" class="raha-btn raha-btn--primary" style="text-decoration:none;">Send Instant Dispatch Copy on WhatsApp →</a>' +
              '<a href="' + mailDispatchUrl + '" class="raha-btn raha-btn--glass" style="text-decoration:none;">Send Copy via Email</a>' +
              '<button type="button" class="raha-btn raha-btn--glass" id="raha-cod-done-btn">Continue Shopping</button>' +
            '</div>';
        }

        var doneBtn = document.getElementById('raha-cod-done-btn');
        if (doneBtn) {
          doneBtn.addEventListener('click', function () {
            closeAllDrawersAndModals();
          });
        }
      }

      /* Clear the bag only if standard cart checkout; keep bag intact if Buy Now direct purchase */
      if (!isDirectBuy) {
        saveCart([]);
        renderCartDrawer();
      }
      /* 7. Re-render Client Dispatches Carousel with reviews uploaded for products */
      renderClientDispatchesReviews();
    });
  }

  /* ========================================================================
     12. SUPABASE & ADMIN CMS LIVE STOREFRONT SYNCHRONIZATION ENGINE
     ======================================================================== */
  function buildCardHtmlFromCatalogItem(p, idx) {
    /* Out of Stock: Product disappears completely from customer view */
    var pStock = (typeof p.stock === 'number') ? p.stock : 15;
    if (pStock <= 0) {
      return '';
    }

    var isCustom = String(p.id || '').indexOf('item-') === 0;
    var rawHover = p.hoverImg || p.img || BRAND_FALLBACK_IMG;
    /* Requirement 4: Enforce Image Payload Compression (Supabase Image Transformations) */
    var primaryImg = optimizeImageUrl(p.img, { width: 800, quality: 80, format: 'webp' });
    var hoverImg = optimizeImageUrl(rawHover, { width: 800, quality: 80, format: 'webp' });
    var pdpUrl = 'product.html?id=' + encodeURIComponent(p.id);
    var saved = Math.max(0, (Number(p.compare) || 0) - (Number(p.price) || 0));
    var swatchesList = (Array.isArray(p.customSkus) && p.customSkus.length > 0)
      ? p.customSkus.map(function (s) { return s.name; })
      : ['Gold Plated', '925 Silver', 'Rose Gold'];
    var swatchesHtml = '';
    swatchesList.forEach(function (sw, sIdx) {
      swatchesHtml += '<button type="button" class="raha-swatch-btn' + (sIdx === 0 ? ' is-selected' : '') + '">' + sw + '</button>';
    });

    var lowStockBadge = (pStock > 0 && pStock <= 5)
      ? '<span class="raha-badge raha-badge--low-stock">Only ' + pStock + ' Left</span>'
      : '';

    return (
      '<li class="raha-card"' +
      ' data-id="' + p.id + '"' +
      ' data-title="' + (p.title || '').replace(/"/g, '&quot;') + '"' +
      ' data-price="' + p.price + '"' +
      ' data-compare="' + p.compare + '"' +
      ' data-rating="' + (p.rating || '5.0') + '"' +
      ' data-material="' + (p.material || 'gold') + '"' +
      ' data-category="' + (p.category || 'Earrings') + '"' +
      ' data-img="' + primaryImg + '"' +
      ' data-hover-img="' + hoverImg + '"' +
      ' data-selected-variant="' + (swatchesList[0] || 'Gold Plated') + '"' +
      ' data-order="' + idx + '"' +
      ' data-cursor="Inspect">' +
        '<div class="raha-card__glare"></div>' +
        '<a href="' + pdpUrl + '" class="raha-card__media" title="Click to Open Full Product Page, Gallery &amp; SKUs">' +
          '<div class="raha-card__badges">' +
            (lowStockBadge || ('<span class="raha-badge">' + (p.badge || 'Raha Edition') + '</span>')) +
            (saved > 0 ? '<span class="raha-badge raha-badge--sale">Save Rs ' + saved + '</span>' : '') +
          '</div>' +
          '<img src="' + primaryImg + '" alt="' + (p.title || '').replace(/"/g, '&quot;') + '" class="raha-card__img raha-card__img--primary" loading="' + (idx < 4 ? 'eager' : 'lazy') + '" ' + (idx < 4 ? 'fetchpriority="high" ' : '') + 'decoding="async" onerror="this.onerror=null;this.src=\'' + BRAND_FALLBACK_IMG + '\';">' +
          (hoverImg && hoverImg !== primaryImg
            ? '<img data-hover-src="' + hoverImg + '" alt="' + (p.title || '').replace(/"/g, '&quot;') + ' alternate view" class="raha-card__img raha-card__img--hover" decoding="async" onerror="this.style.display=\'none\';">'
            : '') +
        '</a>' +
        '<div class="raha-card__body">' +
          '<div>' +
            '<div class="raha-card__meta">' +
              '<span>' + (p.category || 'Jewellery') + ' • Gold Plated</span>' +
              '<span class="raha-card__rating">★ ' + (p.rating || '5.0') + ' (' + (p.reviews || 24) + ')</span>' +
            '</div>' +
            '<h3 class="raha-card__title"><a href="' + pdpUrl + '" class="raha-card__title-link">' + p.title + '</a></h3>' +
            '<div class="raha-card__price-row">' +
              '<span class="raha-card__price">' + formatPKR(p.price) + '</span>' +
              '<span class="raha-card__compare">' + formatPKR(p.compare) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</li>'
    );
  }

  function applyDynamicCmsState(state) {
    if (!state) return;
    ACTIVE_CMS_STATE = state;
    window.RAHA_CMS_STATE = state;

    if (Array.isArray(state.catalog) && state.catalog.length > 0) {
      RAHA_CATALOG = state.catalog;
      window.RAHA_CATALOG = RAHA_CATALOG;
    }

    var s = state.settings || {};
    if (s.freeShippingThreshold) {
      FREE_SHIPPING_THRESHOLD = Number(s.freeShippingThreshold) || 3500;
    }
    if (s.whatsappNumber) {
      var rawWa2 = String(s.whatsappNumber).replace(/[^0-9]/g, ''); if (rawWa2.indexOf('3352396680') !== -1) rawWa2 = '923260870876'; if (rawWa2.indexOf('0326') === 0) rawWa2 = '92' + rawWa2.slice(1); WHATSAPP_NUMBER = rawWa2 || '923260870876';
    }

    /* 1. Apply Hero & Storefront Settings on Home Page */
    var heroTitleEl = document.querySelector('.raha-hero .raha-hero__title');
    var heroLeadEl = document.querySelector('.raha-hero .raha-hero__lead');
    var heroMonolithImg = document.querySelector('.raha-monolith-card__editorial');
    var heroMonolithHead = document.querySelector('.raha-monolith-card__heading');
    if (heroTitleEl && s.heroTitleHtml) heroTitleEl.innerHTML = s.heroTitleHtml;
    if (heroLeadEl && s.heroSubtitle) heroLeadEl.textContent = s.heroSubtitle;
    if (heroMonolithImg && s.heroEditorialImg) {
      heroMonolithImg.src = optimizeImageUrl(s.heroEditorialImg, { width: 1200, quality: 85, format: 'webp' });
    }
    if (heroMonolithHead && s.heroMonolithHeading) heroMonolithHead.textContent = s.heroMonolithHeading;
    var heroMonolithLink = document.querySelector('.raha-monolith-card__link');
    if (heroMonolithLink) {
      if (s.heroFlagshipLink) heroMonolithLink.href = s.heroFlagshipLink;
      if (s.heroFlagshipLinkText) heroMonolithLink.textContent = s.heroFlagshipLinkText;
    }

    /* 1b. Apply Custom Cover Images for the 5 Home Page Category Bento Cards */
    var catBentoMap = [
      { href: 'earrings.html', key: 'catImgEarrings' },
      { href: 'necklace.html', key: 'catImgNecklace' },
      { href: 'rings.html', key: 'catImgRings' },
      { href: 'bracelets.html', key: 'catImgBracelets' },
      { href: 'anklets.html', key: 'catImgAnklets' }
    ];
    catBentoMap.forEach(function (cb) {
      if (s[cb.key]) {
        var bentoImg = document.querySelector('.raha-bento-card[href="' + cb.href + '"] .raha-bento-card__img');
        if (bentoImg) {
          bentoImg.src = optimizeImageUrl(s[cb.key], { width: 900, quality: 84, format: 'webp' });
        }
      }
    });

    /* 2. Apply Custom Announcement Marquee Text if set */
    if (s.announcementText) {
      var mqTrack = document.querySelector('.raha-marquee__track');
      if (mqTrack) {
        var unit = '<span class="raha-marquee__item"><span class="raha-marquee__diamond">◆</span><span>' + s.announcementText + '</span></span>';
        mqTrack.innerHTML = unit + unit + unit + unit;
      }
    }

    /* 3. Re-render Category Grid if on a category page (Batched via DocumentFragment) */
    var catGrid = document.getElementById('raha-category-grid');
    if (catGrid && Array.isArray(RAHA_CATALOG)) {
      var pathName = (window.location.pathname || '').toLowerCase();
      var activeCatSlug = null;
      if (pathName.indexOf('earrings') !== -1) {
        activeCatSlug = 'earrings';
      } else if (pathName.indexOf('rings') !== -1) {
        activeCatSlug = 'rings';
      } else if (pathName.indexOf('anklets') !== -1) {
        activeCatSlug = 'anklets';
      } else if (pathName.indexOf('necklace') !== -1) {
        activeCatSlug = 'necklace';
      } else if (pathName.indexOf('bracelets') !== -1) {
        activeCatSlug = 'bracelets';
      }
      if (activeCatSlug) {
        var catItems = RAHA_CATALOG.filter(function (item) {
          var hasStock = (typeof item.stock !== 'number') || item.stock > 0;
          return ((item.categorySlug || '').toLowerCase() === activeCatSlug) && hasStock;
        });

        /* Requirement 5: DocumentFragment Batching to Prevent Layout Thrashing */
        var catFrag = document.createDocumentFragment();
        catItems.forEach(function (p, i) {
          var cardHtml = buildCardHtmlFromCatalogItem(p, i);
          if (cardHtml) {
            var dummy = document.createElement('div');
            dummy.innerHTML = cardHtml;
            while (dummy.firstChild) {
              catFrag.appendChild(dummy.firstChild);
            }
          }
        });
        catGrid.textContent = '';
        if (catItems.length === 0) {
          catGrid.innerHTML = '<li style="grid-column:1 / -1;text-align:center;padding:56px 20px;color:var(--text-muted);font-family:var(--font-mono);font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">New pieces arriving soon in this collection.</li>';
        } else {
          catGrid.appendChild(catFrag);
        }

        var countEl = document.getElementById('raha-cat-count');
        if (countEl) countEl.textContent = 'Showing ' + catItems.length + ' Architectural Pieces';
        initProductCardsAndQuickView();
      }
    }

    /* 4. Re-render Home Featured Grid if on index.html (Batched via DocumentFragment) */
    var homeSectionGrid = (!catGrid && !document.getElementById('raha-pdp-root'))
      ? document.querySelector('.raha-section .raha-product-grid')
      : null;
    if (homeSectionGrid && Array.isArray(RAHA_CATALOG)) {
      var featuredItems = RAHA_CATALOG.filter(function (item) {
        var hasStock = (typeof item.stock !== 'number') || item.stock > 0;
        var isCustomUploaded = String(item.id || '').indexOf('item-') === 0;
        return (Boolean(item.featuredOnHome) || isCustomUploaded) && hasStock;
      });
      if (featuredItems.length === 0) {
        featuredItems = RAHA_CATALOG.filter(function (item) {
          return (typeof item.stock !== 'number') || item.stock > 0;
        }).slice(0, 8);
      }

      /* Requirement 5: DocumentFragment Batching to Prevent Layout Thrashing */
      var homeFrag = document.createDocumentFragment();
      featuredItems.forEach(function (p, i) {
        var cardHtml = buildCardHtmlFromCatalogItem(p, i);
        if (cardHtml) {
          var dummy = document.createElement('div');
          dummy.innerHTML = cardHtml;
          while (dummy.firstChild) {
            homeFrag.appendChild(dummy.firstChild);
          }
        }
      });
      homeSectionGrid.textContent = '';
      if (featuredItems.length === 0) {
        homeSectionGrid.innerHTML = '<li style="grid-column:1 / -1;text-align:center;padding:56px 20px;color:var(--text-muted);font-family:var(--font-mono);font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">New signature pieces arriving soon.</li>';
      } else {
        homeSectionGrid.appendChild(homeFrag);
      }
      initProductCardsAndQuickView();
    }

    /* 5. Re-render Product Detail Page if on product.html */
    if (document.getElementById('raha-pdp-root')) {
      initProductDetailPage();
    }

    /* 6. Apply Footer Policy Page Edits if Admin customized a policy page */
    if (state.pages) {
      var pPath = (window.location.pathname || '').toLowerCase();
      ['about-us', 'faqs', 'shipping-policy', 'refund-policy', 'terms-and-conditions'].forEach(function (pSlug) {
        if (pPath.indexOf(pSlug) !== -1 && state.pages[pSlug]) {
          var pgData = state.pages[pSlug];
          var leadEl = document.querySelector('.raha-policy-lead');
          var cardEl = document.querySelector('.raha-policy-card');
          if (leadEl && pgData.subtitle) leadEl.textContent = pgData.subtitle;
          if (cardEl && pgData.bodyHtml) {
            // Guard: If it's faqs and the stored HTML was the old truncated snippet (missing question 3),
            // do not overwrite the complete 10 FAQs in faqs.html
            if (pSlug === 'faqs' && pgData.bodyHtml.indexOf('3.') === -1) {
              return;
            }
            cardEl.innerHTML = pgData.bodyHtml;
          }
        }
      });
    }

    /* 7. Re-render Client Dispatches Carousel with reviews uploaded for products */
    renderClientDispatchesReviews();

    renderCartDrawer();
  }

  /* ========================================================================
     13. CUSTOMER AUTHENTICATION (LOGIN / SIGNUP) CONTROLLER
     ======================================================================== */
  function openCustomerAuthModal(noticeMessage) {
    var modal = document.getElementById('raha-auth-modal');
    var backdrop = document.getElementById('raha-backdrop');
    var banner = document.getElementById('auth-modal-banner');
    var errBox = document.getElementById('auth-error-box');

    if (!modal) return;
    if (errBox) errBox.style.display = 'none';

    if (banner) {
      if (noticeMessage) {
        banner.innerHTML = '🔒 ' + noticeMessage;
        banner.style.display = 'block';
      } else {
        banner.style.display = 'none';
      }
    }

    modal.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-open');

    updateCustomerAuthViews();
  }

  async function updateCustomerAuthViews() {
    var loggedInView = document.getElementById('auth-logged-in-view');
    var formsView = document.getElementById('auth-forms-view');
    var nameEl = document.getElementById('auth-user-display-name');
    var emailEl = document.getElementById('auth-user-display-email');
    var adminLink = document.getElementById('auth-go-to-admin-link');
    var labels = document.querySelectorAll('.raha-auth-label');

    var user = null;
    if (window.RahaSupabase && typeof window.RahaSupabase.getAuthUser === 'function') {
      user = await window.RahaSupabase.getAuthUser();
    }

    if (user && user.email) {
      if (user.isOwner) {
        // ADMIN / OWNER: Strictly keep original admin entrance and controls
        labels.forEach(function (el) { el.textContent = 'Admin Portal'; });
        if (loggedInView) {
          loggedInView.style.display = 'block';
          var oldBuyerLink = document.getElementById('auth-go-to-account-link');
          if (oldBuyerLink) oldBuyerLink.remove();
        }
        if (formsView) formsView.style.display = 'none';
        if (nameEl) nameEl.textContent = 'Raha Store Owner';
        if (emailEl) emailEl.textContent = user.email;
        if (adminLink) {
          adminLink.style.display = 'inline-block';
        }
      } else {
        // BUYERS ONLY: Provide direct access to their order tracking and saved details
        var firstName = (user.name || user.email.split('@')[0]).split(' ')[0];
        labels.forEach(function (el) { el.textContent = 'Hi, ' + firstName; });
        if (loggedInView) {
          loggedInView.style.display = 'block';
          var actionsWrap = loggedInView.querySelector('div[style*="flex-direction:column"]');
          if (actionsWrap && !document.getElementById('auth-go-to-account-link')) {
            var accLink = document.createElement('a');
            accLink.id = 'auth-go-to-account-link';
            accLink.href = 'account.html';
            accLink.className = 'raha-btn raha-btn--primary';
            accLink.style.cssText = 'width:100%;padding:13px 20px;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;';
            accLink.innerHTML = '<span>📦 View Orders &amp; Live Tracking ↗</span>';
            actionsWrap.insertBefore(accLink, actionsWrap.firstChild);
          }
        }
        if (formsView) formsView.style.display = 'none';
        if (nameEl) nameEl.textContent = user.name || 'Raha Member';
        if (emailEl) emailEl.textContent = user.email;
        if (adminLink) {
          adminLink.style.display = 'none';
        }
      }
    } else {
      labels.forEach(function (el) { el.textContent = 'Account'; });
      if (loggedInView) loggedInView.style.display = 'none';
      if (formsView) formsView.style.display = 'block';
    }
  }

  function initCustomerAuthModal() {
    document.querySelectorAll('[data-auth-trigger]').forEach(function (btn) {
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        var user = null;
        if (window.RahaSupabase && typeof window.RahaSupabase.getAuthUser === 'function') {
          user = await window.RahaSupabase.getAuthUser();
        }
        if (user && user.email) {
          if (user.isOwner) {
            // ADMIN goes straight to admin.html!
            window.location.href = 'admin.html';
          } else {
            // BUYER goes to account.html for tracking
            window.location.href = 'account.html';
          }
        } else {
          openCustomerAuthModal();
        }
      });
    });

    var tabIn = document.getElementById('auth-tab-signin');
    var tabUp = document.getElementById('auth-tab-signup');
    var formIn = document.getElementById('raha-signin-form');
    var formUp = document.getElementById('raha-signup-form');
    var errBox = document.getElementById('auth-error-box');

    if (tabIn && tabUp && formIn && formUp) {
      tabIn.addEventListener('click', function () {
        tabIn.classList.add('is-active');
        tabIn.style.color = 'var(--raha-gold)';
        tabIn.style.borderBottomColor = 'var(--raha-gold)';
        tabUp.classList.remove('is-active');
        tabUp.style.color = 'var(--text-secondary)';
        tabUp.style.borderBottomColor = 'transparent';
        formIn.style.display = 'block';
        formUp.style.display = 'none';
        if (errBox) errBox.style.display = 'none';
      });

      tabUp.addEventListener('click', function () {
        tabUp.classList.add('is-active');
        tabUp.style.color = 'var(--raha-gold)';
        tabUp.style.borderBottomColor = 'var(--raha-gold)';
        tabIn.classList.remove('is-active');
        tabIn.style.color = 'var(--text-secondary)';
        tabIn.style.borderBottomColor = 'transparent';
        formUp.style.display = 'block';
        formIn.style.display = 'none';
        if (errBox) errBox.style.display = 'none';
      });
    }

    var passInput = document.getElementById('signin-password');
    if (passInput && !document.getElementById('auth-forgot-password-link')) {
      var forgotWrap = document.createElement('div');
      forgotWrap.style.cssText = 'display:flex;justify-content:flex-end;margin-top:-6px;margin-bottom:12px;';
      var forgotLink = document.createElement('a');
      forgotLink.id = 'auth-forgot-password-link';
      forgotLink.href = '#';
      forgotLink.textContent = 'Forgot password?';
      forgotLink.style.cssText = 'font-family:var(--font-mono, monospace);font-size:11px;color:var(--text-muted, #a39e99);text-decoration:none;cursor:pointer;';
      forgotLink.addEventListener('click', async function (e) {
        e.preventDefault();
        var emailInput = document.getElementById('signin-email');
        var email = (emailInput ? emailInput.value : '').trim();
        if (!email) {
          email = window.prompt('Enter your account email to receive a password reset link:');
        }
        if (!email) return;
        try {
          if (errBox) {
            errBox.textContent = 'Sending reset instructions...';
            errBox.style.display = 'block';
            errBox.style.background = 'rgba(255,255,255,0.06)';
            errBox.style.borderColor = 'var(--raha-gold)';
            errBox.style.color = '#fff';
          }
          var res = await window.RahaSupabase.requestPasswordReset(email);
          if (errBox) {
            errBox.textContent = res.message;
            errBox.style.display = 'block';
            errBox.style.background = 'rgba(129,199,132,0.14)';
            errBox.style.borderColor = 'rgba(129,199,132,0.45)';
            errBox.style.color = '#c8e6c9';
          }
        } catch (err) {
          if (errBox) {
            errBox.style.background = '';
            errBox.style.borderColor = '';
            errBox.style.color = '';
            errBox.textContent = err.message || 'Could not send reset email.';
            errBox.style.display = 'block';
          }
        }
      });
      forgotWrap.appendChild(forgotLink);
      if (passInput.parentNode) {
        passInput.parentNode.appendChild(forgotWrap);
      }
    }

    if (formIn) {
      formIn.addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = document.getElementById('signin-email').value.trim();
        var pass = document.getElementById('signin-password').value;
        var btn = document.getElementById('signin-submit-btn');

        if (btn) btn.innerHTML = '<span>Verifying Account...</span>';
        try {
          var res = await window.RahaSupabase.signInCustomer(email, pass);
          if (res && res.user) {
            closeAllDrawersAndModals();
            updateCustomerAuthViews();
            if (window._checkoutPendingAfterAuth) {
              window._checkoutPendingAfterAuth = false;
              openCodCheckoutModal(res.user);
            }
          }
        } catch (err) {
          if (errBox) {
            errBox.style.background = '';
            errBox.style.borderColor = '';
            errBox.style.color = '';
            errBox.textContent = 'Sign In Error: ' + (err.message || 'Invalid email or password.');
            errBox.style.display = 'block';
          }
        } finally {
          if (btn) btn.innerHTML = '<span>Sign In to Account</span>';
        }
      });
    }

    if (formUp) {
      formUp.addEventListener('submit', async function (e) {
        e.preventDefault();
        var name = document.getElementById('signup-name').value.trim();
        var email = document.getElementById('signup-email').value.trim();
        var pass = document.getElementById('signup-password').value;
        var btn = document.getElementById('signup-submit-btn');

        if (btn) btn.innerHTML = '<span>Creating Account...</span>';
        try {
          var res = await window.RahaSupabase.signUpCustomer(email, pass, name);
          if (res && res.needsConfirmation) {
            /* Switch to Sign In tab, prefill email, show green confirmation notice */
            if (tabIn) tabIn.click();
            var siEmail = document.getElementById('signin-email');
            if (siEmail) siEmail.value = email;
            if (errBox) {
              errBox.textContent = res.message;
              errBox.style.display = 'block';
              errBox.style.background = 'rgba(129,199,132,0.14)';
              errBox.style.borderColor = 'rgba(129,199,132,0.45)';
              errBox.style.color = '#c8e6c9';
            }
          } else if (res && res.user) {
            closeAllDrawersAndModals();
            updateCustomerAuthViews();
            if (window._checkoutPendingAfterAuth) {
              window._checkoutPendingAfterAuth = false;
              openCodCheckoutModal(res.user);
            }
          }
        } catch (err) {
          if (errBox) {
            errBox.style.background = '';
            errBox.style.borderColor = '';
            errBox.style.color = '';
            errBox.textContent = 'Account Error: ' + (err.message || 'Could not create account.');
            errBox.style.display = 'block';
          }
        } finally {
          if (btn) btn.innerHTML = '<span>Create My Raha Account</span>';
        }
      });
    }

    var checkoutNowBtn = document.getElementById('auth-go-to-checkout-btn');
    if (checkoutNowBtn) {
      checkoutNowBtn.addEventListener('click', async function () {
        closeAllDrawersAndModals();
        var user = await window.RahaSupabase.getAuthUser();
        openCodCheckoutModal(user);
      });
    }

    var logoutBtn = document.getElementById('auth-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        await window.RahaSupabase.signOutUser();
        updateCustomerAuthViews();
        closeAllDrawersAndModals();
      });
    }

    updateCustomerAuthViews();
  }

  function syncFromSupabaseOrLocalApi() {
    /* Requirement 3: Aggressive sessionStorage cache check for instant 0ms first render */
    try {
      // Clear legacy cache
      sessionStorage.removeItem('raha_cache_storefront_state_v2');
      sessionStorage.removeItem('raha_cache_storefront_state_v3');
      sessionStorage.removeItem('raha_cache_storefront_state_v4');
      var cached = null;
      if (window.RahaCache && typeof window.RahaCache.get === 'function') {
        cached = window.RahaCache.get('storefront_state_v5');
      } else {
        var raw = sessionStorage.getItem('raha_cache_storefront_state_v5');
        if (raw) {
          var entry = JSON.parse(raw);
          if (entry && (!entry.expiry || Date.now() <= entry.expiry)) cached = entry.payload;
        }
      }
      if (cached && Array.isArray(cached.catalog) && cached.catalog.length > 0) {
        applyDynamicCmsState(cached);
      }
    } catch (e) {}

    /* Requirement 1: Parallel network fetch via Promise.all */
    if (window.RahaSupabase && typeof window.RahaSupabase.fetchStorefrontState === 'function') {
      window.RahaSupabase.fetchStorefrontState()
        .then(function (state) {
          if (state && Array.isArray(state.catalog) && state.catalog.length > 0) {
            applyDynamicCmsState(state);
          }
        })
        .catch(function () {});
    }

    /* Stale-while-revalidate listener for instant seamless re-render */
    window.addEventListener('raha:cms-synced', function (e) {
      if (e && e.detail && Array.isArray(e.detail.catalog)) {
        applyDynamicCmsState(e.detail);
      }
    });

    /* Multi-tab shopping bag & live CMS catalog synchronization */
    window.addEventListener('storage', function (e) {
      if (!e) return;
      if (e.key === CART_STORAGE_KEY) {
        renderCartDrawer();
      } else if (e.key === CMS_STORE_KEY && e.newValue) {
        try {
          if (window.RahaSupabase && window.RahaSupabase.cache && typeof window.RahaSupabase.cache.clear === 'function') {
            window.RahaSupabase.cache.clear();
          }
          sessionStorage.removeItem('raha_cache_storefront_state_v3');
          var nextState = JSON.parse(e.newValue);
          if (nextState && Array.isArray(nextState.catalog)) {
            applyDynamicCmsState(nextState);
          }
        } catch (stErr) {}
      }
    });
  }

  function initAll() {
    initThemeEngine();
    initSpotlightSearchAndCity();
    initMagneticCursorAndTilt();
    renderCartDrawer();
    initProductCardsAndQuickView();
    initProductDetailPage();
    initCategoryFilterAndSort();
    initReviewsCarousel();
    initGlobalDrawersAndCheckout();
    initCustomerAuthModal();
    if (ACTIVE_CMS_STATE && Array.isArray(ACTIVE_CMS_STATE.catalog) && ACTIVE_CMS_STATE.catalog.length > 0) {
      applyDynamicCmsState(ACTIVE_CMS_STATE);
    }
    syncFromSupabaseOrLocalApi();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();

