import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = TestBed.runInInjectionContext(() => new SafeHtmlPipe());
  });

  function html(value: string | null): string {
    return sanitizer.sanitize(SecurityContext.HTML, pipe.transform(value)) ?? '';
  }

  it('returns an empty string for missing content', () => {
    expect(html(null)).toBe('');
    expect(html('')).toBe('');
  });

  it('turns plain newlines into breaks and preserves lists', () => {
    expect(html('line one\nline two')).toContain('<br>');
    expect(html('<ul><li>Item</li></ul>')).toContain('list-style-type: disc');
    expect(html('<p>Hello</p>')).toContain('font-size: inherit');
  });
});
