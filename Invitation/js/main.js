/* ============================================================
   PEARL NIKKAH — WEDDING INVITATION SCRIPTS
   Shadab & Ronak
   Interactive envelope opening, high-DPI scratch cards,
   real-time countdown, ambient music player, and WhatsApp RSVP.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ============ 1. URL PERSONALIZATION & DEFAULTS ============ */
  const Q = new URLSearchParams(location.search);
  const setAll = (cls, txt) => document.querySelectorAll(cls).forEach(e => e.textContent = txt);

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let EVENT_DATE = new Date("2026-10-26T20:00:00");

  (function applyParams() {
    const n1 = Q.get("n1"), n2 = Q.get("n2");
    if (n1) setAll(".js-n1", n1);
    if (n2) setAll(".js-n2", n2);
    if (n1 || n2) {
      const a = (n1 || "Shadab").trim()[0] || "S";
      const b = (n2 || "Ronak").trim()[0] || "R";
      const mono = (a + " · " + b).toUpperCase();
      const monoCompact = (a + b).toUpperCase();
      setAll(".js-mono", mono);
      const waxText = document.getElementById("wax-mono-text");
      if (waxText) waxText.textContent = monoCompact;
      document.title = (n1 || "Shadab") + " & " + (n2 || "Ronak") + " — Wedding Invitation";
    }

    const guest = Q.get("guest");
    if (guest) {
      const gl = document.getElementById("guest-line");
      if (gl) gl.textContent = "Dear " + guest + ", you are cordially invited";
    }

    const d = Q.get("date"), t = Q.get("time") || "20:00";
    if (d) {
      const parsedDate = new Date(d + "T" + t + ":00");
      if (!isNaN(parsedDate)) {
        EVENT_DATE = parsedDate;
        const dd = EVENT_DATE.getDate();
        const mm = EVENT_DATE.getMonth();
        const yy = EVENT_DATE.getFullYear();
        setAll(".js-day", dd);
        setAll(".js-month", MONTHS[mm]);
        setAll(".js-year", yy);
        setAll(".js-date-short", String(dd).padStart(2, "0") + " · " + String(mm + 1).padStart(2, "0") + " · " + yy);
        setAll(".js-date-long", EVENT_DATE.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · " + t);
      }
    }

    const venue = Q.get("venue"), addr = Q.get("addr"), city = Q.get("city");
    if (venue) setAll(".js-venue", venue);
    if (addr || city) setAll(".js-addr", [addr, city].filter(Boolean).join(", "));
    if (venue || city) {
      const queryStr = encodeURIComponent([venue, city].filter(Boolean).join(", "));
      const mapEmbed = document.getElementById("map-embed");
      const mapLink = document.getElementById("map-link");
      if (mapEmbed) mapEmbed.src = "https://maps.google.com/maps?q=" + queryStr + "&z=13&output=embed";
      if (mapLink) mapLink.href = "https://maps.google.com/?q=" + queryStr;
    }

    const dress = Q.get("dress");
    if (dress) setAll(".js-dress", dress);
  })();

  /* ============ 2. MUSIC & AMBIENT AUDIO ============ */
  const AUDIO_SRC = Q.get("song") || "humming.mp3";
  const musicBtn = document.getElementById("music-btn");
  let audioEl = null;
  let audioCtx = null;
  let masterGain = null;
  let ambientTimer = null;
  let isPlaying = false;

  if (AUDIO_SRC) {
    audioEl = new Audio(AUDIO_SRC);
    audioEl.loop = true;
    audioEl.volume = 0.6;
  }

  // Generative oriental ambient music fallback via Web Audio API
  const NOTES = [293.66, 311.13, 369.99, 392.00, 440.00, 466.16, 554.37]; // Hijaz oriental scale

  function pluckNote(f, when, dur = 3.2, vol = 0.05) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(masterGain);
    o.start(when);
    o.stop(when + dur);
  }

  function ambientLoop() {
    if (!audioCtx || !isPlaying) return;
    const t = audioCtx.currentTime + 0.05;
    const r = NOTES[Math.floor(Math.random() * NOTES.length)];
    pluckNote(r, t);
    if (Math.random() > 0.45) pluckNote(r * 1.5, t + 0.9, 3, 0.03);
    if (Math.random() > 0.6) pluckNote(r / 2, t + 1.6, 4, 0.035);
    ambientTimer = setTimeout(ambientLoop, 2200 + Math.random() * 1400);
  }

  function startAmbientSynth() {
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.85;
        masterGain.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      ambientLoop();
    } catch (err) {
      console.warn("Ambient synth unavailable:", err);
    }
  }

  function stopAmbientSynth() {
    if (ambientTimer) clearTimeout(ambientTimer);
  }

  function setMusicState(shouldPlay) {
    isPlaying = shouldPlay;
    if (musicBtn) musicBtn.classList.toggle("playing", shouldPlay);

    if (audioEl) {
      if (shouldPlay) {
        audioEl.play().catch(() => {
          // If file playback blocked or fails, fall back to Web Audio API
          startAmbientSynth();
        });
      } else {
        audioEl.pause();
        stopAmbientSynth();
      }
    } else {
      shouldPlay ? startAmbientSynth() : stopAmbientSynth();
    }
  }

  if (musicBtn) {
    musicBtn.addEventListener("click", () => setMusicState(!isPlaying));
  }

  /* ============ 3. ENVELOPE OPENING RITUAL ============ */
  const env = document.getElementById("envelope");
  const screenEl = document.getElementById("envelope-screen");
  const waxEl = document.getElementById("wax");
  const fillEl = document.getElementById("press-fill");
  const HOLD_MS = 1000;
  let holdStartTimestamp = null;
  let holdRAF = null;
  let isOpened = false;

  function spawnMotes() {
    if (!waxEl || !env) return;
    const r = waxEl.getBoundingClientRect();
    const er = env.getBoundingClientRect();
    const count = 26;

    for (let i = 0; i < count; i++) {
      const m = document.createElement("span");
      m.className = "mote";
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 120;
      m.style.left = (r.left - er.left + r.width / 2) + "px";
      m.style.top = (r.top - er.top + r.height / 2) + "px";
      m.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      m.style.setProperty("--dy", (Math.sin(angle) * distance - 50) + "px");
      m.style.animationDelay = (Math.random() * 0.25) + "s";
      const size = 3 + Math.random() * 4;
      m.style.width = size + "px";
      m.style.height = size + "px";
      env.appendChild(m);
      setTimeout(() => m.remove(), 2000);
    }
  }

  function openInvite() {
    if (isOpened) return;
    isOpened = true;

    if (env) {
      env.classList.remove("pressing");
      env.classList.add("opening");
    }
    if (screenEl) screenEl.classList.remove("hint");

    spawnMotes();

    const heroVideo = document.getElementById("hero-video");
    if (heroVideo) {
      heroVideo.play().catch(() => {});
    }

    if (navigator.vibrate) {
      try { navigator.vibrate([18, 50, 24]); } catch (e) {}
    }

    setTimeout(() => {
      document.body.classList.add("opened");
    }, 800);

    setTimeout(() => {
      if (screenEl) screenEl.classList.add("open");
      document.body.classList.remove("locked");
      if (musicBtn) {
        musicBtn.classList.add("show");
        setMusicState(true);
      }
      setTimeout(() => {
        if (screenEl) screenEl.remove();
      }, 1600);
    }, 1400);
  }

  function onHoldStart(e) {
    if (isOpened) return;
    e.preventDefault();
    if (env) env.classList.add("pressing");
    holdStartTimestamp = performance.now();

    if (navigator.vibrate) {
      try { navigator.vibrate(8); } catch (e) {}
    }

    const step = (now) => {
      const elapsed = now - holdStartTimestamp;
      const progress = Math.min(1, elapsed / HOLD_MS);

      if (fillEl) fillEl.style.setProperty("--p", progress);
      if (progress >= 0.35 && screenEl) screenEl.classList.add("hint");

      if (progress >= 1) {
        openInvite();
        return;
      }
      holdRAF = requestAnimationFrame(step);
    };

    holdRAF = requestAnimationFrame(step);
  }

  function onHoldEnd() {
    if (isOpened) return;
    if (holdRAF) cancelAnimationFrame(holdRAF);
    if (env) env.classList.remove("pressing");
    if (screenEl) screenEl.classList.remove("hint");
    if (fillEl) fillEl.style.setProperty("--p", 0);
  }

  if (env) {
    env.addEventListener("pointerdown", onHoldStart);
    ["pointerup", "pointercancel", "pointerleave"].forEach(ev => env.addEventListener(ev, onHoldEnd));
    env.addEventListener("contextmenu", e => e.preventDefault());
    env.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openInvite();
      }
    });
    env.addEventListener("dblclick", openInvite);
  }

  // Force open parameter for testing, automated screenshots, or live editor
  if (Q.get("open") === "1") {
    isOpened = true;
    if (screenEl) screenEl.remove();
    document.body.classList.remove("locked");
    document.body.classList.add("opened");
    if (musicBtn) musicBtn.classList.add("show");
  }

  /* ============ 4. HERO VIDEO SETUP ============ */
  (function initHeroVideo() {
    const hv = document.getElementById("hero-video");
    if (!hv) return;
    const onVideoReady = () => hv.classList.add("ready");
    hv.addEventListener("playing", onVideoReady, { once: true });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      hv.play().then(onVideoReady).catch(() => {});
    } else {
      hv.remove();
    }
  })();

  /* ============ 5. FLOATING PEARL PARTICLES ============ */
  (function initFloaters() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = document.getElementById("hero");
    if (!hero) return;

    const shapes = [
      "<svg width='9' height='9' viewBox='0 0 9 9'><circle cx='4.5' cy='4.5' r='3.8' fill='#F6EEDB' opacity='.9'/><circle cx='3.2' cy='3.2' r='1.2' fill='#FFFFFF' opacity='.95'/></svg>",
      "<svg width='7' height='7' viewBox='0 0 7 7'><circle cx='3.5' cy='3.5' r='2.8' fill='#EAD9A8' opacity='.85'/></svg>",
      "<svg width='11' height='11' viewBox='0 0 11 11'><circle cx='5.5' cy='5.5' r='4.8' fill='#FCFAF6' opacity='.75'/><circle cx='4' cy='4' r='1.5' fill='#FFFFFF' opacity='.9'/></svg>"
    ];

    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      p.className = "floater";
      p.innerHTML = shapes[i % shapes.length];
      p.style.left = (Math.random() * 96 + 2) + "%";
      p.style.animationDuration = (8 + Math.random() * 7) + "s";
      p.style.animationDelay = (-Math.random() * 10) + "s";
      hero.appendChild(p);
    }
  })();

  /* ============ 6. INTERACTIVE SCRATCH CARDS ============ */
  function setupScratchCards() {
    const scratchCards = document.querySelectorAll(".scratch-card canvas");
    scratchCards.forEach(cv => {
      const rect = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      cv.width = rect.width * dpr;
      cv.height = rect.height * dpr;

      const ctx = cv.getContext("2d");
      const gradient = ctx.createLinearGradient(0, 0, cv.width, cv.height);
      gradient.addColorStop(0, "#DCCCA6");
      gradient.addColorStop(0.5, "#B8A171");
      gradient.addColorStop(1, "#DCCCA6");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cv.width, cv.height);

      // Delicate foil label
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = `600 ${Math.round(11 * dpr)}px Jost, sans-serif`;
      ctx.textAlign = "center";
      ctx.letterSpacing = "0.28em";
      ctx.fillText("✦ SCRATCH ✦", cv.width / 2, cv.height / 2 + 4 * dpr);

      ctx.globalCompositeOperation = "destination-out";

      let cleared = false;
      let scratchCount = 0;

      function scratchAt(clientX, clientY) {
        const bounds = cv.getBoundingClientRect();
        const x = (clientX - bounds.left) * dpr;
        const y = (clientY - bounds.top) * dpr;

        ctx.beginPath();
        ctx.arc(x, y, 16 * dpr, 0, Math.PI * 2);
        ctx.fill();

        scratchCount++;
        if (scratchCount > 24 && !cleared) {
          cleared = true;
          cv.style.transition = "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
          cv.style.opacity = "0";
          setTimeout(() => cv.remove(), 900);
        }
      }

      cv.addEventListener("pointerdown", e => {
        cv.setPointerCapture(e.pointerId);
        scratchAt(e.clientX, e.clientY);
      });

      cv.addEventListener("pointermove", e => {
        if (e.buttons > 0 || e.pointerType === "touch") {
          scratchAt(e.clientX, e.clientY);
        }
      });
    });
  }

  setupScratchCards();

  // Handle resize / orientation change cleanly
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Re-initialize only un-cleared scratch cards
      const uncleared = document.querySelectorAll(".scratch-card canvas");
      if (uncleared.length > 0) {
        setupScratchCards();
      }
    }, 250);
  });

  /* ============ 7. REAL-TIME COUNTDOWN ============ */
  const pad = n => String(n).padStart(2, "0");
  const cdD = document.getElementById("cd-d");
  const cdH = document.getElementById("cd-h");
  const cdM = document.getElementById("cd-m");
  const cdS = document.getElementById("cd-s");

  function updateCountdown() {
    const now = Date.now();
    let diff = EVENT_DATE.getTime() - now;
    if (diff < 0 || isNaN(diff)) diff = 0;

    const days = Math.floor(diff / 864e5);
    const hours = Math.floor(diff / 36e5) % 24;
    const minutes = Math.floor(diff / 6e4) % 60;
    const seconds = Math.floor(diff / 1e3) % 60;

    if (cdD) cdD.textContent = days;
    if (cdH) cdH.textContent = pad(hours);
    if (cdM) cdM.textContent = pad(minutes);
    if (cdS) cdS.textContent = pad(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ============ 8. WHATSAPP RSVP ============ */
  const RSVP_PHONE = Q.get("phone") || "9528713324";
  const rsvpBtn = document.getElementById("rsvp-send");
  const rsvpForm = document.getElementById("rsvp-form");
  const rsvpDone = document.getElementById("rsvp-done");

  if (rsvpBtn) {
    rsvpBtn.addEventListener("click", () => {
      const nameInput = document.getElementById("f-name");
      const guestsInput = document.getElementById("f-guests");
      const attendInput = document.getElementById("f-attend");

      const name = (nameInput && nameInput.value.trim()) || "A guest";
      const guests = (guestsInput && guestsInput.value) || "1";
      const attend = (attendInput && attendInput.value) || "Joyfully accept";

      const groom = (document.querySelector(".js-n1") && document.querySelector(".js-n1").textContent) || "Shadab";
      const bride = (document.querySelector(".js-n2") && document.querySelector(".js-n2").textContent) || "Ronak";

      const message = "✦ Wedding RSVP ✦\n\n" +
        "Event: " + groom + " & " + bride + " Nikkah Ceremony\n" +
        "Guest Name: " + name + "\n" +
        "Number of Guests: " + guests + "\n" +
        "Response: " + attend + "\n\n" +
        "Sent via online invitation";

      const waUrl = "https://wa.me/" + RSVP_PHONE + "?text=" + encodeURIComponent(message);
      window.open(waUrl, "_blank", "noopener,noreferrer");

      if (rsvpForm) rsvpForm.style.display = "none";
      if (rsvpDone) rsvpDone.style.display = "block";
    });
  }

  /* ============ 9. INTERSECTION OBSERVER FOR REVEALS ============ */
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback if IntersectionObserver not supported
    revealElements.forEach(el => el.classList.add("in"));
  }
});
