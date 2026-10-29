import { Injectable, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

export interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface ResponsiveLayoutConfig {
  configPanelWidth: string;
  previewScale: number;
  showColumnLayout: boolean;
}

const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

@Injectable({
  providedIn: 'root',
})
export class ResponsiveService {
  readonly screenSize = toSignal(
    fromEvent(window, 'resize').pipe(
      debounceTime(200),
      map(() => this.readScreenSize()),
      distinctUntilChanged((previous, next) => previous.width === next.width && previous.height === next.height),
    ),
    { initialValue: this.readScreenSize() },
  );

  readonly optimalConfig = computed(() => this.configFor(this.screenSize()));

  getCurrentScreenSize(): ScreenSize {
    return this.screenSize();
  }

  getOptimalConfigForScreen(): ResponsiveLayoutConfig {
    return this.optimalConfig();
  }

  private readScreenSize(): ScreenSize {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      width,
      height,
      isMobile: width < MOBILE_MAX_WIDTH,
      isTablet: width >= MOBILE_MAX_WIDTH && width < TABLET_MAX_WIDTH,
      isDesktop: width >= TABLET_MAX_WIDTH,
    };
  }

  private configFor(screenSize: ScreenSize): ResponsiveLayoutConfig {
    if (screenSize.isMobile) {
      return { configPanelWidth: '100%', previewScale: 0.5, showColumnLayout: false };
    }
    if (screenSize.isTablet) {
      return { configPanelWidth: '300px', previewScale: 0.7, showColumnLayout: true };
    }
    return { configPanelWidth: '350px', previewScale: 1, showColumnLayout: true };
  }
}
