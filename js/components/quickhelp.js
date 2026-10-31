/* Quick Help: a scripted help assistant (not AI, and it cannot verify payments).
   Answers are plain data below — edit freely. Each answer is an array of
   paragraphs; a paragraph that is itself an array renders as a bullet list. */
(function () {
  var HP = window.HP, h = HP.h;

  function cfg() { return HP.config; }
  function lim() { var p = cfg().payment; return HP.utils.formatINR(p.minAmount) + " to " + HP.utils.formatINR(p.maxAmount); }

  function topics() {
    var p = cfg().payment;
    return [
      ["How do I make a payment?", ["Go to the Support section, pick an amount, then either scan the QR code with any UPI app or tap \"Pay Using UPI App\" on your phone.", "Confirm that the payee is " + p.payeeName + " and the amount is right, then pay with your UPI PIN. Keep your transaction confirmation."]],
      ["How do I scan the QR code?", ["Open any UPI app and tap Scan (or Scan QR). Point your camera at the QR code in the Support section.", "On a computer, tap \"Enlarge QR\" for a bigger code. If it won't scan, increase your screen brightness and hold the phone steady."]],
      ["How do I copy the UPI ID?", ["Tap \"Copy UPI ID\" in the QR card or in the Pay card. The ID is " + p.upiId + ".", "You can also tap \"Copy payment details\" to copy the payee, ID, amount and note, then paste them where needed."]],
      ["Which payment apps are supported?", ["Any UPI app should work, for example Google Pay, PhonePe, Paytm, Fam and BHIM, plus most bank apps.", "The app buttons try to open that app on your phone. Their names are shown for convenience only and don't mean any partnership."]],
      ["My UPI app is not opening.", [["UPI app buttons work on phones only. On a computer, scan the QR code instead.", "Make sure the app is installed and updated.", "Try \"Pay Using UPI App\", which lets your phone pick an app.", "Or copy the UPI ID and pay manually inside your app."]]],
      ["Custom amount is not working.", [["Use numbers only, like 49 or 49.50. No letters, symbols or minus signs.", "The amount must be within " + lim() + ".", "Up to 2 decimal places are allowed.", "Use the Clear button to reset the field and try again."]]],
      ["My payment is pending.", ["Pending UPI payments usually settle on their own, from a few minutes up to a day. Check the status in your UPI app's history and don't pay again right away.", "This website can't see or confirm your payment status. Your UPI app and bank are the source of truth."]],
      ["My payment failed.", ["If the payment failed, the money should not leave your account, or it is returned by your bank (often within a few working days). Check your app's history for the final status.", "You can try again with another UPI app or a different bank account. Keep the transaction ID if you need to ask your bank."]],
      ["Payment successful but not reflected.", ["This website doesn't instantly show payments. Leaderboard and milestone entries appear only after a payment is verified on a server, which can take time or may not be set up yet.", "If your UPI app shows \"Successful\", the payment went through. Keep your transaction ID."]],
      ["How can I contact HangerPlayz?", contactAnswer],
      ["How does the leaderboard work?", ["The Hall of Supporters ranks supporters by total verified contributions. Only payments confirmed by the server are listed, so you'll never see fake entries.", "If it's empty, there are no verified supporters recorded yet."]],
      ["How do milestones work?", ["Milestones unlock as the number of verified supporters grows: 10, 25, 50, 100, 250 and 500.", "The progress bar uses real verified counts only, and shows a clear \"demo\" label if sample data is ever used."]],
      ["Is payment verification automatic?", ["Not on this website by itself. Opening a UPI app or scanning a QR code does not tell the site that you paid.", "Automatic verification needs a secure backend or payment provider that confirms each payment on the server. Until that's connected, nothing is marked as paid."]],
      ["How can I support Minecraft development?", ["You can support with any amount via UPI, completely optionally. You can also help for free: watch and share videos on YouTube, follow on Instagram, and try or share the mods and plugins on Modrinth."]],
    ];
  }

  function contactAnswer() {
    var c = cfg(), out = ["You can reach HangerPlayz through the links in the \"Find Me Around the Internet\" section: YouTube, Instagram and Modrinth."];
    if (c.contact.email) out.push("Email: " + c.contact.email);
    return out;
  }

  HP.components.QuickHelp = function () {
    var win = HP.$("#chatWindow"), body = HP.$("#chatBody"), fab = HP.$("#chatFab"), back = HP.$("#chatBack"), close = HP.$("#chatClose");
    fab.innerHTML = HP.icons.chat; back.innerHTML = HP.icons.back; close.innerHTML = HP.icons.close;
    var TOPICS = topics(), started = false, busy = false, timers = [];

    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; busy = false; }
    function scroll() { body.scrollTop = body.scrollHeight; }

    function bubble(kind, content) {
      var b = h("div", { class: "bubble " + kind });
      content.forEach(function (c) {
        if (Array.isArray(c)) { var ul = h("ul"); c.forEach(function (li) { ul.appendChild(h("li", null, li)); }); b.appendChild(ul); }
        else b.appendChild(h("p", null, c));
      });
      body.appendChild(b); scroll(); return b;
    }

    function showTopics(intro) {
      clearTimers();
      back.hidden = true;
      HP.$$(".chips, .chip.center", body).forEach(function (n) { n.remove(); });
      var wrap = h("div", { class: "chips", role: "group", "aria-label": "Help topics" });
      TOPICS.forEach(function (t, i) {
        var chip = h("button", { type: "button", class: "chip", style: "--d:" + i * 35 + "ms" }, t[0]);
        chip.addEventListener("click", function () { if (!busy) choose(i, chip); });
        wrap.appendChild(chip);
      });
      bubble("bot", [intro]);
      body.appendChild(wrap); scroll();
    }

    function choose(i, chip) {
      busy = true; back.hidden = false;
      chip.classList.add("picked");
      bubble("user", [TOPICS[i][0]]);
      var typing = h("div", { class: "bubble bot typing", "aria-label": "Quick Help is typing" }, h("i"), h("i"), h("i"));
      body.appendChild(typing); scroll();
      later(function () {
        typing.remove();
        var ans = typeof TOPICS[i][1] === "function" ? TOPICS[i][1]() : TOPICS[i][1];
        bubble("bot", ans);
        later(function () {
          var again = h("button", { type: "button", class: "chip center" }, "Back to all topics");
          again.addEventListener("click", function () { again.remove(); showTopics("What else can I help with?"); });
          body.appendChild(again); scroll(); busy = false;
          again.focus({ preventScroll: true });
        }, HP.reducedMotion() ? 0 : 350);
      }, HP.reducedMotion() ? 0 : 700);
    }

    function open() {
      win.classList.remove("closing"); win.hidden = false;
      fab.setAttribute("aria-expanded", "true"); fab.setAttribute("aria-label", "Close Quick Help");
      if (!started) { started = true; showTopics("Hi! I'm Quick Help. Pick a question below. I can explain how things work, but I can't check or confirm payments."); }
      setTimeout(function () { body.focus({ preventScroll: true }); }, 50);
    }
    function shut() {
      fab.setAttribute("aria-expanded", "false"); fab.setAttribute("aria-label", "Open Quick Help");
      if (win.hidden) return;
      if (HP.reducedMotion()) { win.hidden = true; return; }
      win.classList.add("closing");
      setTimeout(function () { win.hidden = true; win.classList.remove("closing"); }, 230);
    }

    fab.addEventListener("click", function () { win.hidden ? open() : shut(); });
    close.addEventListener("click", function () { shut(); fab.focus(); });
    back.addEventListener("click", function () { showTopics("Sure. What would you like to know?"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !win.hidden) { shut(); fab.focus(); } });
    HP.openQuickHelp = open;
  };
})();
