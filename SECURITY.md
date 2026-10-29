# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a vulnerability

Please do **not** open a public issue. Report it privately through
[GitHub Security Advisories](https://github.com/junaaid96/dynamic-prescription/security/advisories/new).
You should get a reply within a few days. Once a fix is released, the advisory is published with credit if you want it.

## Scope and data handling

Prescription Pad is local-first: there is no backend, account or server-side storage.
Pads, drafts, templates and history are stored only in the browser's `localStorage` on the user's device.
Relevant issues include XSS or injection in rendered/printed content, data leaking outside the device,
and vulnerable dependencies. Protecting the device and browser profile itself is the user's responsibility.
