#!/usr/bin/env python3
"""Regenerate assets/js/padmap.js from the JK PadMapper typing profiles.

The controller view in the tutor is driven by the same profiles the JK app
uses to turn a gamepad into a keyboard:

    Typing.toml      -> English course  (profile "Typing")
    Typing_TH.toml   -> Thai course     (profile "Typing_TH")

Those files live in the JK repo and may be reshuffled at any time. Whenever
either one changes, re-run this script and commit the result - the app itself
never parses TOML and needs no build step.

    python tools/sync_padmap.py                 # reads ../JK (sibling folder)
    python tools/sync_padmap.py D:\\path\\to\\JK  # explicit profile folder
    python tools/sync_padmap.py --check         # fail if padmap.js is stale

Only button bindings with key/mouse actions are exported: sticks, scroll,
profile switching and the `not` dead-zones carry no character for the view to
show. What is exported per slot: the gamepad button, the held modifier combo
(`when.pressed`), the injected virtual key (normalised to the tutor's own
physical-key ids) and the profile's internal `shift` flag.

Python 3.11+ (stdlib tomllib). No third-party dependencies.
"""

import argparse
import json
import sys
import tomllib
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT_DEFAULT = REPO / "assets" / "js" / "padmap.js"

# course id -> profile filename
PROFILES = [("en", "Typing.toml"), ("th", "Typing_TH.toml")]

# JK VirtualKey name -> the physical-key id used by assets/js/keyboard.js
# (the same ids the app's KeyboardEvent.code table resolves to). Unlisted
# names (pageup, home, ...) pass through unchanged and are labelled from the
# original key name.
PHYS = {
    "return": "Enter",
    "space": "Space",
    "backspace": "Back",
    "tab": "Tab",
    "escape": "Esc",
    "delete": "Del",
    "insert": "Ins",
    "lshift": "LShift",
    "rshift": "RShift",
    "lctrl": "LCtrl",
    "rctrl": "RCtrl",
    "lalt": "LAlt",
    "ralt": "RAlt",
    "up": "ArrowUp",
    "down": "ArrowDown",
    "left": "ArrowLeft",
    "right": "ArrowRight",
    "lbracket": "[",
    "rbracket": "]",
    "backslash": "\\",
    "oem_backslash": "OemBackslash",
    "minus": "-",
    "equals": "=",
    "semicolon": ";",
    "apostrophe": "'",
    "grave": "`",
    "comma": ",",
    "period": ".",
    "slash": "/",
}

# canonical order for the hold-combo a slot needs
LAYER_ORDER = ["left-shoulder", "right-shoulder", "left-trigger", "right-trigger"]

# actions that inject no character/click for the view (sticks, wheel, profile)
SKIP_ACTION_TYPES = {
    "mouse-move",
    "wheel-scroll",
    "wheel-tick",
    "stick-keys",
    "profile-next",
    "profile-set",
}


def sort_mods(mods):
    rest = sorted(m for m in mods if m not in LAYER_ORDER)
    return [m for m in LAYER_ORDER if m in mods] + rest


def extract(path):
    with open(path, "rb") as f:
        cfg = tomllib.load(f)
    slots, warnings = [], []
    seen = {}
    for b in cfg.get("bindings", []):
        inp = b.get("input", {})
        if inp.get("kind") != "button" or "button" not in inp:
            continue
        act = b.get("action", {})
        atype = act.get("type")
        if atype in SKIP_ACTION_TYPES:
            continue
        slot = {"btn": inp["button"], "mods": sort_mods(b.get("when", {}).get("pressed", []))}
        if atype == "key":
            name = act["key"]
            slot["key"] = name
            slot["phys"] = PHYS.get(name, name)
            if act.get("shift"):
                slot["shift"] = True
        elif atype == "mouse":
            slot["mouse"] = act.get("button", "left")
        else:
            warnings.append(f"{path.name}: unknown action type {atype!r} on {slot['btn']} - skipped")
            continue
        uid = (slot["btn"], tuple(slot["mods"]))
        if uid in seen:
            warnings.append(f"{path.name}: duplicate binding for {uid[0]} + {uid[1] or 'no mods'} - kept the first")
            continue
        seen[uid] = slot
        slots.append(slot)
    return cfg.get("name", path.stem), slots, warnings


def render(maps, sources):
    banner = (
        "/* Typing Tutor - gamepad typing maps for the controller view.\n"
        " *\n"
        " * GENERATED FILE - DO NOT EDIT. Built from the JK PadMapper profiles:\n"
    )
    for s in sources:
        banner += f" *   {s}\n"
    banner += (
        " *\n"
        " * When a profile changes, re-run:\n"
        " *\n"
        " *   python tools/sync_padmap.py            # reads the JK repo next to this one\n"
        " *\n"
        " * Slot shape: {btn: gamepad button, mods: [held buttons],\n"
        " *             key: JK virtual key name, phys: keyboard.js key id,\n"
        " *             shift: profile-internal Shift, mouse: click button}\n"
        " */\n"
        "window.TT = window.TT || {};\n"
    )
    lines = ["TT.PADMAPS = {"]
    course_ids = list(maps)
    for i, course in enumerate(course_ids):
        m = maps[course]
        lines.append(
            f' "{course}": {{ "name": {json.dumps(m["name"])}, "source": {json.dumps(m["source"])},'
            ' "slots": ['
        )
        slots = m["slots"]
        for j, slot in enumerate(slots):
            lines.append("  " + json.dumps(slot, ensure_ascii=False) + ("," if j < len(slots) - 1 else ""))
        lines.append(" ] }" + ("," if i < len(course_ids) - 1 else ""))
    lines.append("};")
    return banner + "\n".join(lines) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument(
        "source",
        nargs="?",
        default=None,
        help="folder holding Typing.toml / Typing_TH.toml (default: the JK repo next to this one)",
    )
    ap.add_argument("-o", "--out", default=str(OUT_DEFAULT), help="JS file to write (default: assets/js/padmap.js)")
    ap.add_argument("--check", action="store_true", help="exit 1 if the existing file differs from a fresh build")
    args = ap.parse_args(argv)

    src_dir = Path(args.source) if args.source else REPO.parent / "JK"
    if not src_dir.is_dir():
        print(f"error: profile folder not found: {src_dir}", file=sys.stderr)
        print("pass the JK repo path:  python tools/sync_padmap.py D:\\works\\JK", file=sys.stderr)
        return 2

    maps, sources, warnings = {}, [], []
    for course, fname in PROFILES:
        path = src_dir / fname
        if not path.is_file():
            print(f"error: profile missing: {path}", file=sys.stderr)
            return 2
        name, slots, warns = extract(path)
        warnings += warns
        maps[course] = {"name": name, "source": fname, "slots": slots}
        sources.append(f"{name}  ({fname})")

    out = render(maps, sources)
    out_path = Path(args.out)

    for w in warnings:
        print("warning:", w, file=sys.stderr)

    if args.check:
        current = out_path.read_text(encoding="utf-8") if out_path.is_file() else ""
        # ignore the generation banner? it is deterministic - compare whole file
        if current != out:
            print(f"stale: {out_path} does not match the current profiles", file=sys.stderr)
            return 1
        print("padmap.js is up to date")
        return 0

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out, encoding="utf-8", newline="\n")
    counts = ", ".join(f"{c}: {len(m['slots'])} slots" for c, m in maps.items())
    print(f"wrote {out_path.relative_to(REPO) if out_path.is_relative_to(REPO) else out_path} ({counts})")
    print("regenerate with:  python tools/sync_padmap.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
