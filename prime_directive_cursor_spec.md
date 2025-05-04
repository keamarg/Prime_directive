# The Prime Directive – Cursor Build-Spec

## 1 Narrative Premise

A silent alien cruiser orbits a cooling planet. Over **three eons** a young civilisation struggles while its world slowly dies. At nine pivotal moments you may **intervene**, **guide gently**, or **remain silent**. Every action (and inaction) shifts three aspects:

\| Truth | Happiness | Autonomy |
\| Knowledge & science | Collective wellbeing | Self-governance |

“Do Nothing” always harms at least one aspect because natural decay continues. After Eon 3 the final aspect vector selects one of **10 endings**, revealing unintended consequences.

---

## 2 Screen-by-Screen Flow

| Step                       | Screen                                                                                                                                      | Core assets                                             | Audio |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----- |
| 0 Title                    | `intro_screen.png` (1280 × 720) + “Begin Observation” button                                                                                | `/audio/music/ambient_loop.mp3` (loop)                  |       |
| 1 Bridge                   | `spaceship_base.png` + three 180 × 120 monitor overlays (`<aspect>_eon<1-3>_<tier>.png`). CSS bars show aspect values. Four choice buttons. | `ui_select.wav`, `ui_confirm.wav`, `monitor_change.wav` |       |
| 2 Questions                | 3 random dilemmas (from `questions.json`). Choices update aspects + overlays.                                                               | same UI SFX                                             |       |
| 3 Splash 1                 | `splash_eon1.png` (Awakening World) + 3 narrative snippets from `snippets.json`.                                                            | `eon_end.wav`, then `eon_start.wav`                     |       |
| 4 Eon 2 Bridge & Questions | –                                                                                                                                           | –                                                       |       |
| 5 Splash 2                 | `splash_eon2.png` (Industrial Dusk) + snippets.                                                                                             | same SFX                                                |       |
| 6 Eon 3 Bridge & Questions | –                                                                                                                                           | –                                                       |       |
| 7 Ending                   | Match final aspects to `endings.json` → show matching `ending01-10.png` + epilogue text.                                                    | `ending_reveal.wav`                                     |       |

_(Two splashes only; after Eon 3 game jumps straight to ending.)_

---

## 3 Assets

### 3.1 Images

```
/assets/img/spaceship_base.png               640×360
/assets/img/intro_screen.png                 1280×720
/assets/img/monitors/<aspect>_eon#_<tier>.png (27 × 180×120)
/assets/img/splashes/splash_eon1.png         1280×720
/assets/img/splashes/splash_eon2.png         1280×720
/assets/img/endings/ending01.png … ending10.png 1280×720
```

### 3.2 Audio (MP3 music, WAV SFX)

```
/assets/audio/music/ambient_loop.mp3
/assets/audio/sfx/ui_select.wav
/assets/audio/sfx/ui_confirm.wav
/assets/audio/sfx/monitor_change.wav
/assets/audio/sfx/eon_end.wav
/assets/audio/sfx/eon_start.wav
/assets/audio/sfx/ending_reveal.wav
```

### 3.3 Data

```
/assets/data/questions.json   – 12 dilemmas per eon (tags + numeric deltas)
/assets/data/snippets.json    – narrative pools (up / down / flat)
/assets/data/endings.json     – 10 profiles & epilogue lines
```

---

## 4 Folder Layout

```
/assets
  /img
    spaceship_base.png
    intro_screen.png
    monitors/  (27 overlay PNGs)
    splashes/
      splash_eon1.png
      splash_eon2.png
    endings/
      ending01.png … ending10.png
  /audio
    /music/ambient_loop.mp3
    /sfx/
      ui_select.wav
      ui_confirm.wav
      monitor_change.wav
      eon_end.wav
      eon_start.wav
      ending_reveal.wav
  /data
    questions.json
    snippets.json
    endings.json
index.html
style.css
main.js
```

---

## 5 Layout Containers (IDs only – Cursor places elements)

- `#bridge-bg` – background image
- `#monitors` – flex row containing three `.monitor` divs

  - inside each `.monitor` → `<img class="overlay">` + `<div class="bar">`

- `#question-card` – dilemma text & four `.choice` buttons
- `#console-log` – scrollable log of decisions
- `#fullscreen-overlay` – full-screen div for splashes & endings

  - contains `#overlay-img` and `#overlay-text`

No further code required—Cursor will scaffold HTML, CSS, and JS around these IDs.

---

> **This prompt fully defines concept, flow, assets (paths & formats), and UI containers—ready for Cursor to generate the complete project.**

Copy-paste into Cursor and import your assets as listed.
