import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-text-format-toolbar',
  template: `
    <div class="text-format-toolbar" [style.top.px]="position.top" [style.left.px]="position.left" [class.visible]="visible">
      <button (click)="applyFormat('bold')" class="toolbar-button" title="Bold">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
        </svg>
      </button>
      <button (click)="applyFormat('italic')" class="toolbar-button" title="Italic">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="4" x2="10" y2="4"></line>
          <line x1="14" y1="20" x2="5" y2="20"></line>
          <line x1="15" y1="4" x2="9" y2="20"></line>
        </svg>
      </button>
      <div class="color-selector">
        <input type="color" [(ngModel)]="selectedColor" (change)="applyFormat('color')" title="Text Color">
      </div>
    </div>
  `,
  styles: [`
    .text-format-toolbar {
      position: absolute;
      display: flex;
      background-color: #333;
      border-radius: 4px;
      padding: 4px 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
    }
    
    .text-format-toolbar.visible {
      opacity: 1;
      visibility: visible;
    }
    
    .toolbar-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      margin: 0 2px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .toolbar-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .color-selector {
      display: flex;
      align-items: center;
      margin-left: 4px;
    }
    
    .color-selector input {
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
    }
  `]
})
export class TextFormatToolbarComponent implements OnInit {
  @Input() editorElement?: HTMLTextAreaElement;
  @Output() formatText = new EventEmitter<{format: string, value?: string}>();
  
  position = { top: 0, left: 0 };
  visible = false;
  selectedColor = '#000000';

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp(event: MouseEvent): void {
    setTimeout(() => {
      this.checkForSelection();
    }, 10);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    // Hide the toolbar if clicked outside
    if (this.visible && !this.elementRef.nativeElement.contains(event.target)) {
      this.hideToolbar();
    }
  }

  checkForSelection(): void {
    if (!this.editorElement) {
      this.hideToolbar();
      return;
    }

    const selection = window.getSelection();
    
    // Only show toolbar if there's a selection inside our editor
    if (selection && !selection.isCollapsed && selection.rangeCount > 0 && 
        this.isSelectionInEditor(selection)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position the toolbar above the selection
      this.position = {
        top: rect.top - 40 + window.scrollY, // 40px above the selection
        left: rect.left + (rect.width / 2) - 50 + window.scrollX // centered, approx 100px wide
      };
      
      this.showToolbar();
    } else {
      this.hideToolbar();
    }
  }

  isSelectionInEditor(selection: Selection): boolean {
    if (!selection || !this.editorElement) return false;
    
    let node = selection.anchorNode;
    while (node) {
      if (node === this.editorElement) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  showToolbar(): void {
    this.visible = true;
  }

  hideToolbar(): void {
    this.visible = false;
  }

  applyFormat(format: string): void {
    this.formatText.emit({ 
      format, 
      value: format === 'color' ? this.selectedColor : undefined 
    });
  }
}