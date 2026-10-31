/* Pure helpers (no DOM) — also loadable in Node for tests. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { root.HP = root.HP || { components: {} }; root.HP.utils = factory(); }
})(typeof self !== "undefined" ? self : this, function () {
  /** Validate a custom amount typed by a user. Returns {ok, value, error}. */
  function validateAmount(raw, limits) {
    var min = limits.min, max = limits.max;
    var s = String(raw == null ? "" : raw).trim();
    if (s === "") return { ok: false, value: null, error: "", empty: true };
    if (/^-/.test(s)) return { ok: false, value: null, error: "Amount can't be negative." };
    if (!/^[0-9.]+$/.test(s)) return { ok: false, value: null, error: "Use numbers only (e.g. 49 or 49.50)." };
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return { ok: false, value: null, error: "Enter a valid amount, up to 2 decimal places." };
    var v = Math.round(parseFloat(s) * 100) / 100;
    if (!(v > 0)) return { ok: false, value: null, error: "Amount must be more than zero." };
    if (v < min) return { ok: false, value: null, error: "Minimum amount is ₹" + min + "." };
    if (v > max) return { ok: false, value: null, error: "Maximum amount is ₹" + max.toLocaleString("en-IN") + "." };
    return { ok: true, value: v, error: "" };
  }

  /** UPI `am` parameter: plain decimal with two places. */
  function upiAmount(v) { return (Math.round(v * 100) / 100).toFixed(2); }

  /** Human display, Indian grouping, e.g. ₹1,500 or ₹49.50 */
  function formatINR(v) {
    if (v == null || isNaN(v)) return "—";
    var hasFraction = Math.round(v * 100) % 100 !== 0;
    return "₹" + Number(v).toLocaleString("en-IN", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }

  /** Build a standard UPI payment URI. */
  function buildUpiUri(cfg, amount, scheme) {
    var base = scheme || "upi://pay";
    var q = [
      ["pa", cfg.upiId],
      ["pn", cfg.payeeName],
      ["am", upiAmount(amount)],
      ["cu", cfg.currency],
      ["tn", cfg.note],
    ].map(function (p) { return p[0] + "=" + encodeURIComponent(p[1]); }).join("&");
    return base + "?" + q;
  }

  /** Plain-text payment details for the "Copy payment details" button. */
  function paymentDetailsText(cfg, amount) {
    var lines = [
      "Payee: " + cfg.payeeName,
      "UPI ID: " + cfg.upiId,
      "Amount: " + (amount != null ? "₹" + upiAmount(amount) : "(choose in your UPI app)"),
      "Currency: " + cfg.currency,
      "Note: " + cfg.note,
    ];
    return lines.join("\n");
  }

  /**
   * Progress bar fill (0-100). Goals are laid out at equal spacing:
   * goal i sits at (i+1)/n of the track; progress interpolates between goals.
   */
  function milestoneProgress(count, goals) {
    var n = goals.length;
    if (!n || !(count > 0)) return 0;
    if (count >= goals[n - 1]) return 100;
    var prev = 0;
    for (var i = 0; i < n; i++) {
      if (count < goals[i]) {
        var seg = (count - prev) / (goals[i] - prev);
        return ((i + seg) / n) * 100;
      }
      prev = goals[i];
    }
    return 100;
  }

  function nextMilestoneIndex(count, goals) {
    for (var i = 0; i < goals.length; i++) if (count < goals[i]) return i;
    return -1;
  }

  return { validateAmount: validateAmount, upiAmount: upiAmount, formatINR: formatINR,
    buildUpiUri: buildUpiUri, paymentDetailsText: paymentDetailsText,
    milestoneProgress: milestoneProgress, nextMilestoneIndex: nextMilestoneIndex };
});
