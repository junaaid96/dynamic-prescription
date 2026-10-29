# Contributing to Prescription Pad

Prescription Pad is free and open-source software under the [MIT License](LICENSE). Thanks for helping doctors print better prescriptions.

## Report issues

Open a GitHub issue using the bug-report or feature-request template. For print problems, include your browser, OS, printer, pad size and a photo of the misaligned print if you can.

**Never include real patient information** in issues, screenshots or test data. Use demo names only.

## Contribute code

1. **Fork** the repo, clone your fork and run `npm ci`.
2. **Branch** from `main`: `git checkout -b feat/short-name` (or `fix/…`, `docs/…`). Use small, conventional commits.
3. **Change** as little as possible. Keep to the existing conventions: standalone components, signals, zoneless change detection, everything measured in millimetres, and no backend (data stays in `localStorage`).
4. **Verify** with the same checks CI runs:

   | Check | Command |
   | --- | --- |
   | Unit tests | `npm test -- --watch=false` |
   | Production build | `npm run build` |

5. **Test your change:** bug fixes should add a regression test next to the code in `src/app/core`.
6. **Open a pull request** with a short description and screenshots for UI changes.

## Design notes

Read [docs/DESIGN.md](docs/DESIGN.md) before larger UX changes. The main goals are speed of entry, accurate printing and keeping patient data on the device.
