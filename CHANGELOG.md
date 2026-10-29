# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-30

### Added

- Pad setup wizard: paper presets or custom size (mm, cm, in), header/footer zones,
  margins, letterhead, live to-scale preview and a 100 mm calibration print.
- Multiple pad profiles, switchable from the toolbar.
- Fast prescribing: drug autocomplete with learned usual doses, one-tap dose, timing,
  duration and follow-up chips, keyboard shortcuts and dark mode.
- Templates, recent prescriptions with Repeat, and an auto-saved draft.
- Fit / Actual size preview with an overflow warning and "shrink text".
- Unit tests (Vitest), CI, docs (`docs/DESIGN.md`) and open-source project files
  (license, code of conduct, contributing, security policy, templates, Dependabot, release workflow).

### Changed

- Upgraded to Angular 22 with standalone components, signals and zoneless change detection.
- Rebuilt the UI/UX around exact `@page` printing on the doctor's own pad.

### Removed

- TinyMCE, interact.js and Angular CDK, plus legacy NgModule and stale code
  (initial bundle now about 231 kB).

### Fixed

- First keystrokes lost when typing right after "Add medicine".

### Notes

- Data saved by pre-1.0 versions is not migrated (new storage format).

[Unreleased]: https://github.com/junaaid96/dynamic-prescription/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/junaaid96/dynamic-prescription/releases/tag/v1.0.0
