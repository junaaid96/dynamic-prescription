import { Component, Input, Output, EventEmitter, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

interface DiagnosisItem {
  id: string;
  title: string;
  children: Array<{ id: string; value: string }>;
}

@Component({
  selector: 'app-diagnosis-fields',
  template: `
    <div class="diagnosis-fields-container">
      <div class="fields-header">
        <label>Diagnosis Fields</label>
        <div class="header-buttons">
          <button 
            type="button" 
            class="add-title-btn"
            (click)="addTitle()"
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
        <div 
          *ngFor="let item of diagnosisItems; let i = index" 
          class="diagnosis-group"
          cdkDrag
        >
          <!-- Title Section -->
          <div class="title-section">
            <div class="title-input-container">
              <span class="group-number">{{ i + 1 }}.</span>
              <input
                type="text"
                [(ngModel)]="item.title"
                (input)="updateContent()"
                [placeholder]="'Enter title ' + (i + 1)"
                class="title-input"
              />
              <button 
                type="button" 
                class="add-child-btn"
                (click)="addChild(item)"
                title="Add child item"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </button>
              <button 
                type="button" 
                class="remove-title-btn"
                (click)="removeTitle(i)"
                title="Remove this title and all children"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
              <span class="drag-handle" cdkDragHandle title="Drag to reorder">☰</span>
            </div>
          </div>

          <!-- Children Section -->
          <div class="children-section" *ngIf="item.children.length > 0">
            <div 
              *ngFor="let child of item.children; let j = index" 
              class="child-item"
            >
              <div class="child-input-container">
                <span class="bullet-point">•</span>
                <input
                  type="text"
                  [(ngModel)]="child.value"
                  (input)="updateContent()"
                  [placeholder]="'Enter bullet point'"
                  class="child-input"
                />
                <button 
                  type="button" 
                  class="remove-child-btn"
                  (click)="removeChild(item, j)"
                  title="Remove this bullet point"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
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
    
    .header-buttons {
      display: flex;
      gap: 0.5rem;
    }
    
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
      transition: all 0.2s ease;
    }
    
    .add-title-btn:hover {
      background: #059669;
      transform: translateY(-1px);
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
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      transition: all 0.2s;
      position: relative;
    }
    
    .diagnosis-group.cdk-drag-preview {
      box-shadow: 0 8px 25px rgba(59,130,246,0.25);
      border: 2px solid #3b82f6;
      background: #f0f7ff;
      transform: scale(1.02);
    }
    
    .diagnosis-group.cdk-drag-placeholder {
      opacity: 0.3;
      background: #e5e7eb;
    }
    
    .diagnosis-group.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .title-section {
      margin-bottom: 0.5rem;
    }
    
    .title-input-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    
    .group-number {
      font-size: 0.875rem;
      font-weight: 700;
      color: #374151;
      min-width: 1.5rem;
    }
    
    .title-input {
      flex: 1;
      padding: 0.5rem;
      border: 2px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      background: #ffffff;
      transition: border-color 0.2s ease;
    }
    
    .title-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .add-child-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 2rem;
      height: 2rem;
    }
    
    .add-child-btn:hover {
      background: #2563eb;
      transform: scale(1.05);
    }
    
    .remove-title-btn {
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
    
    .remove-title-btn:hover {
      background: #dc2626;
      transform: scale(1.05);
    }
    
    .children-section {
      padding-left: 1.5rem;
      border-left: 2px solid #e5e7eb;
      margin-left: 0.75rem;
    }
    
    .child-item {
      margin-bottom: 0.25rem;
    }
    
    .child-input-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    
    .bullet-point {
      font-size: 1rem;
      font-weight: 600;
      color: #6b7280;
      min-width: 1rem;
    }
    
    .child-input {
      flex: 1;
      padding: 0.375rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      background: #ffffff;
      transition: border-color 0.2s ease;
    }
    
    .child-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    
    .remove-child-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      background: #f87171;
      color: white;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 1.5rem;
      height: 1.5rem;
    }
    
    .remove-child-btn:hover {
      background: #ef4444;
      transform: scale(1.05);
    }
    
    .drag-handle {
      cursor: grab;
      font-size: 1.2rem;
      color: #6b7280;
      user-select: none;
      transition: color 0.2s;
      padding: 0.25rem;
    }
    
    .drag-handle:hover {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 0.25rem;
    }
    
    .drag-handle:active {
      cursor: grabbing;
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

  diagnosisItems: DiagnosisItem[] = [];
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.parseContentToFields();
  }

  addTitle(): void {
    const newTitle: DiagnosisItem = {
      id: this.generateId(),
      title: '',
      children: [{ id: this.generateId(), value: '' }]
    };
    this.diagnosisItems.push(newTitle);
    this.updateContent();
  }

  removeTitle(index: number): void {
    this.diagnosisItems.splice(index, 1);
    this.updateContent();
  }

  addChild(item: DiagnosisItem): void {
    item.children.push({ id: this.generateId(), value: '' });
    this.updateContent();
  }

  removeChild(item: DiagnosisItem, childIndex: number): void {
    item.children.splice(childIndex, 1);
    this.updateContent();
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.diagnosisItems, event.previousIndex, event.currentIndex);
    this.updateContent();
  }

  private generateId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

  updateContent(): void {
    const contentParts: string[] = [];
    
    this.diagnosisItems.forEach(item => {
      if (item.title.trim()) {
        // Add title (bold, no bullet point) with paragraph wrapper
        contentParts.push(`<p><strong>${item.title.trim()}</strong></p>`);
        
        // Add children as proper HTML list
        const childrenValues = item.children
          .map(child => child.value.trim())
          .filter(value => value.length > 0);
        
        if (childrenValues.length > 0) {
          const listItems = childrenValues
            .map(value => `<li>${value}</li>`)
            .join('');
          contentParts.push(`<ul>${listItems}</ul>`);
        }
      }
    });
    
    const finalContent = contentParts.join('');
    this.content = finalContent;
    this.onChange(finalContent);
    this.contentChange.emit(finalContent);
  }

  parseContentToFields(): void {
    if (!this.content) {
      // Initialize with 3 basic fields with empty children
      this.diagnosisItems = [
        {
          id: this.generateId(),
          title: 'Chief Complaints',
          children: [
            { id: this.generateId(), value: '' },
            { id: this.generateId(), value: '' }
          ]
        },
        {
          id: this.generateId(),
          title: 'Vitals',
          children: [
            { id: this.generateId(), value: '' },
            { id: this.generateId(), value: '' }
          ]
        },
        {
          id: this.generateId(),
          title: 'Investigations',
          children: [
            { id: this.generateId(), value: '' },
            { id: this.generateId(), value: '' }
          ]
        }
      ];
      return;
    }

    // Parse HTML structure (new format) or fallback to legacy format
    this.diagnosisItems = [];
    
    if (this.content.includes('<p>') && this.content.includes('<ul>')) {
      // Parse new HTML format
      this.parseHtmlContent();
    } else {
      // Parse legacy text format
      this.parseLegacyContent();
    }

    // Ensure each title has at least one empty child for editing
    this.diagnosisItems.forEach(item => {
      if (item.children.length === 0) {
        item.children.push({ id: this.generateId(), value: '' });
      }
    });

    // If no items were parsed, create a default structure
    if (this.diagnosisItems.length === 0) {
      this.diagnosisItems = [{
        id: this.generateId(),
        title: 'Chief Complaints',
        children: [
          { id: this.generateId(), value: '' },
          { id: this.generateId(), value: '' }
        ]
      }];
    }
  }

  private parseHtmlContent(): void {
    // Extract titles from <p><strong> tags
    const titleMatches = this.content.match(/<p><strong>(.*?)<\/strong><\/p>/g) || [];
    
    // Split content by titles to get corresponding lists
    const sections = this.content.split(/<p><strong>.*?<\/strong><\/p>/);
    
    titleMatches.forEach((titleMatch, index) => {
      const titleText = titleMatch.replace(/<p><strong>(.*?)<\/strong><\/p>/, '$1').trim();
      const listSection = sections[index + 1] || '';
      
      // Extract list items
      const listItems = listSection.match(/<li>(.*?)<\/li>/g) || [];
      const children = listItems.map(item => ({
        id: this.generateId(),
        value: item.replace(/<li>(.*?)<\/li>/, '$1').trim()
      }));
      
      this.diagnosisItems.push({
        id: this.generateId(),
        title: titleText,
        children: children.length > 0 ? children : [{ id: this.generateId(), value: '' }]
      });
    });
  }

  private parseLegacyContent(): void {
    const lines = this.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    let currentTitle: DiagnosisItem | null = null;

    for (const line of lines) {
      // Check if line is a title (bold HTML or doesn't start with bullet)
      if (line.includes('<strong>') || line.includes('<b>') || (!line.startsWith('•') && !line.startsWith('-'))) {
        // This is a title
        const titleText = line.replace(/<\/?strong>/g, '').replace(/<\/?b>/g, '').replace(/<\/?p>/g, '').trim();
        currentTitle = {
          id: this.generateId(),
          title: titleText,
          children: []
        };
        this.diagnosisItems.push(currentTitle);
      } else {
        // This is a child item
        const childText = line.replace(/^[•\-]\s*/, '').trim();
        if (childText) {
          if (!currentTitle) {
            // Create a default title if none exists
            currentTitle = {
              id: this.generateId(),
              title: 'Diagnosis',
              children: []
            };
            this.diagnosisItems.push(currentTitle);
          }
          currentTitle.children.push({
            id: this.generateId(),
            value: childText
          });
        }
      }
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
