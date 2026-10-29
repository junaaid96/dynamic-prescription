import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PadProfile, padGeometry } from '../../core/pad.model';

/**
 * Test print: outlines of every zone plus 100 mm rulers. Print it on a real
 * pad (or hold it against one) and measure the bars to calibrate the printer.
 */
@Component({
  selector: 'app-calibration-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let g = geo();
    @let p = pad();
    <div class="relative overflow-hidden bg-white text-black"
         [style.width.mm]="g.page.width" [style.height.mm]="g.page.height">
      <div class="absolute inset-0 origin-top-left" [style.transform]="transform()">
        @for (z of zones(); track z.label) {
          <div class="absolute flex items-center justify-center border border-dashed border-black text-[8pt]"
               [style.left.mm]="z.box.x" [style.top.mm]="z.box.y"
               [style.width.mm]="z.box.width" [style.height.mm]="z.box.height">{{ z.label }}</div>
        }
        <!-- 100 mm horizontal bar -->
        <div class="absolute" [style.left.mm]="g.body.x + 4" [style.top.mm]="g.body.y + 10">
          <div class="h-[3mm] w-[100mm] border-x-2 border-black bg-[repeating-linear-gradient(90deg,#000_0_0.3mm,transparent_0.3mm_10mm)]"></div>
          <div class="mt-[1mm] text-[8pt]">← 100 mm →  (measure this)</div>
        </div>
        <!-- 100 mm vertical bar -->
        <div class="absolute flex" [style.left.mm]="g.body.x + 8" [style.top.mm]="g.body.y + 22">
          <div class="h-[100mm] w-[3mm] border-y-2 border-black bg-[repeating-linear-gradient(180deg,#000_0_0.3mm,transparent_0.3mm_10mm)]"></div>
          <div class="ml-[2mm] self-center text-[8pt] [writing-mode:vertical-rl]">100 mm</div>
        </div>
        <div class="absolute right-[2mm] bottom-[2mm] text-right text-[7pt]"
             [style.bottom.mm]="p.margins.bottom + 2" [style.right.mm]="p.margins.right + 2">
          {{ p.name }} · {{ g.page.width }} × {{ g.page.height }} mm · scale {{ p.scale }}
        </div>
      </div>
    </div>
  `,
})
export class CalibrationSheetComponent {
  readonly pad = input.required<PadProfile>();
  readonly geo = computed(() => padGeometry(this.pad()));
  readonly zones = computed(() => {
    const g = this.geo();
    return [
      { label: 'Header / letterhead', box: g.header },
      { label: 'Prescription body', box: g.body },
      { label: 'Footer', box: g.footer },
    ].filter((z) => z.box.height > 0);
  });
  readonly transform = computed(() => {
    const p = this.pad();
    return `translate(${p.offsetX}mm, ${p.offsetY}mm) scale(${p.scale || 1})`;
  });
}
