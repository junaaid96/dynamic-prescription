import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [AppComponent] }).compileComponents();
  });

  it('renders editor, preview and print sheet', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-rx-editor')).not.toBeNull();
    expect(el.querySelector('app-preview-pane app-pad-sheet')).not.toBeNull();
    expect(el.querySelector('.print-root app-pad-sheet')).not.toBeNull();
  });

  it('opens pad setup from the toolbar and shortcut', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, code: 'KeyS', key: 'ß' }));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-pad-setup')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-pad-setup')).toBeNull();
  });

  it('adds a medicine row from the editor', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('#add-medicine')!.click();
    await fixture.whenStable();
    expect(el.querySelectorAll('.med-row').length).toBe(1);
  });
});
