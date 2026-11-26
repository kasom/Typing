# Typing Tutor

A touch-typing tutor that runs entirely in the browser. No build step, no
dependencies, no framework — just static HTML, CSS and vanilla JavaScript you
can open directly or drop on any web server.

It ships with two full courses — **English (QWERTY)** and **Thai (Kedmanee)** —
each with progressive lessons and timed tests, a custom-drill editor, an
on-screen keyboard with per-finger colours, live WPM/accuracy stats, and a
progress report. Everything (settings, best scores and history) is stored
locally in your browser via `localStorage`; nothing is sent anywhere.

## Features

- **Four courses** — English on QWERTY and Thai on Kedmanee (TIS 820), plus
  **Gamepad English** and **Gamepad ไทย**, which teach the same alphabets in
  the gamepad grid's order (tap row first, one held row per lesson). Switch
  from the menu-bar pill or in Options; records are kept per course.
- **10 English lessons, 13 Thai lessons, 8 + 10 gamepad lessons, 4 timed
  tests per course** — a lesson unlocks the next one once you hit its target
  speed at its target accuracy or better (every lesson in the shipped course
  data asks for 95%).
- **On-screen keyboard** — colour-coded by finger, highlights the next key to
  press, lights up the physical key you actually hit, and is clickable so the
  course also works on tablets.
- **Controller view (optional)** — replaces the keyboard with a gamepad
  diagram built from the [JK / PadMapper](../JK) typing profiles: see which
  LB/RB/LT/RT combo to hold and which of A B X Y Start Guide to tap for the
  next character. See [Gamepad typing](#gamepad-typing-controller-view) below.
- **Live scoring** — WPM, net CPM, raw speed, accuracy, error count, elapsed /
  remaining time and percent complete, updated as you type. Time spent with the
  browser tab hidden is handed back to the run, so switching away mid-test does
  not cost you the clock.
- **Thai-aware rendering** — dependent marks are shaped into clusters with a
  dotted-circle carrier so above/below/before vowels stay readable, and Thai
  digits map to the correct Kedmanee keys.
- **Alt-keys** — on the Thai course you can press the US key in the same physical
  position (e.g. `asdf` types `ฟหกด`), so no OS keyboard switch is required.
- **Strict mode** — wrong characters stay in the text and must be erased with
  Backspace before a lesson can be completed.
- **Custom drills** — paste any text and practise it (no pass target, but your best
  speed on it is recorded). Each course keeps its own drill text, matching the way
  records are kept per course.
- **Dark / light theme** — follows your OS preference by default and can be
  overridden; applied before first paint to avoid a flash.
- **Sound feedback** — subtle key-click, error and completion tones synthesised
  with the Web Audio API (no audio files).
- **Caps-Lock and IME aware** — warns when Caps Lock is on and leaves the keys
  alone while an input method is composing.

## Getting started

Because there is no build step, you can simply open `index.html` in a browser.
For the most faithful experience (and reliable `localStorage`), serve the folder
over HTTP:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then visit <http://localhost:8000>.

> **Thai course:** set your operating-system keyboard to *Thai (Thailand)* to
> type Kedmanee directly, or leave it on US and rely on alt-keys (see above).

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `F1` | Help |
| `F2` | Lesson menu |
| `F3` | Timed tests |
| `F4` | Progress report |
| `F5` | Options |
| `Esc` | Leave a lesson / return to menu |
| `F8` | Show / hide the on-screen keyboard |
| `F7` | Toggle the gamepad controller view |
| `F9` | Retry the current exercise |
| `F10` | Next lesson |
| `Backspace` | Erase a wrong character |
| `↑` `↓` | Move the selection in the lesson / test list |
| `Enter` | Start the selected lesson or test |

## How scoring works

Speed is measured in words per minute, where **five correct characters equal one
word**. Accuracy is `(keystrokes − errors) / keystrokes`. A run shorter than 20
keystrokes still appears in the history but is never recorded as a best, so a
couple of lucky keystrokes can't post a flawless score. For a lesson, the best
WPM and its matching accuracy always come from the same run.

## Gamepad typing (controller view)

The sibling [JK](../JK) project (PadMapper) turns any standard-layout gamepad
into a keyboard: hold a combo of **LB / RB / LT / RT** to pick a row, then tap
**A B X Y Start Guide** with the right thumb; **L3** is Shift and the D-pad is
Backspace / Esc / Space / Enter. Since that app injects real keystrokes, this
tutor scores pad input exactly like typing — the controller view just shows
you where every character lives on the pad.

Turn it on in **Options** or with **`F7`**: the on-screen keyboard is replaced
by a gamepad diagram. It always shows the row the *next* character is in,
marks the buttons you must hold, pulses the face key to tap (plus L3 for
capitals and shifted symbols), and flashes the slot every typed key came
from. The English course drives the `Typing` profile, the Thai course drives
`Typing_TH` (Kedmanee legends resolved through the app's own layout table,
including the profile's internal Shift).

### Pad-first courses

`asdf`-style home-row ordering is meaningless on a pad, so two extra courses
teach the grid in effort order instead: **Gamepad English** starts on the
tap-only row (`e t a o i n` — nothing held), then one held row per lesson
(LB `s r h l d c`, RB `u m f p g w`, LT `y b v k j x`, RT `q z`), capitals
via L3, and the two-finger digit/punctuation rows last. **Gamepad ไทย**
mirrors the `Typing_TH` tiering: `ร น ก อ ง ม` first, then the LB/RB
consonant rows, the LT vowel signs, the RT long and pre-posed vowels, the
RB+RT tone marks, two-hold consonants, three-hold rarities and the Thai-digit
rows. Switch with the menu-bar pill; a gamepad course turns the controller
view on for you, and its records are kept apart from the keyboard courses'.

### Updating the controller maps

The diagram is generated from the profile files — it never parses TOML at
runtime. When `Typing.toml` or `Typing_TH.toml` changes, re-run:

```bash
python tools/sync_padmap.py            # reads the JK repo next to this one
python tools/sync_padmap.py D:\some\JK # or an explicit profile folder
python tools/sync_padmap.py --check    # CI-style staleness check
```

and commit the regenerated `assets/js/padmap.js` (Python 3.11+, no
dependencies). The script keeps every button binding that injects a key or a
click — so re-tiered rows, moved Ctrl, new chords all show up automatically —
and skips sticks, scrolling and profile-switching bindings, which the pad
view has nothing to draw. Courses without a map in `TT.PADMAPS` simply keep
the keyboard, and the Options switch disables itself.

## Project structure

```
.
├── index.html              # app shell, menu bar, theme bootstrap
├── assets/
│   ├── css/
│   │   └── tutor.css       # theme tokens, layout, dark/light palettes
│   └── js/
│       ├── lessons.js      # course registry + English (QWERTY) lessons/tests
│       ├── lessons-th.js   # Thai (Kedmanee) lessons/tests
│       ├── lessons-pad.js  # Gamepad English course (pad-grid order)
│       ├── lessons-pad-th.js # Gamepad ไทย course (pad-grid order)
│       ├── keyboard.js     # physical key geometry, finger map, layouts
│       ├── padmap.js       # GENERATED gamepad maps (from the JK profiles)
│       ├── padview.js      # controller view: gamepad diagram + highlights
│       ├── engine.js       # typing engine: validation, clustering, statistics
│       └── app.js          # screens, scoring, storage, keyboard input
└── tools/
    └── sync_padmap.py      # regenerates padmap.js from Typing*.toml
```

The `TT` global is assembled across the script files in load order (see the
`<script>` tags at the bottom of `index.html`): lesson data, then the keyboard
model, then the gamepad maps and controller view, then the engine, then the
application shell.

## Browser support

Uses standard, widely supported web platform features — `localStorage`, the
Web Audio API, `KeyboardEvent.code`, and JavaScript written in an ES5 style with
a few widely supported ES6 conveniences (template literals, `Object.assign`,
`Array.from`), so no transpile step is needed. The stylesheet uses `color-mix()`
and logical properties, which need a current browser. Works in current Chrome,
Firefox, Edge and Safari, and on touch tablets via the clickable keyboard.
