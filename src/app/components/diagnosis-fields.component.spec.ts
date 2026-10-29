import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiagnosisFieldsComponent } from './diagnosis-fields.component';

describe('DiagnosisFieldsComponent', () => {
  let fixture: ComponentFixture<DiagnosisFieldsComponent>;
  let component: DiagnosisFieldsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosisFieldsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DiagnosisFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts from the default diagnosis groups when content is empty', () => {
    component.writeValue('');
    expect(component.diagnosisItems().map((item) => item.title)).toEqual([
      'Chief Complaints',
      'Vitals',
      'Investigations',
    ]);
  });

  it('parses saved HTML and round-trips edits', () => {
    component.writeValue('<p><strong>Vitals</strong></p><ul><li>BP 120/80</li></ul>');
    expect(component.diagnosisItems().length).toBe(1);
    expect(component.diagnosisItems()[0].title).toBe('Vitals');
    expect(component.diagnosisItems()[0].children[0].value).toBe('BP 120/80');

    const ids = component.diagnosisItems().map((item) => item.id);
    component.writeValue('<p><strong>Vitals</strong></p><ul><li>BP 120/80</li></ul>');
    expect(component.diagnosisItems().map((item) => item.id)).toEqual(ids);
  });

  it('escapes titles and bullets before emitting HTML', () => {
    let emitted = '';
    component.registerOnChange((value) => {
      emitted = value;
    });
    component.writeValue('');
    const first = component.diagnosisItems()[0];
    component.updateTitle(first.id, '<script>alert(1)</script>');
    component.updateChild(first.id, first.children[0].id, 'BP <90');

    expect(emitted).toContain('&lt;script&gt;');
    expect(emitted).not.toContain('<script>');
    expect(emitted).toContain('BP &lt;90');
  });

  it('reorders groups and honors the disabled state', () => {
    component.writeValue('');
    const before = component.diagnosisItems().map((item) => item.title);
    component.drop({ previousIndex: 0, currentIndex: 2 } as never);
    const after = component.diagnosisItems().map((item) => item.title);
    expect(after[2]).toBe(before[0]);

    component.setDisabledState(true);
    expect(component.disabled()).toBe(true);
  });
});
