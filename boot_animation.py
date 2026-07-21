#!/usr/bin/env python3
"""
boot_animation.py
Cinematic terminal boot animation for IZI Staff Inventory Management System.
Pure Python 3.11+ · Standard library only · macOS / Linux
"""

import sys
import time
import math
import random
import shutil
import signal

# ─────────────────────────────────────────────────────────────────────────────
#  ANSI Escape Sequences
# ─────────────────────────────────────────────────────────────────────────────
ESC = "\033"
RESET    = f"{ESC}[0m"
BOLD     = f"{ESC}[1m"
DIM      = f"{ESC}[2m"

# Matrix green palette
G_WHITE  = f"{ESC}[1;97m"      # white-hot head
G_BRIGHT = f"{ESC}[1;92m"      # bright green
G_MED    = f"{ESC}[32m"        # normal green
G_DIM    = f"{ESC}[2;32m"      # dim green
G_DARK   = f"{ESC}[38;5;22m"   # very dark green

# UI accents
WHITE_B  = f"{ESC}[1;97m"
GREY     = f"{ESC}[38;5;240m"
GREY_B   = f"{ESC}[38;5;246m"
CYAN_B   = f"{ESC}[1;96m"

# Cursor / screen
HIDE_CUR = f"{ESC}[?25l"
SHOW_CUR = f"{ESC}[?25h"
CLEAR    = f"{ESC}[2J{ESC}[H"

# ─────────────────────────────────────────────────────────────────────────────
#  Character Pool
# ─────────────────────────────────────────────────────────────────────────────
POOL = list(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "0123456789!@#$%^&*-+=|\\/<>[]{}:;?~`"
)

# ─────────────────────────────────────────────────────────────────────────────
#  ASCII Block Logo: RVB TEC  (5 rows × 42 cols)
# ─────────────────────────────────────────────────────────────────────────────
def _build_logo() -> list[str]:
    LR = ["█████", "█   █", "████ ", "█  █ ", "█   █"]
    LV = ["█   █", "█   █", " █ █ ", " █ █ ", "  █  "]
    LB = ["████ ", "█   █", "████ ", "█   █", "████ "]
    LT = ["█████", "  █  ", "  █  ", "  █  ", "  █  "]
    LE = ["█████", "█    ", "████ ", "█    ", "█████"]
    LC = [" ████", "█    ", "█    ", "█    ", " ████"]
    return [
        LR[i] + "  " + LV[i] + "  " + LB[i] + "    " + LT[i] + "  " + LE[i] + "  " + LC[i]
        for i in range(5)
    ]


LOGO_LINES = _build_logo()
LOGO_W     = len(LOGO_LINES[0])   # 42
LOGO_H     = len(LOGO_LINES)      # 5

SYSTEM_NAME = "IZI Staff"
SUBTITLE    = "Inventory Management System"

BOOT_MSGS = [
    "Initializing Kernel",
    "Loading Configuration",
    "Loading SQLite Engine",
    "Loading Backup Service",
    "Loading QR Engine",
    "Loading API",
    "Loading Frontend",
    "Checking Database",
    "Verifying Assets",
    "Starting Services",
]

PROGRESS_ITEMS = [
    ("Backend  ", 0.45),
    ("Frontend ", 0.55),
    ("Database ", 0.30),
    ("QR Engine", 0.38),
    ("Backups  ", 0.27),
]

# ─────────────────────────────────────────────────────────────────────────────
#  Terminal Utilities
# ─────────────────────────────────────────────────────────────────────────────
def get_size() -> tuple[int, int]:
    """Return (cols, rows)."""
    s = shutil.get_terminal_size(fallback=(80, 24))
    return s.columns, s.lines


def clear_screen() -> None:
    sys.stdout.write(CLEAR)
    sys.stdout.flush()


def hide_cursor() -> None:
    sys.stdout.write(HIDE_CUR)
    sys.stdout.flush()


def show_cursor() -> None:
    sys.stdout.write(SHOW_CUR)
    sys.stdout.flush()


def goto(row: int, col: int) -> None:
    sys.stdout.write(f"{ESC}[{row};{col}H")


def center_text(text: str, width: int) -> str:
    pad = max(0, (width - len(text)) // 2)
    return " " * pad + text


def get_logo_pos() -> tuple[int, int]:
    cols, rows = get_size()
    logo_row = max(2, (rows - LOGO_H - 2) // 2)
    logo_col = max(1, (cols - LOGO_W) // 2 + 1)
    return logo_row, logo_col


# ─────────────────────────────────────────────────────────────────────────────
#  Stage 1 — Matrix Rain
# ─────────────────────────────────────────────────────────────────────────────
def matrix_rain(duration: float) -> None:
    """Full-screen Matrix-style digital rain."""
    cols, rows = get_size()
    rows = max(rows - 1, 1)

    clear_screen()

    FPS       = 25
    frame_dt  = 1.0 / FPS

    # Each column: [head_y, speed, length, char_buffer]
    heads   = [random.uniform(-rows * 0.6, 0.0) for _ in range(cols)]
    speeds  = [random.uniform(0.22, 0.72)        for _ in range(cols)]
    lengths = [random.randint(7, 20)              for _ in range(cols)]
    cbuf    = [[random.choice(POOL) for _ in range(rows)] for _ in range(cols)]

    # Screen state (for delta drawing)
    s_char  = [[" "] * rows for _ in range(cols)]
    s_color = [[None]       * rows for _ in range(cols)]

    start      = time.perf_counter()
    last_frame = start

    while True:
        now = time.perf_counter()
        if now - start >= duration:
            break
        if now - last_frame < frame_dt:
            time.sleep(0.001)
            continue
        last_frame = now

        out = []

        for c in range(cols):
            heads[c] += speeds[c]
            hi = int(heads[c])

            # Recycle drop when off-screen
            if heads[c] > rows + lengths[c] + 4:
                heads[c]   = random.uniform(-lengths[c] - 4, -1.0)
                speeds[c]  = random.uniform(0.22, 0.72)
                lengths[c] = random.randint(7, 20)

            for r in range(rows):
                dist = hi - r

                if dist < 0 or dist > lengths[c]:
                    color, char = None, " "
                elif dist == 0:
                    color = G_WHITE
                    char  = random.choice(POOL)
                    cbuf[c][r] = char
                elif dist == 1:
                    color = G_BRIGHT
                    if random.random() < 0.10:
                        cbuf[c][r] = random.choice(POOL)
                    char = cbuf[c][r]
                elif dist <= 3:
                    color = G_MED
                    if random.random() < 0.05:
                        cbuf[c][r] = random.choice(POOL)
                    char = cbuf[c][r]
                elif dist <= 8:
                    color = G_DIM
                    char  = cbuf[c][r]
                else:
                    color = G_DARK
                    char  = cbuf[c][r]

                if color != s_color[c][r] or char != s_char[c][r]:
                    s_char[c][r]  = char
                    s_color[c][r] = color
                    cell = f"{color}{char}{RESET}" if color else " "
                    out.append(f"{ESC}[{r + 1};{c + 1}H{cell}")

        if out:
            sys.stdout.write("".join(out))
            sys.stdout.flush()


# ─────────────────────────────────────────────────────────────────────────────
#  Stage 2 — Fade Matrix → Logo Emerges
# ─────────────────────────────────────────────────────────────────────────────
def fade_matrix(duration: float) -> None:
    """Logo assembles from random Matrix characters over the rain."""
    logo_row, logo_col = get_logo_pos()

    # Build list of all non-space logo positions
    positions: list[tuple[int, int, str]] = []
    for r in range(LOGO_H):
        for c in range(LOGO_W):
            ch = LOGO_LINES[r][c]
            if ch != " ":
                positions.append((r, c, ch))
    random.shuffle(positions)

    total     = len(positions)
    FPS       = 28
    frame_dt  = 1.0 / FPS
    start     = time.perf_counter()
    last_frame = start
    revealed  = 0

    while True:
        now     = time.perf_counter()
        elapsed = now - start
        if elapsed >= duration:
            break
        if now - last_frame < frame_dt:
            time.sleep(0.001)
            continue
        last_frame = now

        progress = elapsed / duration
        # ease-in so logo slows at end
        eased    = math.pow(progress, 0.6)
        target   = int(eased * total)

        out = []

        # Reveal new positions with a flash
        while revealed < target and revealed < total:
            r, c, ch = positions[revealed]
            sr = logo_row + r
            sc = logo_col + c
            out.append(f"{ESC}[{sr};{sc}H{G_WHITE}{random.choice(POOL)}{RESET}")
            revealed += 1

        # Animate already-revealed: flicker occasionally
        for i in range(revealed):
            r, c, ch = positions[i]
            sr = logo_row + r
            sc = logo_col + c
            if random.random() < 0.04:
                out.append(f"{ESC}[{sr};{sc}H{G_BRIGHT}{random.choice(POOL)}{RESET}")
            else:
                out.append(f"{ESC}[{sr};{sc}H{G_MED}{ch}{RESET}")

        if out:
            sys.stdout.write("".join(out))
            sys.stdout.flush()


# ─────────────────────────────────────────────────────────────────────────────
#  Stage 3 — Draw Logo + Neon Glow Sweep
# ─────────────────────────────────────────────────────────────────────────────
def draw_logo(color: str = G_MED) -> None:
    """Render the logo cleanly at its centered position."""
    cols, _ = get_size()
    logo_row, logo_col = get_logo_pos()
    out = []
    for r, line in enumerate(LOGO_LINES):
        out.append(f"{ESC}[{logo_row + r};{logo_col}H{color}{line}{RESET}")
    sys.stdout.write("".join(out))
    sys.stdout.flush()


def glow_logo(duration: float) -> None:
    """Neon glow beam sweeps left-to-right across the logo twice."""
    logo_row, logo_col = get_logo_pos()
    BEAM_W = 9          # half-width of glow beam in chars
    FPS    = 30
    dt     = 1.0 / FPS
    start  = time.perf_counter()
    last   = start

    while True:
        now     = time.perf_counter()
        elapsed = now - start
        if elapsed >= duration:
            break
        if now - last < dt:
            time.sleep(0.001)
            continue
        last = now

        # Two sweeps in `duration` seconds
        sweep_t  = (elapsed / duration) * 2
        sweep_x  = (sweep_t % 1.0) * (LOGO_W + BEAM_W * 2) - BEAM_W

        out = []
        for r, line in enumerate(LOGO_LINES):
            for c, ch in enumerate(line):
                if ch == " ":
                    continue
                dist = abs(c - sweep_x)
                if dist < BEAM_W * 0.20:
                    color = G_WHITE
                elif dist < BEAM_W * 0.50:
                    color = G_BRIGHT
                elif dist < BEAM_W * 0.90:
                    color = G_MED
                else:
                    color = G_DIM
                out.append(f"{ESC}[{logo_row + r};{logo_col + c}H{color}{ch}{RESET}")

        sys.stdout.write("".join(out))
        sys.stdout.flush()


# ─────────────────────────────────────────────────────────────────────────────
#  Stage 4 — Typewriter Boot Messages
# ─────────────────────────────────────────────────────────────────────────────
def type_line(row: int, col: int, msg: str) -> None:
    """Print a boot message char-by-char then show [ OK ]."""
    prefix = "  [....] "
    ok_tag = f"  [{G_BRIGHT} OK {RESET}{GREY}]"

    # Print placeholder tag + message character by character
    sys.stdout.write(f"{ESC}[{row};{col}H{GREY}{prefix}{RESET}")
    sys.stdout.flush()

    msg_col = col + len(prefix)
    for i, ch in enumerate(msg):
        sys.stdout.write(f"{ESC}[{row};{msg_col + i}H{G_MED}{ch}{RESET}")
        sys.stdout.flush()
        time.sleep(random.uniform(0.008, 0.032))

    # Brief pause, then stamp OK
    time.sleep(random.uniform(0.04, 0.10))
    sys.stdout.write(f"{ESC}[{row};{col}H{GREY}{ok_tag}{RESET}")
    sys.stdout.flush()


# ─────────────────────────────────────────────────────────────────────────────
#  Stage 5 — Animated Progress Bars
# ─────────────────────────────────────────────────────────────────────────────
def progress_bar(row: int, col: int, label: str, duration: float) -> None:
    """Fill a progress bar from 0 → 100 % in `duration` seconds."""
    BAR_W = 22
    start = time.perf_counter()

    while True:
        now      = time.perf_counter()
        progress = min(1.0, (now - start) / duration)

        filled = int(progress * BAR_W)
        bar    = "█" * filled + "░" * (BAR_W - filled)
        pct    = int(progress * 100)

        sys.stdout.write(
            f"{ESC}[{row};{col}H"
            f"{GREY_B}{label}{RESET} "
            f"{G_DIM}[{RESET}"
            f"{G_BRIGHT}{bar}{RESET}"
            f"{G_DIM}]{RESET} "
            f"{G_BRIGHT}{pct:3d}%{RESET}"
        )
        sys.stdout.flush()

        if progress >= 1.0:
            break
        time.sleep(1.0 / 30)


# ─────────────────────────────────────────────────────────────────────────────
#  Final Screen
# ─────────────────────────────────────────────────────────────────────────────
def final_screen() -> None:
    """Clear screen, display centered logo + SYSTEM READY."""
    cols, rows = get_size()
    clear_screen()

    total_h  = LOGO_H + 5          # logo + name + subtitle + sep + ready
    start_r  = max(1, (rows - total_h) // 2)

    out = []

    # Logo — bright green
    for r, line in enumerate(LOGO_LINES):
        padded = center_text(line, cols)
        out.append(f"{ESC}[{start_r + r};1H{G_BRIGHT}{padded}{RESET}")

    # System name
    row = start_r + LOGO_H + 1
    out.append(f"{ESC}[{row};1H{WHITE_B}{center_text(SYSTEM_NAME, cols)}{RESET}")

    # Subtitle
    row += 1
    out.append(f"{ESC}[{row};1H{G_DIM}{center_text(SUBTITLE, cols)}{RESET}")

    # Separator line
    row += 1
    sep = "─" * min(36, cols - 4)
    out.append(f"{ESC}[{row};1H{GREY}{center_text(sep, cols)}{RESET}")

    # SYSTEM READY
    row += 1
    ready = "S Y S T E M   R E A D Y"
    out.append(f"{ESC}[{row};1H{BOLD}{G_BRIGHT}{center_text(ready, cols)}{RESET}")

    sys.stdout.write("".join(out))
    sys.stdout.flush()
    time.sleep(1.5)


# ─────────────────────────────────────────────────────────────────────────────
#  Boot Sequence Orchestrator
# ─────────────────────────────────────────────────────────────────────────────
def boot_sequence() -> None:
    cols, rows = get_size()
    rows_safe  = max(rows - 2, 1)

    # ── Stage 1: Matrix rain ────────────────────────────────────────────────
    matrix_rain(1.8)

    # ── Stage 2: Logo emerges from the rain ─────────────────────────────────
    fade_matrix(0.9)

    # Brief pause with logo still on rain background
    time.sleep(0.15)

    # ── Stage 3: Clean slate — logo + glow ──────────────────────────────────
    clear_screen()
    draw_logo(G_DIM)
    time.sleep(0.15)

    glow_logo(1.0)
    draw_logo(G_MED)

    # Subtitle under logo
    logo_row, logo_col = get_logo_pos()
    sub_row  = logo_row + LOGO_H + 1
    sys.stdout.write(
        f"{ESC}[{sub_row};1H{G_DIM}{center_text(SUBTITLE, cols)}{RESET}"
    )
    sys.stdout.flush()
    time.sleep(0.25)

    # ── Stage 4: Typewriter boot messages ───────────────────────────────────
    msg_start = sub_row + 2
    msg_col   = max(1, (cols - 52) // 2)

    for i, msg in enumerate(BOOT_MSGS):
        r = msg_start + i
        if r >= rows_safe:
            # Scroll-shift: clear messages area and restart from top
            for rr in range(msg_start, rows_safe + 1):
                sys.stdout.write(f"{ESC}[{rr};1H{' ' * (cols - 1)}")
            i = 0
            r = msg_start
        type_line(r, msg_col, msg)
        time.sleep(random.uniform(0.03, 0.07))

    time.sleep(0.30)

    # ── Stage 5: Progress bars ───────────────────────────────────────────────
    pb_start = msg_start + len(BOOT_MSGS) + 1
    pb_col   = max(1, (cols - 42) // 2)

    # If bars don't fit, clear lower area
    if pb_start + len(PROGRESS_ITEMS) + 1 >= rows_safe:
        for rr in range(msg_start, rows_safe + 1):
            sys.stdout.write(f"{ESC}[{rr};1H{' ' * (cols - 1)}")
        pb_start = msg_start

    sys.stdout.write(
        f"{ESC}[{pb_start};{pb_col}H{GREY}  Loading services...{RESET}"
    )
    sys.stdout.flush()
    time.sleep(0.20)

    for i, (label, dur) in enumerate(PROGRESS_ITEMS):
        r = pb_start + 1 + i
        if r < rows_safe:
            progress_bar(r, pb_col + 2, label, dur)

    time.sleep(0.40)

    # ── Final Screen ─────────────────────────────────────────────────────────
    final_screen()


# ─────────────────────────────────────────────────────────────────────────────
#  Entry Point
# ─────────────────────────────────────────────────────────────────────────────
def main() -> None:
    def _cleanup(signum=None, frame=None):
        show_cursor()
        sys.stdout.write(f"{RESET}\n")
        sys.stdout.flush()
        raise SystemExit(0)

    signal.signal(signal.SIGINT,  _cleanup)
    signal.signal(signal.SIGTERM, _cleanup)

    try:
        hide_cursor()
        boot_sequence()
    except SystemExit:
        pass
    except Exception:
        pass
    finally:
        show_cursor()
        cols, rows = get_size()
        sys.stdout.write(f"{ESC}[{rows};1H{RESET}\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
