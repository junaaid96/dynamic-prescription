import { TestBed } from '@angular/core/testing';
import { BodySection, LayoutConfig } from '../models/section.model';
import { ValidationService } from './validation.service';

function layout(overrides: Partial<LayoutConfig> = {}): LayoutConfig {
  return {
    pageType: 'A4',
    totalWidth: 8.27,
    totalHeight: 11.69,
    leftMargin: 0.1,
    rightMargin: 0.1,
    topMargin: 0.1,
    bottomMargin: 0.1,
    leftPadding: 0.1,
    rightPadding: 0.1,
    topPadding: 0.1,
    bottomPadding: 0.1,
    headerHeight: 1.5,
    footerHeight: 1.5,
    columnLayout: { column1: 50, column2: 0, column3: 50 },
    bodySection: {
      leftMargin: 0,
      rightMargin: 0,
      topMargin: 0,
      bottomMargin: 0,
      separatorLine: false,
      bottomLine: false,
    },
    ...overrides,
  };
}

function section(overrides: Partial<BodySection> = {}): BodySection {
  return {
    id: 'section-1',
    type: 'custom',
    name: 'Custom',
    content: 'Notes',
    position: { x: 10, y: 10 },
    size: { width: 40, height: 20 },
    style: {
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left',
      fontColor: '#000000',
      padding: 8,
      margin: 3,
    },
    ...overrides,
  };
}

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidationService);
  });

  it('accepts a standard page and flags margins that exceed it', () => {
    expect(service.validateLayoutConfig(layout()).isValid).toBe(true);

    const invalid = service.validateLayoutConfig(layout({
      leftMargin: 5,
      rightMargin: 5,
      totalWidth: 8,
    }));
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.some((error) => error.includes('Horizontal margins'))).toBe(true);
  });

  it('auto-fixes column widths without mutating the original layout', () => {
    const original = layout({ columnLayout: { column1: 0, column2: 0, column3: 0 } });
    const fixed = service.autoFixLayout(original);

    expect(original.columnLayout.column1).toBe(0);
    expect(fixed.columnLayout).not.toBe(original.columnLayout);
    expect(fixed.columnLayout.column1).toBe(100);
    expect(fixed.columnLayout.column2).toBe(0);
    expect(fixed.columnLayout.column3).toBe(0);
    expect(Number.isNaN(fixed.columnLayout.column1)).toBe(false);
  });

  it('auto-fixes a section without mutating the caller', () => {
    const original = section({
      position: { x: -10, y: 10 },
      size: { width: 200, height: 20 },
    });
    const fixed = service.autoFixSection(original);

    expect(original.position.x).toBe(-10);
    expect(original.size.width).toBe(200);
    expect(fixed.position).not.toBe(original.position);
    expect(fixed.position.x).toBe(0);
    expect(fixed.size.width).toBeLessThanOrEqual(100);
  });

  it('detects overlap and refuses an out-of-bounds resolution', () => {
    const first = section({ id: 'a', name: 'A', position: { x: 0, y: 0 }, size: { width: 50, height: 50 } });
    const second = section({ id: 'b', name: 'B', position: { x: 25, y: 25 }, size: { width: 50, height: 50 } });
    expect(service.sectionsOverlap(first, second)).toBe(true);

    const result = service.validateAllSections([first, second]);
    expect(result.warnings.some((warning) => warning.includes('overlap'))).toBe(true);

    const full = section({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
    const covering = section({ id: 'cover', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
    expect(service.resolveOverlap(full, covering)).toBeNull();
  });
});
