import { PAPER_PRESETS, createPad, pageCss, padGeometry, presetFor } from './pad.model';

describe('pad model', () => {
  it('splits an A5 pad into header, body and footer that add up', () => {
    const pad = createPad({ widthMm: 148, heightMm: 210, headerMm: 40, footerMm: 15,
      margins: { top: 5, right: 8, bottom: 5, left: 8 } });
    const g = padGeometry(pad);
    expect(g.header).toEqual({ x: 8, y: 5, width: 132, height: 40 });
    expect(g.body.y).toBe(45);
    expect(g.body.height).toBe(210 - 5 - 5 - 40 - 15);
    expect(g.footer.y + g.footer.height).toBe(205);
    expect(g.problems).toEqual([]);
  });

  it('splits the body into side and main columns', () => {
    const g = padGeometry(createPad({ sideColumnPct: 25 }));
    expect(g.sideColumn!.width + g.mainColumn.width).toBeCloseTo(g.body.width);
    expect(g.mainColumn.x).toBeCloseTo(g.body.x + g.sideColumn!.width);
  });

  it('has no side column when set to 0 %', () => {
    const g = padGeometry(createPad({ sideColumnPct: 0 }));
    expect(g.sideColumn).toBeNull();
    expect(g.mainColumn.width).toBe(g.body.width);
  });

  it('reports a pad with no room left for the prescription', () => {
    const g = padGeometry(createPad({ heightMm: 120, headerMm: 60, footerMm: 30 }));
    expect(g.problems.length).toBeGreaterThan(0);
    expect(g.body.height).toBeGreaterThanOrEqual(0);
  });

  it('builds an @page rule with the exact physical size', () => {
    expect(pageCss(createPad({ widthMm: 139.7, heightMm: 215.9 })))
      .toBe('@page { size: 139.7mm 215.9mm; margin: 0; }');
  });

  it('recognises presets with tolerance', () => {
    expect(presetFor(210, 297)?.id).toBe('a4');
    expect(presetFor(215.9, 279.4)?.id).toBe('letter');
    expect(presetFor(100, 100)).toBeUndefined();
    expect(PAPER_PRESETS.every((p) => p.widthMm < p.heightMm)).toBe(true);
  });
});
