/*
 * HashCLASS data layer (Supabase).
 *
 * - Every call goes to a secure database function (see supabase/01_schema.sql)
 *   together with the login session token. The browser never touches tables directly.
 * - Keeps the old trickle* function names so the rest of the app is unchanged:
 *     trickleCreateObject / trickleListObjects / trickleGetObject /
 *     trickleUpdateObject / trickleDeleteObject
 * - Any image/file that arrives as a base64 "data:" URL is uploaded to Supabase
 *   Storage first and replaced by its public link, so the database only keeps URLs.
 */
(function () {
  var SUPABASE_URL = 'https://yyadebqnrapcvamxfnsn.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_JvY_O-hPTCX5g38BhgL8KQ_rblRUcxr';
  var BUCKET = 'uploads';
  var SESSION_KEY = 'hc_session';
  var PUBLIC_PAGES = /(^|\/)(index\.html|signup\.html|forgot-password\.html|welcome\.html)?$/;

  // allow tests / self-hosting to override
  if (window.HC_CONFIG) {
    SUPABASE_URL = window.HC_CONFIG.url || SUPABASE_URL;
    SUPABASE_ANON_KEY = window.HC_CONFIG.anonKey || SUPABASE_ANON_KEY;
  }

  /* ---------------- session ---------------- */
  function getToken() { try { return localStorage.getItem(SESSION_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { localStorage.setItem(SESSION_KEY, t); } catch (e) {} }
  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('currentUser');
    } catch (e) {}
  }
  function onPublicPage() { return PUBLIC_PAGES.test(window.location.pathname); }
  function sessionExpired() {
    clearSession();
    if (!onPublicPage()) window.location.href = 'index.html';
  }

  /* ---------------- low level http ---------------- */
  function baseHeaders(extra) {
    var h = { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY };
    for (var k in extra || {}) h[k] = extra[k];
    return h;
  }

  async function fetchWithTimeout(url, opts, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms || 30000);
    try { return await fetch(url, Object.assign({}, opts, { signal: ctrl.signal })); }
    finally { clearTimeout(timer); }
  }

  async function rpc(fn, args, opts) {
    opts = opts || {};
    var attempts = opts.retry ? 2 : 1;
    var lastErr;
    for (var i = 0; i < attempts; i++) {
      try {
        var res = await fetchWithTimeout(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
          method: 'POST',
          headers: baseHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ args: args || {} })
        }, opts.timeout);
        var text = await res.text();
        var body = text ? JSON.parse(text) : null;
        if (!res.ok) {
          var err = new Error((body && body.message) || ('Request failed (' + res.status + ')'));
          err.status = res.status;
          if (res.status === 401 && !opts.noExpire) sessionExpired();
          throw err;
        }
        return body;
      } catch (e) {
        lastErr = e;
        var network = !e.status; // timeouts / offline: retry once for reads
        if (!network || i === attempts - 1) break;
        await new Promise(function (r) { setTimeout(r, 600); });
      }
    }
    if (lastErr && lastErr.name === 'AbortError') lastErr = new Error('Connection timeout. Please try again.');
    else if (lastErr && !lastErr.status && /Failed to fetch|NetworkError|Load failed/i.test(lastErr.message)) {
      lastErr = new Error('Network error. Please check your internet connection.');
    }
    throw lastErr;
  }

  /* ---------------- file storage ---------------- */
  var uploadCache = {};
  var EXT = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'application/pdf': 'pdf', 'text/plain': 'txt', 'application/zip': 'zip',
    'application/x-zip-compressed': 'zip', 'application/vnd.rar': 'rar',
    'application/x-rar-compressed': 'rar', 'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav',
    'video/mp4': 'mp4', 'video/webm': 'webm'
  };

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // Shrink big photos before upload (max 1600px, JPEG 85%). Small files and GIFs are untouched.
  async function compressImage(blob) {
    if (!/^image\/(jpeg|png|webp)$/.test(blob.type) || blob.size < 400 * 1024) return blob;
    try {
      var bmp = await createImageBitmap(blob);
      var scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
      var out = await new Promise(function (r) { canvas.toBlob(r, 'image/jpeg', 0.85); });
      return out && out.size < blob.size ? out : blob;
    } catch (e) { return blob; }
  }

  async function uploadDataUrl(dataUrl, folder) {
    if (uploadCache[dataUrl]) return uploadCache[dataUrl];
    var m = /^data:([^;,]*)((?:;[^;,]*)*),/.exec(dataUrl);
    if (!m) throw new Error('Unsupported file');
    var mime = (m[1] || 'application/octet-stream').toLowerCase();
    var blob = await (await fetch(dataUrl)).blob();
    blob = await compressImage(new Blob([blob], { type: mime }));
    mime = blob.type || mime;
    var ext = EXT[mime];
    if (!ext) throw new Error('This file type is not supported');
    var path = (folder || 'misc') + '/' + uuid() + '.' + ext;
    var res = await fetchWithTimeout(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + path, {
      method: 'POST',
      headers: baseHeaders({ 'Content-Type': mime, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' }),
      body: blob
    }, 120000);
    if (!res.ok) {
      var msg = '';
      try { msg = (await res.json()).message || ''; } catch (e) {}
      throw new Error(/size|exceed/i.test(msg) ? 'File is too large (max 10 MB)' : 'Upload failed. ' + msg);
    }
    var url = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path;
    uploadCache[dataUrl] = url;
    return url;
  }

  // Walks any value; every base64 data URL (also inside JSON strings) becomes a storage link.
  async function externalize(value, folder) {
    if (typeof value === 'string') {
      if (value.indexOf('data:') === 0 && value.indexOf(',') > 0) return uploadDataUrl(value, folder);
      var c = value.charAt(0);
      if ((c === '{' || c === '[') && value.indexOf('data:') > -1) {
        try {
          var parsed = JSON.parse(value);
          return JSON.stringify(await externalize(parsed, folder));
        } catch (e) { return value; }
      }
      return value;
    }
    if (Array.isArray(value)) {
      var arr = [];
      for (var i = 0; i < value.length; i++) arr.push(await externalize(value[i], folder));
      return arr;
    }
    if (value && typeof value === 'object') {
      var out = {};
      for (var k in value) out[k] = await externalize(value[k], folder);
      return out;
    }
    return value;
  }

  /* ---------------- object API (old trickle* names) ---------------- */
  async function trickleCreateObject(table, data) {
    var clean = await externalize(data || {}, table);
    return rpc('app_create', { token: getToken(), table: table, data: clean });
  }

  // 5th argument (optional): { filter: {field: value}, gt: {field: number}, order: 'asc' }
  async function trickleListObjects(table, limit, paginate, nextPageToken, options) {
    options = options || {};
    var res = await rpc('app_list', {
      token: getToken(), table: table, limit: limit || 50,
      offset: nextPageToken ? parseInt(nextPageToken, 10) || 0 : 0,
      filter: options.filter, gt: options.gt, order: options.order
    }, { retry: true });
    return {
      items: res.items || [],
      nextPageToken: res.nextOffset != null ? String(res.nextOffset) : undefined
    };
  }

  async function trickleGetObject(table, objectId) {
    return rpc('app_get', { token: getToken(), table: table, id: objectId }, { retry: true });
  }

  async function trickleUpdateObject(table, objectId, data) {
    var clean = await externalize(data || {}, table);
    return rpc('app_update', { token: getToken(), table: table, id: objectId, data: clean });
  }

  async function trickleDeleteObject(table, objectId) {
    await rpc('app_delete', { token: getToken(), table: table, id: objectId });
    return true;
  }

  // Fetch every page (use sparingly; prefer filters).
  async function trickleListAll(table, options, pageSize) {
    var items = [], token;
    do {
      var r = await trickleListObjects(table, pageSize || 1000, true, token, options);
      items = items.concat(r.items);
      token = r.nextPageToken;
    } while (token);
    return items;
  }

  /* ---------------- accounts ---------------- */
  async function appLogin(reg, password) {
    var res = await rpc('app_login', { reg: reg, password: password }, { noExpire: true });
    if (res && res.error) { var e = new Error(res.error); e.status = res.status; throw e; }
    setToken(res.token);
    return res;
  }
  async function appLogout() {
    var t = getToken();
    clearSession();
    if (t) { try { await rpc('app_logout', { token: t }, { noExpire: true }); } catch (e) {} }
  }
  function appMe() { return rpc('app_me', { token: getToken() }); }
  function appCheckValid(reg) { return rpc('app_check_valid', { reg: reg }, { retry: true, noExpire: true }); }
  function appRegExists(reg) { return rpc('app_reg_exists', { reg: reg }, { retry: true, noExpire: true }); }
  async function appRegister(data) {
    var clean = await externalize(data, 'registered_user');
    return rpc('app_register', { data: clean }, { noExpire: true });
  }
  function appRequestPasswordReset(reg) { return rpc('app_request_password_reset', { reg: reg }, { noExpire: true }); }
  function appChangePassword(oldPw, newPw) {
    return rpc('app_change_password', { token: getToken(), old: oldPw, new: newPw });
  }
  function appApproveReset(requestId) { return rpc('app_approve_reset', { token: getToken(), id: requestId }); }

  window.HC = {
    url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, rpc: rpc,
    getToken: getToken, clearSession: clearSession, uploadDataUrl: uploadDataUrl, externalize: externalize
  };
  window.trickleCreateObject = trickleCreateObject;
  window.trickleListObjects = trickleListObjects;
  window.trickleGetObject = trickleGetObject;
  window.trickleUpdateObject = trickleUpdateObject;
  window.trickleDeleteObject = trickleDeleteObject;
  window.trickleListAll = trickleListAll;
  window.appLogin = appLogin;
  window.appLogout = appLogout;
  window.appMe = appMe;
  window.appCheckValid = appCheckValid;
  window.appRegExists = appRegExists;
  window.appRegister = appRegister;
  window.appRequestPasswordReset = appRequestPasswordReset;
  window.appChangePassword = appChangePassword;
  window.appApproveReset = appApproveReset;
})();


// ---------------------------------------------------------------------------
// Busy buttons: when a click starts a request, the button is disabled and shows a spinner
// until the request(s) finish, so nothing can be double-clicked.
// ---------------------------------------------------------------------------
(function () {
  if (window.__hcBusyInstalled) return;
  window.__hcBusyInstalled = true;
  var seq = 0, pending = {};
  var origFetch = window.fetch ? window.fetch.bind(window) : null;
  if (origFetch) {
    window.fetch = function () {
      var id = ++seq; pending[id] = 1;
      var p = origFetch.apply(null, arguments);
      var done = function () { delete pending[id]; };
      p.then(done, done);
      return p;
    };
  }
  function anyActiveSince(start) {
    for (var id in pending) if (+id > start) return true;
    return false;
  }
  function makeBusy(btn, start) {
    if (btn.classList.contains('hc-busy')) return;
    var weDisabled = !btn.disabled;
    btn.classList.add('hc-busy');
    btn.setAttribute('aria-busy', 'true');
    if (weDisabled) btn.disabled = true;
    var t0 = Date.now(), lastSeq = seq, quietSince = 0;
    var iv = setInterval(function () {
      var now = Date.now();
      if (anyActiveSince(start) || seq !== lastSeq) { lastSeq = seq; quietSince = 0; if (now - t0 < 60000) return; }
      else {
        if (!quietSince) { quietSince = now; return; }
        if (now - quietSince < 150 || now - t0 < 350) return;
      }
      clearInterval(iv);
      btn.classList.remove('hc-busy');
      btn.removeAttribute('aria-busy');
      if (weDisabled) btn.disabled = false;
    }, 60);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    if (btn.classList.contains('hc-busy')) { e.stopPropagation(); e.preventDefault(); return; }
    if (btn.disabled || btn.hasAttribute('data-no-busy')) return;
    var start = seq, tries = 0;
    (function check() {
      if (!btn.isConnected) return;
      if (seq > start) { makeBusy(btn, start); return; }
      if (++tries < 5) setTimeout(check, tries === 1 ? 0 : 80);
    })();
  }, true);
})();


// ---------------------------------------------------------------------------
// Click + cursor motion (desktop only parts are gated by the pointer media query)
// ---------------------------------------------------------------------------
(function () {
  if (window.__hcFxInstalled) return;
  window.__hcFxInstalled = true;
  document.addEventListener('pointerdown', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('button,a.hc-gold-btn') : null;
    if (!el || el.disabled) return;
    el.classList.remove('hc-pulse'); void el.offsetWidth; el.classList.add('hc-pulse');
    setTimeout(function () { el.classList.remove('hc-pulse'); }, 520);
  }, true);
  if (!window.matchMedia || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var root = document.documentElement, raf = 0, last = null;
  document.addEventListener('pointermove', function (e) { last = e; if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  function tick() {
    raf = 0; if (!last) return;
    root.style.setProperty('--mx', (last.clientX / window.innerWidth).toFixed(3));
    root.style.setProperty('--my', (last.clientY / window.innerHeight).toFixed(3));
    var t = last.target && last.target.closest ? last.target.closest('.hc-card,.hc-tile,.hc-card-desktop') : null;
    if (t) {
      var r = t.getBoundingClientRect();
      t.style.setProperty('--px', (last.clientX - r.left) + 'px');
      t.style.setProperty('--py', (last.clientY - r.top) + 'px');
    }
  }
})();
