import { Injectable, computed, effect, signal } from '@angular/core';
import { newId } from './pad.model';
import {
  Medicine, Patient, Prescription, RxTemplate, STARTER_DRUGS, emptyMedicine, emptyRx, isBlank,
} from './rx.model';
import { readJson, writeJson } from './storage';

const DRAFT_KEY = 'rx.draft.v2';
const TEMPLATES_KEY = 'rx.templates.v2';
const HISTORY_KEY = 'rx.history.v2';
const USAGE_KEY = 'rx.drugUsage.v2';
const HISTORY_LIMIT = 50;

export type TextField = 'complaints' | 'history' | 'examination' | 'investigations' | 'diagnosis' | 'advice' | 'followUp' | 'date';

/**
 * The prescription being written plus everything that makes the next one
 * faster: templates (order sets), recent prescriptions and learned medicines.
 */
@Injectable({ providedIn: 'root' })
export class RxStore {
  readonly rx = signal<Prescription>(this.loadDraft());
  readonly templates = signal<RxTemplate[]>(readJson<RxTemplate[]>(TEMPLATES_KEY, []));
  readonly history = signal<Prescription[]>(readJson<Prescription[]>(HISTORY_KEY, []));
  /** How often each medicine line was used, with its last dose so it can be pre-filled. */
  readonly usage = signal<Record<string, { count: number; last: Omit<Medicine, 'id' | 'name'> }>>(
    readJson(USAGE_KEY, {}),
  );
  readonly lastSaved = signal<number | null>(null);

  /** Favourites first (most used), then the starter list. */
  readonly drugSuggestions = computed(() => {
    const used = Object.entries(this.usage())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name]) => name);
    return [...new Set([...used, ...STARTER_DRUGS])];
  });
  readonly favourites = computed(() =>
    Object.entries(this.usage())
      .filter(([, u]) => u.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([name]) => name),
  );

  constructor() {
    // Auto-save the draft on every change (debounced by the browser's own batching is enough here).
    effect(() => {
      writeJson(DRAFT_KEY, this.rx());
      this.lastSaved.set(Date.now());
    });
    effect(() => writeJson(TEMPLATES_KEY, this.templates()));
    effect(() => writeJson(HISTORY_KEY, this.history()));
    effect(() => writeJson(USAGE_KEY, this.usage()));
  }

  private loadDraft(): Prescription {
    const d = readJson<Prescription | null>(DRAFT_KEY, null);
    return d && d.patient && Array.isArray(d.medicines) ? { ...emptyRx(), ...d } : emptyRx();
  }

  private touch(fn: (rx: Prescription) => Prescription): void {
    this.rx.update((rx) => ({ ...fn(rx), updatedAt: Date.now() }));
  }

  setField(field: TextField, value: string): void {
    this.touch((rx) => ({ ...rx, [field]: value }));
  }

  setPatient<K extends keyof Patient>(key: K, value: Patient[K]): void {
    this.touch((rx) => ({ ...rx, patient: { ...rx.patient, [key]: value } }));
  }

  addMedicine(name = ''): Medicine {
    const known = this.usage()[name]?.last;
    const med = emptyMedicine({ name, ...(known ?? {}) });
    this.touch((rx) => ({ ...rx, medicines: [...rx.medicines, med] }));
    return med;
  }

  updateMedicine(id: string, patch: Partial<Medicine>): void {
    // Picking a known medicine pre-fills its usual dose if the row is still empty.
    if (patch.name) {
      const known = this.usage()[patch.name]?.last;
      const row = this.rx().medicines.find((m) => m.id === id);
      if (known && row && !row.dose && !row.duration) patch = { ...known, ...patch };
    }
    this.touch((rx) => ({
      ...rx,
      medicines: rx.medicines.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  removeMedicine(id: string): void {
    this.touch((rx) => ({ ...rx, medicines: rx.medicines.filter((m) => m.id !== id) }));
  }

  moveMedicine(id: string, delta: -1 | 1): void {
    this.touch((rx) => {
      const list = [...rx.medicines];
      const i = list.findIndex((m) => m.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= list.length) return rx;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...rx, medicines: list };
    });
  }

  /** Start a fresh prescription; the current one goes to history if it has content. */
  newRx(): void {
    this.archive();
    this.rx.set(emptyRx());
  }

  /** Called after printing: remember the prescription and learn medicine habits. */
  archive(): void {
    const rx = this.rx();
    if (isBlank(rx)) return;
    this.history.update((h) => [rx, ...h.filter((x) => x.id !== rx.id)].slice(0, HISTORY_LIMIT));
    this.usage.update((u) => {
      const next = { ...u };
      for (const m of rx.medicines) {
        const name = m.name.trim();
        if (!name) continue;
        next[name] = {
          count: (next[name]?.count ?? 0) + 1,
          last: { dose: m.dose, timing: m.timing, duration: m.duration, note: m.note },
        };
      }
      return next;
    });
  }

  open(rx: Prescription): void {
    this.archive();
    this.rx.set(structuredClone(rx));
  }

  /** Re-use a past prescription for a follow-up visit (same patient, new date). */
  repeat(rx: Prescription): void {
    this.archive();
    const copy = structuredClone(rx);
    this.rx.set({
      ...emptyRx(),
      patient: copy.patient,
      diagnosis: copy.diagnosis,
      medicines: copy.medicines.map((m) => ({ ...m, id: newId('med') })),
      advice: copy.advice,
    });
  }

  saveTemplate(name: string): RxTemplate {
    const rx = this.rx();
    const tpl: RxTemplate = {
      id: newId('tpl'),
      name: name.trim() || rx.diagnosis.split('\n')[0] || 'Template',
      data: {
        complaints: rx.complaints,
        examination: rx.examination,
        investigations: rx.investigations,
        diagnosis: rx.diagnosis,
        medicines: rx.medicines.map((m) => ({ ...m })),
        advice: rx.advice,
      },
    };
    this.templates.update((t) => [tpl, ...t]);
    return tpl;
  }

  /** Merge a template in: text is appended, medicines are added (no duplicates). */
  applyTemplate(tpl: RxTemplate): void {
    const join = (a: string, b: string) => (a.trim() && b.trim() ? `${a.trim()}\n${b.trim()}` : a || b);
    this.touch((rx) => {
      const have = new Set(rx.medicines.map((m) => m.name.trim().toLowerCase()));
      const add = tpl.data.medicines
        .filter((m) => !have.has(m.name.trim().toLowerCase()))
        .map((m) => ({ ...m, id: newId('med') }));
      return {
        ...rx,
        complaints: join(rx.complaints, tpl.data.complaints),
        examination: join(rx.examination, tpl.data.examination),
        investigations: join(rx.investigations, tpl.data.investigations),
        diagnosis: join(rx.diagnosis, tpl.data.diagnosis),
        advice: join(rx.advice, tpl.data.advice),
        medicines: [...rx.medicines.filter((m) => m.name.trim()), ...add],
      };
    });
  }

  deleteTemplate(id: string): void {
    this.templates.update((t) => t.filter((x) => x.id !== id));
  }
}
