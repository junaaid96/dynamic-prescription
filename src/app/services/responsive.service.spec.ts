import { TestBed } from '@angular/core/testing';
import { ResponsiveService } from './responsive.service';

describe('ResponsiveService', () => {
  let service: ResponsiveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResponsiveService);
  });

  it('classifies the current viewport', () => {
    const size = service.getCurrentScreenSize();
    expect(size.width).toBe(window.innerWidth);
    expect(size.height).toBe(window.innerHeight);
    expect(size.isMobile).toBe(size.width < 768);
    expect(size.isTablet).toBe(size.width >= 768 && size.width < 1024);
    expect(size.isDesktop).toBe(size.width >= 1024);
  });

  it('returns a layout hint for the current breakpoint', () => {
    const config = service.getOptimalConfigForScreen();
    const size = service.screenSize();
    if (size.isMobile) {
      expect(config.previewScale).toBe(0.5);
      expect(config.showColumnLayout).toBe(false);
    } else if (size.isTablet) {
      expect(config.previewScale).toBe(0.7);
    } else {
      expect(config.previewScale).toBe(1);
      expect(config.showColumnLayout).toBe(true);
    }
  });
});
