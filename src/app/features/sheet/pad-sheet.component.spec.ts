import { TestBed } from '@angular/core/testing';
import { createPad } from '../../core/pad.model';
import { emptyRx } from '../../core/rx.model';
import { PadSheetComponent } from './pad-sheet.component';

function render(padPatch = {}, guides = true) {
  const fixture = TestBed.createComponent(PadSheetComponent);
  const rx = emptyRx();
  rx.patient.name = 'Ayesha';
  rx.diagnosis = 'Migraine';
  rx.medicines = [{ id: '1', name: 'Tab. Naproxen 500 mg', dose: '1+0+1', timing: 'After meal', duration: '5 days', note: '' }];
  fixture.componentRef.setInput('pad', createPad(padPatch));
  fixture.componentRef.setInput('rx', rx);
  fixture.componentRef.setInput('guides', guides);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('PadSheetComponent', () => {
  it('renders the sheet at the pad size in mm', () => {
    const el = render({ widthMm: 139.7, heightMm: 215.9 });
    const sheet = el.querySelector<HTMLElement>('.rx-sheet')!;
    expect(sheet.style.width).toBe('139.7mm');
    expect(sheet.style.height).toBe('215.9mm');
  });

  it('shows patient, diagnosis and medicines', () => {
    const text = render().textContent!;
    expect(text).toContain('Ayesha');
    expect(text).toContain('Migraine');
    expect(text).toContain('1. Tab. Naproxen 500 mg');
    expect(text).toContain('1+0+1');
  });

  it('prints our letterhead on plain paper', () => {
    const el = render({ preprinted: false, letterhead: { ...createPad().letterhead, doctorName: 'Dr. Test' } });
    expect(el.textContent).toContain('Dr. Test');
  });

  it('leaves the letterhead blank on a pre-printed pad', () => {
    const el = render({ preprinted: true, letterhead: { ...createPad().letterhead, doctorName: 'Dr. Test' } }, false);
    expect(el.textContent).not.toContain('Dr. Test');
    expect(el.querySelector('.guide-zone')).toBeNull();
  });

  it('applies printer calibration as a transform', () => {
    const el = render({ scale: 1.02, offsetX: 1.5 });
    const inner = el.querySelector<HTMLElement>('.rx-sheet > div')!;
    expect(inner.style.transform).toContain('scale(1.02)');
    expect(inner.style.transform).toContain('translate(1.5mm');
  });
});
