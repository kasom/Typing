/* Typing Tutor - typing engine: validation, error handling, statistics */
window.TT = window.TT || {};

var EQUIV = {
  "\u2018": "'", "\u2019": "'", "\u201C": "\"", "\u201D": "\"",
  "\u2013": "-", "\u2014": "-", "\u00A0": " ", "\u2026": "."
};

function norm(s) {
  try { return s.normalize("NFC"); } catch (e) { return s; }
}

function same(a, b) {
  if (a === b) return true;
  var x = EQUIV[a] || a, y = EQUIV[b] || b;
  if (x === y) return true;
  return norm(x) === norm(y);
}

TT.createSession = function (item, container, opts) {
  opts = opts || {};
  var hooks = opts.hooks || {};
  var strict = opts.strict !== false;
  var allowAlt = opts.altkeys !== false;
  var chars = Array.from(item.text);
  var nodes = [];
  var groups = [];

  var st = {
    item: item,
    typed: new Array(chars.length).fill(null),
    pos: 0,
    keystrokes: 0,
    errors: 0,
    startedAt: 0,
    endedAt: 0,
    done: false,
    strict: strict,
    total: chars.length
  };

/*
 * Thai shaping rules that matter for display:
 *  - a dependent mark (วรรณยุกต์ and the above/below vowels) sits on the base
 *    character in front of it
 *  - a mark with no base before it in the same run - including one that follows
 *    a pre-vowel such as เ แ โ ใ ไ - is shown on a dotted circle so it stays
 *    readable. `hostable` only turns true on a base character, which is what
 *    implements that rule.
 * ะ (U+0E30) and า (U+0E32) are spacing vowels (category Lo), not marks, so they
 * are bases like any consonant or Latin letter: a browser draws them, and the
 * mark after them, without a circle.
 * The carrier is display only - it is never part of the typed text.
 *
 * A base and the marks that hang off it have to be drawn from one text node.
 * The shaper attaches a mark to the base it finds in the same run, so a mark
 * left in a span of its own is shaped with nothing under it: it lands on the
 * following letter, and the letters around it are pushed apart. That is only
 * visible once typing starts, because a mark and its base are only split when
 * the two get different styles - which is exactly what the done/err classes do.
 * So the display unit is the cluster, never the code point: `groups` records the
 * code points each element renders, and the typed state of a cluster is the
 * state of its worst member.
 */
var MARK = /[\u0E31\u0E34-\u0E3A\u0E33\u0E47-\u0E4E]/;
var LEAD = /[\u0E40-\u0E45]/;
var SPACE = /\s/;

  /* one element renders the code points [from,to); `caret` is the element the
     cursor block is drawn on when the position falls inside the range */
  function bind(from, to, el, els, caret) {
    for (var n = from; n < to; n++) nodes[n] = el;
    groups.push({ from: from, to: to, els: els || [el], caret: caret || el });
  }

  function textOf(from, to) {
    var s = "";
    for (var n = from; n < to; n++) s += chars[n];
    return s;
  }

  function build() {
    container.innerHTML = "";
    nodes = [];
    groups = [];
    var i = 0;
    while (i < chars.length) {
      if (SPACE.test(chars[i])) {
        /* a line break has no inline box of its own, so an error on it - the usual
           result of typing a space or a letter where Enter belongs - lands on a
           zero-width span and shows nothing. Give it a visible carrier, the same
           trick an unhosted Thai mark uses, and let that carry the colouring. */
        var brk = null;
        if (chars[i] === "\n") {
          brk = document.createElement("span");
          brk.className = "carrier brk";
          brk.dataset.base = "carrier brk";
          brk.textContent = "\u21B5";
          container.appendChild(brk);
        }
        var sp = document.createElement("span");
        sp.textContent = chars[i];
        container.appendChild(sp);
        bind(i, i + 1, sp, brk ? [sp, brk] : [sp], brk || sp);
        i++;
        continue;
      }
      var start = i;
      while (i < chars.length && !SPACE.test(chars[i])) i++;
      /* the run groups one word's clusters so they stay inline together; each
         cluster still gets its own span so it can be coloured and carry the
         cursor. The run carries no class - line breaking is left to the browser,
         because a nowrap wrapper would strand a long Thai clause off-screen */
      var run = document.createElement("span");
      container.appendChild(run);
      var hostable = false;
      var j = start;
      while (j < i) {
        var end;
        if (MARK.test(chars[j]) && !hostable) {
          end = j;
          while (end < i && MARK.test(chars[end])) end++;
          /* the circle is the base the marks attach to, so it goes in front of
             them inside the same element rather than in a carrier of its own */
          var carrier = document.createElement("span");
          carrier.className = "carrier";
          carrier.dataset.base = "carrier";
          carrier.textContent = "\u25CC" + textOf(j, end);
          run.appendChild(carrier);
          bind(j, end, carrier);
          j = end;
          continue;
        }
        hostable = !MARK.test(chars[j]) && !LEAD.test(chars[j]);
        end = j + 1;
        /* a pre-vowel is not a base: the mark after it belongs to the next
           consonant, and with none coming it goes on a circle instead */
        if (hostable) while (end < i && MARK.test(chars[end])) end++;
        var cl = document.createElement("span");
        cl.textContent = textOf(j, end);
        run.appendChild(cl);
        bind(j, end, cl);
        j = end;
      }
    }
    paint();
  }

  /* a cluster is only finished when every code point in it is, and one wrong
     code point colours the whole of it: the marks have no box of their own to
     put a mistake on */
  function groupClass(g) {
    var wrong = false, all = true;
    for (var n = g.from; n < g.to; n++) {
      if (st.typed[n] === false) wrong = true;
      if (st.typed[n] !== true) all = false;
    }
    return wrong ? "err" : (all ? "done" : "");
  }

  function paint() {
    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g], cls = groupClass(grp);
      /* the caret belongs to the code point at the position, but it can only be
         drawn on the cluster: a mark has no advance width, so a position inside
         the cluster is the right-hand edge of the base that is already there */
      var at = "";
      if (!st.done && st.pos >= grp.from && st.pos < grp.to)
        at = st.pos === grp.from ? " cur" : " cur right";
      for (var e = 0; e < grp.els.length; e++) {
        var el = grp.els[e];
        /* a carrier keeps the base classes it was built with - the dotted circle and
           the paragraph mark are not styled the same way */
        el.className = (el.dataset.base || "") + (cls ? " " + cls : "") +
          (el === grp.caret ? at : "");
      }
    }
    container.classList.toggle("danger", strict && badLeft() > 0);
    scrollToCur();
  }

  /* scrolling on every keystroke is expensive and fights the reader's eye, so
     only move the passage when the cursor has actually left the visible box */
  function scrollToCur() {
    var cur = nodes[Math.min(st.pos, chars.length - 1)];
    if (!cur || !cur.getBoundingClientRect || !cur.scrollIntoView) return;
    if (container.getBoundingClientRect) {
      var b = cur.getBoundingClientRect(), v = container.getBoundingClientRect();
      if (b.top >= v.top && b.bottom <= v.bottom && b.left >= v.left && b.right <= v.right) return;
    }
    try { cur.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) { cur.scrollIntoView(false); }
  }

  function badLeft() {
    var n = 0;
    for (var i = 0; i < st.typed.length; i++) if (st.typed[i] === false) n++;
    return n;
  }

  function stats() {
    var now = st.endedAt || Date.now();
    var ms = st.startedAt ? now - st.startedAt : 0;
    var min = ms / 60000;
    var live = min > 0;
    var correct = 0;
    for (var i = 0; i < st.typed.length; i++) if (st.typed[i] === true) correct++;
    return {
      wpm: live ? Math.round(correct / 5 / min * 10) / 10 : 0,
      cpm: live ? Math.round(correct / min) : 0,
      raw: live ? Math.round((st.keystrokes / 5) / min * 10) / 10 : 0,
      acc: st.keystrokes ? Math.round((st.keystrokes - st.errors) / st.keystrokes * 1000) / 10 : 100,
      errors: st.errors,
      keystrokes: st.keystrokes,
      correct: correct,
      badLeft: badLeft(),
      seconds: Math.round(ms / 1000),
      pct: chars.length ? Math.round(st.pos / chars.length * 100) : 0,
      done: st.done
    };
  }

  /* `at` pins the end of a timed run to its deadline instead of the moment the
     status interval happens to notice, which keeps the scored duration exact. */
  function finish(at) {
    if (st.done) return;
    st.done = true;
    st.endedAt = at || Date.now();
    paint();
    if (hooks.onComplete) hooks.onComplete(stats());
  }

  function checkDone() {
    if (st.pos === chars.length && (badLeft() === 0 || !strict)) finish();
  }

  /* `code` is the DOM KeyboardEvent.code of the key that produced `ch`, when there
     was one. It lets the caller light up the real key rather than guessing at it
     from the character, which matters once a layout or an alt-key mapping is in
     the way. Virtual-keyboard clicks have no code and fall back to the guess. */
  function type(ch, code) {
    if (!st.startedAt) {
      st.startedAt = Date.now();
      if (hooks.onStart) hooks.onStart();
    }
    var expected = chars[st.pos];
    var viaAlt = false;
    var ok = same(ch, expected);
    if (!ok && allowAlt && TT.altChars) {
      ok = TT.altChars(expected).indexOf(ch) >= 0;
      viaAlt = ok;
    }
    st.typed[st.pos] = ok;
    st.pos++;
    st.keystrokes++;
    if (!ok) st.errors++;
    paint();
    if (hooks.onKey) hooks.onKey({ ch: ch, code: code, expected: expected, ok: ok, alt: viaAlt, stats: stats() });
    checkDone();
  }

  function backspace(code) {
    /* a finished run is a scored record: editing it afterwards would redraw the
       cursor into a passage the typist can no longer change */
    if (st.done || st.pos === 0) return false;
    st.typed[st.pos - 1] = null;
    st.pos--;
    paint();
    if (hooks.onKey) hooks.onKey({ ch: null, code: code || "Backspace", expected: chars[st.pos], ok: true, back: true, stats: stats() });
    return true;
  }

  /* returns true when the event was consumed by the session */
  function handleKey(ev) {
    if (st.done) return false;
    /* Ctrl or Cmd means a browser shortcut. AltGr is reported as Ctrl+Alt on
       Windows and Linux but does produce a character, so only treat the pair as
       a modifier when there is nothing to type. */
    var altGr = ev.altKey && (ev.ctrlKey || ev.metaKey);
    var printable = typeof ev.key === "string" && ev.key.length === 1;
    if ((ev.ctrlKey || ev.metaKey) && !(altGr && printable)) return false;
    /* an in-progress IME composition has not produced a character yet - the
     * composed text arrives as a single input event we do not handle */
    if (ev.isComposing || ev.keyCode === 229) return false;
    var k = ev.key, code = ev.code;
    if (k === "Backspace") { backspace(code); return true; }
    if (st.pos >= chars.length) return false;
    if (k === "Enter") {
      /* Enter is a keystroke like any other: scoring it against the expected
         character is what tells the typist they ended the line early. Swallowing
         it here left the mistake completely invisible. */
      if (!ev.repeat) type("\n", code);
      return true;
    }
    if (k === "Tab") {
      if (chars[st.pos] === "\t") { if (!ev.repeat) type("\t", code); return true; }
      return false;
    }
    if (typeof k === "string" && k.length === 1) {
      /* key auto-repeat is swallowed but never scored: holding a key down
         would otherwise fill the passage with phantom errors */
      if (!ev.repeat) type(k, code);
      return true;
    }
    return false;
  }

  function next() {
    if (st.pos >= chars.length) return null;
    return TT.keyForChar(chars[st.pos]);
  }

  build();

  return {
    state: st,
    handleKey: handleKey,
    inject: function (ch) { if (!st.done && st.pos < chars.length) type(ch); },
    backspace: backspace,
    next: next,
    charAt: function (i) { return chars[i]; },
    stats: stats,
    finish: finish
  };
};
