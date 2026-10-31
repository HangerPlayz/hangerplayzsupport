/* Tiny DOM helpers + icons + toast. Data is always inserted with textContent
   (never innerHTML) so backend-provided strings can't inject markup. */
(function () {
  var HP = (window.HP = window.HP || { components: {} });

  HP.reducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };
  HP.isTouch = function () {
    return window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches;
  };

  /** h("div", {class:"x", onclick:fn}, child1, "text", ...) */
  HP.h = function (tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v; // only ever used with our own static icon strings
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
    return el;
  };

  HP.$ = function (s, r) { return (r || document).querySelector(s); };
  HP.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- Icons (simple generic glyphs; swap for official brand SVGs if you wish) ---- */
  var S = function (p, extra) {
    return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"' + (extra || "") + ">" + p + "</svg>";
  };
  HP.icons = {
    copy: S('<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>'),
    expand: S('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'),
    close: S('<path d="M6 6l12 12M18 6L6 18"/>'),
    menu: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    up: S('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    back: S('<path d="M15 5l-7 7 7 7"/>'),
    chat: S('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.3A8 8 0 1 1 21 12z"/>'),
    music: S('<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'),
    volume: S('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9a4 4 0 0 1 0 6"/>'),
    check: S('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    lock: S('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    unlock: S('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>'),
    star: S('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>'),
    trophy: S('<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3M12 13v4M9 20h6M10 17h4"/>'),
    heart: S('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>'),
    qr: S('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2"/>'),
    phone: S('<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>'),
    external: S('<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>'),
    send: S('<path d="M4 12l16-8-6 16-3-7-7-1z"/>'),
    info: S('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    youtube: S('<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="M10.500 9.500v5l4.500-2.500z" fill="currentColor"/>'),
    instagram: S('<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.600"/><circle cx="16.800" cy="7.200" r=".8" fill="currentColor"/>'),
    discord: S('<path d="M7 7.500c1.600-.9 3.200-1.300 5-1.300s3.400.4 5 1.300c1.500 2.300 2.200 4.700 2.300 7.300-1.200.9-2.400 1.500-3.700 1.900l-.9-1.500M7 7.500C5.500 9.800 4.800 12.200 4.700 14.800c1.200.9 2.400 1.500 3.700 1.900l.9-1.500"/><circle cx="9.500" cy="12.200" r="1" fill="currentColor"/><circle cx="14.500" cy="12.200" r="1" fill="currentColor"/>'),
    modrinth: S('<path d="M12 3l7.500 4.300v8.400L12 20l-7.500-4.300V7.300L12 3z"/><path d="M8.500 13.500l3.500 2 3.500-2M12 15.500V9"/>'),
    curseforge: S('<path d="M4 8h16l-2 3H9.500c-1.500 0-2 1-2 2s.5 2 2 2H16l2 3H8a5 5 0 0 1-5-5V8z"/>'),
    globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
    cube: S('<path d="M12 3l8 4.500v9L12 21l-8-4.500v-9L12 3z"/><path d="M4 7.500l8 4.500 8-4.500M12 12v9"/>'),
    plug: S('<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8zM12 16v5"/>'),
    bolt: S('<path d="M13 3L5 13.500h6L10 21l8-10.500h-6L13 3z"/>'),
    users: S('<circle cx="9" cy="8" r="3.500"/><path d="M3 20c0-3.500 2.700-6 6-6s6 2.500 6 6"/><path d="M16 5a3.500 3.500 0 0 1 0 7M18 14.500c1.800.8 3 2.600 3 5.500"/>'),
  };

  /* ---- Toast ---- */
  var toastTimer;
  HP.toast = function (msg, kind) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast show" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, 2600);
  };

  /* ---- Clipboard (with fallback for http / older browsers) ---- */
  HP.copy = function (text, okMsg) {
    function done(ok) { HP.toast(ok ? okMsg || "Copied!" : "Couldn't copy — please copy manually.", ok ? "" : "warn"); if (ok && HP.sound) HP.sound.click(); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:-100px;opacity:0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      done(ok);
    }
  };

  /* ---- Backend data (read-only GETs; returns null when no backend) ---- */
  HP.api = {
    enabled: function () { return !!HP.config.api.baseUrl; },
    get: function (path) {
      if (!HP.api.enabled()) return Promise.resolve(null);
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var timer = ctrl && setTimeout(function () { ctrl.abort(); }, HP.config.api.timeoutMs);
      return fetch(HP.config.api.baseUrl.replace(/\/$/, "") + path, { headers: { Accept: "application/json" }, signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .catch(function () { return null; })
        .then(function (d) { if (timer) clearTimeout(timer); return d; });
    },
  };

  HP.fmtDate = function (iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
})();
