import { TestBed } from '@angular/core/testing';
import { RxStore } from './rx.store';

describe('RxStore', () => {
  let store: RxStore;
  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(RxStore);
  });

  it('edits patient, fields and medicines', () => {
    store.setPatient('name', 'Rahim');
    store.setField('diagnosis', 'Viral fever');
    const m = store.addMedicine('Tab. Paracetamol 500 mg');
    store.updateMedicine(m.id, { dose: '1+1+1' });
    const rx = store.rx();
    expect(rx.patient.name).toBe('Rahim');
    expect(rx.diagnosis).toBe('Viral fever');
    expect(rx.medicines[0]).toMatchObject({ name: 'Tab. Paracetamol 500 mg', dose: '1+1+1' });
  });

  it('reorders and removes medicines', () => {
    const a = store.addMedicine('A');
    const b = store.addMedicine('B');
    store.moveMedicine(b.id, -1);
    expect(store.rx().medicines.map((m) => m.name)).toEqual(['B', 'A']);
    store.removeMedicine(a.id);
    expect(store.rx().medicines.map((m) => m.name)).toEqual(['B']);
  });

  it('learns favourites and pre-fills their usual dose', () => {
    for (let i = 0; i < 2; i++) {
      const m = store.addMedicine('Tab. X 5 mg');
      store.updateMedicine(m.id, { dose: '0+0+1', duration: '30 days' });
      store.setPatient('name', `P${i}`);
      store.newRx();
    }
    expect(store.favourites()).toContain('Tab. X 5 mg');
    expect(store.drugSuggestions()[0]).toBe('Tab. X 5 mg');
    const again = store.addMedicine('Tab. X 5 mg');
    expect(again).toMatchObject({ dose: '0+0+1', duration: '30 days' });
    expect(store.history().length).toBe(2);
  });

  it('does not archive an empty prescription', () => {
    store.newRx();
    expect(store.history().length).toBe(0);
  });

  it('saves and applies templates without duplicating medicines', () => {
    store.setField('diagnosis', 'URTI');
    store.addMedicine('Tab. Cetirizine 10 mg');
    const tpl = store.saveTemplate('Cold');
    store.newRx();
    store.addMedicine('Tab. Cetirizine 10 mg');
    store.applyTemplate(tpl);
    expect(store.rx().diagnosis).toBe('URTI');
    expect(store.rx().medicines.length).toBe(1);
  });

  it('repeats a past prescription for a new visit', () => {
    store.setPatient('name', 'Karim');
    store.addMedicine('Tab. Amlodipine 5 mg');
    const old = store.rx();
    store.repeat(old);
    expect(store.rx().id).not.toBe(old.id);
    expect(store.rx().patient.name).toBe('Karim');
    expect(store.rx().medicines[0].id).not.toBe(old.medicines[0].id);
  });

  it('auto-saves the draft', () => {
    store.setPatient('name', 'Draft person');
    TestBed.tick();
    expect(localStorage.getItem('rx.draft.v2')).toContain('Draft person');
  });
});
