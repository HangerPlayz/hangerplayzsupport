/* Optional ambient music + UI click sounds.
   Everything is synthesized with the Web Audio API (original, no audio files,
   no licensing concerns). Muted by default; the AudioContext is only created
   after the visitor flips a toggle. */
(function () {
  var HP = window.HP;
  var ctx, master, sfxGain, musicGain, musicOn = false, sfxOn = false, timer = null, step = 0, nodes = [];

  // Slow A-minor-ish pad progression (frequencies in Hz).
  var CHORDS = [
    [110.0, 164.81, 220.0, 261.63],   // Am
    [87.31, 130.81, 174.61, 261.63],  // F
    [98.0, 146.83, 196.0, 246.94],    // G
    [82.41, 123.47, 164.81, 246.94],  // Em
  ];

  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(ctx.destination);
    return true;
  }

  function playChord() {
    var chord = CHORDS[step++ % CHORDS.length], t = ctx.currentTime, dur = 8;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.connect(musicGain);
    chord.forEach(function (f, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i % 2 ? "triangle" : "sine"; o.frequency.value = f; o.detune.value = (i - 1.5) * 4;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 2.5);
      g.gain.linearRampToValueAtTime(0, t + dur + 1.5);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + 1.6);
      nodes.push(o);
      o.onended = function () { nodes.splice(nodes.indexOf(o), 1); };
    });
  }

  function startMusic() {
    if (!ensure()) { HP.toast("Your browser doesn't support Web Audio.", "warn"); return false; }
    musicOn = true;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
    playChord();
    timer = setInterval(playChord, 8000);
    return true;
  }
  function stopMusic() {
    musicOn = false;
    clearInterval(timer); timer = null;
    if (ctx) {
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      var old = nodes.slice();
      setTimeout(function () { old.forEach(function (o) { try { o.stop(); } catch (e) {} }); }, 700);
    }
  }

  HP.sound = {
    click: function () {
      if (!sfxOn || !ctx) return;
      var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(990, t + 0.06);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 0.14);
    },
  };

  HP.components.Audio = function () {
    var btn = HP.$("#audioBtn"), panel = HP.$("#audioPanel");
    var music = HP.$("#musicToggle"), vol = HP.$("#musicVol"), sfx = HP.$("#sfxToggle");
    btn.innerHTML = HP.icons.music;

    btn.addEventListener("click", function () {
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    });

    music.addEventListener("change", function () {
      if (music.checked) { if (!startMusic()) music.checked = false; } else stopMusic();
    });
    vol.addEventListener("input", function () {
      if (ctx) master.gain.value = (vol.value / 100) * 0.7;
    });
    sfx.addEventListener("change", function () {
      sfxOn = sfx.checked;
      if (sfxOn) { if (!ensure()) { sfx.checked = false; sfxOn = false; return; } HP.sound.click(); }
    });

    // Subtle UI click on buttons/links (only if enabled by the visitor).
    document.addEventListener("click", function (e) {
      if (sfxOn && e.target.closest("button, a, summary")) HP.sound.click();
    }, true);

    // Pause music when the tab is hidden.
    document.addEventListener("visibilitychange", function () {
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else if (musicOn || sfxOn) ctx.resume();
    });
  };
})();
