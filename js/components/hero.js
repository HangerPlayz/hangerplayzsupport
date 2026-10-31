/* Hero: icons, floating particles (paused when off-screen / tab hidden),
   scroll-reveal observer. */
(function () {
  var HP = window.HP;

  HP.components.Hero = function () {
    HP.$$("[data-icon]").forEach(function (el) { var i = HP.icons[el.dataset.icon]; if (i) { el.innerHTML = i; el.removeAttribute("data-icon"); } });
    initParticles();
  };

  HP.components.Reveal = function () {
    var els = HP.$$(".reveal");
    els.forEach(function (el, i) { el.style.setProperty("--d", (i % 4) * 70 + "ms"); });
    if (!("IntersectionObserver" in window) || HP.reducedMotion()) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
    HP.reveal = function (root) { HP.$$(".reveal:not(.in)", root).forEach(function (e) { io.observe(e); }); };
  };

  function initParticles() {
    var canvas = HP.$("#particles");
    if (!canvas || HP.reducedMotion()) { if (canvas) canvas.remove(); return; }
    var c = canvas.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), w = 0, h = 0, parts = [], raf = 0, running = false;
    var COUNT = window.innerWidth < 700 ? 18 : 32;

    function resize() {
      var r = canvas.getBoundingClientRect(); w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make() {
      return { x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2 + .6, vy: -(Math.random() * .25 + .08), vx: (Math.random() - .5) * .12, a: Math.random() * .5 + .15 };
    }
    function init() { resize(); parts = []; for (var i = 0; i < COUNT; i++) parts.push(make()); }
    function frame() {
      c.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]; p.x += p.vx; p.y += p.vy;
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        c.beginPath(); c.fillStyle = "rgba(192,132,252," + p.a + ")"; c.arc(p.x, p.y, p.r, 0, 6.2832); c.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    init();
    var resizeT;
    window.addEventListener("resize", function () { clearTimeout(resizeT); resizeT = setTimeout(init, 200); }, { passive: true });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : (onScreen && start()); });
    var onScreen = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; onScreen && !document.hidden ? start() : stop(); }).observe(canvas);
    } else start();
  }
})();
