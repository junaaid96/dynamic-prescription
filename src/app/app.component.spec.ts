import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

@Component({
  selector: 'app-comprehensive-layout',
  template: '<section class="layout-stub">layout</section>',
})
class LayoutStub {}

describe('AppComponent', () => {
  beforeEach(async () => {
    TestBed.overrideComponent(AppComponent, {
      set: { imports: [LayoutStub] },
    });
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose the application title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title()).toBe('dynamic-prescription');
  });

  it('should render the prescription layout', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-comprehensive-layout')).not.toBeNull();
    expect(compiled.querySelector('.layout-stub')?.textContent).toContain('layout');
  });
});
