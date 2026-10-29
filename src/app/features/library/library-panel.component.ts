import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { RxStore } from '../../core/rx.store';
import { valueOf } from '../editor/rx-editor.component';

/** Templates (order sets) and recent prescriptions. */
@Component({
  selector: 'app-library-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col">
      <header class="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div class="seg" role="tablist" aria-label="Library">
          <button type="button" role="tab" [class.seg-on]="tab() === 'templates'" [attr.aria-selected]="tab() === 'templates'" (click)="tab.set('templates')">Templates</button>
          <button type="button" role="tab" [class.seg-on]="tab() === 'recent'" [attr.aria-selected]="tab() === 'recent'" (click)="tab.set('recent')">Recent</button>
        </div>
        <button type="button" class="icon-btn text-lg" (click)="closed.emit()" aria-label="Close library">✕</button>
      </header>
      <div class="border-b border-slate-200 p-3 dark:border-slate-700">
        <input class="field" type="search" placeholder="Search…" aria-label="Search library" [value]="query()" (input)="query.set(valueOf($event))" />
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto p-3">
        @if (tab() === 'templates') {
          <form class="mb-3 flex gap-2" (submit)="$event.preventDefault(); saveTemplate()">
            <input class="field" placeholder="Save current as… (e.g. Viral fever)" aria-label="Template name"
                   [value]="newName()" (input)="newName.set(valueOf($event))" />
            <button class="btn btn-primary shrink-0" type="submit">Save</button>
          </form>
          <ul class="space-y-2">
            @for (t of templates(); track t.id) {
              <li class="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="font-medium">{{ t.name }}</div>
                    <div class="truncate text-xs text-slate-500">{{ t.data.medicines.length }} medicines · {{ t.data.diagnosis }}</div>
                  </div>
                  <div class="flex shrink-0 gap-1">
                    <button type="button" class="btn btn-primary !px-2 !py-1 text-xs" (click)="store.applyTemplate(t); closed.emit()">Apply</button>
                    <button type="button" class="icon-btn hover:text-red-600" (click)="store.deleteTemplate(t.id)" [attr.aria-label]="'Delete template ' + t.name">✕</button>
                  </div>
                </div>
              </li>
            } @empty {
              <li class="p-4 text-center text-sm text-slate-500">
                No templates yet. Write a typical prescription once (e.g. for viral fever), then save it here to reuse in one click.
              </li>
            }
          </ul>
        } @else {
          <ul class="space-y-2">
            @for (r of recent(); track r.id) {
              <li class="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="font-medium">{{ r.patient.name || 'Unnamed patient' }} <span class="text-xs font-normal text-slate-500">{{ r.patient.age }}</span></div>
                    <div class="truncate text-xs text-slate-500">{{ r.date }} · {{ r.diagnosis || r.complaints }}</div>
                  </div>
                  <div class="flex shrink-0 gap-1">
                    <button type="button" class="btn !px-2 !py-1 text-xs" (click)="store.open(r); closed.emit()">Open</button>
                    <button type="button" class="btn btn-primary !px-2 !py-1 text-xs" (click)="store.repeat(r); closed.emit()" title="New visit for this patient with the same medicines">Repeat</button>
                  </div>
                </div>
              </li>
            } @empty {
              <li class="p-4 text-center text-sm text-slate-500">Printed prescriptions appear here (stored only on this device).</li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  host: { class: 'block h-full' },
})
export class LibraryPanelComponent {
  readonly store = inject(RxStore);
  readonly closed = output<void>();
  readonly tab = signal<'templates' | 'recent'>('templates');
  readonly query = signal('');
  readonly newName = signal('');
  readonly valueOf = valueOf;

  readonly templates = computed(() => {
    const q = this.query().toLowerCase();
    return this.store.templates().filter((t) => !q || `${t.name} ${t.data.diagnosis}`.toLowerCase().includes(q));
  });
  readonly recent = computed(() => {
    const q = this.query().toLowerCase();
    return this.store.history().filter((r) =>
      !q || `${r.patient.name} ${r.patient.phone} ${r.patient.id} ${r.diagnosis}`.toLowerCase().includes(q));
  });

  saveTemplate(): void {
    this.store.saveTemplate(this.newName());
    this.newName.set('');
  }
}
