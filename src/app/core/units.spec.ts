import { calibrationFactor, clamp, fromMm, mmToPx, toMm } from './units';

describe('units', () => {
  it('converts between mm, cm and inches', () => {
    expect(toMm(1, 'in')).toBe(25.4);
    expect(toMm(2.5, 'cm')).toBe(25);
    expect(fromMm(210, 'in')).toBe(8.27);
    expect(fromMm(148, 'cm')).toBe(14.8);
    expect(fromMm(toMm(5.5, 'in'), 'in')).toBe(5.5);
  });

  it('maps mm to CSS px at 96 dpi', () => {
    expect(mmToPx(25.4)).toBeCloseTo(96);
  });

  it('clamps values', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });

  it('derives a print correction from a ruler measurement', () => {
    expect(calibrationFactor(100, 97)).toBeCloseTo(1.031, 3);
    expect(calibrationFactor(100, 102)).toBeCloseTo(0.98, 3);
    expect(calibrationFactor(100, 100)).toBe(1);
  });

  it('ignores implausible calibration input', () => {
    expect(calibrationFactor(100, 0)).toBe(1);
    expect(calibrationFactor(100, 60)).toBe(1);
  });
});
