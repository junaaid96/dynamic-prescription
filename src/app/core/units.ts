/**
 * Physical-unit helpers. All pad geometry is stored in millimetres (the unit
 * printers and paper standards use) and converted only for display.
 */
export type LengthUnit = 'mm' | 'cm' | 'in';

export const MM_PER_UNIT: Record<LengthUnit, number> = { mm: 1, cm: 10, in: 25.4 };

/** CSS defines 1in = 96px, so 1mm = 96 / 25.4 px. */
export const PX_PER_MM = 96 / 25.4;

export function toMm(value: number, unit: LengthUnit): number {
  return value * MM_PER_UNIT[unit];
}

export function fromMm(mm: number, unit: LengthUnit, decimals = unit === 'mm' ? 1 : 2): number {
  const factor = 10 ** decimals;
  return Math.round((mm / MM_PER_UNIT[unit]) * factor) / factor;
}

export function mmToPx(mm: number): number {
  return mm * PX_PER_MM;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Turn a ruler measurement of the 100 mm calibration bar into a correction
 * factor. Printing 100 mm and measuring 97 mm means the printer shrinks by
 * 3 %, so content must be scaled by 100 / 97.
 */
export function calibrationFactor(expectedMm: number, measuredMm: number): number {
  if (!(expectedMm > 0) || !(measuredMm > 0)) return 1;
  const factor = expectedMm / measuredMm;
  // Anything outside ±15 % is almost certainly a typo or "fit to page" being on.
  return factor < 0.85 || factor > 1.15 ? 1 : Math.round(factor * 1000) / 1000;
}
