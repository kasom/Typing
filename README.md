# Typing Tutor

A touch-typing tutor that runs entirely in the browser. No build step, no
dependencies, no framework — just static HTML, CSS and vanilla JavaScript you
can open directly or drop on any web server.

It ships with two full courses — **English (QWERTY)** and **Thai (Kedmanee)** —
each with ten progressive lessons, four timed tests, a custom-drill editor, an
on-screen keyboard with per-finger colours, live WPM/accuracy stats, and a
progress report. Everything (settings, best scores and history) is stored
locally in your browser via `localStorage`; nothing is sent anywhere.

## Features

- **Two courses** — English on QWERTY and Thai on Kedmanee (TIS 820). Switch
  from the menu-bar pill or in Options; records are kept per course.
- **10 lessons + 4 timed tests per course** — a lesson unlocks the next one once
  you hit its target speed at 95% accuracy or better.
- **On-screen keyboard** — colour-coded by finger, highlights the next key to
  press, lights up the physical key you actually hit, and is clickable so the
  course also works on tablets.
- **Live scoring** — WPM, net CPM, raw speed, accuracy, error count, elapsed /
  remaining time and percent complete, updated as you type.
- **Thai-aware rendering** — dependent marks are shaped into clusters with a
  dotted-circle carrier so above/below/before vowels stay readable, and Thai
  digits map to the correct Kedmanee keys.
- **Alt-keys** — on the Thai course you can press the US key in the same physical
  position (e.g. `asdf` types `ฟหกด`), so no OS keyboard switch is required.
- **Strict mode** — wrong characters stay in the text and must be erased with
  Backspace before a lesson can be completed.
- **Custom drills** — paste any text and practise it (unscored).
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
| `F9` | Retry the current exercise |
| `F10` | Next lesson |
| `Backspace` | Erase a wrong character |

## How scoring works

Speed is measured in words per minute, where **five correct characters equal one
word**. Accuracy is `(keystrokes − errors) / keystrokes`. A run shorter than 20
keystrokes still appears in the history but is never recorded as a best, so a
couple of lucky keystrokes can't post a flawless score. For a lesson, the best
WPM and its matching accuracy always come from the same run.

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
│       ├── keyboard.js     # physical key geometry, finger map, layouts
│       ├── engine.js       # typing engine: validation, clustering, statistics
│       └── app.js          # screens, scoring, storage, keyboard input
```

The `TT` global is assembled across the script files in load order (see the
`<script>` tags at the bottom of `index.html`): lesson data, then the keyboard
model, then the engine, then the application shell.

## Browser support

Uses standard, widely supported web platform features — `localStorage`, the
Web Audio API, `KeyboardEvent.code`, and ES5-style JavaScript throughout (no
transpile needed). Works in current Chrome, Firefox, Edge and Safari, and on
touch tablets via the clickable keyboard.
