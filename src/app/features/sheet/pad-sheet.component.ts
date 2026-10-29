import {
  ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, input, output, viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PadProfile, padGeometry } from '../../core/pad.model';
import { Prescription } from '../../core/rx.model';

const SEX_LABEL: Record<string, string> = { M: 'Male', F: 'Female', O: 'Other' };

/**
 * One prescription page drawn in real millimetres. The same component is used
 * for the on-screen preview (with guides) and for the printed page.
 */
@Component({
  selector: 'app-pad-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './pad-sheet.component.html',
  host: { class: 'block' },
})
export class PadSheetComponent {
  readonly pad = input.required<PadProfile>();
  readonly rx = input.required<Prescription>();
  /** Show zone guides (screen only). */
  readonly guides = input(true);
  /** Emits true when the body content is taller than the space on the pad. */
  readonly overflow = output<boolean>();

  readonly geo = computed(() => padGeometry(this.pad()));
  readonly showLetterhead = computed(() => !this.pad().preprinted);
  readonly sexLabel = computed(() => SEX_LABEL[this.rx().patient.sex] ?? '');
  readonly medicines = computed(() => this.rx().medicines.filter((m) => m.name.trim()));
  readonly dateLabel = computed(() => {
    const d = this.rx().date;
    if (!d) return '';
    const parsed = new Date(`${d}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? d
      : parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  });
  /** Print correction from calibration + feed offset. */
  readonly transform = computed(() => {
    const p = this.pad();
    const parts: string[] = [];
    if (p.offsetX || p.offsetY) parts.push(`translate(${p.offsetX}mm, ${p.offsetY}mm)`);
    if (p.scale && p.scale !== 1) parts.push(`scale(${p.scale})`);
    return parts.join(' ') || null;
  });

  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  constructor() {
    afterRenderEffect(() => {
      this.rx();
      this.pad();
      const el = this.body()?.nativeElement;
      if (!el) return;
      let over = false;
      for (const col of Array.from(el.querySelectorAll<HTMLElement>('[data-col]'))) {
        if (col.scrollHeight > col.clientHeight + 1) over = true;
      }
      this.overflow.emit(over);
    });
  }
}
