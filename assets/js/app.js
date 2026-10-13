/* Typing Tutor - application shell: screens, scoring, storage */
(function () {
  "use strict";
  var TT = window.TT;
  var view = document.getElementById("view");
  var menuEl = document.getElementById("menu");
  var hotEl = document.getElementById("hotkeys");

  var K_OPT = "tt.options.v1", K_HIST = "tt.history.v1", K_BEST = "tt.best.v1", K_DRILL = "tt.drill.v1";
  var DEF_DUR = 2;

  var DEF_OPTS = { sound: true, crisp: true, kbd: true, hints: true, strict: true, course: "en", altkeys: true, testdur: DEF_DUR };
  var DUR_OPTS = [1, 2, 3, 5];
  /* below this a run is noise: a couple of lucky keystrokes would otherwise post
     a 100% best that no real session could ever beat */
  var MIN_SCORED = 20;
  var opts = Object.assign({}, DEF_OPTS);
  var history = [];
  var best = {};
  var drill = "";
  /* the drill textarea saves on a timer: a synchronous localStorage write on
     every keystroke stalls the caret on long pastes */
  var drillTimer = null;

  var S = { screen: "boot", sel: { lessons: 0, tests: 0 }, dur: DEF_DUR, session: null, tick: null, limit: 0, caps: false, kbdEl: null, kbdHost: null };

  /* ---------------------------------------------------------------- storage */
  function num(v) { return typeof v === "number" && isFinite(v) ? v : 0; }
  /* every screen reads these records with toFixed(), so a half-written or
     hand-edited blob has to be coerced on the way in, not guarded at each use */
  function fixBest(b) {
    if (!b || typeof b !== "object") return { wpm: 0, acc: 0, pass: false, tries: 0, ts: 0, course: "" };
    return {
      wpm: num(b.wpm), acc: num(b.acc), pass: !!b.pass, tries: num(b.tries), ts: num(b.ts),
      course: typeof b.course === "string" ? b.course : ""
    };
  }
  function fixRun(h) {
    if (!h || typeof h !== "object") return null;
    return {
      id: String(h.id || ""), name: String(h.name || h.id || ""),
      course: typeof h.course === "string" ? h.course : "",
      wpm: num(h.wpm), acc: num(h.acc), errors: num(h.errors), sec: num(h.sec),
      limit: num(h.limit), mode: String(h.mode || "lesson"), ts: num(h.ts)
    };
  }
  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(K_OPT) || "null");
      if (o) {
        opts = Object.assign({}, DEF_OPTS, o);
        /* a stale or hand-edited profile must not leave the course picker blank */
        if (!TT.COURSES[opts.course]) opts.course = DEF_OPTS.course;
        if (DUR_OPTS.indexOf(opts.testdur) < 0) opts.testdur = DEF_DUR;
      }
      var h = JSON.parse(localStorage.getItem(K_HIST) || "null");
      if (Array.isArray(h)) history = h.map(fixRun).filter(Boolean);
      var b = JSON.parse(localStorage.getItem(K_BEST) || "null");
      if (b && typeof b === "object" && !Array.isArray(b)) {
        best = {};
        for (var k in b) if (b.hasOwnProperty(k)) best[k] = fixBest(b[k]);
      }
      /* save() always encodes, so the drill has to come back through JSON.parse -
         read raw it returns with the quote marks and the escaped newlines in it */
      var d = JSON.parse(localStorage.getItem(K_DRILL) || "null");
      if (typeof d === "string") drill = d;
    } catch (e) { /* storage unavailable */ }
    S.dur = opts.testdur;
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function saveOpts() { save(K_OPT, opts); }

  /* ------------------------------------------------------------------ audio */
  var AC = null;
  function tone(freq, dur, gain) {
    if (!opts.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = "square"; o.frequency.value = freq;
      g.gain.value = gain || 0.02;
      o.connect(g); g.connect(AC.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
      o.stop(AC.currentTime + dur);
    } catch (e) {}
  }
  function sndKey() { tone(2100, 0.02, 0.012); }
  function sndErr() { tone(160, 0.14, 0.05); }
  function sndBeep() { tone(880, 0.08, 0.03); }
  function sndDone() { tone(660, 0.1, 0.03); setTimeout(function () { tone(990, 0.18, 0.03); }, 110); }

  /* ------------------------------------------------------------------ utils */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* only used by fmtDate: dates have to be zero padded, not space padded */
  function pad(n, w) { var s = String(n); while (s.length < (w || 2)) s = "0" + s; return s; }
  function clock(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = String(Math.floor(sec / 60)); if (m.length < 2) m = "0" + m;
    var s = String(sec % 60); if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  /* a countdown must not round: 40.4 s left shown as 00:40 hides a second the
     typist still has, and 0.4 s left shown as 00:00 reads as the end of the run */
  function clockUp(sec) { return clock(Math.ceil(sec)); }
  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function lessonById(id) {
    for (var i = 0; i < TT.LESSONS.length; i++) if (TT.LESSONS[i].id === id) return i;
    return -1;
  }
  function testById(id) {
    for (var i = 0; i < TT.TESTS.length; i++) if (TT.TESTS[i].id === id) return i;
    return -1;
  }
  /* a history record may belong to the other course: look it up in every registry */
  function findItem(id) {
    for (var cid in TT.COURSES) {
      if (!TT.COURSES.hasOwnProperty(cid)) continue;
      var c = TT.COURSES[cid];
      for (var i = 0; i < c.lessons.length; i++) if (c.lessons[i].id === id) return { course: cid, kind: "lesson", item: c.lessons[i] };
      for (var t = 0; t < c.tests.length; t++) if (c.tests[t].id === id) return { course: cid, kind: "test", item: c.tests[t] };
    }
    return null;
  }
  /* a custom drill is not in any registry - it is rebuilt from the stored text.
     The id carries the course, because best[] is keyed by id alone and a single
     shared "CUSTOM" key lets one course's drill overwrite the other's record. */
  function drillId(cid) { return "CUSTOM." + (cid || TT.courseId); }
  function isDrillId(id) { return typeof id === "string" && id.indexOf("CUSTOM") === 0; }
  function drillItem() {
    return { id: drillId(), name: "Custom drill", text: drill, passWpm: 0, passAcc: 0 };
  }
  /* records are stored under one key but belong to a single course each; every
     screen shows the active course only, so the aggregates have to match */
  function courseIds() {
    var mine = {};
    TT.LESSONS.concat(TT.TESTS).forEach(function (it) { mine[it.id] = true; });
    return mine;
  }
  function inCourse(h, mine) {
    if (h.course) return h.course === TT.courseId;
    /* records written before the course stamp existed: a lesson or test id says
       which course it belongs to, a drill has no id to go on, so keep it */
    return !!mine[h.id] || h.mode === "drill";
  }
  function courseHistory() {
    var mine = courseIds();
    return history.filter(function (h) { return inCourse(h, mine); });
  }
  /* "erase" is offered from a screen that only ever shows one course, so it has
     to leave the other course's records in the shared store untouched */
  function eraseCourse() {
    var mine = courseIds();
    history = history.filter(function (h) { return !inCourse(h, mine); });
    var keep = {};
    for (var k in best) {
      if (!best.hasOwnProperty(k)) continue;
      /* best[] is keyed by exercise id alone: the id names the course for an
         un-stamped record, and a drill id carries its course outright. A drill key
         written before the ".course" suffix existed carries no course at all, and
         inCourse() already counts those as this course's, so erase them here too. */
      var cid = best[k].course ||
        (isDrillId(k) ? (k.slice(7) || TT.courseId) : (mine[k] ? TT.courseId : ""));
      if (cid !== TT.courseId) keep[k] = best[k];
    }
    best = keep;
    save(K_HIST, history);
    save(K_BEST, best);
  }
  function unlocked(idx) {
    if (idx === 0) return true;
    var prev = best[TT.LESSONS[idx - 1].id];
    return !!(prev && prev.pass);
  }
  function meets(item, st) {
    return st.wpm >= item.passWpm && st.acc >= item.passAcc;
  }
  function record(item, st, mode, limit) {
    history.push({
      id: item.id, name: item.name, course: TT.courseId, wpm: st.wpm, acc: st.acc, errors: st.errors,
      sec: st.seconds, limit: limit || 0, mode: mode, ts: Date.now()
    });
    if (history.length > 300) history = history.slice(-300);
    save(K_HIST, history);
    /* the noise floor gates the pass too: a sub-MIN_SCORED run that happens to
       clear the WPM/ACC bar must not unlock the next lesson on a few keystrokes */
    var pass = mode === "lesson" && st.keystrokes >= MIN_SCORED && meets(item, st);
    /* a run under the floor is not a score. Writing the record anyway leaves a
       0.0 WPM entry that Progress then lists as an exercise practised at zero
       speed, so a record is only created once something can go in it; an
       existing record still counts the attempt. */
    if (!best[item.id] && st.keystrokes < MIN_SCORED && !pass) return;
    var b = best[item.id] || fixBest(null);
    b.tries = (b.tries || 0) + 1;
    /* WPM and ACC have to come from the same run: keeping the fastest speed and
       the best accuracy separately posts a pair the typist never actually typed */
    if (st.keystrokes >= MIN_SCORED && st.wpm > (b.wpm || 0)) {
      b.wpm = st.wpm;
      b.acc = st.acc;
    }
    if (pass) b.pass = true;
    b.course = TT.courseId;
    b.ts = Date.now();
    best[item.id] = b;
    save(K_BEST, best);
  }

  /* ---------------------------------------------------------------- chrome  */
  var MENU = [
    { id: "lessons", label: "Lessons", key: "F2" },
    { id: "tests", label: "Tests", key: "F3" },
    { id: "progress", label: "Progress", key: "F4" },
    { id: "options", label: "Options", key: "F5" },
    { id: "help", label: "Help", key: "F1" }
  ];
  function renderMenu() {
    menuEl.innerHTML = "";
    MENU.forEach(function (m) {
      var b = document.createElement("button");
      b.textContent = m.label;
      b.title = m.key;
      if (S.screen === m.id || (S.screen === "session" && m.id === "lessons")) {
        b.className = "on";
        b.setAttribute("aria-current", "page");
      }
      b.onclick = function () { go(m.id); };
      menuEl.appendChild(b);
    });
    var v = document.querySelector(".menubar .ver");
    if (!v) return;
    var kb = v.querySelector(".ver-kbd"), cs = v.querySelector(".ver-course");
    if (kb) kb.textContent = TT.layout.short || "QWERTY";
    if (cs) cs.textContent = TT.active().name;
    /* the pill is a control, so say what it will do before it is pressed */
    var nid = nextCourseId();
    v.disabled = nid === TT.courseId;
    v.title = v.disabled ? "Only one course is installed" : "Switch to " + TT.COURSES[nid].name;
  }
  /* the menu-bar pill steps to the next installed course - with the two courses
     in the registry that is the same toggle the Options screen offers */
  function nextCourseId() {
    var ids = Object.keys(TT.COURSES);
    if (!ids.length) return TT.courseId;
    var i = ids.indexOf(TT.courseId);
    return ids[(i + 1) % ids.length];
  }
  /* the menu shortcuts are live on every screen (see the keydown handler), so the
     footer always shows them; the per-screen list only carries what is special to
     that screen */
  var MENU_KEYS = [["F2", "lessons"], ["F3", "tests"], ["F4", "progress"], ["F5", "options"], ["F1", "help"]];
  function hk(x) {
    return '<span class="hk"><kbd>' + esc(x[0]) + "</kbd>" + esc(x[1]) + "</span>";
  }
  function renderHotkeys(list) {
    hotEl.innerHTML = '<span class="hk-group">' + list.map(hk).join("") + "</span>" +
      '<span class="hk-menu"><span class="hk-cap">Menu</span>' + MENU_KEYS.map(hk).join("") + "</span>";
  }

  /* the palette lives in the theme tokens, so switching is one attribute on <html>;
     index.html applies the stored value before the first paint, this keeps it live */
  var K_THEME = "tt.theme.v1";
  /* stored only on an explicit choice: persisting the value index.html resolved
     from prefers-color-scheme would pin the palette and stop following the OS */
  function applyTheme(t, keep) {
    document.documentElement.dataset.theme = t;
    if (keep) { try { localStorage.setItem(K_THEME, t); } catch (e) {} }
    var b = document.getElementById("theme");
    if (b) b.title = "Switch to the " + (t === "light" ? "dark" : "light") + " theme";
  }
  function initTheme() {
    var b = document.getElementById("theme");
    if (!b) return;
    applyTheme(document.documentElement.dataset.theme || "dark");
    b.onclick = function () {
      applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light", true);
    };
  }

  /* the course pill lives in the static menu bar, so one handler covers every
     screen; renderMenu only refreshes its label */
  function initCourseSwitch() {
    var b = document.querySelector(".menubar .ver");
    if (!b) return;
    b.onclick = function () {
      var id = nextCourseId();
      if (id === TT.courseId) { sndErr(); return; }
      setCourse(id);
      sndBeep();
      /* a session belongs to the course it was started in: the lesson list has
         just been swapped out from under it, so there is nothing to resume */
      go(S.screen === "session" ? "lessons" : S.screen);
    };
  }

  /* ---------------------------------------------------------------- screens */
  function stopTick() { if (S.tick) { clearInterval(S.tick); S.tick = null; } }
  function go(screen, arg, arg2) {
    stopTick();
    S.session = null; S.kbdEl = null; S.kbdHost = null; S.caps = false;
    S.screen = screen;
    if (screen === "boot") return boot();
    if (screen === "lessons") return lessons();
    if (screen === "tests") return tests();
    if (screen === "progress") return progress();
    if (screen === "options") return options();
    if (screen === "help") return help();
    if (screen === "session") return session(arg, arg2);
  }

  function boot() {
    view.innerHTML =
      '<div class="boot">' +
      '<div class="mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34" fill="none"' +
      ' stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
      '<rect x="2" y="6" width="20" height="12" rx="2.5"/>' +
      '<path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 14h.01M18 14h.01M9.5 14h5"/></svg></div>' +
      "<h1>Typing Tutor</h1>" +
      '<p class="sub">Touch typing course in ten lessons.</p>' +
      '<div class="hero-stats">' +
      '<div class="stat"><span class="k">Best speed</span><span class="v">' + bestOverall() + "<small>WPM</small></span></div>" +
      '<div class="stat"><span class="k">Lessons passed</span><span class="v">' + passedCount() + "<small>/" + TT.LESSONS.length + "</small></span></div>" +
      '<div class="stat"><span class="k">Course</span><span class="v sm">' + esc(TT.active().name) + "</span></div>" +
      '<div class="stat"><span class="k">Keyboard</span><span class="v sm">' + esc(TT.layout.name) + "</span></div>" +
      "</div>" +
      '<p style="margin-top:22px"><button class="btn pri lg" id="start">Start the course</button></p>' +
      '<p class="acc blink" style="margin-top:12px">or press any key</p>' +
      '<p class="dim" style="margin-top:20px">Use a full-size keyboard. Ten fingers, eyes on the screen. Layout can be changed in Options.</p>' +
      "</div>";
    renderMenu();
    renderHotkeys([["Any key", "start"]]);
    view.querySelector("#start").onclick = startFromBoot;
  }
  function startFromBoot() {
    sndBeep();
    S.sel.lessons = 0;
    go("lessons");
  }
  function bestOverall() {
    var m = 0;
    TT.LESSONS.concat(TT.TESTS).forEach(function (it) {
      var b = best[it.id];
      if (b && b.wpm > m) m = b.wpm;
    });
    return Math.round(m);
  }
  function passedCount() {
    var n = 0;
    for (var i = 0; i < TT.LESSONS.length; i++) {
      var b = best[TT.LESSONS[i].id];
      if (b && b.pass) n++;
    }
    return n;
  }

  function lessons() {
    var rows = TT.LESSONS.map(function (l, i) {
      var open = unlocked(i), b = best[l.id];
      var state = !open ? "Locked" : (b && b.pass ? "Passed" : "Ready");
      var tone = state === "Passed" ? "ok" : state === "Ready" ? "acc" : "";
      var cls = !open ? "locked" : (S.sel.lessons === i ? "current" : "");
      return '<tr class="' + cls + '" data-i="' + i + '">' +
        "<td>" + esc(l.name) + "</td>" +
        '<td class="num">' + (b ? b.wpm.toFixed(1) : "-.-") + "</td>" +
        '<td class="num">' + (b ? b.acc.toFixed(1) : "-.-") + "</td>" +
        '<td class="num">' + l.passWpm + "</td>" +
        '<td class="num">' + (b ? b.tries : 0) + "</td>" +
        '<td><span class="chip ' + tone + '">' + state + "</span></td></tr>";
    }).join("");
    view.innerHTML =
      '<div class="page-head"><div><h1>Lessons</h1>' +
      '<p class="dim">Select a lesson. A lesson unlocks the next one when you reach the required speed with ' +
      "95% accuracy or better.</p></div>" +
      '<div class="actions"><button class="btn ghost" id="retrylast">Repeat last attempt</button>' +
      '<button class="btn pri" id="go">Start selected lesson</button></div></div>' +
      '<div class="tablewrap"><table><thead><tr><th>Lesson</th><th class="num">Best&nbsp;WPM</th>' +
      '<th class="num">Best&nbsp;ACC</th><th class="num">Req&nbsp;WPM</th><th class="num">Tries</th>' +
      "<th>Status</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
    renderMenu();
    renderHotkeys([["Up/Down", "select"], ["Enter", "start"], ["Esc", "menu"]]);
    view.querySelectorAll("tr[data-i]").forEach(function (tr) {
      tr.onclick = function () {
        var i = +tr.dataset.i;
        if (!unlocked(i)) { sndErr(); return; }
        S.sel.lessons = i;
        go("session", TT.LESSONS[i]);
      };
    });
    var g = view.querySelector("#go");
    g.onclick = function () {
      if (!unlocked(S.sel.lessons)) { sndErr(); return; }
      go("session", TT.LESSONS[S.sel.lessons]);
    };
    view.querySelector("#retrylast").onclick = function () {
      var last = history[history.length - 1];
      if (!last) { sndErr(); return; }
      var hit = findItem(last.id);
      if (!hit) {
        /* the last run was a custom drill: replay the stored text, switching to
           the course the drill belongs to so the layout matches what is typed */
        if (isDrillId(last.id) && drill) {
          var cid = last.id.slice(7);
          if (TT.COURSES[cid] && cid !== TT.courseId) setCourse(cid);
          go("session", drillItem());
        } else sndErr();
        return;
      }
      if (hit.course !== TT.courseId) setCourse(hit.course);
      if (hit.kind === "lesson") {
        S.sel.lessons = lessonById(hit.item.id);
        go("session", hit.item);
      } else {
        S.sel.tests = testById(hit.item.id);
        go("session", hit.item, last.limit || 120);
      }
    };
  }

  function tests() {
    var rows = TT.TESTS.map(function (t, i) {
      var b = best[t.id];
      return '<tr data-t="' + i + '" class="' + (i === S.sel.tests ? "current" : "") + '">' +
        "<td>" + esc(t.name) + "</td>" +
        '<td class="num">' + (b ? b.wpm.toFixed(1) : "-.-") + "</td>" +
        '<td class="num">' + (b ? b.acc.toFixed(1) : "-.-") + "</td>" +
        '<td class="dim">' + Array.from(t.text).length + " chars</td></tr>";
    }).join("");
    view.innerHTML =
      '<div class="page-head"><div><h1>Timed tests</h1>' +
      '<p class="dim">A test is timed. When the clock reaches zero the run is scored, pass or not. ' +
      "Errors are not corrected after the time expires.</p></div>" +
      '<div class="actions"><div class="seg" role="radiogroup" aria-label="Test duration">' +
      DUR_OPTS.map(function (m) {
        return '<label class="segopt"><input type="radio" name="dur" value="' + m + '"' +
          (m === S.dur ? " checked" : "") + '><span>' + m + " min</span></label>";
      }).join("") +
      '</div><button class="btn pri" id="go">Start selected test</button></div></div>' +
      '<div class="tablewrap"><table><thead><tr><th>Test</th><th class="num">Best&nbsp;WPM</th>' +
      '<th class="num">Best&nbsp;ACC</th><th>Length</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
    renderMenu();
    renderHotkeys([["Up/Down", "select"], ["Enter", "start"], ["Esc", "menu"]]);
    view.querySelectorAll("tr[data-t]").forEach(function (tr) {
      tr.onclick = function () { S.sel.tests = +tr.dataset.t; startTest(TT.TESTS[S.sel.tests], dur()); };
    });
    view.querySelector("#go").onclick = function () { startTest(TT.TESTS[S.sel.tests], dur()); };
    /* the duration has to survive the re-render that row selection triggers */
    view.querySelectorAll('input[name=dur]').forEach(function (r) {
      r.onchange = function () {
        S.dur = opts.testdur = +r.value;
        saveOpts();
      };
    });
  }

  function dur() {
    var r = view.querySelector('input[name=dur]:checked');
    return r ? +r.value : S.dur;
  }

  function startTest(item, minutes) { go("session", item, minutes * 60); }

  /* ------------------------------------------------------- session screen */
  function session(item, secs) {
    var isTest = !!secs;
    var minutes = isTest ? Math.round(secs / 60) : 0;
    var mode = isTest ? "test" : (isDrillId(item.id) ? "drill" : "lesson");
    var lIdx = lessonById(item.id);
    var modeChip = mode === "test" ? "Timed test" : mode === "drill" ? "Practice" : "Lesson";
    var head =
      '<div class="sess-head"><span class="title">' + esc(item.name) + "</span>" +
      '<span class="chip' + (isTest ? " acc" : "") + '">' + modeChip +
      (isTest ? " · " + minutes + " min" + (minutes > 1 ? "s" : "") : "") + "</span>" +
      '<span class="focus">' + esc(item.focus ||
        (isTest ? "The clock decides the end of the run; errors are not corrected after it expires." : "")) + "</span></div>";

    function stat(k, id, v) {
      return '<div class="stat"><span class="k">' + k + '</span><span class="v" id="' + id + '">' + v + "</span></div>";
    }
    var status =
      '<div class="status">' +
      stat("WPM", "s-wpm", "0.0") +
      stat("CPM", "s-cpm", "0") +
      stat("ACC", "s-acc", "100.0") +
      stat("ERR", "s-err", "0") +
      stat(isTest ? "Left" : "Time", "s-time", isTest ? clock(secs) : "00:00") +
      stat("Done", "s-pct", "0%") +
      '<span class="spacer"></span>' +
      '<span class="hint" id="s-hint"></span>' +
      "</div>";

    view.innerHTML = head +
      '<div class="passage" id="passage"></div>' + status +
      '<div id="result"></div>' +
      '<div class="kbd-wrap"><div id="kbd"></div>' +
      '<div class="legend" aria-hidden="true">' + Object.keys(TT.FINGERS).map(function (f) {
        return '<span><i style="background:var(--f-' + f + ')"></i>' + TT.FINGERS[f] + "</span>";
      }).join("") + "</div></div>";

    renderMenu();
    renderHotkeys([["Esc", "abort"], ["F9", "retry"], ["F10", "next"], ["F8", "keyboard"], ["Type", "just start typing"]]);

    var passage = view.querySelector("#passage");
    passage.setAttribute("lang", TT.active().lang);
    S.session = TT.createSession(item, passage, {
      /* a timed run is scored as it stands when the clock expires, and a custom
         drill has no target to be gated on at all - only a lesson demands a
         clean sheet, so strict applies to lessons alone */
      strict: (isTest || mode === "drill") ? false : opts.strict,
      altkeys: opts.altkeys,
      hooks: {
        onKey: function (ev) {
          flashKey(ev);
          updStatus();
          updKbd();
          if (!ev.ok) sndErr(); else sndKey();
        },
        onStart: function () { },
        onComplete: function (st) { finish(st, item, mode, lIdx); }
      }
    });

    S.limit = isTest ? secs : 0;

    S.tick = setInterval(updStatus, 250);
    buildKbd();
    updKbd();
    updStatus();
    view.querySelector("#result").innerHTML =
      '<div class="tip">Start typing. Wrong characters are marked in red - press Backspace to clear them before you continue.' +
      /* the same test the Options screen uses (see dead()): what matters is whether
         the active layout can reach the US key positions, not which course id is set */
      (TT.layout !== TT.LAYOUTS.us && opts.altkeys ? " You may type the Thai characters or the US key in the same position." : "") +
      "</div>";
  }

  function elapsed() {
    var st = S.session.state;
    if (!st.startedAt) return 0;
    return ((st.endedAt || Date.now()) - st.startedAt) / 1000;
  }

  function updStatus() {
    if (!S.session) return;
    var s = S.session.stats();
    var q = function (id) { return view.querySelector("#" + id); };
    if (!q("s-wpm")) return;
    q("s-wpm").textContent = s.wpm.toFixed(1);
    q("s-cpm").textContent = s.cpm;
    q("s-acc").textContent = s.acc.toFixed(1);
    q("s-acc").className = "v " + (s.acc < 90 ? "warn" : "");
    q("s-err").textContent = s.errors;
    q("s-pct").textContent = s.pct + "%";
    if (S.limit) {
      var left = S.limit - elapsed();
      q("s-time").textContent = clockUp(left);
      if (left <= 0 && !S.session.state.done) {
        /* pin the end to the deadline, not to the tick that happened to notice it */
        S.session.finish(S.session.state.startedAt + S.limit * 1000);
        return;
      }
    } else {
      q("s-time").textContent = clock(elapsed());
    }
    if (S.limit && !S.session.state.startedAt) {
      q("s-hint").textContent = "START TYPING TO START THE CLOCK";
    } else if (S.caps) {
      q("s-hint").textContent = "CAPS LOCK IS ON - TURN IT OFF";
    } else if (S.session.state.strict && s.badLeft > 0) {
      /* only a strict run is gated on a clean sheet - a timed test is scored as
         it stands, so there is nothing to fix there */
      q("s-hint").textContent = "FIX " + s.badLeft + " ERROR" + (s.badLeft > 1 ? "S" : "") + " WITH BACKSPACE";
    } else if (S.session.state.pos >= S.session.state.total) {
      q("s-hint").textContent = "COMPLETE";
    } else if (opts.hints) {
      var n = S.session.next();
      var want = S.session.charAt(S.session.state.pos);
      if (n) {
        var alt = opts.altkeys ? TT.altChars(want) : [];
        q("s-hint").textContent = "NEXT: " + (n.shift ? "Shift + " : "") + pretty(want) +
          (alt.length ? "  or  " + pretty(alt[0]) : "") +
          "  (" + (TT.FINGERS[n.finger] || "unknown finger") + (n.numpad ? ", numeric keypad" : "") + ")";
      }
    } else q("s-hint").textContent = "";
  }

  function pretty(ch) {
    if (ch === " ") return "Space";
    if (ch === "\n") return "Enter";
    if (ch === "\t") return "Tab";
    return ch;
  }

  function finish(st, item, mode, lIdx) {
    stopTick();
    /* snapshot the record before record() overwrites it, otherwise the result
       screen can never tell a new best from an ordinary run */
    var was = best[item.id];
    var prevWpm = (was && was.wpm) || 0;
    record(item, st, mode, S.limit);
    sndDone();
    var pass = mode === "lesson" ? (st.keystrokes >= MIN_SCORED && meets(item, st)) : null;
    var b = best[item.id];
    var crit = mode === "lesson"
      ? '<p class="dim">Required: ' + item.passWpm + " WPM at " + item.passAcc + "% accuracy.</p>" : "";
    /* the same MIN_SCORED gate record() applies, otherwise a run too short to be
       stored can still be announced as a new best next to an unchanged BEST cell */
    var rec = (st.keystrokes >= MIN_SCORED && st.wpm > prevWpm)
      ? '<p class="ok">New best for this exercise (previous ' + prevWpm.toFixed(1) + " WPM).</p>" : "";
    var verdict = pass === null
      ? '<span class="big acc">' + (mode === "drill" ? "Practice complete" : "Test complete") + "</span>"
        : pass ? '<span class="big ok">Lesson passed</span>'
          : '<span class="big bad">Not yet</span>';
    var nextMsg = "";
    if (mode === "lesson") {
      if (pass && lIdx + 1 < TT.LESSONS.length) nextMsg = '<button class="btn pri" id="next">Next lesson (F10)</button>';
      else if (pass) nextMsg = '<p class="ok">That is the last lesson. Take the timed tests to measure your speed.</p>';
      else nextMsg = '<p class="dim">Repeat the lesson until the required speed and accuracy are met.</p>';
    }
    view.querySelector("#result").innerHTML =
      '<div class="result ' + (pass === null ? "" : pass ? "pass" : "fail") + '">' + verdict +
      '<div class="grid">' +
      cell("WPM", st.wpm.toFixed(1)) + cell("Net CPM", st.cpm) + cell("Raw", st.raw.toFixed(1)) +
      cell("Accuracy", st.acc.toFixed(1) + "%") + cell("Errors", st.errors) +
      cell("Keystrokes", st.keystrokes) + cell("Time", clock(st.seconds)) +
      cell("Best", (b ? b.wpm.toFixed(1) : "-") + " WPM") +
      "</div>" + crit + rec + nextMsg +
      '<button class="btn" id="again">Retry (F9)</button>' +
      '<button class="btn ghost" id="menu">Lesson menu (Esc)</button></div>';
    var q = function (id) { return view.querySelector("#" + id); };
    if (q("again")) q("again").onclick = function () { go("session", item, S.limit || undefined); };
    if (q("menu")) q("menu").onclick = function () { go("lessons"); };
    if (q("next")) q("next").onclick = function () { S.sel.lessons = lIdx + 1; go("session", TT.LESSONS[lIdx + 1]); };
    if (q("s-hint")) q("s-hint").textContent = "";
    if (S.kbdEl) S.kbdEl.querySelectorAll(".next").forEach(function (k) { k.classList.remove("next"); });
  }
  function cell(k, v) { return '<div class="cell"><b>' + k + "</b> " + v + "</div>"; }

  /* ------------------------------------------------------ virtual keyboard */
  function buildKbd() {
    var host = view.querySelector("#kbd");
    if (!host) return;
    S.kbdHost = host;
    S.kbdEl = TT.renderKeyboard(host);
    host.querySelectorAll(".key").forEach(function (k) {
      k.onclick = function () {
        if (!S.session || S.session.state.done) return;
        var id = k.dataset.key;
        if (id === "Back") { S.session.backspace(); return; }
        var want = S.session.charAt(S.session.state.pos);
        var plain = k.dataset.plain, shifted = k.dataset.shift;
        var ch = null;
        if (want && (want === plain || want === shifted)) ch = want;
        else if (id === "Space") ch = " ";
        else if (id === "Enter") ch = "\n";
        else if (plain && plain.length === 1) ch = plain;
        if (ch === null) return;
        S.session.inject(ch);
      };
    });
  }

  function keyEl(id) {
    if (!S.kbdHost || !S.kbdHost._keys) return null;
    return S.kbdHost._keys[id] || null;
  }

  function updKbd() {
    if (!S.kbdEl) return;
    S.kbdEl.querySelectorAll(".next").forEach(function (k) { k.classList.remove("next"); });
    var n = S.session.next();
    if (!n) return;
    var k = keyEl(n.key);
    if (k) k.classList.add("next");
    if (n.shift) {
      var left = (n.finger || "").charAt(0) === "r";
      var sh = keyEl(left ? "LShift" : "RShift");
      if (sh) sh.classList.add("next");
    }
  }

  /* KeyboardEvent.code -> the physical key id used by TT.PHYS_ROWS. Lighting up
     the key the typist actually pressed is right on every layout; deriving it from
     the character is only a guess, and it goes wrong with alt-keys or a shifted
     symbol. The guess stays as a fallback for on-screen keyboard clicks, which
     have no code. */
  var CODE = {};
  (function () {
    for (var c = 97; c <= 122; c++) CODE["Key" + String.fromCharCode(c).toUpperCase()] = String.fromCharCode(c);
    for (var d = 0; d <= 9; d++) { CODE["Digit" + d] = String(d); CODE["Numpad" + d] = "Numpad" + d; }
    CODE.Space = "Space"; CODE.Enter = "Enter"; CODE.Tab = "Tab"; CODE.Backspace = "Back";
    CODE.ShiftLeft = "LShift"; CODE.ShiftRight = "RShift";
    CODE.ControlLeft = "LCtrl"; CODE.ControlRight = "RCtrl";
    CODE.AltLeft = "LAlt"; CODE.AltRight = "RAlt"; CODE.CapsLock = "Caps";
    CODE.Backquote = "`"; CODE.Minus = "-"; CODE.Equal = "="; CODE.BracketLeft = "[";
    CODE.BracketRight = "]"; CODE.Backslash = "\\"; CODE.Semicolon = ";"; CODE.Quote = "'";
    CODE.Comma = ","; CODE.Period = "."; CODE.Slash = "/";
  })();

  function flashKey(ev) {
    if (!S.kbdEl) return;
    var id = CODE[ev.code] || null;
    if (!id) {
      if (ev.ch === null) id = "Back";
      else if (ev.ch === "\n") id = "Enter";
      else if (ev.ch === " ") id = "Space";
      else if (ev.ch) { var n = TT.keyForChar(ev.ch); id = n && n.key; }
    }
    /* the keypad is only drawn for layouts that cannot reach Latin digits, so on
       the US layout a keypad press has to fall back to the main-row key */
    var k = keyEl(id);
    if (!k && typeof id === "string" && id.indexOf("Numpad") === 0) k = keyEl(id.slice(6));
    if (!k) return;
    k.classList.add(ev.ok ? "hit" : "miss");
    setTimeout(function () { k.classList.remove("hit"); k.classList.remove("miss"); }, 130);
  }

  /* ------------------------------------------------------------- progress */
  function progress() {
    /* a custom drill belongs to no registry, but its id is course-scoped, so a
       record under this course's key is always this course's own drill */
    var items = TT.LESSONS.concat(TT.TESTS);
    var did = drillId();
    if (best[did]) items = items.concat([{ id: did, name: "Custom drill" }]);
    var rows = items.map(function (l) {
      var b = best[l.id];
      if (!b) return "";
      var st = l.passWpm ? (b.pass ? "Passed" : "In progress") : "Practised";
      var tone = l.passWpm ? (b.pass ? "ok" : "acc") : "";
      return "<tr><td>" + esc(l.name) + "</td>" +
        '<td class="num">' + b.wpm.toFixed(1) + "</td>" +
        '<td class="num">' + b.acc.toFixed(1) + "</td>" +
        '<td class="num">' + b.tries + "</td>" +
        '<td><span class="chip ' + tone + '">' + st + "</span></td>" +
        '<td class="dim">' + fmtDate(b.ts) + "</td></tr>";
    }).join("");

    var runs = courseHistory();
    var recent = runs.slice(-24);
    var max = 10;
    recent.forEach(function (h) { if (h.wpm > max) max = h.wpm; });
    var bars = recent.map(function (h) {
      var pct = Math.max(2, Math.round(h.wpm / max * 100));
      return '<div class="bar" style="height:' + pct + '%" title="' + esc(h.name) + " " + h.wpm + ' WPM"><i>' + h.wpm.toFixed(0) + "</i><b>" + (h.id || "").replace(/[^A-Z0-9]/g, "") + "</b></div>";
    }).join("");
    var chart = recent.length
      ? '<div class="chart">' + bars + "</div><div class=\"chart-axis\"><span>oldest</span><span>peak " + max + " WPM</span><span>latest</span></div>"
      : '<p class="dim">No sessions recorded yet.</p>';

    var last = runs.slice(-15).reverse().map(function (h) {
      return "<tr><td>" + fmtDate(h.ts) + "</td><td>" + esc(h.name) + "</td>" +
        '<td class="num">' + h.wpm.toFixed(1) + "</td><td class=\"num\">" + h.acc.toFixed(1) + "</td>" +
        '<td class="num">' + h.errors + "</td><td class=\"num\">" + clock(h.sec) + "</td></tr>";
    }).join("");

    view.innerHTML =
      '<div class="page-head"><div><h1>Progress</h1>' +
      '<p class="dim">Covers the ' + esc(TT.active().name) + " course only and is stored in this browser.</p></div>" +
      '<div class="actions"><button class="btn danger" id="clr">Erase this course&rsquo;s records</button></div></div>' +
      '<div class="grid summary">' +
      cell("Lessons passed", passedCount() + "/" + TT.LESSONS.length) +
      cell("Best WPM", bestOverall()) +
      cell("Total runs", runs.length) +
      cell("Sessions", new Set(runs.map(function (h) { return fmtDate(h.ts); })).size) +
      "</div>" +
      '<div class="cols"><div class="panel"><h3>Speed history (last ' + recent.length + " runs)</h3>" + chart + "</div>" +
      '<div class="panel"><h3>Notes</h3><p class="dim">Speed is measured in words per minute: five correct characters equal one word. '
      + "A run shorter than " + MIN_SCORED + " keystrokes still appears in the history below, but is never recorded as a best for an exercise.</p></div></div>" +
      '<div class="panel"><h3>Records by exercise</h3><div class="tablewrap"><table><thead><tr><th>Exercise</th>' +
      '<th class="num">Best WPM</th>' +
      "<th class=\"num\">Best ACC</th><th class=\"num\">Tries</th><th>Status</th><th>Last</th></tr></thead><tbody>" +
      (rows || '<tr><td colspan="6" class="dim">nothing recorded</td></tr>') + "</tbody></table></div></div>" +
      '<div class="panel"><h3>Recent sessions</h3><div class="tablewrap"><table><thead><tr><th>Date</th><th>Exercise</th>' +
      "<th class=\"num\">WPM</th>" +
      "<th class=\"num\">ACC</th><th class=\"num\">ERR</th><th class=\"num\">Time</th></tr></thead><tbody>" +
      (last || '<tr><td colspan="6" class="dim">no sessions</td></tr>') + "</tbody></table></div></div>";
    renderMenu();
    renderHotkeys([["Esc", "menu"]]);
    view.querySelector("#clr").onclick = function () {
      if (!confirm("Erase the records for the " + TT.active().name + " course?")) return;
      eraseCourse(); go("progress");
    };
  }

  /* -------------------------------------------------------------- options */
  function options() {
    var t = [
      ["sound", "Key click and error sounds"],
      ["crisp", "Crisp text (turn off font smoothing)"],
      ["kbd", "Show the on-screen keyboard with finger colours"],
      ["hints", "Show the next-key finger hint on the status line"],
      ["strict", "Errors must be erased before a lesson can be finished"],
      ["altkeys", "Accept the same key position on the US layout (asdf for ฟหกด)"]
    ];
    /* altkeys only ever does anything on a non-US layout: TT.altChars() is a no-op
       for the QWERTY course, so say so instead of offering a dead switch */
    function dead(o) { return o === "altkeys" && TT.layout === TT.LAYOUTS.us; }
    var theme = document.documentElement.dataset.theme || "dark";
    view.innerHTML =
      '<div class="page-head"><div><h1>Options</h1>' +
      '<p class="dim">Settings are stored in this browser.</p></div>' +
      '<div class="actions"><button class="btn ghost" id="resetopt">Restore default options</button>' +
      '<button class="btn danger" id="clr">Erase this course&rsquo;s records</button></div></div>' +
      '<div class="cols"><div class="panel"><h3>Course and keyboard layout</h3>' +
      Object.keys(TT.COURSES).map(function (id) {
        var c = TT.COURSES[id];
        return '<label class="opt"><input type="radio" name="course" value="' + id + '"' +
          (opts.course === id ? " checked" : "") + '><span>' + esc(c.name) +
          ' <em>- ' + esc((TT.LAYOUTS[c.layout] || {}).name || c.layout) + "</em></span></label>";
      }).join("") +
      '<p class="dim">The interface stays in English. The Thai course teaches touch typing on the Kedmanee layout - set your operating system keyboard to Thai (Thailand) before you start. Records are kept per course.</p>' +
      "</div><div class=\"panel\"><h3>Display and sound</h3>" +
      t.map(function (o) {
        var off = dead(o[0]);
        return '<label class="opt' + (off ? " off" : "") + '"><input type="checkbox" data-o="' + o[0] + '"' +
          (opts[o[0]] ? " checked" : "") + (off ? " disabled" : "") + '><span>' + o[1] +
          (off ? ' <em>(not used by this course)</em>' : "") + "</span></label>";
      }).join("") +
      '<h3 style="margin-top:16px">Colour theme</h3><div class="seg" role="radiogroup" aria-label="Colour theme">' +
      ["dark", "light"].map(function (v) {
        return '<label class="segopt"><input type="radio" name="theme" value="' + v + '"' +
          (theme === v ? " checked" : "") + '><span>' + v + "</span></label>";
      }).join("") + "</div>" +
      '</div><div class="panel"><h3>Custom drill</h3>' +
      '<p class="dim">Type your own text as a practice exercise. It is not scored against a target.</p>' +
      '<textarea id="custom" placeholder="paste or type the text you want to practise"></textarea>' +
      '<p style="margin-top:10px"><button class="btn pri" id="godrill">Start custom drill</button></p>' +
      "</div></div>";
    renderMenu();
    renderHotkeys([["Esc", "menu"]]);
    view.querySelectorAll("input[data-o]").forEach(function (cb) {
      cb.onchange = function () { opts[cb.dataset.o] = cb.checked; saveOpts(); applyOpts(); };
    });
    view.querySelectorAll('input[name="course"]').forEach(function (r) {
      r.onchange = function () { setCourse(r.value); go("options"); };
    });
    view.querySelectorAll('input[name="theme"]').forEach(function (r) {
      r.onchange = function () { applyTheme(r.value, true); };
    });
    var cu = view.querySelector("#custom");
    if (cu) {
      cu.setAttribute("lang", TT.active().lang);
      cu.value = drill;
      /* the draft is kept as it is typed: Esc or a menu key leaves this screen
         straight away, and the textarea is rebuilt from the in-memory drill, so
         only the persistence is deferred, not the value */
      cu.oninput = function () {
        drill = cu.value;
        clearTimeout(drillTimer);
        drillTimer = setTimeout(function () { save(K_DRILL, drill); }, 400);
      };
    }
    /* the defaults have to reach the live state too, not just the stored copy:
       setCourse() re-points TT.LESSONS and the layout, S.dur re-primes the
       duration radios, or Options ends up offering one course while the screens
       are still teaching another */
    view.querySelector("#resetopt").onclick = function () {
      opts = Object.assign({}, DEF_OPTS);
      saveOpts();
      S.dur = opts.testdur;
      setCourse(opts.course);
      go("options");
    };
    view.querySelector("#clr").onclick = function () {
      if (!confirm("Erase the records for the " + TT.active().name + " course?")) return;
      eraseCourse(); go("options");
    };
    view.querySelector("#godrill").onclick = function () {
      var txt = view.querySelector("#custom").value.trim();
      if (!txt) { sndErr(); return; }
      drill = txt;
      clearTimeout(drillTimer);
      save(K_DRILL, drill);
      go("session", drillItem());
    };
  }

  function help() {
    view.innerHTML =
      '<div class="page-head"><div><h1>Help</h1><p class="dim">How the course works, and the keys that drive it.</p></div></div>' +
      '<div class="cols"><div class="panel"><h3>How the course works</h3>' +
      "<p>Each lesson teaches one group of keys. Type the text exactly as shown. Characters brighten as you type them correctly; wrong characters are marked in red.</p>" +
      "<p>Wrong characters stay in the text until you press <kbd>Backspace</kbd> to erase them. A lesson is finished only when the text is complete and error free.</p>" +
      "<p>A lesson is passed at the required speed with 95% or better accuracy; passing unlocks the next lesson.</p>" +
      "<p>In a timed test the clock decides the end of the run. Speed is measured in words per minute: five correct characters equal one word.</p>" +
      '</div><div class="panel"><h3>Technique</h3>' +
      "<ul class=\"keys\"><li>Home position: <kbd>A S D F</kbd> and <kbd>J K L ;</kbd></li>" +
      "<li>The bumps on F and J sit under your index fingers</li>" +
      "<li>Never look at the keyboard</li>" +
      "<li>Use the pinky for the key nearest it</li>" +
      "<li>Return every finger to the home row after a reach</li>" +
      "<li>Shift is pressed by the opposite hand</li>" +
      "<li>Accuracy first - speed follows</li></ul>" +
      "</div></div>" +
      '<div class="panel"><h3>Thai course (Kedmanee)</h3>' +
      "<p>Switch course with the pill at the right of the menu bar, or in <b>Options</b>, then set the operating system keyboard to Thai (Thailand). The on-screen keyboard shows Kedmanee legends: the unshifted character large, the shifted character small.</p>" +
      "<p>Thai words are written without spaces; a space separates clauses only. Vowels that sit above, below, before or after a consonant are separate keystrokes - type them in reading order.</p>" +
      "<p>Thai digits ๐-๙ are Shift with the number row: ๐ on Shift+Q, ๑-๔ on Shift+2-5 and ๕-๙ on Shift+8-=. The 6 and 7 keys are ◌ุ/◌ู and ◌ึ/฿ instead. The marks ◌็ and ◌์ are Shift+H and Shift+N. Latin digits come from the numeric keypad.</p>" +
      "<p>You do not have to switch the operating system keyboard: pressing the US key at the same position is accepted too, so <kbd>a</kbd> <kbd>s</kbd> <kbd>d</kbd> <kbd>f</kbd> types <span class=\"hi\">ฟหกด</span>. Turn this off in Options if you want strict Thai input.</p>" +
      '<p class="dim">The interface, the menus and this help stay in English.</p></div>' +
      '<div class="panel"><h3>Keys</h3><ul class="keys">' +
      "<li><kbd>F1</kbd> help</li><li><kbd>F2</kbd> lesson menu</li><li><kbd>F3</kbd> timed tests</li>" +
      "<li><kbd>F4</kbd> progress report</li><li><kbd>F5</kbd> options</li>" +
      "<li><kbd>Esc</kbd> leave a lesson</li><li><kbd>F9</kbd> retry current lesson</li>" +
      "<li><kbd>F10</kbd> next lesson</li><li><kbd>F8</kbd> hide/show keyboard</li>" +
      "<li><kbd>Backspace</kbd> erase a wrong character</li></ul>" +
      '<p class="dim">The on-screen keyboard is clickable, so the course also works on tablets.</p></div>';
    renderMenu();
    renderHotkeys([["Esc", "menu"]]);
  }

  function applyOpts() {
    document.body.classList.toggle("crisp", !!opts.crisp);
    document.body.classList.toggle("no-kbd", !opts.kbd);
    document.body.classList.toggle("course-th", TT.courseId === "th");
  }
  function setCourse(id) {
    opts.course = id;
    saveOpts();
    TT.setCourse(id);
    S.sel = { lessons: 0, tests: 0 };
    applyOpts();
  }

  /* --------------------------------------------------------------- input */
  var TEXT_INPUT = /^(text|search|url|tel|email|password|number|date|time|datetime-local|month|week)$/i;
  document.addEventListener("keydown", function (e) {
    var el = e.target;
    var tag = (el && el.tagName) || "";
    /* only text-entry fields swallow the shortcuts; radios and checkboxes must not.
       The menu keys and Escape stay live inside a text field, or a typist who has
       just written a custom drill has no way off the Options screen without first
       clicking somewhere else. */
    var field = tag === "TEXTAREA" || (tag === "INPUT" && TEXT_INPUT.test((el.type || "text")));
    if (field && !/^(Escape|F[1-5])$/.test(e.key)) return;
    /* while an IME is composing, the keys belong to the IME - do not steal them */
    if (e.isComposing || e.keyCode === 229) return;

    if (S.session && !S.session.state.done) {
      /* Caps Lock silently turns every lowercase lesson into a wall of errors, and
         the typist usually cannot see it - say so on the status line instead of
         quietly accepting the wrong case. */
      S.caps = !!(e.getModifierState && e.getModifierState("CapsLock"));
      if (e.key === "Escape") { e.preventDefault(); go("lessons"); return; }
      if (e.key === "F9") { e.preventDefault(); go("session", S.session.state.item, S.limit || undefined); return; }
      if (e.key === "F10") { e.preventDefault(); nextLesson(); return; }
      if (e.key === "F8") { e.preventDefault(); opts.kbd = !opts.kbd; saveOpts(); applyOpts(); return; }
      if (e.key === "F1" || e.key === "F2" || e.key === "F3" || e.key === "F4" || e.key === "F5") {
        e.preventDefault();
        var map = { F1: "help", F2: "lessons", F3: "tests", F4: "progress", F5: "options" };
        go(map[e.key]);
        return;
      }
      if (S.session.handleKey(e)) { e.preventDefault(); return; }
      /* swallow bare printable keys so they never reach the page, but leave the
         browser shortcuts (copy, paste, select all, undo) alone */
      if (!e.ctrlKey && !e.metaKey && !e.altKey &&
          typeof e.key === "string" && e.key.length === 1) { e.preventDefault(); }
      return;
    }

    if (S.screen === "session" && S.session) {
      if (e.key === "F9") { e.preventDefault(); go("session", S.session.state.item, S.limit || undefined); return; }
      if (e.key === "F10") { e.preventDefault(); nextLesson(); return; }
      if (e.key === "F8") { e.preventDefault(); opts.kbd = !opts.kbd; saveOpts(); applyOpts(); return; }
    }
    if (e.key === "Escape") { e.preventDefault(); go("lessons"); return; }
    if (e.key === "F1") { e.preventDefault(); go("help"); return; }
    if (e.key === "F2") { e.preventDefault(); go("lessons"); return; }
    if (e.key === "F3") { e.preventDefault(); go("tests"); return; }
    if (e.key === "F4") { e.preventDefault(); go("progress"); return; }
    if (e.key === "F5") { e.preventDefault(); go("options"); return; }
    /* handled before the boot catch-all, which swallows every other key */
    if (S.screen === "boot") {
      e.preventDefault();
      startFromBoot();
      return;
    }
    var pick = S.screen === "tests" ? "tests" : "lessons";
    /* a focused control in the menu bar owns its own keys: Enter on the course
       pill has to switch course, not start the highlighted lesson */
    var inbar = !!(el.closest && el.closest(".menubar"));
    if (e.key === "Enter" && !inbar && (S.screen === "lessons" || S.screen === "tests")) {
      e.preventDefault();
      if (S.screen === "lessons") {
        if (!unlocked(S.sel.lessons)) { sndErr(); return; }
        go("session", TT.LESSONS[S.sel.lessons]);
      } else {
        startTest(TT.TESTS[S.sel.tests], dur());
      }
      return;
    }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !inbar && (S.screen === "lessons" || S.screen === "tests")) {
      e.preventDefault();
      var isTest = S.screen === "tests";
      var list = isTest ? TT.TESTS : TT.LESSONS;
      var d = e.key === "ArrowDown" ? 1 : -1;
      for (var i = 0; i < list.length; i++) {
        S.sel[pick] = (S.sel[pick] + d + list.length) % list.length;
        if (isTest || unlocked(S.sel[pick])) break;
      }
      go(S.screen);
    }
  });

  function nextLesson() {
    var cur = S.session && S.session.state.item;
    var i = cur ? lessonById(cur.id) : S.sel.lessons;
    /* past the last lesson there is nothing left to unlock - send the typist to
       the timed tests instead of restarting the lesson they are already on */
    if (i < 0 || i + 1 >= TT.LESSONS.length) { go("tests"); return; }
    /* F10 must not walk past the gate the lesson menu enforces: the next lesson
       only opens once the current one is actually passed */
    if (!unlocked(i + 1)) { sndErr(); return; }
    S.sel.lessons = i + 1;
    go("session", TT.LESSONS[S.sel.lessons]);
  }

  window.addEventListener("resize", function () { if (S.kbdEl && S.session && !S.session.state.done) updKbd(); });

  load();
  TT.setCourse(opts.course);
  applyOpts();
  initTheme();
  initCourseSwitch();
  boot();
})();
