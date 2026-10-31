/* Run: node tests/test-logic.js  — logic tests for amount validation, UPI URI, milestones. */
const U = require("../js/utils.js");
let pass = 0, fail = 0;
function t(name, cond) { (cond ? pass++ : fail++); console.log((cond ? "PASS " : "FAIL ") + name); }
const L = { min: 1, max: 50000 };

// Custom amount validation
t("accepts 49", U.validateAmount("49", L).ok && U.validateAmount("49", L).value === 49);
t("accepts 49.50", U.validateAmount("49.50", L).value === 49.5);
t("accepts max 50000", U.validateAmount("50000", L).ok);
t("accepts min 1", U.validateAmount("1", L).ok);
t("rejects empty (no error text)", !U.validateAmount("", L).ok && U.validateAmount("", L).empty);
t("rejects 0", !U.validateAmount("0", L).ok);
t("rejects 0.00", !U.validateAmount("0.00", L).ok);
t("rejects negative", /negative/i.test(U.validateAmount("-5", L).error));
t("rejects letters", !U.validateAmount("abc", L).ok);
t("rejects 1e3", !U.validateAmount("1e3", L).ok);
t("rejects 12abc", !U.validateAmount("12abc", L).ok);
t("rejects 1.234 (3 decimals)", !U.validateAmount("1.234", L).ok);
t("rejects 1..2", !U.validateAmount("1..2", L).ok);
t("rejects '.'", !U.validateAmount(".", L).ok);
t("rejects 50000.01 (over max)", !U.validateAmount("50000.01", L).ok);
t("rejects 0.5 (under min 1)", !U.validateAmount("0.5", L).ok);
t("rejects <script>", !U.validateAmount("<script>", L).ok);
t("rejects 99999999 (too long)", !U.validateAmount("99999999", L).ok);

// UPI URI
const cfg = { upiId: "its.shivamsr@fam", payeeName: "HangerPlayz", currency: "INR", note: "Support HangerPlayz" };
const uri = U.buildUpiUri(cfg, 100);
console.log("   URI:", uri);
t("URI scheme", uri.startsWith("upi://pay?"));
t("pa param", uri.includes("pa=its.shivamsr%40fam"));
t("pn param", uri.includes("pn=HangerPlayz"));
t("am param 100.00", uri.includes("am=100.00"));
t("cu param", uri.includes("cu=INR"));
t("tn param encoded", uri.includes("tn=Support%20HangerPlayz"));
t("fractional am 49.50", U.buildUpiUri(cfg, 49.5).includes("am=49.50"));
t("999 preset", U.buildUpiUri(cfg, 999).includes("am=999.00"));
t("app scheme override", U.buildUpiUri(cfg, 10, "phonepe://pay").startsWith("phonepe://pay?"));
t("no txn id / status params", !/tr=|tid=|status/i.test(uri));

// Formatting
t("format 1500", U.formatINR(1500) === "₹1,500");
t("format 49.5", U.formatINR(49.5) === "₹49.50");
t("format 100000", U.formatINR(100000) === "₹1,00,000");
t("copy text", U.paymentDetailsText(cfg, 75).includes("Amount: ₹75.00"));

// Milestones
const G = [10, 25, 50, 100, 250, 500];
t("0 supporters => 0%", U.milestoneProgress(0, G) === 0);
t("5 => halfway to first", Math.abs(U.milestoneProgress(5, G) - (0.5 / 6) * 100) < 1e-9);
t("10 => 1/6", Math.abs(U.milestoneProgress(10, G) - 100 / 6) < 1e-9);
t("500 => 100%", U.milestoneProgress(500, G) === 100);
t("next of 0 is idx0", U.nextMilestoneIndex(0, G) === 0);
t("next of 10 is idx1", U.nextMilestoneIndex(10, G) === 1);
t("next of 500 is -1", U.nextMilestoneIndex(500, G) === -1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
