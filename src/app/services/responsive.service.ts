import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {
  private screenSizeSubject = new BehaviorSubject<ScreenSize>(this.getScreenSize());
  public screenSize$: Observable<ScreenSize> = this.screenSizeSubject.asObservable();

  constructor() {
    // Listen for window resize events
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.screenSizeSubject.next(this.getScreenSize());
      });
  }

  private getScreenSize(): ScreenSize {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024
    };
  }

  getCurrentScreenSize(): ScreenSize {
    return this.getScreenSize();
  }

  // Helper method to adjust layout based on screen size
  getOptimalConfigForScreen(): any {
    const screenSize = this.getScreenSize();
    
    if (screenSize.isMobile) {
      return {
        configPanelWidth: '100%',
        previewScale: 0.5,
        showColumnLayout: false
      };
    } else if (screenSize.isTablet) {
      return {
        configPanelWidth: '300px',
        previewScale: 0.7,
        showColumnLayout: true
      };
    } else {
      return {
        configPanelWidth: '350px',
        previewScale: 1,
        showColumnLayout: true
      };
    }
  }
}