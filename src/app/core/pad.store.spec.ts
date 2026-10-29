import { TestBed } from '@angular/core/testing';
import { createPad } from './pad.model';
import { PadStore } from './pad.store';

describe('PadStore', () => {
  beforeEach(() => localStorage.clear());

  it('starts with one default pad', () => {
    const store = TestBed.inject(PadStore);
    expect(store.pads().length).toBe(1);
    expect(store.active().widthMm).toBe(148);
  });

  it('saves, selects, duplicates and removes pads', () => {
    const store = TestBed.inject(PadStore);
    const first = store.active();
    const a4 = createPad({ name: 'A4', widthMm: 210, heightMm: 297 });
    store.save(a4);
    expect(store.active().id).toBe(a4.id);
    store.select(first.id);
    expect(store.active().id).toBe(first.id);
    const copy = store.duplicate(a4.id)!;
    expect(copy.name).toBe('A4 (copy)');
    expect(store.pads().length).toBe(3);
    store.remove(copy.id);
    expect(store.pads().length).toBe(2);
  });

  it('never removes the last pad', () => {
    const store = TestBed.inject(PadStore);
    store.remove(store.active().id);
    expect(store.pads().length).toBe(1);
  });

  it('persists to localStorage', () => {
    const store = TestBed.inject(PadStore);
    store.patchActive({ name: 'Chamber pad' });
    TestBed.tick();
    expect(localStorage.getItem('rx.pads.v2')).toContain('Chamber pad');
  });
});
