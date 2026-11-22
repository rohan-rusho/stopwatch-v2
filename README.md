# Stopwatch ⏱️

A free online stopwatch with millisecond precision, lap times, and keyboard
control. No sign-up, no ads — just a clean, accurate timer in your browser.

## Features

- **Start / Pause / Reset** — big buttons, or keyboard shortcuts
- **Millisecond display** — hundredths of a second, updated via `requestAnimationFrame`
- **Lap times** — record splits while running; fastest and slowest laps are highlighted
- **Lap stats** — lap count, fastest lap, slowest lap
- **Keyboard** — `Space` start/stop, `L` lap, `R` reset
- **Copy laps** — one tap to copy the full lap list as text
- Responsive, keyboard-friendly, `prefers-reduced-motion` respected

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step, no dependencies — just open `index.html` (or serve it).

## Deploy

Static site — drop the folder on any static host (GitHub Pages, Netlify,
Vercel, or any web server). The only external dependency is Google Fonts.
