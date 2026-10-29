import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PadProfile } from './core/pad.model';
import { PadStore } from './core/pad.store';
import { PrintService } from './core/print.service';
import { RxStore } from './core/rx.store';
import { ThemeService } from './core/theme.service';
import { RxEditorComponent, valueOf } from './features/editor/rx-editor.component';
import { LibraryPanelComponent } from './features/library/library-panel.component';
import { PadSetupComponent } from './features/pad-setup/pad-setup.component';
import { PreviewPaneComponent } from './features/preview/preview-pane.component';
import { CalibrationSheetComponent } from './features/sheet/calibration-sheet.component';
import { PadSheetComponent } from './features/sheet/pad-sheet.component';

type Panel = null | 'setup' | 'library' | 'help';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RxEditorComponent, PreviewPaneComponent, PadSetupComponent, LibraryPanelComponent,
    PadSheetComponent, CalibrationSheetComponent,
  ],
  templateUrl: './app.component.html',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class AppComponent {
  readonly pads = inject(PadStore);
  readonly rx = inject(RxStore);
  readonly theme = inject(ThemeService);
  readonly printer = inject(PrintService);

  readonly panel = signal<Panel>(null);
  /** Pad passed to the setup wizard (null = new pad). */
  readonly editing = signal<PadProfile | null>(null);
  /** Small screens show one pane at a time. */
  readonly mobileView = signal<'write' | 'preview'>('write');
  readonly printPad = computed(() => this.printer.pad() ?? this.pads.active());
  readonly savedLabel = computed(() => {
    const t = this.rx.lastSaved();
    return t ? `Draft saved ${new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : '';
  });
  readonly shortcuts = [
    ['Ctrl / ⌘ + P', 'Print prescription'],
    ['Ctrl / ⌘ + Enter', 'Add medicine'],
    ['Enter (in a medicine)', 'Next field; on duration adds a new row'],
    ['Alt + N', 'New prescription'],
    ['Alt + L', 'Templates & recent'],
    ['Alt + S', 'Pad setup'],
    ['Alt + D', 'Toggle dark mode'],
    ['Esc', 'Close panel'],
  ];

  openSetup(pad: PadProfile | null): void {
    this.editing.set(pad);
    this.panel.set('setup');
  }

  selectPad(event: Event): void {
    const id = valueOf(event);
    if (id === '__new') {
      (event.target as HTMLSelectElement).value = this.pads.active().id;
      this.openSetup(null);
    } else {
      this.pads.select(id);
    }
  }

  print(): void {
    this.printer.print(this.pads.active(), 'rx');
    this.rx.archive();
  }

  newRx(): void {
    this.rx.newRx();
    this.mobileView.set('write');
    queueMicrotask(() => document.getElementById('patient-name')?.focus());
  }

  onKey(e: KeyboardEvent): void {
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (e.key === 'Escape' && this.panel()) {
      this.panel.set(null);
    } else if (mod && key === 'p') {
      e.preventDefault();
      this.print();
    } else if (mod && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('add-medicine')?.click();
    } else if (e.altKey && !mod) {
      const code = e.code; // Alt changes e.key on macOS, so use the physical key.
      const actions: Record<string, () => void> = {
        KeyN: () => this.newRx(),
        KeyL: () => this.panel.set('library'),
        KeyS: () => this.openSetup(this.pads.active()),
        KeyD: () => this.theme.toggle(),
      };
      if (actions[code]) {
        e.preventDefault();
        actions[code]();
      }
    } else if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      this.panel.set('help');
    }
  }
}
