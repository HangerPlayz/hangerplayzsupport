/* ==========================================================================
   HangerPlayz — central configuration
   Edit values here. Nothing else in the project hardcodes these.
   ========================================================================== */
window.HP = window.HP || { components: {} };

HP.config = {
  brand: {
    name: "HangerPlayz",
    tagline: "Made for the community. Powered by your support.",
    year: 2026,
  },

  /* ---- UPI payment details ------------------------------------------------ */
  payment: {
    upiId: "its.shivamsr@fam",
    payeeName: "HangerPlayz",
    currency: "INR",
    currencySymbol: "₹",
    note: "Support HangerPlayz",
    presets: [10, 20, 30, 50, 75, 100, 150, 200, 300, 500, 999],
    minAmount: 1, //   custom amount lower limit (INR)
    maxAmount: 50000, // custom amount upper limit (INR)
    /* Optional per-app deep-link schemes. The generic "upi://pay" works with
       every UPI app; app-specific schemes try to open that app directly. */
    apps: [
      { id: "gpay", name: "Google Pay", scheme: "tez://upi/pay", letter: "G", color: "#4285F4", icon: "" },
      { id: "phonepe", name: "PhonePe", scheme: "phonepe://pay", letter: "Pe", color: "#5F259F", icon: "" },
      { id: "paytm", name: "Paytm", scheme: "paytmmp://pay", letter: "P", color: "#00B9F1", icon: "" },
      { id: "fam", name: "Fam", scheme: "upi://pay", letter: "F", color: "#F5B83D", icon: "" },
      { id: "bhim", name: "BHIM", scheme: "upi://pay", letter: "B", color: "#E86A1C", icon: "" },
    ],
  },

  /* ---- Social links (exact links supplied by the creator) ----------------- */
  socials: [
    { id: "modrinth", name: "Modrinth", handle: "HangerPlayz", blurb: "Mods & Plugin", url: "https://modrinth.com/user/HangerPlayz" },
    { id: "instagram", name: "Instagram", handle: "@hangerplayz", blurb: "Reels & Story", url: "https://www.instagram.com/hangerplayz/" },
    { id: "youtube", name: "YouTube", handle: "@HangerPlayz", blurb: "Short & Stream", url: "https://youtube.com/@HangerPlayz" },
    /* Placeholders — put a real URL in `url` and the card becomes a live link. */
    { id: "curseforge", name: "CurseForge", handle: "HangerPlayz", blurb: "Mods & Plugin", url: "https://www.curseforge.com/members/hangerplayz/projects" },
    { id: "discord", name: "Discord", handle: "hanger.jar", blurb: "Support", url: "https://discord.gg/rEtEK8uhrY" },
  ],

  /* ---- Contact (optional). Leave "" to hide. ------------------------------ */
  contact: { email: "" },

  /* ---- Community milestones (supporter counts) ---------------------------- */
  milestones: [10, 25, 50, 100, 250, 500],

  /* ---- Backend ------------------------------------------------------------
     Leave baseUrl empty => the site shows honest empty states.
     When you deploy the backend (see BACKEND.md) set e.g.
       baseUrl: "https://api.example.com/api"
     Expected GET endpoints (JSON):
       /leaderboard  /recent  /wall  /milestones  /updates                       */
  api: {
    baseUrl: "",
    timeoutMs: 8000,
  },

  /* Demo data is OFF by default. When ON, milestones show a clearly labelled
     demo count only. Never enable on the public production site. */
  demo: { enabled: false, supporterCount: 12 },

  /* ---- Latest Updates: EXAMPLE placeholders, replace with real posts ------ */
  updatesExamples: [
    { tag: "Mod", title: "Your next Fabric mod announcement goes here", date: "Example", body: "Replace this card with a real release note or video link." },
    { tag: "Plugin", title: "Plugin update notes go here", date: "Example", body: "Describe what changed, what's fixed, and where to download it." },
    { tag: "Community", title: "Community announcement placeholder", date: "Example", body: "Share events, polls, or thank-yous with your supporters." },
  ],
};
