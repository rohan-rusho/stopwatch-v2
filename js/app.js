/* Stopwatch — start/pause/reset, laps, millisecond display, Space to start/stop. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var displayTime = $("display-time");
  var displayMs = $("display-ms");
  var displayWrap = document.querySelector(".display");
  var statusEl = $("status");
  var startStopBtn = $("start-stop-btn");
  var lapBtn = $("lap-btn");
  var resetBtn = $("reset-btn");
  var lapList = $("lap-list");
  var lapsEmpty = $("laps-empty");
  var copyLapsBtn = $("copy-laps-btn");
  var clearLapsBtn = $("clear-laps-btn");
  var toastEl = $("toast");

  var running = false;
  var startStamp = 0;      /* performance.now() when the current run started */
  var accumulated = 0;     /* ms banked from earlier runs */
  var laps = [];           /* { lapMs, totalMs } */
  var lastLapTotal = 0;    /* total ms at the previous lap */
  var rafId = null;
  var toastTimer = null;

  /* ---------- Pure helpers (also unit-tested in node) ---------- */
  function pad(n, len) {
    var s = String(n);
    while (s.length < (len || 2)) s = "0" + s;
    return s;
  }

  function formatTime(ms) {
    var total = Math.max(0, Math.floor(ms));
    var hours = Math.floor(total / 3600000);
    var minutes = Math.floor(total / 60000) % 60;
    var seconds = Math.floor(total / 1000) % 60;
    var hundredths = Math.floor((total % 1000) / 10);
    return { main: pad(hours) + ":" + pad(minutes) + ":" + pad(seconds), ms: "." + pad(hundredths) };
  }

  function lapStats(lapArray) {
    if (!lapArray.length) return { fastest: null, slowest: null };
    var fastest = lapArray[0].lapMs;
    var slowest = lapArray[0].lapMs;
    lapArray.forEach(function (l) {
      if (l.lapMs < fastest) fastest = l.lapMs;
      if (l.lapMs > slowest) slowest = l.lapMs;
    });
    return { fastest: fastest, slowest: slowest };
  }

  /* ---------- Toast ---------- */
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---------- Timing ---------- */
  function nowMs() {
    return running ? accumulated + (performance.now() - startStamp) : accumulated;
  }

  function render() {
    var f = formatTime(nowMs());
    displayTime.textContent = f.main;
    displayMs.textContent = f.ms;
  }

  function tick() {
    render();
    rafId = requestAnimationFrame(tick);
  }

  function setRunningUI() {
    startStopBtn.innerHTML = running ? "⏸ Pause" : "▶ Start";
    lapBtn.disabled = !running;
    resetBtn.disabled = accumulated === 0 && !running;
    displayWrap.classList.toggle("running", running);
    statusEl.textContent = running ? "Running…" : (accumulated > 0 ? "Paused" : "Stopped — ready to start");
    statusEl.classList.toggle("running", running);
  }

  function start() {
    if (running) return;
    running = true;
    startStamp = performance.now();
    rafId = requestAnimationFrame(tick);
    setRunningUI();
  }

  function pause() {
    if (!running) return;
    running = false;
    accumulated = nowMs();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    render();
    setRunningUI();
  }

  function toggle() {
    if (running) pause(); else start();
  }

  function reset() {
    if (running) pause();
    accumulated = 0;
    lastLapTotal = 0;
    render();
    setRunningUI();
  }

  function recordLap() {
    if (!running) return;
    var total = nowMs();
    laps.push({ lapMs: total - lastLapTotal, totalMs: total });
    lastLapTotal = total;
    renderLaps();
  }

  /* ---------- Laps ---------- */
  function renderLaps() {
    lapList.innerHTML = "";
    lapsEmpty.classList.toggle("hidden", laps.length > 0);
    var stats = lapStats(laps);
    $("stat-laps").textContent = laps.length;
    $("stat-fastest").textContent = stats.fastest === null ? "—" : formatTime(stats.fastest).main + formatTime(stats.fastest).ms;
    $("stat-slowest").textContent = stats.slowest === null ? "—" : formatTime(stats.slowest).main + formatTime(stats.slowest).ms;

    // Newest first.
    for (var i = laps.length - 1; i >= 0; i--) {
      var lap = laps[i];
      var li = document.createElement("li");
      li.className = "lap-item";
      var num = document.createElement("span");
      num.className = "lap-num";
      num.textContent = "Lap " + (i + 1);
      var split = document.createElement("span");
      split.className = "lap-split";
      var sf = formatTime(lap.lapMs);
      split.textContent = sf.main + sf.ms;
      var total = document.createElement("span");
      total.className = "lap-total";
      var tf = formatTime(lap.totalMs);
      total.textContent = "Total " + tf.main + tf.ms;
      li.appendChild(num);
      li.appendChild(split);
      li.appendChild(total);
      if (laps.length > 1) {
        if (lap.lapMs === stats.fastest) {
          var fast = document.createElement("span");
          fast.className = "lap-badge fast";
          fast.textContent = "Fastest";
          li.appendChild(fast);
        } else if (lap.lapMs === stats.slowest) {
          var slow = document.createElement("span");
          slow.className = "lap-badge slow";
          slow.textContent = "Slowest";
          li.appendChild(slow);
        }
      }
      lapList.appendChild(li);
    }
  }

  /* ---------- Events ---------- */
  startStopBtn.addEventListener("click", toggle);
  lapBtn.addEventListener("click", recordLap);
  resetBtn.addEventListener("click", function () {
    reset();
    showToast("Stopwatch reset.");
  });

  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea, select")) return;
    if (e.code === "Space") {
      e.preventDefault();
      toggle();
    } else if (e.code === "KeyL") {
      recordLap();
    } else if (e.code === "KeyR") {
      reset();
    }
  });

  copyLapsBtn.addEventListener("click", function () {
    if (!laps.length) { showToast("No laps to copy yet."); return; }
    var lines = laps.map(function (l, i) {
      var sf = formatTime(l.lapMs);
      var tf = formatTime(l.totalMs);
      return "Lap " + (i + 1) + ": " + sf.main + sf.ms + " (total " + tf.main + tf.ms + ")";
    });
    var text = "Stopwatch laps:\n" + lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast("Laps copied!"); }, function () { showToast("Copy failed."); });
    } else {
      showToast(text);
    }
  });

  clearLapsBtn.addEventListener("click", function () {
    if (!laps.length) { showToast("No laps to clear."); return; }
    laps = [];
    lastLapTotal = nowMs();
    renderLaps();
    showToast("Laps cleared.");
  });

  /* ---------- Header / nav / reveal ---------- */
  var header = $("site-header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  var navToggle = $("nav-toggle");
  var mobileMenu = $("mobile-menu");
  navToggle.addEventListener("click", function () {
    var open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { mobileMenu.classList.remove("open"); });
  });

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  $("year").textContent = new Date().getFullYear();

  /* ---------- Init ---------- */
  render();
  setRunningUI();
  renderLaps();

  /* Expose pure helpers for node-based verification. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { formatTime: formatTime, lapStats: lapStats, pad: pad };
  }
})();
