# HangerPlayz — Premium Creator Support Website

A static, dependency-free website (HTML + CSS + vanilla JS) for supporting HangerPlayz' Minecraft content, Fabric mods and plugins. It works by simply opening the files, no build step, no framework, no API keys.

> **Honesty note:** this site starts UPI payments (QR / UPI app intent) but it **cannot verify** them. Leaderboard, milestones, recent support and the community wall show honest empty states until you connect a backend (see `BACKEND.md`). Nothing on the page is fabricated.

---

## 1. Run it

```bash
cd hangerplayz
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```

You can also double-click `index.html`. (Clipboard copy needs `http://localhost` or HTTPS; it falls back automatically otherwise.)

**Deploy:** upload the folder to any static host: Netlify, Vercel, Cloudflare Pages, GitHub Pages. Use HTTPS.

## 2. Project structure

```
hangerplayz/
├─ index.html                 Page markup (semantic sections)
├─ admin-preview.html         Clearly-labelled NON-functional admin concept
├─ css/styles.css             Design system + all component styles
├─ assets/
│  ├─ images/
│  │  ├─ upi-qr.png           YOUR QR — byte-identical to the file you supplied
│  │  ├─ logo-face.png        Logo #2 (navbar, footer, favicon)
│  │  └─ logo-live.gif        Logo #3 (loader, hero, about)
│  └─ apps/                   Optional official UPI app icons (see §5)
├─ js/
│  ├─ config.js               ★ ALL editable settings live here
│  ├─ utils.js                Pure logic: amount validation, UPI URI, milestone maths (unit-tested)
│  ├─ dom.js                  DOM helpers, icons, toast, clipboard, API client
│  ├─ main.js                 Boots every component (each isolated with try/catch)
│  └─ components/
│     ├─ navbar.js            Navbar, active section, mobile menu, progress bar, back-to-top
│     ├─ hero.js              Hero, particles, scroll-reveal
│     ├─ payment.js           PaymentSection = QRCard + AmountSelector + PaymentSummary + UPI actions + Steps
│     ├─ data-sections.js     Leaderboard, Milestones, RecentSupporters, CommunityWall, Updates
│     ├─ about-social.js      About + SocialLinks
│     ├─ quickhelp.js         Quick Help chatbot (14 topics)
│     ├─ faq.js               FAQ accordion
│     ├─ footer.js            Footer
│     ├─ cursor.js            Custom cursor system
│     └─ audio.js             Optional ambient music + UI sounds (synthesized, no audio files)
└─ tests/
   ├─ test-logic.js           Node unit tests (39 checks)
   └─ e2e.js                  Browser tests (Playwright, 119 checks)
```

## 3. Your three images

| File | What it is | Where it's used |
|---|---|---|
| `assets/images/upi-qr.png` | Your UPI QR (**never edited**) | Support section QR card + enlarge dialog |
| `assets/images/logo-face.png` | Logo #2 (pumpkin face) | Navbar, footer, favicon |
| `assets/images/logo-live.gif` | Logo #3 (full character) | Loading screen, hero, About |

To replace any image, overwrite the file keeping the same name (or change the `src` in `index.html`). The QR is displayed with no filters, overlays or recolouring, at its original aspect ratio (444×516). Logos use `image-rendering: pixelated` so the pixel art stays crisp.

## 4. Common edits (all in `js/config.js`)

**Change UPI details**
```js
payment: { upiId: "its.shivamsr@fam", payeeName: "HangerPlayz", note: "Support HangerPlayz", ... }
```
If you change the UPI ID, **also replace `assets/images/upi-qr.png`** with the matching QR. The code never generates a QR, so they can't update each other.

**Preset amounts & custom limits:** `presets: [10, 20, ...]`, `minAmount: 1`, `maxAmount: 50000` (shown to visitors under the custom field).

**Social links:** edit the `socials` array. A card with `url: ""` renders as a "coming soon" placeholder (CurseForge and Discord are placeholders now). Add your URL and it becomes a live link automatically, including in the footer. Icons: ids `modrinth`, `instagram`, `youtube`, `curseforge`, `discord` (others fall back to a globe icon).

**Milestones:** `milestones: [10, 25, 50, 100, 250, 500]`.

**Contact email (optional):** `contact: { email: "you@example.com" }` shows it in Quick Help.

**Latest Updates:** until the backend serves `/updates`, three cards flagged *EXAMPLE PLACEHOLDERS* are shown, so edit `updatesExamples` or connect the backend.

**Quick Help answers / FAQ text:** `js/components/quickhelp.js` and `faq.js` (plain data arrays at the top).

## 5. UPI app buttons & icons

Buttons for Google Pay, PhonePe, Paytm, Fam and BHIM try each app's deep link (`tez://`, `phonepe://`, `paytmmp://`) or the generic `upi://pay`. They use neutral lettered badges, not logos, because brand logos are trademarked and I can't download or license them for you. If you have permission/official assets, drop SVGs in `assets/apps/` and set `icon: "assets/apps/gpay.svg"` in `config.js`. No partnership with these brands is implied (the site says so).

The generated URI looks like:
```
upi://pay?pa=its.shivamsr%40fam&pn=HangerPlayz&am=100.00&cu=INR&tn=Support%20HangerPlayz
```
App deep links vary by phone and OS version; "Pay Using UPI App" (generic `upi://pay`) is the most compatible and lets the phone choose an app. On desktop browsers UPI apps can't open, so visitors are guided to scan the QR.

## 6. What works now vs. what needs a backend

| Feature | Status |
|---|---|
| Navbar, smooth scroll, active indicator, mobile menu, scroll progress, back-to-top | ✅ Works |
| Hero, particles, animations, reveal, page loader, reduced-motion support | ✅ Works |
| Exact QR display, enlarge/close dialog, copy UPI ID | ✅ Works |
| 11 presets, custom amount validation, payment summary, copy payment details | ✅ Works |
| UPI intent (`upi://pay…`) + per-app buttons | ✅ Works on phones with UPI apps |
| Quick Help (14 topics), FAQ accordion, social links, About | ✅ Works |
| Custom cursor (arrow / link / I-beam / trail), off on touch & reduced motion | ✅ Works |
| Optional music (synthesized), UI sounds, volume, muted by default | ✅ Works |
| **Payment verification / confirmation** | ❌ Needs backend + payment provider |
| **Leaderboard, Recent Support, Community Wall (moderated)** | ❌ Needs backend (empty states shown) |
| **Milestone counts** | ❌ Needs backend (shows 0 verified) |
| **Latest Updates (real posts)** | ❌ Needs backend (examples labelled) |
| **Admin dashboard** | ❌ Needs backend (`admin-preview.html` is a non-functional concept) |

## 7. Testing

```bash
node tests/test-logic.js          # amount validation, UPI URI, formatting, milestone maths
# Browser tests (needs: npm i playwright-core, and Chrome; set CHROME_PATH if not auto-detected)
python3 -m http.server 8765 &     # the tests expect http://localhost:8765
node tests/e2e.js
```
The browser suite covers navigation, all 11 presets, custom amount edge cases, copy buttons, QR dialog (X / Esc / backdrop), cursor modes, empty states, social links, FAQ, all 14 Quick Help topics, audio toggles, mobile menu/overflow, tablet, reduced motion, XSS-safety of backend text, and rendering of mocked backend data.

## 8. Accessibility & performance notes

Semantic landmarks, skip link, visible focus rings, ARIA states on toggles/accordion/dialog, `aria-live` for errors and notices, alt text on logos and QR, native `<dialog>` for the QR lightbox, `prefers-reduced-motion` honoured (CSS and JS). Animations use `transform`/`opacity`; particles pause when off-screen or the tab is hidden; non-critical images are lazy-loaded; backdrop blur is limited to the navbar. Fonts load from Google Fonts with system-font fallbacks, so remove the `<link>` in `index.html` if you want zero third-party requests.

## 9. Security quick facts

- No secrets, keys or admin logins in the frontend.
- Backend text is inserted with `textContent` and length-capped (no HTML injection).
- External links use `rel="noopener noreferrer"`.
- The site never prints "payment successful" and never invents transaction IDs or supporters.
