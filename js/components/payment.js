/* Payment section: QRCard, AmountSelector, PaymentSummary, UPI app buttons, steps.
   IMPORTANT: nothing here verifies a payment. Opening a UPI app only starts a
   payment intent — success can only be confirmed by a trusted backend. */
(function () {
  var HP = window.HP, U = HP.utils;

  // Shared state: the single source of truth for the selected amount.
  var state = { amount: null, source: null }; // source: "preset" | "custom" | null

  function cfg() { return HP.config.payment; }

  /* ---------------- QR card ---------------- */
  function QRCard() {
    var c = cfg();
    HP.$("#upiIdText").textContent = c.upiId;
    var dlg = HP.$("#qrDialog"), closeBtn = HP.$("#qrClose"), frame = HP.$(".qr-frame");
    closeBtn.innerHTML = HP.icons.close;

    function open() {
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    }
    function close() { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }
    HP.$("#qrEnlarge").addEventListener("click", open);
    frame.addEventListener("click", open);
    frame.setAttribute("role", "button"); frame.setAttribute("tabindex", "0"); frame.setAttribute("aria-label", "Enlarge payment QR code");
    frame.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    closeBtn.addEventListener("click", close);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); }); // click outside the card
    dlg.addEventListener("click", function (e) { if (!e.target.closest(".lightbox-card")) close(); });

    HP.$("#copyUpi").addEventListener("click", function () { HP.copy(c.upiId, "UPI ID copied: " + c.upiId); });
  }

  /* ---------------- Amount selector ---------------- */
  function AmountSelector() {
    var c = cfg(), grid = HP.$("#amountGrid"), input = HP.$("#customAmount");
    var err = HP.$("#customError"), hint = HP.$("#customHint");
    hint.textContent = "Allowed: " + HP.utils.formatINR(c.minAmount) + " to " + HP.utils.formatINR(c.maxAmount) + ". Numbers only, up to 2 decimals.";

    c.presets.forEach(function (v) {
      var b = HP.h("button", { type: "button", class: "amt", "aria-pressed": "false", "data-amount": v }, U.formatINR(v));
      b.addEventListener("click", function () {
        if (state.amount === v && state.source === "preset") { setAmount(null, null); return; } // toggle off
        input.value = ""; clearError();
        setAmount(v, "preset");
      });
      grid.appendChild(b);
    });

    function clearError() { err.textContent = ""; input.removeAttribute("aria-invalid"); }

    // Input rules: typing a disallowed character simply doesn't enter it (with a message).
    // A leading/embedded "-" is kept visible so the "can't be negative" error is clear.
    // Pasted text containing anything invalid is rejected as a whole.
    input.addEventListener("input", function (e) {
      var raw = input.value, pasted = e && /paste|drop/i.test(e.inputType || "");
      var cleaned = raw.replace(/[^0-9.\-]/g, "");
      var invalidChars = cleaned !== raw;
      if (invalidChars) input.value = cleaned;
      if (invalidChars && pasted) {
        err.textContent = "Pasted text contained invalid characters. Please type numbers only (e.g. 49 or 49.50).";
        input.setAttribute("aria-invalid", "true");
        setAmount(null, null);
        return;
      }
      var r = U.validateAmount(input.value, { min: c.minAmount, max: c.maxAmount });
      if (r.empty) {
        if (invalidChars) { err.textContent = "Only numbers are allowed."; input.setAttribute("aria-invalid", "true"); } else clearError();
        setAmount(null, null); return;
      }
      if (r.ok) {
        if (invalidChars) { err.textContent = "Only numbers are allowed."; input.removeAttribute("aria-invalid"); } else clearError();
        setAmount(r.value, "custom");
      } else { err.textContent = r.error; input.setAttribute("aria-invalid", "true"); setAmount(null, null); }
    });
    HP.$("#customForm").addEventListener("submit", function (e) { e.preventDefault(); });
    HP.$("#resetAmount").addEventListener("click", function () { input.value = ""; clearError(); setAmount(null, null); input.focus(); });

    function sync() {
      HP.$$(".amt", grid).forEach(function (b) { b.setAttribute("aria-pressed", String(state.source === "preset" && Number(b.dataset.amount) === state.amount)); });
    }
    AmountSelector.sync = sync;
  }

  /* ---------------- Summary ---------------- */
  function PaymentSummary() {
    var c = cfg();
    HP.$("#sumPayee").textContent = c.payeeName;
    HP.$("#sumUpi").textContent = c.upiId;
    PaymentSummary.render = function () {
      var el = HP.$("#sumAmount"), txt = state.amount == null ? "—" : U.formatINR(state.amount);
      if (el.textContent !== txt) {
        el.textContent = txt;
        el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap");
      }
      HP.$("#sumMethod").textContent = state.source === "preset" ? "UPI — preset amount" : state.source === "custom" ? "UPI — custom amount" : "UPI — scan QR or open a UPI app";
    };
  }

  function setAmount(v, source) {
    state.amount = v; state.source = source;
    AmountSelector.sync(); PaymentSummary.render();
    var n = HP.$("#payNotice"); n.hidden = true;
  }

  /* ---------------- Pay buttons ---------------- */
  var isMobile = function () {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  };

  function showNotice(msg, warn) {
    var n = HP.$("#payNotice");
    n.textContent = msg; n.className = "notice" + (warn ? " warn" : ""); n.hidden = false;
  }

  function needAmount() {
    showNotice("Please choose or enter an amount first.", true);
    var card = HP.$("#amountGrid").closest(".card");
    card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
    HP.$(".amt").focus({ preventScroll: false });
  }

  function launch(scheme, appName) {
    if (state.amount == null) { needAmount(); return; }
    var uri = U.buildUpiUri(cfg(), state.amount, scheme);
    if (!isMobile()) {
      showNotice("UPI apps open on phones. On a computer, scan the QR code with your phone, or copy the UPI ID / payment details.", true);
      pulseQr();
      return;
    }
    var left = false;
    function onHide() { if (document.hidden) left = true; }
    document.addEventListener("visibilitychange", onHide);
    HP.navigate(uri);
    showNotice("Opening " + (appName || "your UPI app") + "… Check the payee and amount there, then complete the payment. This site cannot confirm whether it succeeded.");
    setTimeout(function () {
      document.removeEventListener("visibilitychange", onHide);
      if (!left) showNotice("Nothing opened? Your device may not have that app. Try \"Pay Using UPI App\", copy the UPI ID, or scan the QR code.", true);
    }, 2200);
  }

  // Single place that hands the payment intent to the OS (overridable for tests).
  HP.navigate = HP.navigate || function (url) { window.location.href = url; };

  function pulseQr() {
    var q = HP.$("#qrCard"); q.classList.add("pulse");
    q.scrollIntoView({ behavior: HP.reducedMotion() ? "auto" : "smooth", block: "center" });
    setTimeout(function () { q.classList.remove("pulse"); }, 2500);
  }

  function PayActions() {
    var c = cfg();
    HP.$("#payBtn").addEventListener("click", function () { launch("upi://pay"); });

    var row = HP.$("#appRow");
    c.apps.forEach(function (app) {
      var badge = HP.h("span", { class: "app-badge", style: "background:" + app.color, "aria-hidden": "true" }, app.letter);
      var b = HP.h("button", { type: "button", class: "app-btn", "aria-label": "Pay with " + app.name }, badge, HP.h("span", null, app.name));
      // Use an official icon if you've placed one in assets/apps/; otherwise keep the lettered badge.
      if (app.icon) { // optional: set `icon: "assets/apps/yourfile.svg"` in config.js
        var probe = new Image();
        probe.onload = function () { badge.textContent = ""; badge.style.background = "transparent"; badge.appendChild(HP.h("img", { src: app.icon, alt: "", loading: "lazy" })); };
        probe.src = app.icon;
      }
      b.addEventListener("click", function () { launch(app.scheme, app.name); });
      row.appendChild(b);
    });

    function copyUpi() { HP.copy(c.upiId, "UPI ID copied: " + c.upiId); }
    HP.$("#copyUpi2").addEventListener("click", copyUpi);
    HP.$("#copyDetails").addEventListener("click", function () { HP.copy(U.paymentDetailsText(c, state.amount), "Payment details copied"); });
    HP.$("#useQr").addEventListener("click", pulseQr);
  }

  function Steps() {
    var steps = [
      ["Choose an amount", "Select a preset amount or enter a custom amount."],
      ["Scan or open a UPI app", "Scan the original QR code, or choose a UPI payment option."],
      ["Confirm the details", "Check the payee name and amount inside your UPI app."],
      ["Complete the payment", "Finish the payment using your UPI app and PIN."],
      ["Keep your confirmation", "Save your transaction confirmation for reference."],
    ];
    var ol = HP.$("#steps");
    steps.forEach(function (s, i) {
      var li = HP.h("li", { class: "step reveal" }, HP.h("div", { class: "step-num" }, String(i + 1)), HP.h("h3", null, s[0]), HP.h("p", null, s[1]));
      li.style.setProperty("--d", i * 90 + "ms");
      ol.appendChild(li);
    });
  }

  HP.components.QRCard = QRCard;
  HP.components.AmountSelector = AmountSelector;
  HP.components.PaymentSummary = PaymentSummary;
  HP.components.PaymentSection = function () {
    QRCard(); AmountSelector(); PaymentSummary(); PayActions(); Steps();
    PaymentSummary.render();
  };
  HP.paymentState = state; // read-only for debugging/tests
})();
