/* Bootstraps every component. Each one is isolated: a failure in one never
   stops the rest of the site from working. */
(function () {
  var HP = window.HP;

  function safe(name, fn) {
    try { var r = fn(); if (r && r.catch) r.catch(function (e) { console.error("[HangerPlayz]", name, e); }); }
    catch (e) { console.error("[HangerPlayz]", name, e); }
  }

  function boot() {
    safe("Hero", HP.components.Hero);       // swaps [data-icon] placeholders, starts particles
    safe("Reveal", HP.components.Reveal);
    safe("Navbar", HP.components.Navbar);
    safe("Audio", HP.components.Audio);
    safe("Payment", HP.components.PaymentSection);
    safe("About", HP.components.About);
    safe("Social", HP.components.SocialLinks);
    safe("FAQ", HP.components.FAQ);
    safe("Footer", HP.components.Footer);
    safe("QuickHelp", HP.components.QuickHelp);
    safe("Leaderboard", HP.components.Leaderboard);
    safe("Recent", HP.components.RecentSupporters);
    safe("Milestones", HP.components.Milestones);
    safe("Wall", HP.components.CommunityWall);
    safe("Updates", HP.components.Updates);
    safe("Cursor", HP.components.Cursor);
    // Re-observe reveal elements that were created after the initial pass.
    if (HP.reveal) HP.reveal(document);
    else HP.$$(".reveal").forEach(function (e) { e.classList.add("in"); });

    // Hide the loader shortly after everything is ready.
    var loader = HP.$("#loader");
    function hideLoader() { if (loader) { loader.classList.add("done"); setTimeout(function () { loader.remove(); }, 600); } }
    if (document.readyState === "complete") setTimeout(hideLoader, 350);
    else window.addEventListener("load", function () { setTimeout(hideLoader, 350); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
