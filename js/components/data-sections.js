/* Leaderboard, Milestones, RecentSupporters, CommunityWall, Updates.
   All data comes from the (optional) backend via HP.api. With no backend they
   render honest empty states — nothing here is invented.
   All strings are inserted with textContent (see HP.h) and length-capped. */
(function () {
  var HP = window.HP, h = HP.h, U = HP.utils;

  function str(v, max) { return String(v == null ? "" : v).slice(0, max || 200); }
  function num(v) { var n = Number(v); return isFinite(n) && n >= 0 ? n : 0; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function empty(iconName, title, text) {
    var ico = h("div", { class: "ico", html: HP.icons[iconName] });
    return h("div", { class: "empty reveal in" }, ico, h("h3", null, title), h("p", null, text));
  }
  function setNote(id, text) { var n = HP.$(id); if (n) n.textContent = text; }
  var NO_BACKEND = "Live supporter data isn't connected yet, so nothing is shown. Nothing on this page is made up.";

  /* ---------------- Leaderboard ---------------- */
  HP.components.Leaderboard = function () {
    var root = HP.$("#leaderboardBody");
    return HP.api.get("/leaderboard").then(function (data) {
      clear(root);
      var rows = arr(data).map(function (r) { return { name: str(r.name || "Anonymous", 40), total: num(r.total), message: str(r.message, 140) }; })
        .filter(function (r) { return r.total > 0; })
        .sort(function (a, b) { return b.total - a.total; }).slice(0, 25);
      if (!rows.length) {
        root.appendChild(empty("trophy", "No verified supporters yet", HP.api.enabled() ? "Be the first name on the Hall of Supporters." : "The first verified supporter will appear here."));
        setNote("#leaderboardNote", HP.api.enabled() ? "" : NO_BACKEND);
        return;
      }
      var top = h("div", { class: "lb-top" });
      rows.slice(0, 3).forEach(function (r, i) {
        var card = h("article", { class: "lb-card lb-" + (i + 1) + " anim-in", style: "--d:" + i * 120 + "ms" },
          i === 0 ? h("span", { class: "crown", html: HP.icons.trophy, "aria-hidden": "true" }) : null,
          h("span", { class: "rank", "aria-label": "Rank " + (i + 1) }, String(i + 1)),
          h("div", { class: "name" }, r.name),
          h("div", { class: "total" }, U.formatINR(r.total)),
          r.message ? h("p", { class: "msg" }, r.message) : null);
        top.appendChild(card);
      });
      root.appendChild(top);
      var list = h("ol", { class: "lb-list" });
      rows.slice(3).forEach(function (r, i) {
        list.appendChild(h("li", { class: "lb-row anim-in", style: "--d:" + (360 + i * 60) + "ms" },
          h("span", { class: "rank" }, String(i + 4)),
          h("div", null, h("div", { class: "name" }, r.name), r.message ? h("div", { class: "msg" }, r.message) : null),
          h("span", { class: "total" }, U.formatINR(r.total))));
      });
      root.appendChild(list);
    });
  };

  /* ---------------- Milestones ---------------- */
  HP.components.Milestones = function () {
    var root = HP.$("#milestoneBody"), goals = HP.config.milestones;
    return HP.api.get("/milestones").then(function (data) {
      var demo = false, count = 0, hasData = false;
      if (data && typeof data === "object") { count = Math.floor(num(data.verifiedSupporters)); hasData = true; }
      else if (HP.config.demo.enabled) { count = HP.config.demo.supporterCount; demo = true; hasData = true; }

      var next = U.nextMilestoneIndex(count, goals);
      var pct = U.milestoneProgress(count, goals);
      clear(root);

      var status = demo ? h("span", { class: "badge demo" }, "DEMO DATA — not real supporters") : null;
      root.appendChild(h("div", { class: "ms-top" },
        h("div", null, h("div", { class: "ms-count" }, count + (count === 1 ? " verified supporter" : " verified supporters")),
          next >= 0 ? h("div", { class: "muted small" }, "Next milestone: " + goals[next] + " supporters (" + (goals[next] - count) + " to go)") : h("div", { class: "muted small" }, "All milestones unlocked. Thank you!")),
        status));

      var track = h("div", { class: "ms-track", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(goals[goals.length - 1]), "aria-valuenow": String(count), "aria-label": "Verified supporters toward the next milestone" });
      var fill = h("div", { class: "ms-fill" });
      track.appendChild(fill);
      goals.forEach(function (g, i) {
        var unlocked = count >= g, isNext = i === next;
        var node = h("div", { class: "ms-node" + (unlocked ? " unlocked" : "") + (isNext ? " next" : ""), style: "left:" + ((i + 1) / goals.length) * 100 + "%" },
          h("span", { class: "ms-dot", html: unlocked ? HP.icons.check : isNext ? HP.icons.star : HP.icons.lock }),
          h("span", { class: "ms-label" }, h("span", { class: "ms-long" }, i === 0 ? "First " + g + " supporters" : g + " supporters"), h("span", { class: "ms-short", "aria-hidden": "true" }, String(g)), h("span", { class: "ms-tag" }, unlocked ? "Unlocked" : isNext ? "Next up" : "Locked")));
        track.appendChild(node);
      });
      root.appendChild(track);
      root.appendChild(h("p", { class: "ms-note small muted" }, hasData ? "Counts only verified contributions recorded by the backend." : NO_BACKEND));

      // Animate the fill once the card scrolls into view.
      function go() { fill.style.width = pct + "%"; }
      if (HP.reducedMotion() || !("IntersectionObserver" in window)) go();
      else new IntersectionObserver(function (en, io) { if (en[0].isIntersecting) { go(); io.disconnect(); } }, { threshold: 0.4 }).observe(track);
    });
  };

  /* ---------------- Recent supporters ---------------- */
  HP.components.RecentSupporters = function () {
    var root = HP.$("#recentBody");
    return HP.api.get("/recent").then(function (data) {
      clear(root);
      var items = arr(data).slice(0, 10).map(function (r) { return { name: str(r.name || "Anonymous", 40), amount: num(r.amount), date: r.date, message: str(r.message, 140) }; }).filter(function (r) { return r.amount > 0; });
      if (!items.length) { root.appendChild(empty("heart", "Be the first to support HangerPlayz!", "Verified contributions will show up here.")); return; }
      var list = h("ul", { class: "recent-list" });
      items.forEach(function (r, i) {
        list.appendChild(h("li", { class: "recent-item anim-in", style: "--d:" + i * 70 + "ms" },
          h("span", { class: "avatar", "aria-hidden": "true" }, r.name.charAt(0).toUpperCase()),
          h("div", null, h("div", { class: "who" }, r.name), h("div", { class: "meta" }, HP.fmtDate(r.date)), r.message ? h("div", { class: "says" }, r.message) : null),
          h("span", { class: "amt-out" }, U.formatINR(r.amount))));
      });
      root.appendChild(list);
    });
  };

  /* ---------------- Community wall ---------------- */
  HP.components.CommunityWall = function () {
    var root = HP.$("#wallBody");
    return HP.api.get("/wall").then(function (data) {
      clear(root);
      // The backend must only return messages with status "approved"; we also drop empty ones.
      var items = arr(data).slice(0, 30).map(function (r) { return { name: str(r.name || "Anonymous", 40), message: str(r.message, 240), date: r.date }; }).filter(function (r) { return r.message.trim(); });
      if (!items.length) { root.appendChild(empty("chat", "No messages yet", "Approved messages from verified supporters will appear here.")); return; }
      var grid = h("div", { class: "wall-grid" });
      items.forEach(function (r, i) {
        grid.appendChild(h("article", { class: "wall-card anim-in", style: "--d:" + (i % 6) * 80 + "ms" },
          h("blockquote", null, "“" + r.message + "”"),
          h("div", { class: "by" }, h("strong", null, r.name), h("span", null, HP.fmtDate(r.date)))));
      });
      root.appendChild(grid);
    });
  };

  /* ---------------- Latest updates ---------------- */
  HP.components.Updates = function () {
    var root = HP.$("#updatesBody");
    return HP.api.get("/updates").then(function (data) {
      clear(root);
      var real = arr(data).slice(0, 6).map(function (u) { return { tag: str(u.tag || "News", 20), title: str(u.title, 100), body: str(u.body, 300), date: HP.fmtDate(u.date) }; }).filter(function (u) { return u.title; });
      var items = real, isExample = false;
      if (!items.length) { items = HP.config.updatesExamples; isExample = true; }
      if (isExample) root.appendChild(h("p", { class: "example-flag" }, h("span", { class: "badge demo" }, "EXAMPLE PLACEHOLDERS — replace with real updates")));
      var grid = h("div", { class: "update-grid" });
      items.forEach(function (u, i) {
        grid.appendChild(h("article", { class: "card update-card reveal", style: "--d:" + i * 90 + "ms" },
          h("span", { class: "tag" }, u.tag), h("h3", null, u.title), h("p", null, u.body), h("span", { class: "date" }, u.date)));
      });
      root.appendChild(grid);
      if (HP.reveal) HP.reveal(root);
    });
  };
})();
