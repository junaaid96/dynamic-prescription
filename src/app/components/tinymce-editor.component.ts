import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef, OnChanges, SimpleChanges, NgZone, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-tinymce-editor',
  template: `
    <div class="tinymce-editor-container">
      <editor
        apiKey="ssmquwl5pb1n3b4v2klayq4uwcuyt7y5ra3kmc8ymnz4cj77"
        [init]="editorConfig"
        [initialValue]="content"
        (onChange)="onContentChange($event)"
        (onInit)="onEditorInit($event)"
        [disabled]="disabled"
        (onError)="onEditorError($event)"
      ></editor>
    </div>
  `,
  styles: [`
    .tinymce-editor-container {
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      overflow: hidden;
      min-height: 120px;
    }
    
    .tinymce-editor-container ::ng-deep .tox-tinymce {
      border: none !important;
    }
    
    .tinymce-editor-container ::ng-deep .tox-editor-header {
      border-bottom: 1px solid #e2e8f0;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TinyMCEEditorComponent),
      multi: true
    }
  ]
})
export class TinyMCEEditorComponent implements OnInit, OnDestroy, ControlValueAccessor, OnChanges {
  @Input() content: string = '';
  @Input() placeholder: string = 'Enter content...';
  @Input() height: number = 200;
  @Input() disabled: boolean = false;
  @Input() toolbar: string = 'undo redo | bold italic underline | fontsize forecolor backcolor | alignleft aligncenter alignright | bullist numlist | link';
  @Input() menubar: boolean = false;
  @Input() statusbar: boolean = false;
  @Input() resize: boolean = false;
  
  @Output() contentChange = new EventEmitter<string>();

  editorConfig: any = {};
  private onChange = (value: string) => {};
  private onTouched = () => {};
  private editor: any = null;
  private isInternalChange = false;
  private updateTimeout: any = null;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.editorConfig = {
      height: this.height,
      menubar: this.menubar,
      statusbar: this.statusbar,
      resize: this.resize,
      // Optimized plugin set for prescription content with font formatting
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'charmap',
        'searchreplace', 'visualblocks', 'code',
        'table', 'help', 'wordcount'
      ],
      toolbar: this.toolbar,
      placeholder: this.placeholder,
      branding: false,
      elementpath: false,
      // Font size configuration - using pt units
      fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 30pt 32pt 36pt 48pt 72pt',
      // Override TinyMCE default formats to use pt only
      formats: {
        fontsize: { inline: 'span', styles: { 'font-size': '%value' } }
      },
      // Set default font size to 10pt
      font_size_default: '10pt',
      // Font family configuration  
      font_family_formats: 'Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; Georgia=georgia,palatino,serif; Helvetica=helvetica,arial,sans-serif; Times New Roman=times new roman,times,serif; Verdana=verdana,geneva,sans-serif',
      // Remove deprecated options for TinyMCE 6.0 compatibility
      verify_html: false,
      cleanup: false,
      extended_valid_elements: 'p[align|style],div[align|style],span[style|class],font[face|size|color|style]',
      valid_children: '+body[p|div|span|font]',
      // Enable font size and family controls
      toolbar_mode: 'sliding',
      // Add configuration to handle plugin loading issues
      browser_spellcheck: true,
      contextmenu: false,
      // Enhanced paste configuration for cleaner content
      paste_as_text: false,
      // Removed: paste_retain_style_properties, paste_word_valid_elements, paste_merge_formats
      // Add better content style for TinyMCE 6.0
      content_style: `
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          font-size: 10pt; 
          line-height: 1.3; 
          margin: 0; 
          padding: 3px; 
        }
        p { margin: 0 0 2px 0; }
        p:last-child { margin-bottom: 0; }
        p[align="left"] { text-align: left !important; }
        p[align="center"] { text-align: center !important; }
        p[align="right"] { text-align: right !important; }
        p[align="justify"] { text-align: justify !important; }
        div[align="left"] { text-align: left !important; }
        div[align="center"] { text-align: center !important; }
        div[align="right"] { text-align: right !important; }
        div[align="justify"] { text-align: justify !important; }
        .mce-content-body { padding: 3px; }
        strong, b { font-weight: bold !important; }
        em, i { font-style: italic !important; }
        u { text-decoration: underline !important; }
        span[style*="font-size"] { }
        font[size] { }
        * { font-size: inherit; }
      `,
      // Add better setup for TinyMCE 6.0
      setup: (editor: any) => {
        this.editor = editor;
        
        editor.on('init', () => {
          if (this.content) {
            editor.setContent(this.content);
          }
        });
        
        // Immediate update for critical events
        const updateContentImmediate = () => {
          if (!this.isInternalChange) {
            this.ngZone.run(() => {
              const content = editor.getContent();
              this.content = content;
              this.onChange(content);
              this.contentChange.emit(content);
              this.cdr.detectChanges(); // Force change detection
            });
          }
        };
        
        // Debounced update for less critical events
        const updateContentDebounced = () => {
          if (!this.isInternalChange) {
            if (this.updateTimeout) {
              clearTimeout(this.updateTimeout);
            }
            this.updateTimeout = setTimeout(() => {
              this.ngZone.run(() => {
                const content = editor.getContent();
                this.content = content;
                this.onChange(content);
                this.contentChange.emit(content);
                this.cdr.detectChanges();
              });
            }, 50); // 50ms debounce for smooth typing
          }
        };
        
        // Immediate updates for typing and critical changes
        editor.on('input keyup', updateContentImmediate);
        
        // Immediate updates for formatting and commands
        editor.on('ExecCommand FormatApply FormatRemove', updateContentImmediate);
        
        // Debounced updates for other changes
        editor.on('change paste undo redo NodeChange', updateContentDebounced);
        
        editor.on('blur', () => {
          this.onTouched();
        });
        
        // Better error handling for TinyMCE 6.0
        editor.on('error', (e: any) => {
          console.warn('TinyMCE Component: Editor warning:', e);
        });
        
        // Add load error handling
        editor.on('LoadError', (e: any) => {
          console.warn('TinyMCE Component: Load error:', e);
        });
        
        // Handle plugin loading errors gracefully
        editor.on('PluginLoadError', (e: any) => {
          console.warn('TinyMCE Component: Plugin load error:', e);
        });
      }
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && !changes['content'].firstChange && this.editor) {
      const newContent = changes['content'].currentValue;
      const currentContent = this.editor.getContent();
      
      // Only update if content is actually different
      if (newContent !== currentContent) {
        this.isInternalChange = true;
        this.editor.setContent(newContent || '');
        this.isInternalChange = false;
        
        // Trigger change detection for external content changes
        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });
      }
    }
  }

  onEditorInit(event: any) {
    // Editor initialized
  }

  onEditorError(event: any) {
    console.warn('TinyMCE Component: Editor error:', event);
  }

  onContentChange(event: any) {
    // Handle different event formats
    let content = '';
    if (typeof event === 'string') {
      content = event;
    } else if (event && event.content) {
      content = event.content;
    } else if (event && event.target) {
      content = event.target.getContent();
    }
    
    if (content !== undefined) {
      this.ngZone.run(() => {
        this.content = content;
        this.onChange(content);
        this.contentChange.emit(content);
        this.cdr.detectChanges();
      });
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.content = value || '';
    if (this.editor && !this.isInternalChange) {
      this.isInternalChange = true;
      this.editor.setContent(this.content);
      this.isInternalChange = false;
      
      // Trigger change detection after programmatic updates
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnDestroy() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  }
} 