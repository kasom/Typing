/* Typing Tutor - controller view: a gamepad diagram that replaces the
 * on-screen keyboard. It is driven by TT.PADMAPS (assets/js/padmap.js), the
 * same layout the JK / PadMapper app uses to type with a gamepad:
 *
 *   hold a combo of LB/RB/LT/RT (a "row"), tap A B X Y Start Guide,
 *   L3 = Shift, D-pad = Backspace Esc Space Enter.
 *
 * The controller itself never talks to this page - JK injects real keystrokes
 * into the browser - so the pad is a visual aid plus a clickable aid, exactly
 * like the keyboard. It shows the row the NEXT character lives in, marks the
 * buttons to hold and the face to tap, and flashes the slot a typed key came
 * from. */
window.TT = window.TT || {};

(function () {
  "use strict";

  /* the six tap-targets, in the profile's table order */
  var FACES = ["south", "east", "west", "north", "start", "guide"];
  var FACE_NAME = { south: "A", east: "B", west: "X", north: "Y", start: "Start", guide: "Guide" };
  /* buttons held to select a row (plus the L3-Shift role, shown in captions) */
  var HOLD_NAME = {
    "left-shoulder": "LB", "right-shoulder": "RB",
    "left-trigger": "LT", "right-trigger": "RT", "left-thumb": "L3"
  };
  var DPAD_NAME = {
    "d-pad-up": "D-pad ↑", "d-pad-down": "D-pad ↓",
    "d-pad-left": "D-pad ←", "d-pad-right": "D-pad →"
  };
  var FIXED_NAME = { "left-thumb": "L3", "right-thumb": "R3", back: "Back", misc1: "Misc1" };

  /* keys with no printed character get a fixed glyph on the button */
  var KEY_LABEL = {
    Back: "⌫", Enter: "⏎", Space: "␣", Esc: "Esc", Tab: "Tab",
    Del: "Del", Ins: "Ins", LShift: "⇧", RShift: "⇧",
    LCtrl: "Ctrl", RCtrl: "Ctrl", LAlt: "Alt", RAlt: "Alt"
  };
  /* what a click on a slot holding this key injects (text keys only) */
  var TYPE_AS = { Space: " ", Enter: "\n", Tab: "\t" };

  function nameOf(btn) {
    return FACE_NAME[btn] || HOLD_NAME[btn] || DPAD_NAME[btn] || FIXED_NAME[btn] || btn;
  }

  /* the map for a course, or null when there is none (padview then falls back
     to the keyboard - see app.js applyOpts). A course without its own PADMAPS
     entry may borrow one: gamepad courses declare pad: "en" / "th". */
  TT.padFor = function (courseId) {
    var maps = TT.PADMAPS || {};
    var m = maps[courseId];
    if (!m) {
      var c = (TT.COURSES || {})[courseId];
      if (c && c.pad) m = maps[c.pad];
    }
    return m && m.slots && m.slots.length ? m : null;
  };

  /* build the diagram in host; actions = {type(ch), backspace()} for clicks.
     Returns {el, setNext, flash, hint, clear} or null when the course has no map. */
  TT.buildPad = function (host, courseId, actions) {
    var map = TT.padFor(courseId);
    if (!map) return null;
    var course = TT.COURSES[courseId] || TT.active();
    var layout = TT.LAYOUTS[(course && course.layout) || "us"] || TT.LAYOUTS.us;

    /* slot indexes: by grid position, by printed physical key, by key+Shift */
    var slotOf = {}, byPhys = {}, byPhysShift = {};
    map.slots.forEach(function (s) {
      slotOf[s.btn + "|" + s.mods.join("+")] = s;
      if (!s.phys) return;
      (byPhys[s.phys] = byPhys[s.phys] || []).push(s);
      byPhysShift[s.phys + "|" + (s.shift ? 1 : 0)] = s;
    });

    function el(cls, txt) {
      var e = document.createElement("div");
      e.className = cls;
      if (txt != null) e.textContent = txt;
      return e;
    }

    /* what one slot prints on its button, in the course's layout:
       Kedmanee resolves the physical key + the profile's own Shift flag, US
       resolves it unshifted - capitals come from L3, never from the slot */
    function charOf(s) {
      if (!s) return "·";
      if (s.mouse) return "Click";
      if (KEY_LABEL[s.phys]) return KEY_LABEL[s.phys];
      var pair = layout.map[s.phys];
      if (pair) return pair[s.shift ? 1 : 0];
      return (s.key || s.btn).toUpperCase();
    }
    function injectable(s) {
      if (!s || s.mouse) return null;
      if (TYPE_AS[s.phys] != null) return TYPE_AS[s.phys];
      var pair = layout.map[s.phys];
      if (pair && !KEY_LABEL[s.phys]) return pair[s.shift ? 1 : 0];
      return null;
    }

    /* ---- skeleton: one .pbtn per gamepad button, placed by CSS on data-btn */
    host.innerHTML = "";
    /* the same reasoning as the keyboard's: the real input is the pad's
       injected keystrokes; this is a visual (and touch) aid, not a widget */
    host.setAttribute("aria-hidden", "true");
    var pad = el("pad");
    pad.appendChild(el("pad-shell"));

    var els = {};
    function btn(btnId, cls, chText, nmText) {
      var b = el("pbtn " + cls);
      b.dataset.btn = btnId;
      b.appendChild(el("ch", chText == null ? "" : chText));
      b.appendChild(el("nm", nmText));
      pad.appendChild(b);
      els[btnId] = b;
      return b;
    }
    function roleSlot(btnId) { /* the bare (no combo) binding of a fixed button */
      return slotOf[btnId + "|"];
    }

    btn("left-trigger", "trig", null, "LT");
    btn("right-trigger", "trig", null, "RT");
    btn("left-shoulder", "shldr", null, "LB");
    btn("right-shoulder", "shldr", null, "RB");
    btn("back", "mini", charOf(roleSlot("back")) || "·", "Back");
    btn("misc1", "mini", charOf(roleSlot("misc1")) || "·", "Misc1");
    btn("guide", "face", null, "Guide");
    btn("start", "face", null, "Start");
    FACES.forEach(function (f) {
      if (!els[f]) btn(f, "face", null, FACE_NAME[f]);
    });
    btn("left-thumb", "stick", charOf(roleSlot("left-thumb")) || "⇧", "L3");
    btn("right-thumb", "stick", charOf(roleSlot("right-thumb")) || "Click", "R3");
    [["d-pad-up", "▲"], ["d-pad-down", "▼"], ["d-pad-left", "◀"], ["d-pad-right", "▶"]]
      .forEach(function (d) {
        btn(d[0], "dpad", charOf(roleSlot(d[0])) || "·", d[1]);
      });

    var layerLine = el("pad-layer", "Base row · hold nothing");

    /* face clicks tap the character they currently show; D-pad ← erases.
       Like the keyboard click, a tap types what the lesson expects: the
       capital when the slot's small letter sits under L3, the alt-key when
       that is what is wanted. */
    function tapSlot(s) {
      if (!actions || !actions.type) return;
      var ch = injectable(s);
      if (ch == null) return;
      var w = actions.want ? actions.want() : null;
      if (typeof w === "string" && w.length === 1 && ch.length === 1 &&
          w !== ch && w.toUpperCase() === ch.toUpperCase()) ch = w;
      actions.type(ch);
    }
    FACES.forEach(function (b) {
      els[b].onclick = function () { tapSlot(slotOf[b + "|" + curMods]); };
    });
    ["d-pad-right", "d-pad-down"].forEach(function (b) {
      els[b].onclick = function () { tapSlot(roleSlot(b)); };
    });
    els["d-pad-left"].onclick = function () {
      if (actions && actions.backspace) actions.backspace();
    };

    host.appendChild(pad);
    host.appendChild(layerLine);

    /* ---- dynamic state: which row is shown, which buttons are lit */
    var curMods = "";
    function setRow(modsKey) {
      curMods = modsKey;
      FACES.forEach(function (f) {
        els[f].firstChild.textContent = charOf(slotOf[f + "|" + modsKey]);
      });
      var held = modsKey ? modsKey.split("+").map(nameOf) : [];
      layerLine.textContent = held.length
        ? "Row: hold " + held.join(" + ") + " with your fingers"
        : "Base row · no buttons held";
    }
    function clearNext() {
      pad.querySelectorAll(".next").forEach(function (e) { e.classList.remove("next"); });
    }

    /* the slot that types ch: the profile's own Shift flag wins (Kedmanee
       characters); otherwise an unshifted slot plus an external L3 hold (the
       capitals and shifted symbols of the English profile) */
    function resolve(ch) {
      var n = TT.keyForChar(ch);
      if (!n || n.numpad) return null;
      var s = byPhysShift[n.key + "|" + (n.shift ? 1 : 0)];
      if (s) return { slot: s, extShift: false };
      s = byPhysShift[n.key + "|0"];
      return s ? { slot: s, extShift: !!n.shift } : null;
    }

    function setNext(ch) {
      clearNext();
      if (!ch) { setRow(""); return; }
      var r = resolve(ch);
      if (!r) { setRow(""); layerLine.textContent = "No gamepad key for this character"; return; }
      setRow(r.slot.mods.join("+"));
      r.slot.mods.forEach(function (m) { if (els[m]) els[m].classList.add("next"); });
      if (els[r.slot.btn]) els[r.slot.btn].classList.add("next");
      if (r.extShift && els["left-thumb"]) els["left-thumb"].classList.add("next");
      if (r.extShift) layerLine.textContent += " · hold L3 (⇧) too";
    }

    function flash(physId, ok) {
      var hit = ok ? "hit" : "miss";
      var slots = byPhys[physId] || [];
      if (!slots.length) return;
      slots.forEach(function (s) {
        var targets = [s.btn].concat(s.mods);
        targets.forEach(function (t) {
          var e = els[t];
          if (!e) return;
          e.classList.add(hit);
          setTimeout(function () { e.classList.remove(hit); }, 150);
        });
      });
    }

    function hint(ch) {
      var r = resolve(ch);
      if (!r) return null;
      var mods = r.slot.mods.map(nameOf);
      if (r.extShift) mods.unshift(nameOf("left-thumb"));
      return (mods.length ? "hold " + mods.join(" + ") + ", then tap " : "tap ") +
        (DPAD_NAME[r.slot.btn] || nameOf(r.slot.btn));
    }

    function clear() {
      clearNext();
      setRow("");
    }

    setRow("");
    return { el: pad, setNext: setNext, flash: flash, hint: hint, clear: clear };
  };
})();
