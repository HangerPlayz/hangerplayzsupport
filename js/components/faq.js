/* FAQ accordion (animated grid-rows, keyboard accessible, one open at a time). */
(function () {
  var HP = window.HP, h = HP.h;

  var FAQ = [
    ["What is HangerPlayz?", "HangerPlayz is an independent Minecraft creator and developer who makes Minecraft content, Fabric mods, plugins and optimization projects for the community."],
    ["Why should I support?", "Support helps fund more content and new mods and plugins, and helps keep the projects improving. It's a way to say thanks, nothing more."],
    ["Is payment optional?", "Yes, completely. Everything HangerPlayz shares stays available whether or not you pay. Support is a voluntary thank-you."],
    ["How do I use the QR code?", "Open any UPI app, tap Scan, and point it at the QR code in the Support section. Enter your amount, check that the payee is HangerPlayz, and confirm with your UPI PIN."],
    ["Can I use a custom amount?", "Yes. Type any amount within the shown limits (numbers only, up to 2 decimals). The payment summary updates as you type."],
    ["Which UPI apps are supported?", "Any app that supports UPI should work: Google Pay, PhonePe, Paytm, Fam, BHIM, your bank's app and more. The app buttons try to open that app on your phone."],
    ["How does the leaderboard work?", "The Hall of Supporters ranks people by their total verified contributions. Only payments confirmed on the server appear. The site never shows unverified or made-up entries."],
    ["How do supporter milestones work?", "Milestones unlock when the number of verified supporters reaches goals such as 10, 25 or 50. They count only verified supporters recorded by the backend."],
    ["What if my payment is pending?", "Wait a little. Pending UPI payments usually resolve on their own within a few minutes to a day. Check the status in your UPI app's history. If the money is debited but not completed, it is normally returned by your bank. Keep your transaction ID in case you need to contact your bank."],
    ["How can I contact HangerPlayz?", "Use the social links in the \"Find Me Around the Internet\" section (YouTube, Instagram or Modrinth) and send a message there."],
  ];

  HP.components.FAQ = function () {
    var root = HP.$("#faqList"), items = [];
    FAQ.forEach(function (qa, i) {
      var qid = "faq-q" + i, aid = "faq-a" + i;
      var btn = h("button", { class: "faq-q", type: "button", id: qid, "aria-expanded": "false", "aria-controls": aid }, qa[0]);
      var panel = h("div", { class: "faq-a", id: aid, role: "region", "aria-labelledby": qid }, h("div", null, h("p", null, qa[1])));
      var item = h("div", { class: "faq-item reveal", style: "--d:" + (i % 5) * 50 + "ms" }, h("h3", { style: "margin:0;font-size:inherit" }, btn), panel);
      items.push({ item: item, btn: btn });
      btn.addEventListener("click", function () {
        var open = !item.classList.contains("open");
        items.forEach(function (x) { x.item.classList.remove("open"); x.btn.setAttribute("aria-expanded", "false"); });
        if (open) { item.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
      });
      root.appendChild(item);
    });
  };
})();
