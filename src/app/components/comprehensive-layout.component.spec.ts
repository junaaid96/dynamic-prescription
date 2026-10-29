import { Component, forwardRef, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NgStyle } from '@angular/common';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { ComprehensiveLayoutComponent } from './comprehensive-layout.component';
import { DiagnosisFieldsComponent } from './diagnosis-fields.component';

@Component({
  selector: 'app-tinymce-editor',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TinyMceStubComponent),
      multi: true,
    },
  ],
})
class TinyMceStubComponent implements ControlValueAccessor {
  readonly placeholder = input('');
  readonly height = input(200);
  readonly toolbar = input('');
  readonly menubar = input(false);
  readonly statusbar = input(false);
  readonly resize = input(false);

  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
}

describe('ComprehensiveLayoutComponent', () => {
  let fixture: ComponentFixture<ComprehensiveLayoutComponent>;
  let component: ComprehensiveLayoutComponent;

  beforeEach(async () => {
    TestBed.overrideComponent(ComprehensiveLayoutComponent, {
      set: {
        imports: [
          FormsModule,
          ReactiveFormsModule,
          NgStyle,
          SafeHtmlPipe,
          TinyMceStubComponent,
          DiagnosisFieldsComponent,
        ],
      },
    });
    await TestBed.configureTestingModule({
      imports: [ComprehensiveLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComprehensiveLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates a patient section at full width', () => {
    component.addBodySection('patient');
    fixture.detectChanges();

    const section = component.bodySections()[0];
    expect(section.type).toBe('patient');
    expect(section.name).toBe('Patient Information');
    expect(section.size.width).toBe(100);
    expect(component.selectedSection()?.id).toBe(section.id);
  });

  it('keeps edited header content when column widths change', () => {
    component.updateHeaderContent(0, 'Edited header');
    component.updateColumnLayout('column1', 40);
    component.updateColumnLayout('column2', 20);

    const columns = component.visibleHeaderColumns();
    expect(columns.some((column) => column.content === 'Edited header')).toBe(true);
    expect(columns.map((column) => column.width).reduce((sum, width) => sum + width, 0)).toBe(100);
    expect(columns.every((column) => !Number.isNaN(column.width))).toBe(true);
  });

  it('switches to a custom page size when dimensions are edited', () => {
    component.updateDimension('totalWidth', 9);
    expect(component.config().pageType).toBe('Custom');
    expect(component.config().totalWidth).toBe(9);
  });

  it('clamps section size without mutating the original object', () => {
    component.addBodySection('custom');
    const section = component.bodySections()[0];
    section.size.width = 200;
    const size = section.size;

    component.selectBodySection(section);

    expect(size.width).toBe(200);
    expect(component.bodySections()[0].size.width).toBeLessThanOrEqual(100);
    expect(component.bodySections()[0].size).not.toBe(size);
  });

  it('restores default section content', () => {
    component.addBodySection('custom');
    const section = component.bodySections()[0];
    component.onSectionContentChange(section.id, 'Changed');
    component.restoreSectionDefaults(section.id);
    expect(component.bodySections()[0].content).toContain('Additional Information');
    expect(component.bodySections()[0].content).not.toBe('Changed');
  });
});
