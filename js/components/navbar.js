/* Navbar: scroll state, mobile menu, active-section tracking + indicator,
   scroll progress, back-to-top. */
(function () {
  var HP = window.HP;

  HP.components.Navbar = function () {
    var nav = HP.$("#navbar"), toggle = HP.$("#navToggle"), links = HP.$("#navLinks");
    var indicator = HP.$("#navIndicator"), progress = HP.$("#scrollProgress"), toTop = HP.$("#toTop");
    var navAnchors = HP.$$("[data-nav]", links);
    toggle.innerHTML = HP.icons.menu;
    toTop.innerHTML = HP.icons.up;

    function setMenu(open) {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      toggle.innerHTML = open ? HP.icons.close : HP.icons.menu;
    }
    toggle.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && links.classList.contains("open")) { setMenu(false); toggle.focus(); } });
    document.addEventListener("click", function (e) {
      // composedPath is captured at dispatch, so it still works after the toggle icon was swapped out.
      var inside = e.composedPath ? e.composedPath().indexOf(nav) !== -1 : nav.contains(e.target);
      if (links.classList.contains("open") && !inside) setMenu(false);
    });

    /* Active section: nav items map to one or more section ids. */
    var MAP = { home: ["home"], support: ["support", "how"], leaderboard: ["leaderboard", "recent"], milestones: ["milestones", "wall", "updates"], about: ["about", "connect"], faq: ["faq"] };
    var reverse = {};
    Object.keys(MAP).forEach(function (k) { MAP[k].forEach(function (id) { reverse[id] = k; }); });
    var current = null;

    function moveIndicator(a) {
      if (!a || getComputedStyle(indicator).display === "none") return;
      var nr = nav.querySelector(".nav-inner").getBoundingClientRect(), ar = a.getBoundingClientRect();
      indicator.style.width = ar.width - 28 + "px";
      indicator.style.transform = "translateX(" + (ar.left - nr.left + 14) + "px)";
      indicator.style.opacity = "1";
    }
    function setActive(key) {
      if (key === current) return;
      current = key;
      navAnchors.forEach(function (a) {
        var on = a.dataset.nav === key;
        a.classList.toggle("active", on);
        if (on) { a.setAttribute("aria-current", "true"); moveIndicator(a); } else a.removeAttribute("aria-current");
      });
    }

    var sections = HP.$$("[data-section]");
    if ("IntersectionObserver" in window) {
      var visible = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible[en.target.dataset.section] = en.isIntersecting ? en.intersectionRatio : 0; });
        var best = null, bestV = 0;
        Object.keys(visible).forEach(function (id) { if (visible[id] > bestV && reverse[id]) { best = id; bestV = visible[id]; } });
        if (best) setActive(reverse[best]);
      }, { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.01, 0.5, 1] });
      sections.forEach(function (s) { io.observe(s); });
    }
    window.addEventListener("resize", function () { var a = navAnchors.filter(function (x) { return x.classList.contains("active"); })[0]; moveIndicator(a); }, { passive: true });

    /* Scroll-driven bits in a single rAF-throttled listener. */
    var ticking = false;
    function onScroll() {
      ticking = false;
      var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
      nav.classList.toggle("scrolled", y > 24);
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
      toTop.classList.toggle("show", y > 600);
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: HP.reducedMotion() ? "auto" : "smooth" });
    });
  };
})();
