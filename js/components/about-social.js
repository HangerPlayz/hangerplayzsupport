/* About (project cards) + SocialLinks. Links come from HP.config.socials. */
(function () {
  var HP = window.HP, h = HP.h;

  HP.components.About = function () {
    var grid = HP.$("#projectGrid");
    [
      ["cube", "Minecraft content", "Videos, reels and community-focused Minecraft creativity."],
      ["bolt", "Fabric mods", "Lightweight mods built for the Fabric loader."],
      ["plug", "Minecraft plugins", "Server plugins that are simple to run and configure."],
      ["users", "Optimization projects", "Performance-focused work to keep the game smooth."],
    ].forEach(function (p, i) {
      grid.appendChild(h("article", { class: "project reveal", style: "--d:" + i * 80 + "ms" },
        h("div", { class: "ico", html: HP.icons[p[0]] }), h("h3", null, p[1]), h("p", null, p[2])));
    });
  };

  HP.components.SocialLinks = function () {
    var grid = HP.$("#socialGrid"), foot = HP.$("#footSocial");
    HP.config.socials.forEach(function (s, i) {
      var live = !!s.url;
      var inner = [
        h("span", { class: "ico", html: HP.icons[s.id] || HP.icons.globe }),
        h("strong", null, s.name),
        h("span", { class: "h" }, s.handle),
        h("span", { class: "b" }, s.blurb),
        live ? h("span", { class: "go", html: HP.icons.external, "aria-hidden": "true" }) : null,
      ];
      var card = live
        ? h.apply(null, ["a", { class: "social-card reveal", href: s.url, target: "_blank", rel: "noopener noreferrer", "aria-label": s.name + " (opens in a new tab)", style: "--d:" + i * 70 + "ms" }].concat(inner))
        : h.apply(null, ["div", { class: "social-card soon reveal", style: "--d:" + i * 70 + "ms", "aria-label": s.name + " — coming soon" }].concat(inner));
      grid.appendChild(card);

      var f = live
        ? h("a", { href: s.url, target: "_blank", rel: "noopener noreferrer", "aria-label": s.name + " (opens in a new tab)", html: HP.icons[s.id] || HP.icons.globe })
        : h("span", { class: "soon", title: s.name + " — coming soon", "aria-hidden": "true", html: HP.icons[s.id] || HP.icons.globe });
      if (live) foot.appendChild(f);
    });
  };
})();
