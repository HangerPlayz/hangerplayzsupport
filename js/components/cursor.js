/* Custom cursor system. Enabled only on fine-pointer (mouse) devices and when
   reduced-motion is off. It never intercepts events (pointer-events:none), so
   clicking and text selection behave normally. If anything fails, the native
   cursor is restored. Modes: arrow / link (hand + ring) / text (I-beam). */
(function () {
  var HP = window.HP;

  var ARROW = '<svg class="cursor-shape cursor-arrow" width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M3 2l17 11.200-7.600 1.600 4.300 8.400-3.600 1.800-4.300-8.400L3 21.500z" fill="#a855f7" stroke="#f5f3ff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var HAND = '<svg class="cursor-shape cursor-hand" width="30" height="32" viewBox="0 0 30 32" aria-hidden="true"><path d="M11 4.500a2 2 0 0 1 4 0V13l1.500-.4a2 2 0 0 1 2.500 1.400l.4 0a2 2 0 0 1 2.400 1.300 2 2 0 0 1 2.200 2l-.2 6.200c-.1 2.600-2.200 4.700-4.800 4.700h-3.700c-1.500 0-2.900-.7-3.800-1.900L6.400 20c-.6-.9-.4-2.100.5-2.700.8-.5 1.800-.4 2.500.2L11 18.800z" fill="#c084fc" stroke="#f5f3ff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  var IBEAM = '<svg class="cursor-shape cursor-text" width="16" height="30" viewBox="0 0 16 30" aria-hidden="true"><path d="M3 3h10M3 27h10M8 3v24" stroke="#f5f3ff" stroke-width="5" stroke-linecap="round" opacity=".0"/><path d="M4 3.500h8M4 26.500h8M8 3.500v23" stroke="#c084fc" stroke-width="2.200" stroke-linecap="round"/></svg>';

  var LINK_SEL = 'a[href], button, summary, [role="button"], label[for], input[type="checkbox"], input[type="range"], select, .amt, .chip, .app-btn, .faq-q, .qr-frame';
  var TEXT_SEL = 'input:not([type="checkbox"]):not([type="range"]):not([type="button"]), textarea, [contenteditable="true"]';

  HP.components.Cursor = function () {
    var root = HP.$("#cursor");
    if (!root || HP.isTouch() || HP.reducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) { if (root) root.remove(); return; }

    root.innerHTML = '<div class="cursor-shape cursor-ring"></div>' + ARROW + HAND + IBEAM;
    var ring = root.querySelector(".cursor-ring"), arrow = root.querySelector(".cursor-arrow"), hand = root.querySelector(".cursor-hand"), ibeam = root.querySelector(".cursor-text");
    root.dataset.hidden = "1";

    var x = -100, y = -100, rx = -100, ry = -100, raf = 0, shown = false, mode = "arrow";
    var TRAIL = 6, trail = [], tpos = [];
    for (var i = 0; i < TRAIL; i++) {
      var d = document.createElement("div"); d.className = "trail-dot"; d.style.opacity = "0"; document.body.appendChild(d);
      trail.push(d); tpos.push({ x: -100, y: -100 });
    }

    function setMode(m) { if (m !== mode) { mode = m; root.dataset.mode = m; } }

    function onMove(e) {
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; rx = x; ry = y; delete root.dataset.hidden; }
      var t = e.target;
      if (t && t.closest) setMode(t.closest(TEXT_SEL) ? "text" : t.closest(LINK_SEL) ? "link" : "arrow");
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function loop() {
      raf = 0;
      rx += (x - rx) * 0.28; ry += (y - ry) * 0.28;
      arrow.style.translate = x + "px " + y + "px";
      hand.style.translate = x + "px " + y + "px";
      ibeam.style.translate = x + "px " + y + "px";
      ring.style.translate = rx + "px " + ry + "px";
      // Trail: each dot follows the previous one.
      var px = rx, py = ry;
      for (var i = 0; i < TRAIL; i++) {
        var p = tpos[i]; p.x += (px - p.x) * 0.35; p.y += (py - p.y) * 0.35;
        trail[i].style.transform = "translate(" + p.x + "px," + p.y + "px) scale(" + (1 - i / TRAIL) + ")";
        trail[i].style.opacity = shown ? String(0.35 * (1 - i / TRAIL)) : "0";
        px = p.x; py = p.y;
      }
      var moving = Math.abs(x - rx) > 0.2 || Math.abs(y - ry) > 0.2 || Math.abs(tpos[TRAIL - 1].x - rx) > 0.5;
      if (moving) raf = requestAnimationFrame(loop);
    }

    // The arrow's hotspot is its top-left tip; the hand/ring/I-beam use CSS `translate`
    // so they don't clash with their own `transform` (scale) transitions.
    document.documentElement.classList.add("custom-cursor");
    document.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse" || e.pointerType === "pen") onMove(e); }, { passive: true });
    document.addEventListener("pointerdown", function () { root.dataset.down = "1"; });
    document.addEventListener("pointerup", function () { delete root.dataset.down; });
    document.documentElement.addEventListener("mouseleave", function () { root.dataset.hidden = "1"; shown = false; });
    document.documentElement.addEventListener("mouseenter", function () { delete root.dataset.hidden; });
    // If a touch/pen interaction happens later (hybrid laptops), fall back to the native cursor.
    window.addEventListener("touchstart", function () {
      document.documentElement.classList.remove("custom-cursor"); root.remove(); trail.forEach(function (t) { t.remove(); });
    }, { once: true, passive: true });
  };
})();
