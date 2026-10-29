# Prescription Pad (dynamic-prescription)

Write prescriptions fast and print them **exactly** onto your own prescription pad, whether it is pre-printed or plain, A5 or a custom size.

![Editor and live preview](docs/screenshots/1-editor-preview.png)

## Features
- **Pad setup wizard:** paper presets or a custom size (mm/cm/in), pre-printed vs plain paper, header/footer zones, margins, notes column and text size, all with a live preview to scale.
- **Calibration print:** print a 100 mm ruler, measure it, and enter the result. Scale and X/Y offsets are then applied to every print.
- **Multiple pads:** switch between profiles from the toolbar.
- **Fast writing:** drug autocomplete, remembered usual doses, dose/timing/duration chips (`1+0+1`, after meal, 7 days), and Enter-to-advance.
- **Templates and history:** save order sets and repeat recent prescriptions.
- **Safe printing:** overflow warning with one-click "shrink text", and an exact `@page` size.
- Auto-saved draft, dark mode, keyboard shortcuts (`?`), and a responsive tablet/mobile layout.
- Local-first: all data stays in your browser's localStorage.

See [docs/DESIGN.md](docs/DESIGN.md) for the research and design rationale.

## Printing tips
In the print dialog choose **Scale: 100% / Actual size** and **Margins: None**. Run *Pad setup → Test & calibrate* once for each printer.

## Shortcuts
| Keys | Action |
|---|---|
| Ctrl/⌘ + P | Print |
| Ctrl/⌘ + Enter | Add medicine |
| Alt + N / L / S / D | New / Library / Pad setup / Dark mode |
| ? | Help |
| Esc | Close dialogs |

## Development
Angular 22 (standalone components, signals, zoneless) · Tailwind CSS · Vitest.

```bash
npm install
npm start          # http://localhost:4200
npm test           # ng test (Vitest)
npm run build      # production build in dist/
```
