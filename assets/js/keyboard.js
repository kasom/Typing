/* Typing Tutor - physical keyboard geometry, finger map and layout tables */
window.TT = window.TT || {};

TT.FINGERS = {
  lp: "Left pinky", lr: "Left ring", lm: "Left middle", li: "Left index",
  ri: "Right index", rm: "Right middle", rr: "Right ring", rp: "Right pinky",
  th: "Thumbs"
};

var HOME = "asdfjkl;".split("");

/* physical keys: [id, finger, width] - id is the US-ANSI base key, shared by every layout */
TT.PHYS_ROWS = [
  [["`","lp",1],["1","lp",1],["2","lr",1],["3","lm",1],["4","li",1],["5","li",1],
   ["6","ri",1],["7","ri",1],["8","rm",1],["9","rr",1],["0","rp",1],
   ["-","rp",1],["=","rp",1],["Back","rp",1.6]],
  [["Tab","lp",1.5],["q","lp",1],["w","lr",1],["e","lm",1],["r","li",1],["t","li",1],
   ["y","ri",1],["u","ri",1],["i","rm",1],["o","rr",1],["p","rp",1],
   ["[","rp",1],["]","rp",1],["\\","rp",1]],
  [["Caps","lp",1.8],["a","lp",1],["s","lr",1],["d","lm",1],["f","li",1],["g","li",1],
   ["h","ri",1],["j","ri",1],["k","rm",1],["l","rr",1],[";","rp",1],["'","rp",1],
   ["Enter","rp",1.6]],
  [["LShift","lp",2.2],["z","lp",1],["x","lr",1],["c","lm",1],["v","li",1],["b","li",1],
   ["n","ri",1],["m","ri",1],[",","rp",1],[".","rp",1],["/","rp",1],
   ["RShift","rp",2.2]],
  [["LCtrl","lp",1.3],["LAlt","lp",1.3],["Space","th",7.5],["RAlt","rp",1.3],["RCtrl","rp",1.3]]
];

/* layout tables: physical key -> [unshifted, shifted] */
TT.LAYOUTS = {
  us: {
    name: "United States (QWERTY)",
    short: "QWERTY",
    lang: "en",
    note: "Standard ANSI QWERTY",
    map: (function () {
      var m = {
        "`": ["`", "~"], "1": ["1", "!"], "2": ["2", "@"], "3": ["3", "#"], "4": ["4", "$"],
        "5": ["5", "%"], "6": ["6", "^"], "7": ["7", "&"], "8": ["8", "*"], "9": ["9", "("],
        "0": ["0", ")"], "-": ["-", "_"], "=": ["=", "+"], "[": ["[", "{"], "]": ["]", "}"],
        "\\": ["\\", "|"], ";": [";", ":"], "'": ["'", "\""], ",": [",", "<"], ".": [".", ">"],
        "/": ["/", "?"]
      };
      "abcdefghijklmnopqrstuvwxyz".split("").forEach(function (c) { m[c] = [c, c.toUpperCase()]; });
      return m;
    })()
  },

  /* Kedmanee - Thai national standard (TIS 62 / TIS 820), as in xkeyboard-config "th(basic)" */
  th: {
    name: "Thailand (Kedmanee)",
    short: "KEDMANEE",
    lang: "th",
    note: "Kedmanee, TIS 820.2538. Shift on the number row gives Thai digits ๐-๙",
    map: {
      "`": ["_", "%"], "1": ["ๅ", "+"], "2": ["/", "๑"], "3": ["-", "๒"], "4": ["ภ", "๓"],
      "5": ["ถ", "๔"], "6": ["ุ", "ู"], "7": ["ึ", "฿"], "8": ["ค", "๕"], "9": ["ต", "๖"],
      "0": ["จ", "๗"], "-": ["ข", "๘"], "=": ["ช", "๙"],
      "q": ["ๆ", "๐"], "w": ["ไ", "\""], "e": ["ำ", "ฎ"], "r": ["พ", "ฑ"], "t": ["ะ", "ธ"],
      "y": ["ั", "ํ"], "u": ["ี", "๊"], "i": ["ร", "ณ"], "o": ["น", "ฯ"], "p": ["ย", "ญ"],
      "[": ["บ", "ฐ"], "]": ["ล", ","], "\\": ["ฃ", "ฅ"],
      "a": ["ฟ", "ฤ"], "s": ["ห", "ฆ"], "d": ["ก", "ฏ"], "f": ["ด", "โ"], "g": ["เ", "ฌ"],
      "h": ["้", "็"], "j": ["่", "๋"], "k": ["า", "ษ"], "l": ["ส", "ศ"], ";": ["ว", "ซ"],
      "'": ["ง", "."],
      "z": ["ผ", "("], "x": ["ป", ")"], "c": ["แ", "ฉ"], "v": ["อ", "ฮ"], "b": ["ิ", "ฺ"],
      "n": ["ื", "์"], "m": ["ท", "?"], ",": ["ม", "ฒ"], ".": ["ใ", "ฬ"], "/": ["ฝ", "ฦ"]
    }
  }
};

/* the numeric keypad: the only way to reach Latin digits on a Kedmanee keyboard */
TT.NUMPAD_ROWS = [
  [["Numpad7", "7"], ["Numpad8", "8"], ["Numpad9", "9"]],
  [["Numpad4", "4"], ["Numpad5", "5"], ["Numpad6", "6"]],
  [["Numpad1", "1"], ["Numpad2", "2"], ["Numpad3", "3"]],
  [["Numpad0", "0", 2]]
];

TT.layout = TT.LAYOUTS.us;
var CHAR_MAP = {};

TT.setLayout = function (id) {
  TT.layout = TT.LAYOUTS[id] || TT.LAYOUTS.us;
  CHAR_MAP = {};
  var m = TT.layout.map;
  for (var phys in m) {
    if (!m.hasOwnProperty(phys)) continue;
    CHAR_MAP[m[phys][0]] = { key: phys, shift: false, finger: TT.fingerFor(phys) };
    if (m[phys][1] !== m[phys][0]) {
      CHAR_MAP[m[phys][1]] = { key: phys, shift: true, finger: TT.fingerFor(phys) };
    }
  }
  return TT.layout;
};

/* resolve a character to the physical key that produces it on the active layout */
TT.keyForChar = function (ch) {
  if (ch === " ") return { key: "Space", shift: false, finger: "th" };
  if (ch === "\n") return { key: "Enter", shift: false, finger: "rp" };
  if (ch === "\t") return { key: "Tab", shift: false, finger: "lp" };
  var hit = CHAR_MAP[ch];
  if (hit) return hit;
  /* Latin digits are not printed on a Thai Kedmanee keyboard - they come from the numeric keypad */
  if (/^[0-9]$/.test(ch) && !CHAR_MAP[ch]) {
    return { key: "Numpad" + ch, shift: false, finger: "rp", numpad: true };
  }
  var low = TT.LAYOUTS.us.map[ch.toLowerCase()] ? ch.toLowerCase() : null;
  if (low) return { key: low, shift: ch !== ch.toLowerCase(), finger: TT.fingerFor(low) };
  return { key: ch, shift: false, finger: TT.fingerFor(ch) };
};

/* true when the active layout cannot produce Latin digits, so the keypad is needed */
TT.needsNumpad = function () {
  for (var d = 0; d <= 9; d++) if (!CHAR_MAP[String(d)]) return true;
  return false;
};

/*
 * Characters accepted in place of `ch` because they sit on the same physical key
 * of the US layout. With the Thai course active this lets a typist working on a
 * US-set keyboard type "asdf" where the lesson shows "ฟหกด".
 */
TT.altChars = function (ch) {
  if (TT.layout === TT.LAYOUTS.us) return [];
  var n = TT.keyForChar(ch);
  if (!n || n.numpad || !n.key || n.key.length !== 1) return [];
  var pair = TT.layout.map[n.key], us = TT.LAYOUTS.us.map[n.key];
  if (!pair || !us) return [];
  var i = n.shift ? 1 : 0, out = [];
  if (us[i] && us[i] !== ch) out.push(us[i]);
  if (pair[i] && pair[i] !== ch) out.push(pair[i]);
  return out;
};

var FINGER_OF = {};
(function () {
  for (var r = 0; r < TT.PHYS_ROWS.length; r++)
    for (var i = 0; i < TT.PHYS_ROWS[r].length; i++)
      FINGER_OF[TT.PHYS_ROWS[r][i][0]] = TT.PHYS_ROWS[r][i][1];
})();
TT.fingerFor = function (phys) { return FINGER_OF[phys] || null; };
TT.isHome = function (phys) { return HOME.indexOf(phys) >= 0; };

var SPECIAL = { Back: "Backspace", Tab: "Tab", Caps: "CapsLock", LShift: "Shift",
  RShift: "Shift", Enter: "Enter", Space: "Space", LCtrl: "Ctrl", RCtrl: "Ctrl",
  LAlt: "Alt", RAlt: "Alt" };

/* build the on-screen keyboard for the active layout */
TT.renderKeyboard = function (host) {
  /* one key cap, registered on the host so it can be highlighted later */
  function keyCap(phys, finger, pair) {
    var k = document.createElement("div");
    k.className = "key" + (TT.isHome(phys) ? " homerow" : "");
    k.dataset.key = phys;
    k.dataset.f = finger;
    if (pair) {
      k.dataset.plain = pair[0];
      k.dataset.shift = pair[1];
      k.textContent = pair[0];
      if (pair[1] !== pair[0]) {
        var s = document.createElement("small");
        s.textContent = pair[1];
        k.insertBefore(s, k.firstChild);
      }
    } else {
      k.textContent = SPECIAL[phys] || phys;
    }
    host._keys[phys] = k;
    return k;
  }

  host.innerHTML = "";
  host._keys = {};
  /* a visual aid that duplicates the physical keyboard. It stays out of the
     accessibility tree on purpose: the real keystrokes already drive the session,
     so exposing 60+ clickable keys would only add noise and a tab-trap for
     keyboard/AT users. On touch tablets the keys still work by tap, which is the
     input this aid exists for. */
  host.setAttribute("aria-hidden", "true");
  var kbd = document.createElement("div");
  kbd.className = "kbd";
  for (var r = 0; r < TT.PHYS_ROWS.length; r++) {
    var row = document.createElement("div");
    row.className = "row";
    for (var i = 0; i < TT.PHYS_ROWS[r].length; i++) {
      var spec = TT.PHYS_ROWS[r][i];
      var k = keyCap(spec[0], spec[1], TT.layout.map[spec[0]]);
      k.style.flexGrow = spec[2];
      row.appendChild(k);
    }
    kbd.appendChild(row);
  }
  if (TT.needsNumpad()) {
    var np = document.createElement("div");
    np.className = "numpad";
    var label = document.createElement("span");
    label.className = "np-cap";
    label.textContent = "numeric keypad";
    np.appendChild(label);
    for (var n = 0; n < TT.NUMPAD_ROWS.length; n++) {
      var nrow = document.createElement("div");
      nrow.className = "np-row";
      for (var j = 0; j < TT.NUMPAD_ROWS[n].length; j++) {
        var ns = TT.NUMPAD_ROWS[n][j];
        var nk = keyCap(ns[0], "rp", [ns[1], ns[1]]);
        if (ns[2]) nk.style.flexGrow = ns[2];
        nrow.appendChild(nk);
      }
      np.appendChild(nrow);
    }
    kbd.appendChild(np);
  }
  host.appendChild(kbd);
  return kbd;
};

/* build the character map for the default layout */
TT.setLayout("us");
