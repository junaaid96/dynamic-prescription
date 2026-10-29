import { Injectable, computed, effect, signal } from '@angular/core';
import { PadProfile, createPad, newId, padGeometry } from './pad.model';
import { readJson, writeJson } from './storage';

const KEY = 'rx.pads.v2';

interface PadState { pads: PadProfile[]; activeId: string }

function initialState(): PadState {
  const saved = readJson<PadState | null>(KEY, null);
  if (saved && Array.isArray(saved.pads) && saved.pads.length) {
    const pads = saved.pads.map((p) => createPad(p));
    const activeId = pads.some((p) => p.id === saved.activeId) ? saved.activeId : pads[0].id;
    return { pads, activeId };
  }
  const pad = createPad({ name: 'My A5 pad' });
  return { pads: [pad], activeId: pad.id };
}

/** Saved pad profiles (one per printer / pad stock) and the one in use. */
@Injectable({ providedIn: 'root' })
export class PadStore {
  private readonly state = signal<PadState>(initialState());

  readonly pads = computed(() => this.state().pads);
  readonly active = computed(() => {
    const s = this.state();
    return s.pads.find((p) => p.id === s.activeId) ?? s.pads[0];
  });
  readonly geometry = computed(() => padGeometry(this.active()));

  constructor() {
    effect(() => writeJson(KEY, this.state()));
  }

  select(id: string): void {
    this.state.update((s) => (s.pads.some((p) => p.id === id) ? { ...s, activeId: id } : s));
  }

  /** Insert or replace a profile and make it active. */
  save(pad: PadProfile): void {
    this.state.update((s) => {
      const exists = s.pads.some((p) => p.id === pad.id);
      const pads = exists ? s.pads.map((p) => (p.id === pad.id ? pad : p)) : [...s.pads, pad];
      return { pads, activeId: pad.id };
    });
  }

  patchActive(patch: Partial<PadProfile>): void {
    this.save({ ...this.active(), ...patch });
  }

  duplicate(id: string): PadProfile | undefined {
    const src = this.state().pads.find((p) => p.id === id);
    if (!src) return undefined;
    const copy = { ...structuredClone(src), id: newId('pad'), name: `${src.name} (copy)` };
    this.save(copy);
    return copy;
  }

  remove(id: string): void {
    this.state.update((s) => {
      if (s.pads.length <= 1) return s;
      const pads = s.pads.filter((p) => p.id !== id);
      return { pads, activeId: s.activeId === id ? pads[0].id : s.activeId };
    });
  }
}
