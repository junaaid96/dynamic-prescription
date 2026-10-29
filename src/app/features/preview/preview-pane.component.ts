import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal, viewChild,
} from '@angular/core';
import { PadStore } from '../../core/pad.store';
import { RxStore } from '../../core/rx.store';
import { mmToPx } from '../../core/units';
import { PadSheetComponent } from '../sheet/pad-sheet.component';

export type ZoomMode = 'fit' | 'actual';

/** Live, to-scale preview of the active pad with zoom and an overflow warning. */
@Component({
  selector: 'app-preview-pane',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PadSheetComponent],
  template: `
    @let pad = pads.active();
    <div class="flex items-center justify-between gap-2 px-1 pb-2">
      <div class="seg" role="group" aria-label="Preview zoom">
        <button type="button" [class.seg-on]="zoom() === 'fit'" [attr.aria-pressed]="zoom() === 'fit'" (click)="zoom.set('fit')">Fit</button>
        <button type="button" [class.seg-on]="zoom() === 'actual'" [attr.aria-pressed]="zoom() === 'actual'" (click)="zoom.set('actual')"
                title="Real size on a standard 96 dpi screen">Actual size</button>
      </div>
      <span class="text-xs text-slate-500">{{ pad.widthMm }} × {{ pad.heightMm }} mm · {{ percent() }}%</span>
    </div>
    @if (overflow()) {
      <p role="status" class="mb-2 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
        Content is longer than the space on this pad. Shorten it or reduce the text size
        <button type="button" class="ml-1 underline" (click)="shrink()">({{ pad.fontPt }} pt → {{ pad.fontPt - 0.5 }} pt)</button>.
      </p>
    }
    <div #frame class="min-h-0 flex-1 overflow-auto rounded-xl bg-slate-200/70 p-4 dark:bg-slate-950/60">
      <div class="mx-auto" [style.width.px]="pxWidth() * scale()" [style.height.px]="pxHeight() * scale()">
        <div class="origin-top-left shadow-2xl ring-1 ring-black/10" [style.transform]="'scale(' + scale() + ')'"
             [style.width.px]="pxWidth()">
          <app-pad-sheet [pad]="pad" [rx]="rx.rx()" (overflow)="overflow.set($event)" />
        </div>
      </div>
    </div>
  `,
  host: { class: 'flex min-h-0 flex-col' },
})
export class PreviewPaneComponent {
  readonly pads = inject(PadStore);
  readonly rx = inject(RxStore);
  readonly zoom = signal<ZoomMode>('fit');
  readonly overflow = signal(false);
  private readonly frameWidth = signal(600);
  private readonly frame = viewChild<ElementRef<HTMLElement>>('frame');

  readonly pxWidth = computed(() => mmToPx(this.pads.active().widthMm));
  readonly pxHeight = computed(() => mmToPx(this.pads.active().heightMm));
  readonly scale = computed(() =>
    this.zoom() === 'actual' ? 1 : Math.min(1.25, Math.max(0.2, (this.frameWidth() - 32) / this.pxWidth())),
  );
  readonly percent = computed(() => Math.round(this.scale() * 100));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.frame()?.nativeElement;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(([entry]) => this.frameWidth.set(entry.contentRect.width + 32));
      ro.observe(el);
      destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  shrink(): void {
    const pt = this.pads.active().fontPt;
    if (pt > 7) this.pads.patchActive({ fontPt: pt - 0.5 });
  }
}
