import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { PadProfile, pageCss } from './pad.model';

export type PrintMode = 'rx' | 'calibration';

/**
 * Prints at the pad's true size. Browsers only honour a page size given in
 * an @page rule, so we inject one right before calling window.print().
 */
@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly doc = inject(DOCUMENT);
  /** Which sheet the print stylesheet should show. */
  readonly mode = signal<PrintMode>('rx');
  /** Pad being printed (may be an unsaved draft from the setup wizard). */
  readonly pad = signal<PadProfile | null>(null);

  print(pad: PadProfile, mode: PrintMode = 'rx'): void {
    this.mode.set(mode);
    this.pad.set(pad);
    this.applyPageRule(pad);
    const win = this.doc.defaultView;
    // Let Angular paint the chosen sheet before the print dialog snapshots the page.
    win?.requestAnimationFrame(() => win.print());
  }

  applyPageRule(pad: PadProfile): void {
    let style = this.doc.getElementById('rx-page-rule') as HTMLStyleElement | null;
    if (!style) {
      style = this.doc.createElement('style');
      style.id = 'rx-page-rule';
      this.doc.head.appendChild(style);
    }
    style.textContent = pageCss(pad);
  }
}
