import { Component, Input, Output, EventEmitter, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-diagnosis-fields',
  template: `
    <div class="diagnosis-fields-container">
      <div class="fields-header">
        <label>Diagnosis Fields</label>
        <button 
          type="button" 
          class="add-field-btn"
          (click)="addField()"
          title="Add new diagnosis field"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add Field
        </button>
      </div>
      
      <div class="fields-list" cdkDropList (cdkDropListDropped)="drop($event)">
        <div 
          *ngFor="let field of fields; let i = index" 
          class="field-item"
          cdkDrag
        >
          <div class="field-input-container">
            <span class="field-number">{{ i + 1 }}.</span>
            <input
              type="text"
              [(ngModel)]="field.value"
              (input)="updateContent()"
              [placeholder]="'Enter diagnosis field ' + (i + 1)"
              class="field-input"
            />
            <button 
              type="button" 
              class="remove-field-btn"
              (click)="removeField(i)"
              title="Remove this field"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
            <span class="drag-handle" cdkDragHandle title="Drag to reorder">☰</span>
          </div>
        </div>
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
    
    .add-field-btn {
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
      transition: all 0.2s ease;
    }
    
    .add-field-btn:hover {
      background: #059669;
      transform: translateY(-1px);
    }
    
    .fields-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      min-height: 2rem;
    }
    
    .field-item {
      display: flex;
      align-items: center;
      background: #f9fafb;
      border-radius: 0.25rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      transition: box-shadow 0.2s;
      position: relative;
    }
    .field-item.cdk-drag-preview {
      box-shadow: 0 4px 16px rgba(59,130,246,0.15);
      border: 1px solid #3b82f6;
      background: #e0e7ef;
    }
    .field-item.cdk-drag-placeholder {
      opacity: 0.3;
    }
    .field-item.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .field-input-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.25rem 0.5rem;
    }
    
    .field-number {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      min-width: 1.5rem;
    }
    
    .field-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      background: #ffffff;
      transition: border-color 0.2s ease;
    }
    
    .field-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .remove-field-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 2rem;
      height: 2rem;
    }
    
    .remove-field-btn:hover {
      background: #dc2626;
      transform: scale(1.05);
    }
    .drag-handle {
      cursor: grab;
      font-size: 1.2rem;
      color: #6b7280;
      margin-left: 0.5rem;
      user-select: none;
      transition: color 0.2s;
    }
    .drag-handle:hover {
      color: #3b82f6;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DiagnosisFieldsComponent),
      multi: true
    }
  ]
})
export class DiagnosisFieldsComponent implements OnInit, ControlValueAccessor {
  @Input() content: string = '';
  @Output() contentChange = new EventEmitter<string>();

  fields: Array<{ value: string }> = [];
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.parseContentToFields();
  }

  addField(): void {
    this.fields.push({ value: '' });
    this.updateContent();
  }

  removeField(index: number): void {
    this.fields.splice(index, 1);
    this.updateContent();
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.fields, event.previousIndex, event.currentIndex);
    this.updateContent();
  }

  updateContent(): void {
    const content = this.fields
      .map(field => field.value.trim())
      .filter(value => value.length > 0)
      .join('\n• ');
    
    const finalContent = content ? `• ${content}` : '';
    this.content = finalContent;
    this.onChange(finalContent);
    this.contentChange.emit(finalContent);
  }

  parseContentToFields(): void {
    if (!this.content) {
      this.fields = [{ value: '' }];
      return;
    }

    // Parse existing content into fields
    const lines = this.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^•\s*/, '')); // Remove bullet points

    if (lines.length === 0) {
      this.fields = [{ value: '' }];
    } else {
      this.fields = lines.map(line => ({ value: line }));
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.content = value || '';
    this.parseContentToFields();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handle disabled state if needed
  }
}
