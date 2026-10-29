import { clamp } from './units';
import type { LengthUnit } from './units';

export interface Insets { top: number; right: number; bottom: number; left: number }

/** A doctor's physical prescription pad. Every length is in millimetres. */
export interface PadProfile {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  /** Unit the doctor prefers to see in the setup screen. */
  unit: LengthUnit;
  /** Unprintable / keep-clear edge of the sheet. */
  margins: Insets;
  /** Height of the letterhead band at the top. */
  headerMm: number;
  /** Height of the footer band at the bottom. */
  footerMm: number;
  /**
   * true  = pad is pre-printed: leave header/footer blank on paper (they are
   *         only drawn as a ghost guide on screen).
   * false = plain paper: print our own letterhead and footer.
   */
  preprinted: boolean;
  /** Width of the left clinical-notes column, % of the body. 0 hides it. */
  sideColumnPct: number;
  /** Base font size in points for the printed body. */
  fontPt: number;
  /** Printer correction from the calibration print (1 = none). */
  scale: number;
  /** Nudge in mm to compensate for printer feed offset. */
  offsetX: number;
  offsetY: number;
  letterhead: Letterhead;
}

export interface Letterhead {
  doctorName: string;
  qualifications: string;
  specialty: string;
  registration: string;
  clinic: string;
  address: string;
  phone: string;
  hours: string;
  footerNote: string;
}

export interface PaperPreset { id: string; label: string; widthMm: number; heightMm: number }

export const PAPER_PRESETS: readonly PaperPreset[] = [
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'a5', label: 'A5', widthMm: 148, heightMm: 210 },
  { id: 'b5', label: 'B5', widthMm: 176, heightMm: 250 },
  { id: 'letter', label: 'US Letter', widthMm: 215.9, heightMm: 279.4 },
  { id: 'half-letter', label: 'Half Letter', widthMm: 139.7, heightMm: 215.9 },
  { id: 'legal', label: 'Legal', widthMm: 215.9, heightMm: 355.6 },
];

export function presetFor(widthMm: number, heightMm: number): PaperPreset | undefined {
  return PAPER_PRESETS.find(
    (p) => Math.abs(p.widthMm - widthMm) < 0.6 && Math.abs(p.heightMm - heightMm) < 0.6,
  );
}

export function emptyLetterhead(): Letterhead {
  return {
    doctorName: 'Dr. Your Name',
    qualifications: 'MBBS, FCPS',
    specialty: 'Consultant, Medicine',
    registration: 'Reg. No. 00000',
    clinic: 'Clinic / Chamber name',
    address: 'Chamber address',
    phone: '+00 0000 000000',
    hours: 'Sat–Thu, 5–9 PM',
    footerNote: 'Please bring this prescription on your next visit.',
  };
}

export function createPad(partial: Partial<PadProfile> = {}): PadProfile {
  return {
    id: partial.id ?? newId('pad'),
    name: 'A5 pad',
    widthMm: 148,
    heightMm: 210,
    unit: 'mm',
    margins: { top: 6, right: 8, bottom: 6, left: 8 },
    headerMm: 38,
    footerMm: 14,
    preprinted: false,
    sideColumnPct: 34,
    fontPt: 10,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    letterhead: emptyLetterhead(),
    ...partial,
  };
}

export interface ContentBox { x: number; y: number; width: number; height: number }

export interface PadGeometry {
  page: { width: number; height: number };
  header: ContentBox;
  body: ContentBox;
  footer: ContentBox;
  sideColumn: ContentBox | null;
  mainColumn: ContentBox;
  /** Human-readable problems, empty when the pad is usable. */
  problems: string[];
}

/** Lay the pad out into header / body / footer boxes (all mm). */
export function padGeometry(pad: PadProfile): PadGeometry {
  const problems: string[] = [];
  const { widthMm: w, heightMm: h, margins: m } = pad;
  if (w < 50 || h < 50) problems.push('Pad is smaller than 50 mm; check width and height.');
  const innerW = Math.max(0, w - m.left - m.right);
  const innerH = Math.max(0, h - m.top - m.bottom);
  const header = Math.max(0, pad.headerMm);
  const footer = Math.max(0, pad.footerMm);
  const bodyH = innerH - header - footer;
  if (innerW < 40) problems.push('Left and right margins leave less than 40 mm to write in.');
  if (bodyH < 40) problems.push('Header, footer and margins leave less than 40 mm for the prescription.');
  const body: ContentBox = { x: m.left, y: m.top + header, width: innerW, height: Math.max(0, bodyH) };
  const sidePct = clamp(pad.sideColumnPct, 0, 50);
  const sideW = (innerW * sidePct) / 100;
  return {
    page: { width: w, height: h },
    header: { x: m.left, y: m.top, width: innerW, height: header },
    body,
    footer: { x: m.left, y: h - m.bottom - footer, width: innerW, height: footer },
    sideColumn: sidePct > 0 ? { ...body, width: sideW } : null,
    mainColumn: { ...body, x: body.x + sideW, width: innerW - sideW },
    problems,
  };
}

/** The @page rule that makes the browser print at the pad's true size. */
export function pageCss(pad: PadProfile): string {
  return `@page { size: ${round(pad.widthMm)}mm ${round(pad.heightMm)}mm; margin: 0; }`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
