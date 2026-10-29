import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import {
  Insets, Letterhead, PAPER_PRESETS, PadProfile, createPad, padGeometry, presetFor,
} from '../../core/pad.model';
import { PadStore } from '../../core/pad.store';
import { PrintService } from '../../core/print.service';
import { emptyRx } from '../../core/rx.model';
import { LengthUnit, calibrationFactor, fromMm, toMm } from '../../core/units';
import { PadSheetComponent } from '../sheet/pad-sheet.component';
import { valueOf } from '../editor/rx-editor.component';

export type SetupStep = 'size' | 'layout' | 'letterhead' | 'calibrate';

/** Guided pad setup: size → layout zones → letterhead → test print & calibrate. */
@Component({
  selector: 'app-pad-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PadSheetComponent],
  templateUrl: './pad-setup.component.html',
})
export class PadSetupComponent {
  private readonly store = inject(PadStore);
  private readonly printer = inject(PrintService);

  /** Edit this pad, or create a new one when null. */
  readonly source = input<PadProfile | null>(null);
  readonly closed = output<void>();

  readonly steps: { id: SetupStep; label: string }[] = [
    { id: 'size', label: '1 · Paper size' },
    { id: 'layout', label: '2 · Layout zones' },
    { id: 'letterhead', label: '3 · Letterhead' },
    { id: 'calibrate', label: '4 · Test & calibrate' },
  ];
  readonly presets = PAPER_PRESETS;
  readonly units: LengthUnit[] = ['mm', 'cm', 'in'];
  readonly step = signal<SetupStep>('size');
  readonly draft = signal<PadProfile>(createPad());
  readonly geo = computed(() => padGeometry(this.draft()));
  readonly preset = computed(() => presetFor(this.draft().widthMm, this.draft().heightMm)
    ?? presetFor(this.draft().heightMm, this.draft().widthMm));
  readonly landscape = computed(() => this.draft().widthMm > this.draft().heightMm);
  readonly sampleRx = (() => {
    const rx = emptyRx();
    rx.patient = { name: 'Sample Patient', age: '35 y', sex: 'F', weight: '58 kg', phone: '', id: '' };
    rx.complaints = 'Fever 3 days\nHeadache';
    rx.examination = 'Temp 101°F\nBP 110/70';
    rx.diagnosis = 'Viral fever';
    rx.medicines = [
      { id: 'a', name: 'Tab. Paracetamol 500 mg', dose: '1+1+1', timing: 'After meal', duration: '5 days', note: '' },
      { id: 'b', name: 'Tab. Cetirizine 10 mg', dose: '0+0+1', timing: '', duration: '7 days', note: '' },
    ];
    rx.advice = 'Plenty of fluids and rest';
    return rx;
  })();
  readonly previewScale = computed(() => {
    const { widthMm, heightMm } = this.draft();
    // Fit the sample inside ~300×400 px.
    return Math.min(300 / (widthMm * 3.78), 420 / (heightMm * 3.78), 1);
  });
  readonly measured = signal({ x: 100, y: 100 });
  readonly isNew = signal(true);
  readonly valueOf = valueOf;

  ngOnInit(): void {
    const src = this.source();
    this.isNew.set(!src);
    this.draft.set(src ? structuredClone(src) : createPad({ name: `Pad ${this.store.pads().length + 1}` }));
  }

  /** Show a stored mm value in the doctor's chosen unit. */
  show(mm: number): number {
    return fromMm(mm, this.draft().unit);
  }

  private mm(event: Event): number {
    const n = Number.parseFloat(valueOf(event));
    return Number.isFinite(n) ? Math.max(0, toMm(n, this.draft().unit)) : 0;
  }

  patch(patch: Partial<PadProfile>): void {
    this.draft.update((d) => ({ ...d, ...patch }));
  }

  setLength(key: 'widthMm' | 'heightMm' | 'headerMm' | 'footerMm', event: Event): void {
    this.patch({ [key]: this.mm(event) });
  }

  setMargin(side: keyof Insets, event: Event): void {
    this.draft.update((d) => ({ ...d, margins: { ...d.margins, [side]: this.mm(event) } }));
  }

  setOffset(key: 'offsetX' | 'offsetY', event: Event): void {
    const n = Number.parseFloat(valueOf(event));
    this.patch({ [key]: Number.isFinite(n) ? Math.max(-20, Math.min(20, n)) : 0 });
  }

  setNumber(key: 'sideColumnPct' | 'fontPt', event: Event): void {
    const n = Number.parseFloat(valueOf(event));
    if (Number.isFinite(n)) this.patch({ [key]: n });
  }

  setLetterhead(key: keyof Letterhead, event: Event): void {
    this.draft.update((d) => ({ ...d, letterhead: { ...d.letterhead, [key]: valueOf(event) } }));
  }

  usePreset(id: string): void {
    const p = this.presets.find((x) => x.id === id);
    if (!p) return;
    const land = this.landscape();
    this.patch(land ? { widthMm: p.heightMm, heightMm: p.widthMm } : { widthMm: p.widthMm, heightMm: p.heightMm });
  }

  rotate(): void {
    this.draft.update((d) => ({ ...d, widthMm: d.heightMm, heightMm: d.widthMm }));
  }

  setMeasured(axis: 'x' | 'y', event: Event): void {
    const n = Number.parseFloat(valueOf(event));
    this.measured.update((m) => ({ ...m, [axis]: Number.isFinite(n) ? n : 100 }));
  }

  /** Average of both bars; printers normally scale both axes equally. */
  readonly suggestedScale = computed(() => {
    const m = this.measured();
    return calibrationFactor(100, (m.x + m.y) / 2);
  });

  applyCalibration(): void {
    this.patch({ scale: Math.round(this.draft().scale * this.suggestedScale() * 1000) / 1000 });
    this.measured.set({ x: 100, y: 100 });
  }

  testPrint(): void {
    this.printer.print(this.draft(), 'calibration');
  }

  go(delta: 1 | -1): void {
    const i = this.steps.findIndex((s) => s.id === this.step());
    const next = this.steps[i + delta];
    if (next) this.step.set(next.id);
  }

  save(): void {
    this.store.save(this.draft());
    this.closed.emit();
  }
}
