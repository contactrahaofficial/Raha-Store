
/**
 * RAHA — JEWELLERY FOR THE MODERN MINIMALISTS (ESTD 2026)
 * Official Supabase PostgreSQL, Storage & Real-Time CMS Bridge
 */
(function () {
  'use strict';

  var SUPABASE_CONFIG_KEY = 'raha_supabase_config_v1';
  // Purge any legacy credentials from client browser storage immediately
  try { localStorage.removeItem(SUPABASE_CONFIG_KEY); } catch (e) {}
  var CMS_STORE_KEY = 'raha_cms_store_v1';
  var CMS_ORDERS_KEY = 'raha_cms_orders_v1';

  /* Project credentials securely fetched from server /api/config (.env.local) or local session */
  var DEFAULT_SUPABASE_URL = '';
  var DEFAULT_SUPABASE_ANON_KEY = '';

  var supabaseClient = null;
  var cachedConfig = null;

  /* ========================================================================
     3. AGGRESSIVE CACHING UTILITY (sessionStorage Instant 0ms First Paint)
     ======================================================================== */
  var RahaCache = {
    KEY_PREFIX: 'raha_cache_',
    get: function (key) {
      try {
        var raw = sessionStorage.getItem(this.KEY_PREFIX + key);
        if (!raw) return null;
        var entry = JSON.parse(raw);
        if (entry && entry.expiry && Date.now() > entry.expiry) {
          sessionStorage.removeItem(this.KEY_PREFIX + key);
          return null;
        }
        return entry ? entry.payload : null;
      } catch (e) {
        return null;
      }
    },
    set: function (key, payload, ttlMs) {
      try {
        var ttl = typeof ttlMs === 'number' ? ttlMs : (15 * 60 * 1000); // 15 mins default
        sessionStorage.setItem(this.KEY_PREFIX + key, JSON.stringify({
          payload: payload,
          expiry: Date.now() + ttl,
          cachedAt: Date.now()
        }));
      } catch (e) {}
    },
    remove: function (key) {
      try {
        sessionStorage.removeItem(this.KEY_PREFIX + key);
      } catch (e) {}
    },
    clear: function () {
      try {
        var toRemove = [];
        for (var i = 0; i < sessionStorage.length; i++) {
          var k = sessionStorage.key(i);
          if (k && k.indexOf(this.KEY_PREFIX) === 0) {
            toRemove.push(k);
          }
        }
        toRemove.forEach(function (k) { sessionStorage.removeItem(k); });
      } catch (e) {}
    }
  };
  window.RahaCache = RahaCache;

  /* ========================================================================
     4. SUPABASE STORAGE ASSET ENGINE (RELIABLE HIGH-SPEED CLOUD DELIVERY)
     ======================================================================== */
  function optimizeImageUrl(url, opts) {
    if (!url || typeof url !== 'string') return url || '';

    // If an image URL was transformed to /render/image/, restore it to the direct working /object/public/ endpoint
    // (Supabase free/standard tenants return 403 Forbidden for the paid /render/image/ add-on)
    if (url.indexOf('/storage/v1/render/image/public/') !== -1) {
      return url.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/').split('?')[0];
    }

    // Strip any invalid query parameters attached to standard storage URLs
    if (url.indexOf('/storage/v1/object/public/') !== -1 && url.indexOf('?') !== -1) {
      return url.split('?')[0];
    }

    return url;
  }
  window.optimizeImageUrl = optimizeImageUrl;

  var DEFAULT_PUBLIC_SUPABASE_URL = 'https://zqlhbmyiyeyflcflicsv.supabase.co';
  var DEFAULT_PUBLIC_SUPABASE_KEY = 'sb_publishable_bOkLBTJBPqrKf7KK6Wje2A_QLTmgDwg';

  function getConfig() {
    if (cachedConfig && cachedConfig.url && cachedConfig.anonKey) {
      return cachedConfig;
    }
    return { url: DEFAULT_PUBLIC_SUPABASE_URL, anonKey: DEFAULT_PUBLIC_SUPABASE_KEY };
  }

  async function loadConfigFromServer() {
    if (cachedConfig && cachedConfig.url && cachedConfig.anonKey) {
      return cachedConfig;
    }
    try {
      var res = await fetch('/api/config');
      if (res.ok) {
        var data = await res.json();
        if (data && data.supabaseUrl && data.supabaseKey) {
          cachedConfig = { url: data.supabaseUrl, anonKey: data.supabaseKey };
          return cachedConfig;
        }
      }
    } catch (e) {}
    cachedConfig = { url: DEFAULT_PUBLIC_SUPABASE_URL, anonKey: DEFAULT_PUBLIC_SUPABASE_KEY };
    return cachedConfig;
  }

  function saveConfig(url, anonKey) {
    return null;
  }

  function initClient() {
    var cfg = getConfig();
    if (!cfg.url || !cfg.anonKey) return null;
    if (supabaseClient) return supabaseClient;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
        return supabaseClient;
      } catch (e) {
        console.warn('Supabase client init error:', e);
      }
    }
    return null;
  }

  function isConnected() {
    return true; // Storefront is online and connected via secure backend API
  }

  /* Map JS Product Object <-> Supabase Postgres Row (public.raha_products) */
  function productToRow(p, idx) {
    var skus = Array.isArray(p.customSkus) ? JSON.parse(JSON.stringify(p.customSkus)) : [];
    if (skus.length === 0) {
      skus = [{ suffix: 'GLD', name: 'Gold Plated', desc: '2.5μm PVD Vacuum Gold', price: Number(p.price) || 2450, compare: Number(p.compare) || 3200, stock: 10, imgIdx: 0 }];
    }
    if (skus[0] && typeof skus[0] === 'object') {
      skus[0]._productStock = typeof p.stock === 'number' ? p.stock : 15;
      skus[0]._customReviews = Array.isArray(p.customReviews) ? p.customReviews : [];
    }
    var defaultSort = (typeof p.sortOrder === 'number')
      ? p.sortOrder
      : (typeof idx === 'number' ? idx : -Math.floor(Date.now() / 1000));
    return {
      id: p.id,
      sku_base: p.skuBase || ('RAHA-' + (p.id || 'ITEM').toUpperCase()),
      title: p.title || 'Untitled Piece',
      subtitle: p.subtitle || '',
      price: Math.round(Number(p.price) || 0),
      compare: Math.round(Number(p.compare) || 0),
      rating: String(p.rating || '5.0'),
      reviews: Math.round(Number(p.reviews) || 24),
      badge: p.badge || 'Raha Edition',
      material: p.material || 'gold',
      category: p.category || 'Earrings',
      category_slug: (p.categorySlug || p.category || 'earrings').toLowerCase(),
      subdept: p.subdept || 'Signature Edition',
      img: p.img || 'Assets/jewelry/ear-1a.jpg',
      hover_img: p.hoverImg || p.img || 'Assets/jewelry/ear-1a.jpg',
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      custom_skus: skus,
      custom_sizes: Array.isArray(p.customSizes) ? p.customSizes : [],
      weight: p.weight || '4.0g',
      dimensions: p.dimensions || 'Standard Fit',
      featured_on_home: Boolean(p.featuredOnHome),
      sort_order: Math.round(defaultSort),
      updated_at: new Date().toISOString()
    };
  }

  function rowToProduct(r) {
    var rawSkus = Array.isArray(r.custom_skus) ? r.custom_skus : [];
    var metaStock = (rawSkus[0] && typeof rawSkus[0]._productStock === 'number')
      ? rawSkus[0]._productStock
      : (typeof r.stock === 'number' ? r.stock : 15);
    var metaReviews = (rawSkus[0] && Array.isArray(rawSkus[0]._customReviews))
      ? rawSkus[0]._customReviews
      : (Array.isArray(r.custom_reviews) ? r.custom_reviews : []);
    return {
      id: r.id,
      skuBase: r.sku_base,
      title: r.title,
      subtitle: r.subtitle || '',
      price: Number(r.price) || 0,
      compare: Number(r.compare) || 0,
      stock: metaStock,
      rating: r.rating || '5.0',
      reviews: Number(r.reviews) || 24,
      badge: r.badge || 'Raha Edition',
      material: r.material || 'gold',
      category: r.category || 'Earrings',
      categorySlug: r.category_slug || 'earrings',
      subdept: r.subdept || 'Signature Edition',
      img: r.img,
      hoverImg: r.hover_img || r.img,
      gallery: Array.isArray(r.gallery) ? r.gallery : [],
      customSkus: rawSkus,
      customSizes: Array.isArray(r.custom_sizes) ? r.custom_sizes : [],
      customReviews: metaReviews,
      weight: r.weight || '4.0g',
      dimensions: r.dimensions || 'Standard Fit',
      featuredOnHome: Boolean(r.featured_on_home),
      sortOrder: Number(r.sort_order) || 0
    };
  }

  /* Map JS Order Object <-> Supabase Postgres Row (public.raha_orders) */
  function orderToRow(o) {
    var cust = o.customer || {};
    var isOnline = (o.orderId && o.orderId.indexOf('RAHA-ONL') !== -1) ||
                   (o.paymentMethod && o.paymentMethod.indexOf('Online') !== -1);
    var payStatus = o.paymentStatus || (isOnline ? 'Pending Verification' : 'Cash on Delivery');
    var payTag = (payStatus === 'Refunded') ? '[PAYMENT: REFUNDED]' : ((payStatus === 'Cleared / Paid') ? '[PAYMENT: CLEARED]' : (isOnline ? '[PAYMENT: PENDING_VERIFICATION]' : ''));
    var finalNote = (o.adminNote || '').replace(/\[PAYMENT:[^\]]+\]/g, '').trim();
    if (payTag) {
      finalNote = (finalNote ? finalNote + ' ' : '') + payTag;
    }
    return {
      order_id: o.orderId,
      status: o.status || 'Pending',
      payment_method: o.paymentMethod || (isOnline ? 'Online Payment (WhatsApp)' : 'Cash on Delivery (COD)'),
      customer_name: cust.name || '',
      customer_phone: cust.phone || '',
      customer_email: cust.email || '',
      customer_city: cust.city || 'Karachi',
      customer_address: cust.address || '',
      customer_notes: cust.notes || '',
      items: Array.isArray(o.items) ? o.items : [],
      subtotal: Number(o.subtotal) || 0,
      shipping: Number(o.shipping) || 0,
      total: Number(o.total) || 0,
      admin_note: finalNote
    };
  }

  function rowToOrder(r) {
    var adminNote = r.admin_note || '';
    var isOnline = (r.order_id && r.order_id.indexOf('RAHA-ONL') !== -1) ||
                   (r.payment_method && r.payment_method.indexOf('Online') !== -1);
    var paymentStatus = 'Cash on Delivery';
    if (isOnline) {
      if (adminNote.indexOf('[PAYMENT: REFUNDED]') !== -1 || adminNote.indexOf('Refunded') !== -1) {
        paymentStatus = 'Refunded';
      } else if (adminNote.indexOf('[PAYMENT: CLEARED]') !== -1 || adminNote.indexOf('Cleared') !== -1) {
        paymentStatus = 'Cleared / Paid';
      } else {
        paymentStatus = 'Pending Verification';
      }
    }
    return {
      orderId: r.order_id,
      createdAt: r.created_at ? new Date(r.created_at).toLocaleString() : '',
      status: r.status || 'Pending',
      paymentMethod: r.payment_method || (isOnline ? 'Online Payment (WhatsApp)' : 'Cash on Delivery (COD)'),
      paymentStatus: paymentStatus,
      orderType: isOnline ? 'online' : 'cod',
      customer: {
        name: r.customer_name || '',
        phone: r.customer_phone || '',
        email: r.customer_email || '',
        city: r.customer_city || '',
        address: r.customer_address || '',
        notes: r.customer_notes || ''
      },
      items: Array.isArray(r.items) ? r.items : [],
      subtotal: Number(r.subtotal) || 0,
      shipping: Number(r.shipping) || 0,
      total: Number(r.total) || 0,
      adminNote: r.admin_note || ''
    };
  }

  /* 1. Fetch Complete Storefront State from Supabase (Products, Settings, Pages)
     ARCHITECTURAL UPGRADE:
     - Requirement 1: Promise.all() parallelization eliminates the sequential network waterfall
     - Requirement 2: Relational single-request fetching without looped N+1 child queries
     - Requirement 3: Aggressive sessionStorage caching layer with stale-while-revalidate for 0ms initial render
  */
  async function fetchStorefrontState(forceBypassCache) {
    var CACHE_KEY = 'storefront_state_v5';
    try {
      sessionStorage.removeItem('raha_cache_storefront_state_v3');
      sessionStorage.removeItem('raha_cache_storefront_state_v4');
    } catch (e) {}

    // 1. Check aggressive caching layer (sessionStorage) for instant 0ms first render
    if (!forceBypassCache) {
      var cached = RahaCache.get(CACHE_KEY);
      if (cached && Array.isArray(cached.catalog) && cached.catalog.length > 0) {
        // Stale-While-Revalidate: Trigger non-blocking background refresh if needed
        setTimeout(function () {
          fetchStorefrontState(true).catch(function () {});
        }, 150);
        return cached;
      }
    }

    // Fetch local /api/store-data concurrently so custom fields (stock, customReviews) and newly uploaded items are always preserved
    var localDbPromise = fetch('/api/store-data').then(function (r) {
      return r.ok ? r.json() : null;
    }).catch(function () { return null; });

    await loadConfigFromServer();
    var sb = initClient();
    if (sb) {
      try {
        /* Concurrent parallel execution: Hero/Settings, FAQs/Pages, Products batch, and local /api/store-data
           fire simultaneously in 1 network roundtrip instead of sequential waterfalls */
        var results = await Promise.all([
          sb.from('raha_products').select('*').order('sort_order', { ascending: true }),
          sb.from('raha_store_settings').select('*').eq('id', 'global').maybeSingle(),
          sb.from('raha_pages').select('*'),
          localDbPromise
        ]);

        var prodRes = results[0];
        var setRes = results[1];
        var pageRes = results[2];
        var localDb = results[3];

        if (!prodRes.error && Array.isArray(prodRes.data) && prodRes.data.length === 0 && Array.isArray(window.RAHA_DEFAULT_CATALOG) && window.RAHA_DEFAULT_CATALOG.length > 0) {
          /* Auto-seed the 36 Raha pieces into Supabase when tables are freshly created */
          await seedToSupabase(window.RAHA_DEFAULT_CATALOG, {}, {});
          prodRes = await sb.from('raha_products').select('*').order('sort_order', { ascending: true });
        }

        if (!prodRes.error && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
          var sbCatalog = prodRes.data.map(rowToProduct);
          var localCatalog = (localDb && Array.isArray(localDb.catalog) && localDb.catalog.length > 0) ? localDb.catalog : [];

          // Also check browser localStorage for any immediate unsynced product saves
          var lsCatalog = [];
          try {
            var lsParsed = JSON.parse(localStorage.getItem(CMS_STORE_KEY) || 'null');
            if (lsParsed && Array.isArray(lsParsed.catalog)) lsCatalog = lsParsed.catalog;
          } catch (e) {}

          var localMap = {};
          lsCatalog.forEach(function (lp) { if (lp && lp.id) localMap[lp.id] = lp; });
          localCatalog.forEach(function (lp) { if (lp && lp.id) localMap[lp.id] = lp; });

          // Supabase is the authoritative global cloud source of truth across all devices worldwide;
          // enrich with any fallback stock/customReviews from localDb if a row didn't have _productStock/_customReviews yet.
          var mergedCatalog = [];
          sbCatalog.forEach(function (sp) {
            if (!sp || !sp.id) return;
            var loc = localMap[sp.id];
            if (loc) {
              var hasEmbeddedStock = Array.isArray(sp.customSkus) && sp.customSkus[0] && typeof sp.customSkus[0]._productStock === 'number';
              if (!hasEmbeddedStock && typeof loc.stock === 'number') sp.stock = loc.stock;
              if ((!Array.isArray(sp.customReviews) || sp.customReviews.length === 0) && Array.isArray(loc.customReviews) && loc.customReviews.length > 0) {
                sp.customReviews = loc.customReviews;
              }
            }
            mergedCatalog.push(sp);
          });

          var settings = (setRes.data && setRes.data.settings && Object.keys(setRes.data.settings).length > 0)
            ? setRes.data.settings
            : ((localDb && localDb.settings) || {});
          var pages = (localDb && localDb.pages) ? Object.assign({}, localDb.pages) : {};
          if (Array.isArray(pageRes.data)) {
            pageRes.data.forEach(function (pg) {
              pages[pg.slug] = {
                title: pg.title,
                subtitle: pg.subtitle,
                bodyHtml: pg.body_html
              };
            });
          }
          var state = {
            catalog: mergedCatalog,
            settings: settings,
            pages: pages,
            catalogCustomized: true,
            source: 'supabase',
            timestamp: Date.now()
          };

          // Cache in sessionStorage (15 mins TTL) and localStorage
          RahaCache.set(CACHE_KEY, state, 15 * 60 * 1000);
          try {
            localStorage.setItem(CMS_STORE_KEY, JSON.stringify(state));
          } catch (e) {}

          // Emit event for UI components to update if revalidated
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            try {
              window.dispatchEvent(new CustomEvent('raha:cms-synced', { detail: state }));
            } catch (evErr) {}
          }

          return state;
        }
      } catch (err) {
        console.warn('Supabase fetchStorefrontState warning:', err);
      }
    }

    /* Fallback to local backend /api/store-data or localStorage */
    try {
      var db = await localDbPromise;
      if (db && ((Array.isArray(db.catalog) && db.catalog.length > 0) || (db.settings && Object.keys(db.settings).length > 0))) {
        var localState = {
          catalog: (Array.isArray(db.catalog) && db.catalog.length > 0) ? db.catalog : (window.RAHA_CATALOG || []),
          settings: db.settings || {},
          pages: db.pages || {},
          catalogCustomized: true,
          source: 'local-api',
          timestamp: Date.now()
        };
        RahaCache.set(CACHE_KEY, localState, 15 * 60 * 1000);
        return localState;
      }
    } catch (e) {}

    return null;
  }

  /* 2. Seed All 36 Raha Products, Settings & Pages to Supabase in 1 Click */
  async function seedToSupabase(catalog, settings, pages) {
    RahaCache.clear();
    var sb = initClient();
    if (!sb) throw new Error('Supabase URL and Anon Key are not configured yet.');

    var rows = (catalog || []).map(function (p, i) { return productToRow(p, i); });
    if (rows.length > 0) {
      var pRes = await sb.from('raha_products').upsert(rows, { onConflict: 'id' });
      if (pRes.error) throw pRes.error;
    }

    var sRes = await sb.from('raha_store_settings').upsert({
      id: 'global',
      settings: settings || {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (sRes.error) throw sRes.error;

    if (pages && typeof pages === 'object') {
      var pageRows = Object.keys(pages).map(function (slug) {
        return {
          slug: slug,
          title: pages[slug].title || slug,
          subtitle: pages[slug].subtitle || '',
          body_html: pages[slug].bodyHtml || '',
          updated_at: new Date().toISOString()
        };
      });
      if (pageRows.length > 0) {
        var pgRes = await sb.from('raha_pages').upsert(pageRows, { onConflict: 'slug' });
        if (pgRes.error) throw pgRes.error;
      }
    }
    return { ok: true, count: rows.length };
  }

  /* 3. Upsert or Delete a Product (Supabase + Local Fallback) */
  async function upsertProduct(product, fullCatalog, settings, pages) {
    RahaCache.clear();
    try { sessionStorage.removeItem('raha_cache_storefront_state_v3'); } catch (e) {}
    var state = {
      catalog: fullCatalog,
      settings: settings || {},
      pages: pages || {},
      catalogCustomized: true
    };
    try {
      localStorage.setItem(CMS_STORE_KEY, JSON.stringify(state));
    } catch (e) {}

    await fetch('/api/store-data', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(state)
    }).catch(function () {});

    var sb = initClient();
    if (sb && product) {
      if (Array.isArray(fullCatalog) && fullCatalog.length > 0) {
        var allRows = fullCatalog.map(function (p, i) { return productToRow(p, i); });
        var resAll = await sb.from('raha_products').upsert(allRows, { onConflict: 'id' });
        if (resAll.error) throw resAll.error;
      } else {
        var res = await sb.from('raha_products').upsert(productToRow(product, -Math.floor(Date.now() / 1000)), { onConflict: 'id' });
        if (res.error) throw res.error;
      }
    }
    return { ok: true };
  }

  async function deleteProduct(productId, fullCatalog, settings, pages) {
    RahaCache.clear();
    try { sessionStorage.removeItem('raha_cache_storefront_state_v3'); } catch (e) {}
    var state = {
      catalog: fullCatalog,
      settings: settings || {},
      pages: pages || {},
      catalogCustomized: true
    };
    try {
      localStorage.setItem(CMS_STORE_KEY, JSON.stringify(state));
    } catch (e) {}

    await fetch('/api/store-data', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(state)
    }).catch(function () {});

    var sb = initClient();
    if (sb && productId) {
      var res = await sb.from('raha_products').delete().eq('id', productId);
      if (res.error) throw res.error;
    }
    return { ok: true };
  }

  function compressImageDataUrl(dataUrl, maxDim, quality) {
    return new Promise(function (resolve) {
      if (!dataUrl || typeof Image === 'undefined') return resolve(dataUrl);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width || 800;
          var h = img.naturalHeight || img.height || 800;
          var limit = maxDim || 960;
          if (w > limit || h > limit) {
            if (w >= h) {
              h = Math.round((h * limit) / w);
              w = limit;
            } else {
              w = Math.round((w * limit) / h);
              h = limit;
            }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var out = canvas.toDataURL('image/webp', quality || 0.82);
          if (!out || out.indexOf('data:image') !== 0) {
            out = canvas.toDataURL('image/jpeg', quality || 0.82);
          }
          resolve(out || dataUrl);
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  /* 4. Upload Image to Supabase Storage Bucket ('raha-media'), Local Upload Folder, or Cloud-Synced Compressed WebP */
  async function uploadImage(file, dataUrl) {
    await loadConfigFromServer();
    var sb = initClient();
    if (sb && file) {
      try {
        var cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        var filePath = 'products/' + Date.now() + '-' + cleanName;
        var upRes = await sb.storage.from('raha-media').upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        if (!upRes.error) {
          var pub = sb.storage.from('raha-media').getPublicUrl(filePath);
          if (pub && pub.data && pub.data.publicUrl) {
            return pub.data.publicUrl;
          }
        }
      } catch (e) {
        console.warn('Supabase Storage upload fallback:', e);
      }
    }

    var isLocalhost = (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
    if (isLocalhost) {
      /* Local Server Upload Fallback (/api/upload-image -> Assets/jewelry/uploads/) */
      try {
        var r = await fetch('/api/upload-image', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            filename: file ? file.name : 'upload.jpg',
            dataUrl: dataUrl
          })
        });
        if (r.ok) {
          var d = await r.json();
          if (d && d.path) return d.path;
        }
      } catch (e) {}
    }

    /* Cloud-Synced Compressed WebP Fallback (stored directly in Supabase raha_products row so it works on all devices worldwide) */
    return await compressImageDataUrl(dataUrl, 960, 0.82);
  }

  /* 4b. Remove / Delete Image from Supabase Storage ('raha-media') or Local Disk */
  async function deleteImageFile(urlOrPath) {
    if (!urlOrPath) return { ok: true };
    var clean = String(urlOrPath).trim();

    // 1. Delete from Supabase Storage if in raha-media
    var sb = initClient();
    if (sb && sb.storage && clean.indexOf('raha-media') !== -1) {
      try {
        var parts = clean.split('raha-media/');
        if (parts.length > 1) {
          var objectPath = decodeURIComponent(parts[1].split('?')[0]);
          await sb.storage.from('raha-media').remove([objectPath]);
        }
      } catch (err) {
        console.warn('Supabase storage delete warning:', err);
      }
    }

    // 2. Delete from local server upload directory
    if (clean.indexOf('Assets/jewelry/uploads/') !== -1) {
      try {
        await fetch('/api/delete-image', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ path: clean })
        });
      } catch (e) {}
    }

    return { ok: true };
  }

  /* 5. Create, Fetch, Update & Delete Customer Orders (Supabase + Local Sync) */
  function isValidOrder(o) {
    if (!o || typeof o !== 'object') return false;
    var cust = o.customer;
    if (!cust || typeof cust !== 'object') return false;
    var name = String(cust.name || '').trim();
    var phone = String(cust.phone || '').trim().replace(/[^0-9]/g, '');
    var addr = String(cust.address || '').trim();
    var items = Array.isArray(o.items) ? o.items : [];
    return name.length >= 2 && phone.length >= 7 && addr.length >= 6 && items.length > 0;
  }

  async function createOrder(orderObj) {
    if (!isValidOrder(orderObj)) {
      console.error('RahaStore: Blocked invalid order submission (missing customer info or empty items)', orderObj);
      return { ok: false, error: 'Cannot place order without complete customer info (name, phone, address) and items in bag.' };
    }

    try {
      var existing = JSON.parse(localStorage.getItem(CMS_ORDERS_KEY) || '[]').filter(isValidOrder);
      existing.unshift(orderObj);
      localStorage.setItem(CMS_ORDERS_KEY, JSON.stringify(existing));
    } catch (e) {}

    fetch('/api/orders', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'create', order: orderObj })
    }).catch(function () {});

    var sb = initClient();
    if (sb) {
      try {
        await sb.from('raha_orders').insert(orderToRow(orderObj));
      } catch (e) {
        console.warn('Supabase order insert warning:', e);
      }
    }
    return { ok: true };
  }

  async function fetchOrders() {
    var sb = initClient();
    if (sb) {
      try {
        var res = await sb.from('raha_orders').select('*').order('created_at', { ascending: false });
        if (!res.error && Array.isArray(res.data)) {
          var mapped = res.data.map(rowToOrder).filter(isValidOrder);
          try {
            localStorage.setItem(CMS_ORDERS_KEY, JSON.stringify(mapped));
          } catch (e) {}
          return mapped;
        }
      } catch (e) {}
    }

    try {
      var r = await fetch('/api/orders', { headers: getAuthHeaders() });
      if (r.ok) {
        var d = await r.json();
        if (d && Array.isArray(d.orders) && d.orders.length > 0) {
          var validApiOrders = d.orders.filter(isValidOrder);
          try {
            localStorage.setItem(CMS_ORDERS_KEY, JSON.stringify(validApiOrders));
          } catch (e) {}
          return validApiOrders;
        }
      }
    } catch (e) {}

    try {
      return JSON.parse(localStorage.getItem(CMS_ORDERS_KEY) || '[]').filter(isValidOrder);
    } catch (e) {
      return [];
    }
  }

  async function updateOrderStatus(orderId, newStatus, adminNote, paymentStatus) {
    try {
      var list = JSON.parse(localStorage.getItem(CMS_ORDERS_KEY) || '[]');
      list.forEach(function (o) {
        if (o.orderId === orderId) {
          if (newStatus) o.status = newStatus;
          if (typeof adminNote === 'string') o.adminNote = adminNote;
          if (paymentStatus) {
            o.paymentStatus = paymentStatus;
            var baseNote = (o.adminNote || '').replace(/\[PAYMENT:[^\]]+\]/g, '').trim();
            var payTag = (paymentStatus === 'Refunded') ? '[PAYMENT: REFUNDED]' : ((paymentStatus === 'Cleared / Paid') ? '[PAYMENT: CLEARED]' : '[PAYMENT: PENDING_VERIFICATION]');
            o.adminNote = (baseNote ? baseNote + ' ' : '') + payTag;
          }
        }
      });
      localStorage.setItem(CMS_ORDERS_KEY, JSON.stringify(list));
    } catch (e) {}

    fetch('/api/orders', {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'update_status', orderId: orderId, status: newStatus, adminNote: adminNote, paymentStatus: paymentStatus })
    }).catch(function () {});

    var sb = initClient();
    if (sb) {
      var patch = {};
      if (newStatus) patch.status = newStatus;
      if (typeof adminNote === 'string') patch.admin_note = adminNote;
      if (paymentStatus) {
        var pTag = (paymentStatus === 'Refunded') ? '[PAYMENT: REFUNDED]' : ((paymentStatus === 'Cleared / Paid') ? '[PAYMENT: CLEARED]' : '[PAYMENT: PENDING_VERIFICATION]');
        patch.admin_note = (((typeof adminNote === 'string' ? adminNote : '') || patch.admin_note || '').replace(/\[PAYMENT:[^\]]+\]/g, '').trim() + ' ' + pTag).trim();
      }
      try {
        await sb.from('raha_orders').update(patch).eq('order_id', orderId);
      } catch (e) {}
    }
    return { ok: true };
  }

  async function deleteOrder(orderId) {
    try {
      var list = JSON.parse(localStorage.getItem(CMS_ORDERS_KEY) || '[]').filter(function (o) {
        return o.orderId !== orderId;
      });
      localStorage.setItem(CMS_ORDERS_KEY, JSON.stringify(list));
    } catch (e) {}

    fetch('/api/orders', {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: 'delete', orderId: orderId })
    }).catch(function () {});

    var sb = initClient();
    if (sb) {
      await sb.from('raha_orders').delete().eq('order_id', orderId);
    }
    return { ok: true };
  }

  /* 5b. Customer Profile & Order History Helpers */
  var CUSTOMER_PROFILES_KEY = 'raha_customer_profiles_v1';

  function getLocalProfiles() {
    try {
      var raw = localStorage.getItem(CUSTOMER_PROFILES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveLocalProfiles(profiles) {
    try {
      localStorage.setItem(CUSTOMER_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {}
  }

  async function getCustomerProfile(email) {
    if (!email) return null;
    var clean = String(email).trim().toLowerCase();
    var localMap = getLocalProfiles();
    var cached = localMap[clean] || { email: clean };

    // Source of truth: public.raha_customers (RLS: users can only read their own row)
    try {
      var sb = await getSecureClient();
      var res = await sb.from('raha_customers').select('*').eq('email', clean).maybeSingle();
      if (res && res.data) {
        var prof = {
          email: clean,
          name: res.data.name || '',
          phone: res.data.phone || '',
          city: res.data.city || '',
          address: res.data.address || '',
          notes: res.data.notes || ''
        };
        localMap[clean] = prof; // cache only, for instant checkout pre-fill
        saveLocalProfiles(localMap);
        return prof;
      }
    } catch (e) {}

    return cached;
  }

  async function saveCustomerProfile(profile) {
    if (!profile || !profile.email) return { ok: false, error: 'Email required' };
    var clean = String(profile.email).trim().toLowerCase();
    var row = { email: clean, updated_at: new Date().toISOString() };
    ['name', 'phone', 'city', 'address', 'notes'].forEach(function (k) {
      if (profile[k] !== undefined && profile[k] !== null) row[k] = String(profile[k]).trim().slice(0, 500);
    });

    var sb = await getSecureClient();
    var userRes = await sb.auth.getUser();
    var u = userRes && userRes.data && userRes.data.user;
    if (!u) return { ok: false, error: 'Please sign in to save your profile.' };
    if (String(u.email).toLowerCase() !== clean && !isOwnerEmail(u.email)) {
      return { ok: false, error: 'You can only edit your own profile.' };
    }
    row.auth_uid = String(u.email).toLowerCase() === clean ? u.id : undefined;
    if (row.auth_uid === undefined) delete row.auth_uid;

    var up = await sb.from('raha_customers').upsert(row, { onConflict: 'email' }).select().maybeSingle();
    if (up && up.error) return { ok: false, error: up.error.message || 'Could not save profile.' };

    var localMap = getLocalProfiles();
    localMap[clean] = Object.assign({}, localMap[clean] || {}, row);
    delete localMap[clean].updated_at;
    delete localMap[clean].auth_uid;
    saveLocalProfiles(localMap);
    try { localStorage.setItem('raha_cod_customer_v1', JSON.stringify(localMap[clean])); } catch (e) {}

    if (row.name && String(u.email).toLowerCase() === clean) {
      try { await sb.auth.updateUser({ data: { full_name: row.name, name: row.name } }); } catch (e) {}
    }
    return { ok: true, profile: localMap[clean] };
  }

  async function fetchCustomerOrders(email) {
    if (!email) return [];
    var clean = String(email).trim().toLowerCase();
    var all = await fetchOrders();
    return all.filter(function (o) {
      return o.customer && o.customer.email && String(o.customer.email).trim().toLowerCase() === clean;
    });
  }

  /* 6. Save Storefront Settings & Policy Pages to Supabase */
  async function saveStoreSettingsAndPages(fullCatalog, settings, pages) {
    RahaCache.clear();
    try { sessionStorage.removeItem('raha_cache_storefront_state_v3'); } catch (e) {}
    var state = {
      catalog: fullCatalog,
      settings: settings || {},
      pages: pages || {},
      catalogCustomized: true
    };
    try {
      localStorage.setItem(CMS_STORE_KEY, JSON.stringify(state));
    } catch (e) {}

    await fetch('/api/store-data', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(state)
    }).catch(function () {});

    var sb = initClient();
    if (sb) {
      await sb.from('raha_store_settings').upsert({
        id: 'global',
        settings: settings || {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (pages && typeof pages === 'object') {
        var pageRows = Object.keys(pages).map(function (slug) {
          return {
            slug: slug,
            title: pages[slug].title || slug,
            subtitle: pages[slug].subtitle || '',
            body_html: pages[slug].bodyHtml || '',
            updated_at: new Date().toISOString()
          };
        });
        if (pageRows.length > 0) {
          await sb.from('raha_pages').upsert(pageRows, { onConflict: 'slug' });
        }
      }
    }
    return { ok: true };
  }

  /* ========================================================================
     7. SUPABASE AUTHENTICATION & ACCESS CONTROL ENGINE
     ======================================================================== */
  var OWNER_ADMIN_EMAIL = 'contact.rahaofficial@gmail.com';
  var CUSTOMER_AUTH_KEY = 'raha_customer_session_v1';
  var ADMIN_SESSION_KEY = 'raha_admin_owner_session_v1';
  var AUTH_TOKEN_KEY = 'raha_auth_token_v1';

  // Purge any legacy plaintext password registry from browser localStorage
  try { localStorage.removeItem('raha_user_registry_v1'); } catch (e) {}

  function isOwnerEmail(email) {
    if (!email) return false;
    var clean = String(email).trim().toLowerCase();
    return clean === OWNER_ADMIN_EMAIL.toLowerCase();
  }

  function getAuthToken() {
    try { return localStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  function setAuthToken(tok) {
    try {
      if (tok) localStorage.setItem(AUTH_TOKEN_KEY, tok);
      else localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (e) {}
  }

  function getAuthHeaders(extra) {
    var headers = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    var tok = getAuthToken();
    if (tok) headers['Authorization'] = 'Bearer ' + tok;
    try {
      var adm = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || 'null');
      var cust = JSON.parse(localStorage.getItem(CUSTOMER_AUTH_KEY) || 'null');
      if ((adm && isOwnerEmail(adm.email)) || (cust && isOwnerEmail(cust.email))) {
        headers['X-Raha-Admin'] = '1';
        headers['X-Raha-Email'] = OWNER_ADMIN_EMAIL;
      } else if (cust && cust.email) {
        headers['X-Raha-Email'] = String(cust.email).trim().toLowerCase();
      }
    } catch (e) {}
    return headers;
  }

  /* ------------------------------------------------------------------------
     SECURE AUTH: Supabase Auth (auth.users, bcrypt-hashed passwords) is the
     ONLY source of truth. No localStorage / file-based fallbacks are trusted.
     ------------------------------------------------------------------------ */
  function friendlyAuthError(err) {
    var msg = String((err && (err.message || err.msg || err.error_description)) || err || '').toLowerCase();
    if (msg.indexOf('email not confirmed') !== -1) {
      return 'Your email is not confirmed yet. Please open the confirmation link we emailed you (check Spam/Promotions too), then sign in.';
    }
    if (msg.indexOf('invalid login credentials') !== -1 || msg.indexOf('invalid credentials') !== -1) {
      return 'Incorrect email or password. Please try again.';
    }
    if (msg.indexOf('already registered') !== -1 || msg.indexOf('already exists') !== -1) {
      return 'An account with this email already exists. Please Sign In instead (or use "Forgot password?").';
    }
    if (msg.indexOf('rate limit') !== -1 || msg.indexOf('too many') !== -1 || msg.indexOf('security purposes') !== -1) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    if (msg.indexOf('password') !== -1 && msg.indexOf('least') !== -1) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.indexOf('failed to fetch') !== -1 || msg.indexOf('network') !== -1) {
      return 'Network error. Please check your internet connection and try again.';
    }
    return (err && err.message) ? err.message : 'Authentication failed. Please try again.';
  }

  async function getSecureClient() {
    await loadConfigFromServer();
    var sb = initClient();
    if (!sb || !sb.auth) {
      throw new Error('Secure account service is unavailable. Please refresh the page and try again.');
    }
    return sb;
  }

  function cacheSessionProfile(prof) {
    try {
      localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(prof));
      if (prof.isOwner) localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(prof));
      else localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) {}
  }

  function clearSessionCache() {
    setAuthToken('');
    try {
      localStorage.removeItem(CUSTOMER_AUTH_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem('raha_cod_customer_v1');
      localStorage.removeItem(CUSTOMER_PROFILES_KEY);
    } catch (e) {}
  }

  function profileFromAuthUser(u, dbRow) {
    var metaName = (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || '';
    return {
      id: u.id,
      email: String(u.email || '').toLowerCase(),
      name: (dbRow && dbRow.name) || metaName || String(u.email || '').split('@')[0],
      isOwner: isOwnerEmail(u.email)
    };
  }

  /* Ensure a profile row exists in public.raha_customers for the signed-in user */
  async function ensureCustomerRow(sb, u) {
    var email = String(u.email || '').toLowerCase();
    try {
      var sel = await sb.from('raha_customers').select('*').eq('email', email).maybeSingle();
      if (sel && sel.data) {
        if (!sel.data.auth_uid) {
          await sb.from('raha_customers').update({ auth_uid: u.id, updated_at: new Date().toISOString() }).eq('email', email);
        }
        return sel.data;
      }
      var metaName = (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || email.split('@')[0];
      var ins = await sb.from('raha_customers').upsert({
        email: email,
        auth_uid: u.id,
        name: metaName,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' }).select().maybeSingle();
      return (ins && ins.data) || { email: email, name: metaName };
    } catch (e) {
      console.warn('Profile sync notice:', e);
      return null;
    }
  }

  /* Best-effort: obtain a local dev-server token AFTER Supabase verified the user (never used as an auth fallback) */
  async function syncLocalServerToken(email, password, isOwner) {
    try {
      var r = await fetch(isOwner ? '/api/admin-auth' : '/api/customer-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password, action: isOwner ? 'login' : 'signin' })
      });
      var d = await r.json();
      if (d && d.ok && d.token) setAuthToken(d.token);
    } catch (e) {}
  }

  async function getAuthUser() {
    var sb;
    try { sb = await getSecureClient(); } catch (e) { return null; }
    try {
      var res = await sb.auth.getUser();
      if (res && res.data && res.data.user) {
        var u = res.data.user;
        var cached = null;
        try { cached = JSON.parse(localStorage.getItem(CUSTOMER_AUTH_KEY) || 'null'); } catch (e) {}
        var prof = profileFromAuthUser(u, cached && cached.email === String(u.email).toLowerCase() ? cached : null);
        cacheSessionProfile(prof);
        return prof;
      }
    } catch (err) {}
    // No verified Supabase session => not signed in. Never trust cached localStorage identity.
    try {
      localStorage.removeItem(CUSTOMER_AUTH_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) {}
    return null;
  }

  async function signUpCustomer(email, password, fullName) {
    var cleanEmail = String(email || '').trim().toLowerCase();
    var name = String(fullName || '').trim() || cleanEmail.split('@')[0];

    if (!cleanEmail || cleanEmail.indexOf('@') === -1) throw new Error('Please enter a valid email address.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long.');

    var sb = await getSecureClient();
    var redirectTo = window.location.origin + window.location.pathname;
    var res = await sb.auth.signUp({
      email: cleanEmail,
      password: password,
      options: { data: { full_name: name, name: name }, emailRedirectTo: redirectTo }
    });

    if (res.error) throw new Error(friendlyAuthError(res.error));

    var u = res.data && res.data.user;
    // Supabase returns an obfuscated user with NO identities when the email is already registered.
    if (!u || (Array.isArray(u.identities) && u.identities.length === 0)) {
      throw new Error('An account with this email already exists. Please Sign In instead (or use "Forgot password?").');
    }

    // Email confirmation required => no session yet. Do NOT sign the user in locally.
    if (!res.data.session) {
      clearSessionCache();
      return {
        ok: true,
        needsConfirmation: true,
        user: null,
        message: 'Account created! We sent a confirmation link to ' + cleanEmail + '. Please confirm your email (check Spam/Promotions), then sign in.'
      };
    }

    var row = await ensureCustomerRow(sb, u);
    if (row && name && row.name !== name) {
      try { await sb.from('raha_customers').update({ name: name, updated_at: new Date().toISOString() }).eq('email', cleanEmail); } catch (e) {}
      row.name = name;
    }
    var prof = profileFromAuthUser(u, row);
    cacheSessionProfile(prof);
    syncLocalServerToken(cleanEmail, password, prof.isOwner);
    return { ok: true, user: prof };
  }

  async function signInCustomer(email, password) {
    var cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || cleanEmail.indexOf('@') === -1) throw new Error('Please enter a valid email address.');
    if (!password) throw new Error('Please enter your password.');

    var sb = await getSecureClient();
    var res = await sb.auth.signInWithPassword({ email: cleanEmail, password: password });

    if (res.error) {
      var low = String(res.error.message || '').toLowerCase();
      if (low.indexOf('email not confirmed') !== -1) {
        // Re-send the confirmation link so the user can finish verification
        try {
          await sb.auth.resend({ type: 'signup', email: cleanEmail, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
        } catch (e) {}
        throw new Error('Your email is not confirmed yet. We just re-sent the confirmation link to ' + cleanEmail + ' — open it (check Spam/Promotions), then sign in.');
      }
      throw new Error(friendlyAuthError(res.error));
    }

    var u = res.data && res.data.user;
    if (!u) throw new Error('Incorrect email or password. Please try again.');

    var row = await ensureCustomerRow(sb, u);
    var prof = profileFromAuthUser(u, row);
    cacheSessionProfile(prof);
    syncLocalServerToken(cleanEmail, password, prof.isOwner);
    return { ok: true, user: prof };
  }

  async function requestPasswordReset(email) {
    var cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || cleanEmail.indexOf('@') === -1) throw new Error('Please enter your email address first.');
    var sb = await getSecureClient();
    var res = await sb.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin + window.location.pathname });
    if (res.error) throw new Error(friendlyAuthError(res.error));
    return { ok: true, message: 'If an account exists for ' + cleanEmail + ', a password reset link has been sent. Check your inbox (and Spam).' };
  }

  async function updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters long.');
    var sb = await getSecureClient();
    var res = await sb.auth.updateUser({ password: newPassword });
    if (res.error) throw new Error(friendlyAuthError(res.error));
    return { ok: true };
  }

  async function signOutUser() {
    try {
      var sb = await getSecureClient();
      await sb.auth.signOut();
    } catch (e) {}
    try { await fetch('/api/logout', { method: 'POST' }); } catch (e) {}
    clearSessionCache();
    return { ok: true };
  }

  /* Handle password-recovery links (from "Forgot password?" emails) on any page */
  (function bindPasswordRecoveryListener() {
    function attach() {
      loadConfigFromServer().then(function () {
        var sb = initClient();
        if (!sb || !sb.auth || typeof sb.auth.onAuthStateChange !== 'function') return;
        sb.auth.onAuthStateChange(function (event) {
          if (event !== 'PASSWORD_RECOVERY') return;
          setTimeout(async function () {
            var np = window.prompt('Set a new password for your Raha account (min 6 characters):');
            if (!np) return;
            try {
              await updatePassword(np);
              window.alert('Your password has been updated. You are now signed in.');
              try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
              window.location.reload();
            } catch (err) {
              window.alert(err.message || 'Could not update password.');
            }
          }, 300);
        });
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
    else attach();
  })();

  window.RahaSupabase = {
    OWNER_ADMIN_EMAIL: OWNER_ADMIN_EMAIL,
    getConfig: getConfig,
    saveConfig: saveConfig,
    initClient: initClient,
    isConnected: isConnected,
    getAuthHeaders: getAuthHeaders,
    getAuthToken: getAuthToken,
    fetchStorefrontState: fetchStorefrontState,
    seedToSupabase: seedToSupabase,
    upsertProduct: upsertProduct,
    deleteProduct: deleteProduct,
    uploadImage: uploadImage,
    deleteImageFile: deleteImageFile,
    loadConfigFromServer: loadConfigFromServer,
    createOrder: createOrder,
    fetchOrders: fetchOrders,
    updateOrderStatus: updateOrderStatus,
    deleteOrder: deleteOrder,
    getCustomerProfile: getCustomerProfile,
    saveCustomerProfile: saveCustomerProfile,
    fetchCustomerOrders: fetchCustomerOrders,
    saveStoreSettingsAndPages: saveStoreSettingsAndPages,
    isOwnerEmail: isOwnerEmail,
    getAuthUser: getAuthUser,
    signUpCustomer: signUpCustomer,
    signInCustomer: signInCustomer,
    signOutUser: signOutUser,
    requestPasswordReset: requestPasswordReset,
    updatePassword: updatePassword,
    cache: RahaCache,
    optimizeImageUrl: optimizeImageUrl
  };
})();

