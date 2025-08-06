import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
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
  @Input() toolbar: string = 'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image';
  @Input() menubar: boolean = false;
  @Input() statusbar: boolean = false;
  @Input() resize: boolean = false;
  
  @Output() contentChange = new EventEmitter<string>();

  editorConfig: any = {};
  private onChange = (value: string) => {};
  private onTouched = () => {};
  private editor: any = null;
  private isInternalChange = false;

  ngOnInit() {
    this.editorConfig = {
      height: this.height,
      menubar: this.menubar,
      statusbar: this.statusbar,
      resize: this.resize,
      // Optimized plugin set for prescription content
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'charmap',
        'searchreplace', 'visualblocks', 'code',
        'table', 'help', 'wordcount', 'paste'
      ],
      toolbar: this.toolbar,
      placeholder: this.placeholder,
      branding: false,
      elementpath: false,
      // Remove deprecated options for TinyMCE 6.0 compatibility
      keep_styles: true,
      verify_html: false,
      cleanup: false,
      extended_valid_elements: 'p[align|style],div[align|style],span[align|style]',
      valid_children: '+body[p|div|span]',
      // Add configuration to handle plugin loading issues
      browser_spellcheck: true,
      contextmenu: false,
      // Enhanced paste configuration for cleaner content
      paste_as_text: false,
      paste_word_valid_elements: 'p,span,b,strong,i,em,u,strike,br,ul,ol,li',
      paste_retain_style_properties: 'font-weight font-style text-decoration text-align',
      paste_merge_formats: true,
      // Add better content style for TinyMCE 6.0
      content_style: `
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          font-size: 14px; 
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
      `,
      // Add better setup for TinyMCE 6.0
      setup: (editor: any) => {
        this.editor = editor;
        
        editor.on('init', () => {
          if (this.content) {
            editor.setContent(this.content);
          }
        });
        
        editor.on('change keyup', () => {
          if (!this.isInternalChange) {
            const content = editor.getContent();
            this.content = content;
            this.onChange(content);
            this.contentChange.emit(content);
          }
        });
        
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
      this.content = content;
      this.onChange(content);
      this.contentChange.emit(content);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.content = value || '';
    if (this.editor && !this.isInternalChange) {
      this.isInternalChange = true;
      this.editor.setContent(this.content);
      this.isInternalChange = false;
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
    if (this.editor) {
      this.editor.destroy();
    }
  }
} 