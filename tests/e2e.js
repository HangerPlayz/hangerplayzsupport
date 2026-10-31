const { chromium } = require("playwright");
const SHOTS = __dirname + "/shots/"; // screenshots are written here
let pass = 0, fail = 0;
const ok = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + n + (c || !extra ? "" : "  -> " + extra)); };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
  const errors = [];
  async function newPage(opts) {
    const ctx = await browser.newContext(opts);
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost:8765" }).catch(() => {});
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const page = await ctx.newPage();
    page.on("console", m => { if (m.type() === "error" && !/fonts|ERR_FAILED|ERR_BLOCKED/.test(m.text())) errors.push(m.text()); });
    page.on("pageerror", e => errors.push("PAGEERROR " + e.message));
    await page.goto("http://localhost:8765/index.html", { waitUntil: "load" });
    await page.waitForTimeout(2200);
    return page;
  }

  /* ================= DESKTOP ================= */
  let page = await newPage({ viewport: { width: 1366, height: 820 } });
  ok("hamburger hidden on desktop", !(await page.isVisible("#navToggle")));
  ok("loader removed", (await page.$("#loader")) === null);
  await page.screenshot({ path: SHOTS + "01-hero.png" });

  // images / QR identity
  const qr = await page.evaluate(() => { const i = document.getElementById("qrImage"); return { src: i.getAttribute("src"), nw: i.naturalWidth, nh: i.naturalHeight, filter: getComputedStyle(i).filter }; });
  ok("QR image loaded unmodified", qr.src === "assets/images/upi-qr.png" && qr.nw === 444 && qr.nh === 516 && qr.filter === "none", JSON.stringify(qr));
  const imgsOk = await page.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0 || i.loading === "lazy"));
  ok("all eager images loaded", imgsOk);

  // navigation links scroll to the right sections
  for (const id of ["support", "leaderboard", "milestones", "about", "faq", "home"]) {
    await page.click(`#navLinks a[data-nav="${id}"]`);
    await page.waitForTimeout(id === "home" ? 2500 : 1100);
    const top = await page.evaluate(i => Math.round(document.getElementById(i).getBoundingClientRect().top), id);
    const active = await page.evaluate(() => document.querySelector("#navLinks a.active")?.dataset.nav);
    ok(`nav ${id}: section near top (${top}px), active=${active}`, Math.abs(top) < 140 && active === id);
  }

  // preset buttons + summary
  await page.click('a[href="#support"].btn');
  await page.waitForTimeout(800);
  const presets = [10, 20, 30, 50, 75, 100, 150, 200, 300, 500, 999];
  const labels = await page.$$eval(".amt", b => b.map(x => x.textContent));
  ok("11 preset buttons present", labels.length === 11, labels.join(","));
  for (const p of presets) {
    await page.click(`.amt[data-amount="${p}"]`);
    const sum = await page.textContent("#sumAmount");
    const pressed = await page.$$eval('.amt[aria-pressed="true"]', b => b.map(x => x.dataset.amount));
    ok(`preset ₹${p} -> summary "${sum}", 1 selected`, sum === "₹" + p.toLocaleString("en-IN") && pressed.length === 1 && pressed[0] === String(p));
  }
  await page.click('.amt[data-amount="999"]'); // toggle off
  ok("preset toggles off", (await page.textContent("#sumAmount")) === "—");

  // custom amount
  const custom = async (v) => { await page.fill("#customAmount", ""); await page.type("#customAmount", v); return { err: await page.textContent("#customError"), sum: await page.textContent("#sumAmount"), val: await page.inputValue("#customAmount") }; };
  let r = await custom("49.5"); ok("custom 49.5 accepted", r.sum === "₹49.50" && r.err === "", JSON.stringify(r));
  ok("custom clears preset highlight", (await page.$$('.amt[aria-pressed="true"]')).length === 0);
  r = await custom("-5"); ok("custom -5 rejected (typed)", r.sum === "—" && /negative/i.test(r.err), JSON.stringify(r));
  await page.fill("#customAmount", "-5"); ok("custom -5 rejected (paste-like)", (await page.textContent("#sumAmount")) === "—" && /negative/i.test(await page.textContent("#customError")));
  await page.fill("#customAmount", "12abc"); ok("12abc never produces a payable amount via fill", (await page.textContent("#sumAmount")) !== "₹12abc");
  r = await custom("0"); ok("custom 0 rejected", r.sum === "—" && r.err !== "", JSON.stringify(r));
  r = await custom("abc"); ok("custom abc filtered & rejected", r.sum === "—" && r.val === "" , JSON.stringify(r));
  r = await custom("1.234"); ok("custom 1.234 rejected", r.sum === "—" && r.err !== "", JSON.stringify(r));
  r = await custom("50001"); ok("custom 50001 over max rejected", r.sum === "—" && /Maximum/.test(r.err), JSON.stringify(r));
  r = await custom("250"); ok("custom 250 accepted", r.sum === "₹250" && r.err === "", JSON.stringify(r));
  await page.click('.amt[data-amount="20"]');
  ok("preset click clears custom field", (await page.inputValue("#customAmount")) === "" && (await page.textContent("#sumAmount")) === "₹20");
  await custom("77"); await page.click("#resetAmount");
  ok("Clear resets everything", (await page.inputValue("#customAmount")) === "" && (await page.textContent("#sumAmount")) === "—");
  ok("limits communicated", /₹1 to ₹50,000/.test(await page.textContent("#customHint")));

  // pay without amount
  await page.click("#payBtn");
  ok("pay without amount warns", /choose or enter an amount/i.test(await page.textContent("#payNotice")));
  // desktop pay with amount
  await page.click('.amt[data-amount="100"]'); await page.click("#payBtn");
  ok("desktop pay explains UPI needs phone", /phones|scan the QR/i.test(await page.textContent("#payNotice")));
  ok("no fake success text anywhere", !/payment (was )?successful|thank you for your payment|transaction id:/i.test(await page.evaluate(() => document.body.innerText.replace(/Payment successful but not reflected\./g, ""))));

  // copy buttons
  await page.click("#copyUpi");
  ok("copy UPI ID -> clipboard", (await page.evaluate(() => navigator.clipboard.readText())) === "its.shivamsr@fam");
  await page.click("#copyDetails");
  const det = await page.evaluate(() => navigator.clipboard.readText());
  ok("copy details has payee/id/amount", /Payee: HangerPlayz/.test(det) && /UPI ID: its.shivamsr@fam/.test(det) && /Amount: ₹100.00/.test(det), det);

  // QR enlarge / close (button, Esc, backdrop)
  await page.click("#qrEnlarge"); await page.waitForTimeout(500);
  ok("QR dialog opens", await page.$eval("#qrDialog", d => d.open));
  await page.screenshot({ path: SHOTS + "02-qr-lightbox.png" });
  await page.click("#qrClose"); await page.waitForTimeout(100);
  ok("QR dialog closes via X", !(await page.$eval("#qrDialog", d => d.open)));
  await page.click(".qr-frame"); await page.keyboard.press("Escape");
  ok("QR dialog closes via Esc", !(await page.$eval("#qrDialog", d => d.open)));
  await page.click("#qrEnlarge"); await page.mouse.click(10, 10);
  ok("QR dialog closes via backdrop", !(await page.$eval("#qrDialog", d => d.open)));

  // support section screenshot
  await page.evaluate(() => document.getElementById("support").scrollIntoView());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: SHOTS + "03-support.png" });

  // custom cursor
  ok("custom cursor enabled on desktop", await page.evaluate(() => document.documentElement.classList.contains("custom-cursor")));
  await page.mouse.move(400, 300); await page.waitForTimeout(100);
  const modeAt = async (sel) => { const b = await (await page.$(sel)).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(80); return page.$eval("#cursor", c => c.dataset.mode); };
  await page.evaluate(() => document.getElementById("payBtn").scrollIntoView({block:"center"})); await page.waitForTimeout(700);
  ok("cursor mode=link over button", (await modeAt("#payBtn")) === "link");
  await page.evaluate(() => document.getElementById("customAmount").scrollIntoView({block:"center"})); await page.waitForTimeout(700);
  ok("cursor mode=text over input", (await modeAt("#customAmount")) === "text");
  await page.mouse.move(5, 400); await page.waitForTimeout(80);
  ok("cursor mode=arrow on empty area", (await page.$eval("#cursor", c => c.dataset.mode)) === "arrow");
  ok("cursor doesn't block clicks (pointer-events none)", await page.$eval("#cursor", c => getComputedStyle(c).pointerEvents === "none"));
  // text selection still works in input
  await page.fill("#customAmount", "123"); await page.click("#customAmount", { clickCount: 3 });
  ok("text selectable in input", (await page.evaluate(() => { const i = document.getElementById("customAmount"); return i.selectionEnd - i.selectionStart; })) === 3);
  await page.click("#resetAmount");

  // leaderboard / milestones / recent / wall / updates honest empty states
  const txt = async (id) => (await page.textContent(id)).replace(/\s+/g, " ");
  ok("leaderboard empty state", /No verified supporters yet/.test(await txt("#leaderboardBody")), await txt("#leaderboardBody"));
  ok("leaderboard has no ₹ amounts / fake names", !/₹/.test(await txt("#leaderboardBody")));
  ok("recent empty state text", /Be the first to support HangerPlayz!/.test(await txt("#recentBody")));
  ok("wall empty state", /No messages yet/.test(await txt("#wallBody")));
  const ms = await txt("#milestoneBody");
  ok("milestones show 0 verified & 6 goals locked/next", /0 verified supporters/.test(ms) && (ms.match(/Locked/g) || []).length === 5 && /Next up/.test(ms) && !/DEMO/.test(ms), ms);
  ok("milestone progress width 0", (await page.$eval(".ms-fill", f => parseFloat(f.style.width || "0"))) === 0);
  ok("updates flagged as examples", /EXAMPLE PLACEHOLDERS/.test(await txt("#updatesBody")));
  await page.evaluate(() => document.getElementById("leaderboard").scrollIntoView()); await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + "04-leaderboard.png" });
  await page.evaluate(() => document.getElementById("milestones").scrollIntoView()); await page.waitForTimeout(1500);
  await page.screenshot({ path: SHOTS + "05-milestones.png" });

  // social links
  const socials = await page.$$eval("#socialGrid a", a => a.map(x => ({ h: x.href, t: x.target, r: x.rel })));
  ok("3 live social links", socials.length === 3, JSON.stringify(socials));
  ok("exact modrinth/instagram/youtube URLs", ["https://modrinth.com/user/HangerPlayz", "https://www.instagram.com/hangerplayz/reels/", "https://youtube.com/@HangerPlayz"].every(u => socials.some(s => s.h === u || s.h === u + "/")), JSON.stringify(socials));
  ok("links open safely in new tab", socials.every(s => s.t === "_blank" && /noopener/.test(s.r) && /noreferrer/.test(s.r)));
  ok("CurseForge & Discord placeholders", (await page.$$eval("#socialGrid .social-card.soon", x => x.length)) === 2);
  await page.evaluate(() => document.getElementById("connect").scrollIntoView()); await page.waitForTimeout(1000);
  await page.screenshot({ path: SHOTS + "06-social.png" });

  // FAQ accordion
  const q = await page.$$(".faq-q"); ok("10 FAQ items", q.length === 10);
  await page.evaluate(() => document.getElementById("faq").scrollIntoView()); await page.waitForTimeout(800);
  await q[0].click(); await page.waitForTimeout(500);
  ok("FAQ opens", (await q[0].getAttribute("aria-expanded")) === "true");
  await q[1].click(); await page.waitForTimeout(500);
  ok("FAQ one-at-a-time", (await q[0].getAttribute("aria-expanded")) === "false" && (await q[1].getAttribute("aria-expanded")) === "true");
  await q[1].focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
  ok("FAQ keyboard toggle closes", (await q[1].getAttribute("aria-expanded")) === "false");
  await q[8].click(); await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + "07-faq.png" });

  // Quick Help: every one of the 14 topics
  await page.click("#chatFab"); await page.waitForTimeout(600);
  ok("chat opens", !(await page.$eval("#chatWindow", w => w.hidden)));
  const nTopics = (await page.$$("#chatBody .chip")).length; ok("14 chat topics", nTopics === 14, String(nTopics));
  await page.screenshot({ path: SHOTS + "08-chat-topics.png" });
  const labelsChat = await page.$$eval("#chatBody .chip", c => c.map(x => x.textContent));
  for (let i = 0; i < 14; i++) {
    const chips = await page.$$("#chatBody .chip:not(.center)");
    await chips[i].click(); await page.waitForTimeout(1500);
    const lastBot = await page.$$eval("#chatBody .bubble.bot:not(.typing)", b => b[b.length - 1].innerText);
    ok(`chat topic ${i + 1} "${labelsChat[i]}" answered (${lastBot.length} chars)`, lastBot.length > 40 && !/undefined|\[object/.test(lastBot));
    if (i === 6) await page.screenshot({ path: SHOTS + "09-chat-answer.png" });
    await page.click("#chatBack"); await page.waitForTimeout(200);
  }
  ok("chat never claims payment verification", !/I (have )?verified|payment (is|was) confirmed/i.test(await page.textContent("#chatBody")));
  await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  ok("chat closes with Esc", await page.$eval("#chatWindow", w => w.hidden));
  await page.click("#chatFab"); await page.click("#chatClose"); await page.waitForTimeout(500);
  ok("chat closes with X", await page.$eval("#chatWindow", w => w.hidden));

  // Audio controls: muted by default, no AudioContext before interaction
  ok("music & sfx off by default", !(await page.isChecked("#musicToggle")) && !(await page.isChecked("#sfxToggle")));
  await page.click("#audioBtn"); ok("audio panel opens", !(await page.$eval("#audioPanel", p => p.hidden)));
  await page.click("label.switch:has(#musicToggle)"); await page.fill("#musicVol", "50"); await page.waitForTimeout(300);
  ok("music toggle on", await page.isChecked("#musicToggle")); await page.click("label.switch:has(#musicToggle)");
  ok("music toggles off", !(await page.isChecked("#musicToggle")));
  await page.click("label.switch:has(#sfxToggle)"); ok("sfx toggle on", await page.isChecked("#sfxToggle"));
  await page.keyboard.press("Escape");

  // back to top + scroll progress
  await page.evaluate(() => window.scrollTo(0, 3000)); await page.waitForTimeout(500);
  ok("back-to-top visible after scroll", await page.$eval("#toTop", b => b.classList.contains("show")));
  ok("scroll progress > 0", await page.$eval("#scrollProgress", p => /scaleX\((0\.\d+|1)\)/.test(p.style.transform) && p.style.transform !== "scaleX(0)"));
  await page.click("#toTop"); await page.waitForTimeout(1200);
  ok("back-to-top returns to top", (await page.evaluate(() => scrollY)) < 5);

  // keyboard: tab order reaches interactive elements; focus visible
  await page.focus("#faqList .faq-q"); await page.keyboard.press("Tab");
  const focusOutline = await page.evaluate(() => { const e = document.activeElement; return e ? getComputedStyle(e).outlineStyle : ""; });
  ok("keyboard focus shows outline", focusOutline !== "none", focusOutline);

  // horizontal overflow desktop
  ok("no horizontal overflow (desktop)", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: SHOTS + "10-full-desktop.png", fullPage: true });
  await page.context().close();

  /* ================= MOBILE ================= */
  page = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/150 Mobile Safari/537.36" });
  ok("custom cursor disabled on touch", !(await page.evaluate(() => document.documentElement.classList.contains("custom-cursor"))) && (await page.$("#cursor")) === null);
  ok("no horizontal overflow (mobile, layout width stays 390)", await page.evaluate(() => document.documentElement.scrollWidth <= 390 && innerWidth === 390), await page.evaluate(() => document.documentElement.scrollWidth + " vs " + innerWidth));
  await page.screenshot({ path: SHOTS + "11-mobile-hero.png" });
  ok("hamburger visible", await page.isVisible("#navToggle"));
  ok("desktop nav links hidden on mobile", !(await page.$eval("#navLinks", n => n.classList.contains("open"))) && (await page.$eval("#navLinks", n => getComputedStyle(n).visibility)) === "hidden");
  await page.tap("#navToggle"); await page.waitForTimeout(500);
  ok("mobile menu opens", (await page.getAttribute("#navToggle", "aria-expanded")) === "true" && await page.$eval("#navLinks", n => n.classList.contains("open")));
  await page.screenshot({ path: SHOTS + "12-mobile-menu.png" });
  await page.tap('#navLinks a[data-nav="support"]'); await page.waitForTimeout(1100);
  ok("mobile menu closes after link & scrolls", !(await page.$eval("#navLinks", n => n.classList.contains("open"))) && Math.abs(await page.evaluate(() => document.getElementById("support").getBoundingClientRect().top)) < 140);
  await page.evaluate(() => document.getElementById("qrCard").scrollIntoView()); await page.waitForTimeout(1000);
  await page.screenshot({ path: SHOTS + "13-mobile-qr.png" });
  await page.tap('.amt[data-amount="50"]');
  await page.evaluate(() => document.getElementById("payBtn").scrollIntoView({ block: "center" })); await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + "14-mobile-pay.png" });
  await page.evaluate(() => { window.HP.navigate = u => { window.__uri = u; }; });
  await page.tap("#payBtn");
  ok("mobile pay hands correct UPI URI to the OS", (await page.evaluate(() => window.__uri)) === "upi://pay?pa=its.shivamsr%40fam&pn=HangerPlayz&am=50.00&cu=INR&tn=Support%20HangerPlayz", await page.evaluate(() => window.__uri));
  await page.tap('.app-btn[aria-label="Pay with PhonePe"]'); ok("PhonePe button uses phonepe:// intent with same params", /^phonepe:\/\/pay\?pa=its\.shivamsr%40fam&pn=HangerPlayz&am=50\.00&cu=INR/.test(await page.evaluate(() => window.__uri)));
  await page.tap('.app-btn[aria-label="Pay with Google Pay"]'); ok("GPay button uses tez:// intent", /^tez:\/\/upi\/pay\?/.test(await page.evaluate(() => window.__uri)));
  await page.tap("#payBtn"); await page.waitForTimeout(400);
  ok("mobile pay shows 'opening' notice (not success)", /Opening your UPI app/.test(await page.textContent("#payNotice")) && !/success/i.test(await page.textContent("#payNotice")), await page.textContent("#payNotice"));
  await page.waitForTimeout(2500);
  ok("fallback hint appears if app doesn't open", /Nothing opened/.test(await page.textContent("#payNotice")));
  // fab overlap check: chat button not covering the pay button area permanently
  await page.tap("#chatFab"); await page.waitForTimeout(600);
  const chatBox = await page.$eval("#chatWindow", w => { const r = w.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, vw: innerWidth, vh: innerHeight }; });
  ok("chat fits mobile viewport", chatBox.l >= 0 && chatBox.r <= chatBox.vw && chatBox.t >= 0 && chatBox.b <= chatBox.vh, JSON.stringify(chatBox));
  await page.screenshot({ path: SHOTS + "15-mobile-chat.png" });
  await page.tap("#chatClose"); await page.waitForTimeout(400);
  await page.evaluate(() => document.getElementById("leaderboard").scrollIntoView()); await page.waitForTimeout(900);
  await page.screenshot({ path: SHOTS + "16-mobile-leaderboard.png" });
  await page.evaluate(() => document.getElementById("milestones").scrollIntoView()); await page.waitForTimeout(1600);
  await page.screenshot({ path: SHOTS + "17-mobile-milestones.png" });
  ok("no horizontal overflow after full scroll (mobile)", await page.evaluate(() => document.documentElement.scrollWidth <= 390 && innerWidth === 390));
  await page.context().close();

  /* ================= TABLET ================= */
  page = await newPage({ viewport: { width: 820, height: 1100 } });
  ok("no horizontal overflow (tablet)", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => document.getElementById("support").scrollIntoView()); await page.waitForTimeout(1000);
  await page.screenshot({ path: SHOTS + "18-tablet-support.png" });
  await page.context().close();

  /* ================= REDUCED MOTION ================= */
  page = await newPage({ viewport: { width: 1366, height: 820 }, reducedMotion: "reduce" });
  ok("reduced motion: custom cursor off", !(await page.evaluate(() => document.documentElement.classList.contains("custom-cursor"))));
  ok("reduced motion: particles canvas removed", (await page.$("#particles")) === null);
  ok("reduced motion: reveal content visible", await page.$$eval(".reveal", els => els.every(e => getComputedStyle(e).opacity === "1")));
  await page.context().close();

  /* ================= BACKEND-DATA RENDERING (mock API) ================= */
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const api = {
    "/leaderboard": [{ name: "Alice", total: 500, message: "Keep going!" }, { name: "<img src=x onerror=window.__xss=1>", total: 300 }, { name: "Cara", total: 200 }, { name: "Dev", total: 100 }, { name: "Eli", total: 50 }],
    "/recent": [{ name: "Alice", amount: 500, date: "2026-10-30T10:00:00Z", message: "hi" }],
    "/wall": [{ name: "Alice", message: "Love the mods", date: "2026-10-30T10:00:00Z" }],
    "/milestones": { verifiedSupporters: 30 },
    "/updates": [{ tag: "Mod", title: "Real update", body: "Body", date: "2026-10-01" }],
  };
  await ctx.route("http://mock.api/**", r => { const p = new URL(r.request().url()).pathname.replace(/^\/api/, ""); r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(api[p]) }); });
  const mp = await ctx.newPage();
  mp.on("pageerror", e => errors.push("MOCK PAGEERROR " + e.message));
  await mp.addInitScript(() => { Object.defineProperty(window, "HP_TEST_API", { value: true }); });
  await mp.route("**/js/config.js", async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('baseUrl: ""', 'baseUrl: "http://mock.api/api"'); r.fulfill({ response: resp, body }); });
  await mp.goto("http://localhost:8765/index.html", { waitUntil: "load" }); await mp.waitForTimeout(2500);
  const lb = (await mp.textContent("#leaderboardBody")).replace(/\s+/g, " ");
  ok("leaderboard renders verified data sorted", /Alice/.test(lb) && /₹500/.test(lb) && lb.indexOf("Alice") < lb.indexOf("Cara"), lb);
  ok("podium classes gold/silver/bronze", (await mp.$$(".lb-1,.lb-2,.lb-3")).length === 3);
  ok("XSS in supporter name is inert", (await mp.evaluate(() => window.__xss)) === undefined && (await mp.$$("#leaderboardBody img")).length === 0);
  ok("recent renders", /Alice/.test(await mp.textContent("#recentBody")) && /₹500/.test(await mp.textContent("#recentBody")));
  ok("wall renders approved message", /Love the mods/.test(await mp.textContent("#wallBody")));
  const ms2 = (await mp.textContent("#milestoneBody")).replace(/\s+/g, " ");
  ok("milestones from backend count 30 => 2 unlocked, next 50", /30 verified supporters/.test(ms2) && (ms2.match(/Unlocked/g) || []).length === 2 && /Next milestone: 50/.test(ms2), ms2);
  await mp.evaluate(() => document.getElementById("leaderboard").scrollIntoView()); await mp.waitForTimeout(1400);
  await mp.screenshot({ path: SHOTS + "19-mock-leaderboard.png" });
  await mp.evaluate(() => document.getElementById("milestones").scrollIntoView()); await mp.waitForTimeout(2200);
  await mp.screenshot({ path: SHOTS + "20-mock-milestones.png" });
  ok("updates replaced by real data (no EXAMPLE flag)", !/EXAMPLE PLACEHOLDERS/.test(await mp.textContent("#updatesBody")) && /Real update/.test(await mp.textContent("#updatesBody")));
  await ctx.close();

  console.log("\nConsole/page errors:", errors.length ? errors : "none");
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("HARNESS ERROR", e); process.exit(2); });
