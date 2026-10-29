import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { CdkDragDrop, CdkDrag, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

interface DiagnosisChild {
  id: string;
  value: string;
}

interface DiagnosisItem {
  id: string;
  title: string;
  children: DiagnosisChild[];
}

@Component({
  selector: 'app-diagnosis-fields',
  imports: [FormsModule, CdkDropList, CdkDrag, CdkDragHandle],
  template: `
    <div class="diagnosis-fields-container">
      <div class="fields-header">
        <label>Diagnosis Fields</label>
        <div class="header-buttons">
          <button
            type="button"
            class="add-title-btn"
            (click)="addTitle()"
            [disabled]="disabled()"
            title="Add new diagnosis title"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z"></path>
            </svg>
            Add Field
          </button>
        </div>
      </div>

      <div class="diagnosis-list" cdkDropList (cdkDropListDropped)="drop($event)">
        @for (item of diagnosisItems(); track item.id; let i = $index) {
          <div class="diagnosis-group" cdkDrag [cdkDragDisabled]="disabled()">
            <div class="title-section">
              <div class="title-input-container">
                <span class="group-number">{{ i + 1 }}.</span>
                <input
                  type="text"
                  [ngModel]="item.title"
                  (ngModelChange)="updateTitle(item.id, $event)"
                  [disabled]="disabled()"
                  [placeholder]="'Enter title ' + (i + 1)"
                  class="title-input"
                />
                <button
                  type="button"
                  class="add-child-btn"
                  (click)="addChild(item.id)"
                  [disabled]="disabled()"
                  title="Add child item"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  class="remove-title-btn"
                  (click)="removeTitle(item.id)"
                  [disabled]="disabled()"
                  title="Remove this title and all children"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
                <span class="drag-handle" cdkDragHandle title="Drag to reorder">☰</span>
              </div>
            </div>

            @if (item.children.length > 0) {
              <div class="children-section">
                @for (child of item.children; track child.id) {
                  <div class="child-item">
                    <div class="child-input-container">
                      <span class="bullet-point">•</span>
                      <input
                        type="text"
                        [ngModel]="child.value"
                        (ngModelChange)="updateChild(item.id, child.id, $event)"
                        [disabled]="disabled()"
                        placeholder="Enter bullet point"
                        class="child-input"
                      />
                      <button
                        type="button"
                        class="remove-child-btn"
                        (click)="removeChild(item.id, child.id)"
                        [disabled]="disabled()"
                        title="Remove this bullet point"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .diagnosis-fields-container {
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      padding: 0.75rem;
      background: #ffffff;
    }
    .fields-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .fields-header label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }
    .header-buttons { display: flex; gap: 0.5rem; }
    .add-title-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
    }
    .add-title-btn:hover { background: #059669; }
    .add-title-btn:disabled, .add-child-btn:disabled, .remove-title-btn:disabled, .remove-child-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .diagnosis-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      min-height: 2rem;
    }
    .diagnosis-group {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      padding: 0.5rem;
      position: relative;
    }
    .diagnosis-group.cdk-drag-preview {
      box-shadow: 0 8px 25px rgba(59,130,246,0.25);
      border: 2px solid #3b82f6;
      background: #f0f7ff;
    }
    .diagnosis-group.cdk-drag-placeholder { opacity: 0.3; background: #e5e7eb; }
    .title-input-container, .child-input-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    .group-number { font-size: 0.875rem; font-weight: 700; color: #374151; min-width: 1.5rem; }
    .title-input, .child-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      background: #ffffff;
    }
    .title-input { border-width: 2px; font-weight: 600; }
    .title-input:focus, .child-input:focus { outline: none; border-color: #3b82f6; }
    .add-child-btn, .remove-title-btn, .remove-child-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    .add-child-btn, .remove-title-btn { min-width: 2rem; height: 2rem; }
    .add-child-btn { background: #3b82f6; }
    .remove-title-btn { background: #ef4444; }
    .remove-child-btn { background: #f87171; min-width: 1.5rem; height: 1.5rem; }
    .children-section {
      padding-left: 1.5rem;
      border-left: 2px solid #e5e7eb;
      margin-left: 0.75rem;
      margin-top: 0.5rem;
    }
    .child-item { margin-bottom: 0.25rem; }
    .bullet-point { font-size: 1rem; font-weight: 600; color: #6b7280; min-width: 1rem; }
    .drag-handle { cursor: grab; font-size: 1.2rem; color: #6b7280; user-select: none; padding: 0.25rem; }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DiagnosisFieldsComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosisFieldsComponent implements ControlValueAccessor {
  readonly diagnosisItems = signal<DiagnosisItem[]>([]);
  readonly disabled = signal(false);

  private lastEmitted: string | null = null;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    const next = value ?? '';
    if (next === this.lastEmitted) {
      return;
    }
    this.lastEmitted = next;
    this.diagnosisItems.set(this.parseContent(next));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  addTitle(): void {
    this.diagnosisItems.update((items) => [
      ...items,
      { id: this.generateId(), title: '', children: [{ id: this.generateId(), value: '' }] },
    ]);
    this.emitContent();
  }

  removeTitle(id: string): void {
    this.diagnosisItems.update((items) => items.filter((item) => item.id !== id));
    this.emitContent();
  }

  addChild(itemId: string): void {
    this.updateItem(itemId, (item) => ({
      ...item,
      children: [...item.children, { id: this.generateId(), value: '' }],
    }));
  }

  removeChild(itemId: string, childId: string): void {
    this.updateItem(itemId, (item) => ({
      ...item,
      children: item.children.filter((child) => child.id !== childId),
    }));
  }

  updateTitle(itemId: string, title: string): void {
    this.updateItem(itemId, (item) => ({ ...item, title }));
  }

  updateChild(itemId: string, childId: string, value: string): void {
    this.updateItem(itemId, (item) => ({
      ...item,
      children: item.children.map((child) => child.id === childId ? { ...child, value } : child),
    }));
  }

  drop(event: CdkDragDrop<DiagnosisItem[]>): void {
    this.diagnosisItems.update((items) => {
      const next = [...items];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      return next;
    });
    this.emitContent();
  }

  private updateItem(itemId: string, updater: (item: DiagnosisItem) => DiagnosisItem): void {
    this.diagnosisItems.update((items) => items.map((item) => item.id === itemId ? updater(item) : item));
    this.emitContent();
  }

  private emitContent(): void {
    const html = this.toHtml(this.diagnosisItems());
    this.lastEmitted = html;
    this.onChange(html);
    this.onTouched();
  }

  private toHtml(items: DiagnosisItem[]): string {
    return items.flatMap((item) => {
      const title = item.title.trim();
      if (!title) {
        return [];
      }
      const parts = [`<p><strong>${this.escapeHtml(title)}</strong></p>`];
      const children = item.children.map((child) => child.value.trim()).filter((value) => value.length > 0);
      if (children.length > 0) {
        parts.push(`<ul>${children.map((value) => `<li>${this.escapeHtml(value)}</li>`).join('')}</ul>`);
      }
      return parts;
    }).join('');
  }

  private parseContent(content: string): DiagnosisItem[] {
    if (!content.trim()) {
      return this.defaultItems();
    }

    const items = content.includes('<p>') && content.includes('<ul>')
      ? this.parseHtmlContent(content)
      : this.parseLegacyContent(content);
    const normalized = items.map((item) => item.children.length > 0
      ? item
      : { ...item, children: [{ id: this.generateId(), value: '' }] });

    return normalized.length > 0 ? normalized : this.defaultItems().slice(0, 1);
  }

  private parseHtmlContent(content: string): DiagnosisItem[] {
    const titleMatches = content.match(/<p><strong>(.*?)<\/strong><\/p>/g) ?? [];
    const sections = content.split(/<p><strong>.*?<\/strong><\/p>/);
    return titleMatches.map((titleMatch, index) => {
      const titleText = this.unescapeHtml(titleMatch.replace(/<p><strong>(.*?)<\/strong><\/p>/, '$1').trim());
      const listSection = sections[index + 1] ?? '';
      const listItems = listSection.match(/<li>(.*?)<\/li>/g) ?? [];
      const children = listItems.map((item) => ({
        id: this.generateId(),
        value: this.unescapeHtml(item.replace(/<li>(.*?)<\/li>/, '$1').trim()),
      }));
      return {
        id: this.generateId(),
        title: titleText,
        children: children.length > 0 ? children : [{ id: this.generateId(), value: '' }],
      };
    });
  }

  private parseLegacyContent(content: string): DiagnosisItem[] {
    const lines = content.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    const items: DiagnosisItem[] = [];
    let currentTitle: DiagnosisItem | null = null;

    for (const line of lines) {
      if (line.includes('<strong>') || line.includes('<b>') || (!line.startsWith('•') && !line.startsWith('-'))) {
        const titleText = line.replace(/<\/?strong>/g, '').replace(/<\/?b>/g, '').replace(/<\/?p>/g, '').trim();
        currentTitle = { id: this.generateId(), title: titleText, children: [] };
        items.push(currentTitle);
        continue;
      }
      const childText = line.replace(/^[•-]\s*/, '').trim();
      if (!childText) {
        continue;
      }
      if (!currentTitle) {
        currentTitle = { id: this.generateId(), title: 'Diagnosis', children: [] };
        items.push(currentTitle);
      }
      currentTitle.children.push({ id: this.generateId(), value: childText });
    }
    return items;
  }

  private defaultItems(): DiagnosisItem[] {
    return ['Chief Complaints', 'Vitals', 'Investigations'].map((title) => ({
      id: this.generateId(),
      title,
      children: [
        { id: this.generateId(), value: '' },
        { id: this.generateId(), value: '' },
      ],
    }));
  }

  private generateId(): string {
    return `id_${Math.random().toString(36).slice(2, 11)}`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private unescapeHtml(value: string): string {
    return value
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}
