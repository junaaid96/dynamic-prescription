import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { createTinyMceInit } from './tinymce-config';

const TINYMCE_API_KEY = 'ssmquwl5pb1n3b4v2klayq4uwcuyt7y5ra3kmc8ymnz4cj77';

@Component({
  selector: 'app-tinymce-editor',
  imports: [EditorComponent, FormsModule],
  template: `
    <div class="tinymce-editor-container">
      <editor
        [apiKey]="apiKey"
        cloudChannel="8"
        outputFormat="html"
        [init]="editorConfig()"
        [ngModel]="value()"
        (ngModelChange)="handleInput($event)"
        [disabled]="disabled()"
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
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TinyMCEEditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TinyMCEEditorComponent implements ControlValueAccessor {
  readonly apiKey = TINYMCE_API_KEY;
  readonly placeholder = input('Enter content...');
  readonly height = input(200);
  readonly disabled = model(false);
  readonly toolbar = input('undo redo | bold italic underline | fontsize forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link');
  readonly menubar = input(false);
  readonly statusbar = input(false);
  readonly resize = input(false);

  protected readonly value = signal('');

  protected readonly editorConfig = computed(() => createTinyMceInit({
    height: this.height(),
    placeholder: this.placeholder(),
    menubar: this.menubar(),
    statusbar: this.statusbar(),
    resize: this.resize(),
    toolbar: this.toolbar(),
  }, {
    onBlur: () => this.onTouched(),
  }) as NonNullable<EditorComponent['init']>);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    const next = value ?? '';
    if (next === this.value()) {
      return;
    }
    this.value.set(next);
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

  protected handleInput(content: string): void {
    if (content === this.value()) {
      return;
    }
    this.value.set(content);
    this.onChange(content);
  }
}
