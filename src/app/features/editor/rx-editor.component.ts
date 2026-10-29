import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal,
} from '@angular/core';
import { RxStore, TextField } from '../../core/rx.store';
import { DOSE_CHIPS, DURATION_CHIPS, Medicine, Patient, Sex, TIMING_CHIPS } from '../../core/rx.model';

/** Read the value of an input/textarea/select event without `$any` in templates. */
export function valueOf(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

interface ClinicalField { key: TextField; label: string; placeholder: string; rows: number }

/** The left-hand form: patient, clinical notes, medicines, advice. */
@Component({
  selector: 'app-rx-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rx-editor.component.html',
})
export class RxEditorComponent {
  readonly store = inject(RxStore);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly doseChips = DOSE_CHIPS;
  readonly timingChips = TIMING_CHIPS;
  readonly durationChips = DURATION_CHIPS;
  readonly valueOf = valueOf;
  /** The medicine row being edited, so its quick chips can be shown. */
  readonly activeMed = signal<string | null>(null);

  readonly clinical: ClinicalField[] = [
    { key: 'complaints', label: 'Chief complaints', placeholder: 'Fever for 3 days, cough…', rows: 2 },
    { key: 'history', label: 'History', placeholder: 'Past illness, allergies, current drugs…', rows: 2 },
    { key: 'examination', label: 'On examination', placeholder: 'BP 120/80, Pulse 78, Temp 101°F…', rows: 2 },
    { key: 'diagnosis', label: 'Diagnosis', placeholder: 'Provisional / final diagnosis', rows: 1 },
    { key: 'investigations', label: 'Investigations', placeholder: 'CBC, RBS, X-ray chest P/A…', rows: 2 },
  ];

  setPatient(key: keyof Patient, event: Event): void {
    const v = valueOf(event);
    if (key === 'sex') this.store.setPatient('sex', v as Sex);
    else this.store.setPatient(key, v);
  }

  setField(key: TextField, event: Event): void {
    this.store.setField(key, valueOf(event));
  }

  update(m: Medicine, key: keyof Omit<Medicine, 'id'>, value: string): void {
    this.store.updateMedicine(m.id, { [key]: value });
  }

  /**
   * Add a medicine (optionally pre-filled) and put the cursor in it.
   * An empty trailing row is reused, and focus moves synchronously so fast
   * typists never lose keystrokes.
   */
  add(name = ''): void {
    const meds = this.store.rx().medicines;
    const last = meds[meds.length - 1];
    let med = last && !name && !last.name && !last.dose && !last.timing && !last.duration ? last : null;
    med ??= this.store.addMedicine(name);
    this.activeMed.set(med.id);
    this.cdr.detectChanges();
    document.getElementById(name ? `med-dose-${med.id}` : `med-name-${med.id}`)?.focus();
  }

  /** Enter in a medicine field jumps to the next field instead of submitting. */
  next(event: Event, nextId: string): void {
    event.preventDefault();
    document.getElementById(nextId)?.focus();
  }

  setFollowUpDays(days: number): void {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const label = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    this.store.setField('followUp', `After ${days} days (${label})`);
  }
}
