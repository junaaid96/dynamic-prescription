# Prescription Pad: UX redesign

## The problem
Doctors often write on their **own pads**. Some pads have the chamber letterhead pre-printed and others are plain paper, and they come in many sizes (A5, half-letter, custom cuts). The old app was a free-form drag/resize canvas with a rich-text editor. It was powerful, but it was slow to use with a patient in the room and hard to line up with real paper.

## Research summary
- **Speed of entry is what matters most.** EHR usability work (for example the clinician e-prescribing guides and the "Inspired EHRs" guidelines) keeps finding the same things help: predictive drug search, favourites, **pre-filled usual doses**, **order sets** (templates), a review step before you sign or print, and changing a prescription without starting over.
- **Print accuracy on the web:** `@page { size: W H; margin: 0 }` needs both dimensions given explicitly. Browsers still add their own scaling and margins unless the user picks *Actual size / 100%* and *Margins: None*. The reliable way to fix the rest is a **calibration print**: print a known 100 mm ruler, measure it, and store a scale factor plus X/Y offsets.
- **Common prescription format:** a letterhead at the top, a patient line, a narrow left column for C/C, O/E, diagnosis and investigations, then a large **℞** column. Doses are written as `1+0+1`, followed by timing (before/after meal), duration, advice and follow-up date.

## Personas
1. **Busy GP (40–60 patients a day):** wants a finished prescription in under a minute, using the keyboard only, with the same handful of drugs every day.
2. **Specialist with a printed chamber pad:** the letterhead and footer are already on the paper. The app must print *only* into the blank area and land in exactly the right place.
3. **Junior doctor or assistant on a tablet:** uses touch, needs big tap targets and dose chips instead of typing.

## Key flows
1. **First run → Pad setup wizard:** (1) paper size (presets, custom size, units in mm/cm/in, rotate) → (2) layout zones (pre-printed or plain, header/footer heights, margins, notes column width, text size) → (3) letterhead text (plain paper only) → (4) print the calibration sheet, measure it, and enter the correction. A live preview to scale is shown at every step.
2. **Write:** patient line → clinical notes → medicines (type to autocomplete; a known drug fills in its usual dose; Enter moves to the next field; at the end of a row, Enter starts a new medicine) → advice → follow-up chips (+7 days…).
3. **Review & print:** the preview always shows the real page. If the content overflows the pad you get a warning and a one-click "shrink text". Ctrl/⌘+P prints at the exact pad size.
4. **Reuse:** save the current prescription as a template (order set). Recent prescriptions can be repeated with one click.

## Design decisions
- **Form, not canvas.** A fixed clinical structure fits on the pad automatically. The doctor only sets *zones* (in mm) once per pad and never drags boxes for each patient.
- **Everything stored in millimetres.** Units are only shown for display, so the preview, the print output and calibration all share one source of truth.
- **Multiple pad profiles.** For example Chamber A5 and Hospital A4, switched from the toolbar.
- **Learned favourites:** the last dose, timing and duration used for each drug are remembered locally.
- **Local-first.** Pads, the draft (auto-saved), templates and history live in localStorage. There is no backend and patient data never leaves the device.
- **Accessible and calm:** clear labels, keyboard shortcuts (`?` lists them), dark mode, mobile Write/Preview tabs, and a large Print button as the single primary action.
- **Leaner stack:** removed TinyMCE, interact.js and the Angular CDK. The app is standalone Angular with signals and zoneless change detection, and the initial bundle is about 231 kB.

## Next ideas
- A drug database with generic/brand mapping and interaction warnings.
- Multilingual / bilingual output and fonts.
- Export/import pad profiles (JSON or QR) to share across devices.
- A PDF export and a patient copy, plus optional cloud sync.
- Signature image and doctor's seal placement.
