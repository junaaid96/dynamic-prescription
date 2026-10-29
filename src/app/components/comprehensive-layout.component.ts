import { NgStyle } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
  FormsModule,
} from '@angular/forms';
import interact from 'interactjs';
import {
  BodySection,
  FontWeight,
  LayoutConfig,
  PageType,
  PaperSize,
  SavedSetting,
  SectionColumn,
  SectionStyle,
  TextAlign,
  ValidationResult,
} from '../models/section.model';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { ResponsiveService } from '../services/responsive.service';
import { SettingsService } from '../services/settings.service';
import { ValidationService } from '../services/validation.service';
import { DiagnosisFieldsComponent } from './diagnosis-fields.component';
import { TinyMCEEditorComponent } from './tinymce-editor.component';

const INCH_TO_PX = 96;

const PAPER_SIZES: Record<PageType, PaperSize> = {
  A4: { width: 8.27, height: 11.69 },
  A5: { width: 5.83, height: 8.27 },
  Letter: { width: 8.5, height: 11 },
  Legal: { width: 8.5, height: 14 },
  Custom: { width: 8.5, height: 11 },
};

type ColumnKey = 'column1' | 'column2' | 'column3';
type DimensionKey =
  | 'totalWidth'
  | 'totalHeight'
  | 'leftMargin'
  | 'rightMargin'
  | 'topMargin'
  | 'bottomMargin'
  | 'leftPadding'
  | 'rightPadding'
  | 'topPadding'
  | 'bottomPadding'
  | 'headerHeight'
  | 'footerHeight';

interface ColumnSlot {
  content: string;
  style: SectionStyle;
}

interface VisibleColumn extends ColumnSlot {
  slot: number;
  width: number;
}

interface InteractPointerEvent {
  dx: number;
  dy: number;
  deltaRect?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

function trimmedRequired(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length > 0 ? null : { required: true };
}

function isPageType(value: string): value is PageType {
  return value === 'A4' || value === 'A5' || value === 'Letter' || value === 'Legal' || value === 'Custom';
}

function columnStyle(textAlign: TextAlign): SectionStyle {
  return {
    fontSize: 11,
    fontWeight: 'normal',
    textAlign,
    fontColor: '#000000',
    padding: 8,
    margin: 3,
  };
}

function createDefaultConfig(): LayoutConfig {
  return {
    pageType: 'A4',
    totalWidth: PAPER_SIZES.A4.width,
    totalHeight: PAPER_SIZES.A4.height,
    leftMargin: 0.1,
    rightMargin: 0.1,
    topMargin: 0.1,
    bottomMargin: 0.1,
    leftPadding: 0.1,
    rightPadding: 0.1,
    topPadding: 0.1,
    bottomPadding: 0.1,
    headerHeight: 1.5,
    footerHeight: 1.5,
    columnLayout: { column1: 50, column2: 0, column3: 50 },
    bodySection: {
      leftMargin: 0,
      rightMargin: 0,
      topMargin: 0,
      bottomMargin: 0,
      separatorLine: false,
      bottomLine: false,
    },
  };
}

function createHeaderSlots(): ColumnSlot[] {
  return [
    {
      content: 'Dr. Michael Rodriguez\nMBBS, MD (Internal Medicine)\nInternal Medicine Specialist\nSenior Consultant Physician\nSpringfield Medical Center\nChamber: Room 205, Level 2\nMon-Fri: 9:00 AM - 5:00 PM\nSat: 9:00 AM - 1:00 PM',
      style: columnStyle('left'),
    },
    {
      content: '[QR Code]\nScan for\nVerification',
      style: columnStyle('center'),
    },
    {
      content: 'Springfield Medical Center\n123 Healthcare Boulevard\nSpringfield, IL 62701\nPhone: (555) 123-CARE (2273)\nFax: (555) 123-4568\nEmail: info@springfieldmedical.com\nWebsite: www.springfieldmedical.com\n\nEmergency: (555) 911-HELP',
      style: columnStyle('left'),
    },
  ];
}

function createFooterSlots(): ColumnSlot[] {
  return [
    {
      content: 'Doctor Signature:\n\n_________________________\nDr. Michael Rodriguez, MD\nRegistration No: IL-MD-2015-4789',
      style: columnStyle('left'),
    },
    {
      content: 'Date: January 15, 2024\n\nNext Appointment:\n_________________',
      style: columnStyle('center'),
    },
    {
      content: 'Date: January 15, 2024\n\nNext Appointment: _________________\n\nContact for queries: (555) 123-CARE\n\n[Prescription Barcode] RX-2024-001452\nValid for 30 days from date of issue\nPresent this prescription at any licensed pharmacy',
      style: columnStyle('left'),
    },
  ];
}

@Component({
  selector: 'app-comprehensive-layout',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgStyle,
    SafeHtmlPipe,
    TinyMCEEditorComponent,
    DiagnosisFieldsComponent,
  ],
  templateUrl: './comprehensive-layout.component.html',
  styleUrl: './comprehensive-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComprehensiveLayoutComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly validationService = inject(ValidationService);
  private readonly responsiveService = inject(ResponsiveService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly bodyArea = viewChild<ElementRef<HTMLElement>>('bodyArea');

  readonly pageTypes: ReadonlyArray<{ id: PageType; name: string }> = [
    { id: 'A4', name: 'A4 (8.27 × 11.69 in)' },
    { id: 'A5', name: 'A5 (5.83 × 8.27 in)' },
    { id: 'Letter', name: 'Letter (8.5 × 11 in)' },
    { id: 'Legal', name: 'Legal (8.5 × 14 in)' },
    { id: 'Custom', name: 'Custom Size' },
  ];

  readonly config = signal<LayoutConfig>(createDefaultConfig());
  readonly bodySections = signal<BodySection[]>([]);
  readonly selectedSectionId = signal<string | null>(null);
  readonly headerSlots = signal<ColumnSlot[]>(createHeaderSlots());
  readonly footerSlots = signal<ColumnSlot[]>(createFooterSlots());
  readonly showSettingsModal = signal(false);
  readonly showLoadSettingsModal = signal(false);
  readonly showPrintPreviewModal = signal(false);
  readonly settingsHistory = signal<SavedSetting[]>([]);
  readonly searchQuery = signal('');
  readonly validationResults = signal<{ layout: ValidationResult; sections: ValidationResult } | null>(null);
  readonly screenSize = this.responsiveService.screenSize;
  readonly responsiveLayout = this.responsiveService.optimalConfig;

  readonly saveForm = this.formBuilder.group({
    name: ['', [trimmedRequired, Validators.maxLength(50)]],
    description: [''],
  });

  readonly layout = computed(() => {
    const config = this.config();
    const px = (inches: number): number => inches * INCH_TO_PX;
    return {
      totalWidth: px(config.totalWidth),
      totalHeight: px(config.totalHeight),
      leftMargin: px(config.leftMargin),
      rightMargin: px(config.rightMargin),
      topMargin: px(config.topMargin),
      bottomMargin: px(config.bottomMargin),
      leftPadding: px(config.leftPadding),
      rightPadding: px(config.rightPadding),
      topPadding: px(config.topPadding),
      bottomPadding: px(config.bottomPadding),
      headerHeight: px(config.headerHeight),
      footerHeight: px(config.footerHeight),
    };
  });

  readonly contentAreaWidth = computed(() => {
    const layout = this.layout();
    return Math.max(0, layout.totalWidth - layout.leftMargin - layout.rightMargin - layout.leftPadding - layout.rightPadding);
  });

  readonly contentAreaHeight = computed(() => {
    const layout = this.layout();
    return Math.max(0, layout.totalHeight - layout.topMargin - layout.bottomMargin - layout.topPadding - layout.bottomPadding);
  });

  readonly bodyAreaHeight = computed(() =>
    Math.max(0, this.contentAreaHeight() - this.layout().headerHeight - this.layout().footerHeight),
  );
  readonly visibleHeaderColumns = computed(() => this.projectColumns(this.headerSlots(), this.config()));
  readonly visibleFooterColumns = computed(() => this.projectColumns(this.footerSlots(), this.config()));
  readonly selectedSection = computed(() => {
    const selectedId = this.selectedSectionId();
    return this.bodySections().find((section) => section.id === selectedId) ?? null;
  });
  readonly filteredSettings = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const settings = this.settingsHistory();
    if (!query) {
      return settings;
    }
    return settings.filter((setting) =>
      setting.name.toLowerCase().includes(query) ||
      (setting.description?.toLowerCase().includes(query) ?? false),
    );
  });

  private readonly sectionIds = computed(() => this.bodySections().map((section) => section.id).join('|'));
  private readonly interactElements = new Set<HTMLElement>();
  private readonly pendingSizing = new Set<string>();
  private notifiedMessages = new Set<string>();
  private notificationTimers: ReturnType<typeof setTimeout>[] = [];
  private sizingTimer: ReturnType<typeof setTimeout> | null = null;
  private printStyleElement: HTMLStyleElement | null = null;

  constructor() {
    effect(() => {
      const config = this.config();
      untracked(() => this.applyPrintPageSize(config.totalWidth, config.totalHeight));
    });

    afterRenderEffect(() => {
      this.sectionIds();
      untracked(() => this.initializeInteract());
    });

    document.addEventListener('keydown', this.onKeyDown);
    this.publishValidation(false);
    this.destroyRef.onDestroy(() => this.cleanup());
  }

  paperDimensions(pageType: string): PaperSize | null {
    if (!isPageType(pageType) || pageType === 'Custom') {
      return null;
    }
    return PAPER_SIZES[pageType];
  }

  updatePageType(pageType: string): void {
    if (!isPageType(pageType)) {
      return;
    }
    this.config.update((current) => {
      if (pageType === 'Custom') {
        return { ...current, pageType };
      }
      return {
        ...current,
        pageType,
        totalWidth: PAPER_SIZES[pageType].width,
        totalHeight: PAPER_SIZES[pageType].height,
      };
    });
    this.publishValidation(true);
  }

  updateDimension(key: DimensionKey, value: number | string | null): void {
    const numeric = this.toNumber(value);
    if (numeric === null) {
      return;
    }
    this.config.update((current) => ({
      ...current,
      [key]: numeric,
      pageType: key === 'totalWidth' || key === 'totalHeight' ? 'Custom' : current.pageType,
    }));
    this.publishValidation(true);
  }

  adjustColumn(column: ColumnKey, delta: number): void {
    const current = this.config().columnLayout[column];
    this.updateColumnLayout(column, Math.min(100, Math.max(0, current + delta)));
  }

  updateColumnLayout(column: ColumnKey, value: number | string | null): void {
    const numeric = this.toNumber(value);
    if (numeric === null) {
      return;
    }
    this.config.update((current) => ({
      ...current,
      columnLayout: { ...current.columnLayout, [column]: numeric },
    }));
    this.normalizeColumnWidths();
    this.publishValidation(true);
  }

  updateHeaderContent(slot: number, content: string): void {
    this.headerSlots.update((slots) => slots.map((item, index) => index === slot ? { ...item, content } : item));
  }

  updateFooterContent(slot: number, content: string): void {
    this.footerSlots.update((slots) => slots.map((item, index) => index === slot ? { ...item, content } : item));
  }

  addBodySection(type: BodySection['type']): void {
    const count = this.bodySections().length;
    const section = this.validateSectionValues({
      id: this.createId(type),
      type,
      name: type === 'patient'
        ? 'Patient Information'
        : type.charAt(0).toUpperCase() + type.slice(1),
      content: this.defaultContent(type),
      position: {
        x: type === 'patient' ? 0 : 5 + (count % 2) * 50,
        y: 5 + Math.floor(count / 2) * 40,
      },
      size: { width: type === 'patient' ? 100 : 45, height: type === 'patient' ? 8 : 25 },
      style: this.defaultStyle(),
    });
    this.bodySections.update((sections) => [...sections, section]);
    this.selectedSectionId.set(section.id);
    this.scheduleSizing(section.id);
    this.publishValidation(true);
  }

  deleteBodySection(sectionId: string): void {
    this.bodySections.update((sections) => sections.filter((section) => section.id !== sectionId));
    if (this.selectedSectionId() === sectionId) {
      this.selectedSectionId.set(null);
    }
    this.publishValidation(true);
  }

  duplicateBodySection(section: BodySection): void {
    const copy = this.validateSectionValues({
      ...structuredClone(section),
      id: this.createId(section.type),
      position: { x: section.position.x + 5, y: section.position.y + 5 },
    });
    this.bodySections.update((sections) => [...sections, copy]);
    this.selectedSectionId.set(copy.id);
    this.publishValidation(true);
  }

  selectBodySection(section: BodySection): void {
    const validated = this.validateSectionValues(section);
    this.replaceSection(section.id, () => validated);
    this.selectedSectionId.set(section.id);
    this.scheduleSizing(section.id);
  }

  restoreSectionDefaults(sectionId: string): void {
    const section = this.bodySections().find((item) => item.id === sectionId);
    if (!section) {
      return;
    }
    this.replaceSection(sectionId, (current) => this.validateSectionValues({
      ...current,
      content: this.defaultContent(current.type),
      style: this.defaultStyle(),
      isManuallyResized: false,
      size: {
        width: current.type === 'patient' ? 100 : 45,
        height: current.type === 'patient' ? 8 : 25,
      },
    }));
    this.scheduleSizing(sectionId);
    this.showNotification(`Section "${section.name}" restored to defaults`, 'success');
  }

  onSectionContentChange(sectionId: string, content: string): void {
    this.replaceSection(sectionId, (section) => ({ ...section, content }));
    this.scheduleSizing(sectionId);
    this.publishValidation(true);
  }

  resetToAutomaticSizing(sectionId: string): void {
    const section = this.bodySections().find((item) => item.id === sectionId);
    if (!section) {
      return;
    }
    this.replaceSection(sectionId, (current) => ({ ...current, isManuallyResized: false }));
    this.updateSectionDynamicSize(sectionId);
    this.showNotification(`Section "${section.name}" reset to automatic sizing`, 'success');
  }

  sectionInlineStyles(section: BodySection): Record<string, string> {
    const italic = section.style.fontWeight === 'italic';
    return {
      padding: `${section.style.padding}px`,
      'box-sizing': 'border-box',
      'font-size': `${section.style.fontSize}px`,
      color: section.style.fontColor,
      'text-align': section.style.textAlign,
      'font-weight': italic ? 'normal' : section.style.fontWeight,
      'font-style': italic ? 'italic' : 'normal',
      overflow: 'hidden',
    };
  }

  convertNewlinesToHtml(text: string): string {
    return text ? text.replace(/\n/g, '<br>') : '';
  }

  openPrintPreview(): void {
    this.showPrintPreviewModal.set(true);
  }

  closePrintPreview(): void {
    this.showPrintPreviewModal.set(false);
  }

  printFromPreview(): void {
    this.closePrintPreview();
    const timer = setTimeout(() => window.print(), 100);
    this.notificationTimers.push(timer);
  }

  openSaveSettingsModal(): void {
    this.saveForm.reset({ name: '', description: '' });
    this.showSettingsModal.set(true);
  }

  closeSaveSettingsModal(): void {
    this.showSettingsModal.set(false);
    this.saveForm.reset({ name: '', description: '' });
  }

  saveCurrentSetting(): void {
    if (this.saveForm.invalid) {
      this.saveForm.markAllAsTouched();
      this.showNotification('Please enter a name for your setting', 'error');
      return;
    }
    const name = this.saveForm.controls.name.value.trim();
    const description = this.saveForm.controls.description.value.trim();
    try {
      this.settingsService.saveSetting(name, {
        layout: structuredClone(this.config()),
        bodySections: structuredClone(this.bodySections()),
        headerColumns: this.toSavedColumns(this.visibleHeaderColumns()),
        footerColumns: this.toSavedColumns(this.visibleFooterColumns()),
      }, description || undefined);
      this.showNotification(`Setting "${name}" saved successfully!`, 'success');
      this.closeSaveSettingsModal();
      this.loadSettingsHistory();
    } catch (error) {
      console.error('Error saving setting:', error);
      this.showNotification('Failed to save setting. Please try again.', 'error');
    }
  }

  openLoadSettingsModal(): void {
    this.loadSettingsHistory();
    this.searchQuery.set('');
    this.showLoadSettingsModal.set(true);
  }

  closeLoadSettingsModal(): void {
    this.showLoadSettingsModal.set(false);
    this.searchQuery.set('');
  }

  loadSetting(setting: SavedSetting): void {
    try {
      const saved = setting.config;
      if (saved.layout) {
        const defaults = createDefaultConfig();
        this.config.set({
          ...defaults,
          ...saved.layout,
          columnLayout: { ...defaults.columnLayout, ...saved.layout.columnLayout },
          bodySection: { ...defaults.bodySection, ...saved.layout.bodySection },
        });
      }
      this.bodySections.set((saved.bodySections ?? []).map((section) => this.validateSectionValues(section)));
      this.selectedSectionId.set(null);
      for (const section of this.bodySections()) {
        this.scheduleSizing(section.id);
      }
      this.headerSlots.set(this.applySavedColumns(saved.headerColumns, createHeaderSlots()));
      this.footerSlots.set(this.applySavedColumns(saved.footerColumns, createFooterSlots()));
      this.closeLoadSettingsModal();
      this.publishValidation(true);
      this.showNotification(`Setting "${setting.name}" loaded successfully!`, 'success');
    } catch (error) {
      console.error('Error loading setting:', error);
      this.showNotification('Failed to load setting. Please try again.', 'error');
    }
  }

  deleteSetting(setting: SavedSetting): void {
    if (!confirm(`Are you sure you want to delete "${setting.name}"?`)) {
      return;
    }
    try {
      if (!this.settingsService.deleteSetting(setting.id)) {
        this.showNotification('Failed to delete setting.', 'error');
        return;
      }
      this.showNotification(`Setting "${setting.name}" deleted successfully!`, 'success');
      this.loadSettingsHistory();
    } catch (error) {
      console.error('Error deleting setting:', error);
      this.showNotification('Failed to delete setting. Please try again.', 'error');
    }
  }

  clearAllSettings(): void {
    if (!confirm('Are you sure you want to clear all saved settings? This action cannot be undone.')) {
      return;
    }
    try {
      this.settingsService.clearAllSettings();
      this.settingsHistory.set([]);
      this.showNotification('All settings cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing settings:', error);
      this.showNotification('Failed to clear settings. Please try again.', 'error');
    }
  }

  formatDate(date: Date): string {
    const value = new Date(date);
    return `${value.toLocaleDateString()} ${value.toLocaleTimeString()}`;
  }

  resetToDefaults(): void {
    if (!confirm('Are you sure you want to reset all settings to defaults? This will clear all current configuration.')) {
      return;
    }
    this.config.set(createDefaultConfig());
    this.bodySections.set([]);
    this.selectedSectionId.set(null);
    this.headerSlots.set(createHeaderSlots());
    this.footerSlots.set(createFooterSlots());
    this.notifiedMessages.clear();
    this.publishValidation(false);
    this.showNotification('Configuration reset to defaults!', 'success');
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
        return;
      }
    }

    if (this.showSettingsModal() || this.showLoadSettingsModal() || this.showPrintPreviewModal()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeSaveSettingsModal();
        this.closeLoadSettingsModal();
        this.closePrintPreview();
      }
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'p':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.openPrintPreview();
        }
        break;
      case 'delete':
      case 'backspace': {
        const selectedId = this.selectedSectionId();
        if (selectedId) {
          event.preventDefault();
          this.deleteBodySection(selectedId);
        }
        break;
      }
      case 'escape':
        this.selectedSectionId.set(null);
        break;
      default:
        break;
    }
  };

  private projectColumns(slots: ColumnSlot[], config: LayoutConfig): VisibleColumn[] {
    const widths = [config.columnLayout.column1, config.columnLayout.column2, config.columnLayout.column3];
    const visible: VisibleColumn[] = [];
    widths.forEach((width, slot) => {
      if (width <= 0 || !slots[slot]) {
        return;
      }
      visible.push({
        slot,
        width,
        content: slots[slot].content,
        style: slots[slot].style,
      });
    });
    return visible;
  }

  private normalizeColumnWidths(): void {
    this.config.update((current) => {
      const { column1, column2, column3 } = current.columnLayout;
      const total = column1 + column2 + column3;
      if (total === 0 || total === 100) {
        return current;
      }
      const next1 = Math.round((column1 / total) * 100);
      const next2 = Math.round((column2 / total) * 100);
      const next3 = 100 - next1 - next2;
      if (next1 === column1 && next2 === column2 && next3 === column3) {
        return current;
      }
      return { ...current, columnLayout: { column1: next1, column2: next2, column3: next3 } };
    });
  }

  private applySavedColumns(saved: SectionColumn[] | undefined, defaults: ColumnSlot[]): ColumnSlot[] {
    const next = defaults.map((slot) => ({ content: slot.content, style: { ...slot.style } }));
    if (!saved?.length) {
      return next;
    }
    const widths = [
      this.config().columnLayout.column1,
      this.config().columnLayout.column2,
      this.config().columnLayout.column3,
    ];
    let visibleIndex = 0;
    widths.forEach((width, slot) => {
      if (width <= 0) {
        return;
      }
      const source = saved[visibleIndex];
      visibleIndex += 1;
      if (!source) {
        return;
      }
      next[slot] = {
        content: source.content ?? next[slot].content,
        style: source.style ? { ...next[slot].style, ...source.style } : next[slot].style,
      };
    });
    return next;
  }

  private toSavedColumns(columns: VisibleColumn[]): SectionColumn[] {
    return columns.map((column) => ({
      content: column.content,
      width: column.width,
      style: { ...column.style },
    }));
  }

  private replaceSection(sectionId: string, updater: (section: BodySection) => BodySection): void {
    this.bodySections.update((sections) => sections.map((section) => section.id === sectionId ? updater(section) : section));
  }

  private validateSectionValues(section: BodySection): BodySection {
    const validated: BodySection = {
      ...section,
      position: { ...(section.position ?? { x: 5, y: 5 }) },
      size: { ...(section.size ?? { width: 45, height: 25 }) },
      style: { ...this.defaultStyle(), ...(section.style ?? {}) },
    };

    validated.position.x = Math.max(0, Math.min(90, validated.position.x));
    validated.position.y = Math.max(0, Math.min(90, validated.position.y));
    validated.size.width = Math.max(10, Math.min(100, validated.size.width));
    validated.size.height = Math.max(5, Math.min(95, validated.size.height));
    if (validated.position.x + validated.size.width > 100) {
      validated.size.width = 100 - validated.position.x;
    }
    if (validated.position.y + validated.size.height > 100) {
      validated.size.height = 100 - validated.position.y;
    }

    const minGap = 2;
    validated.position.x = Math.max(0, Math.min(100 - validated.size.width - minGap, validated.position.x));
    validated.position.y = Math.max(0, Math.min(100 - validated.size.height - minGap, validated.position.y));
    validated.style.fontSize = Math.max(8, Math.min(24, validated.style.fontSize));
    validated.style.padding = Math.max(0, Math.min(30, validated.style.padding));
    validated.style.margin = Math.max(0, Math.min(20, validated.style.margin));

    const alignments: TextAlign[] = ['left', 'center', 'right', 'justify'];
    if (!alignments.includes(validated.style.textAlign)) {
      validated.style.textAlign = 'left';
    }
    const weights: FontWeight[] = ['normal', 'bold', 'italic'];
    if (!weights.includes(validated.style.fontWeight)) {
      validated.style.fontWeight = 'normal';
    }
    if (!validated.style.fontColor || !/^#([0-9A-F]{3}){1,2}$/i.test(validated.style.fontColor)) {
      validated.style.fontColor = '#000000';
    }
    return validated;
  }

  private publishValidation(notify: boolean): void {
    const layoutResult = this.validationService.validateLayoutConfig(this.config());
    const sectionsResult = this.validationService.validateAllSections(this.bodySections());
    this.validationResults.set({ layout: layoutResult, sections: sectionsResult });

    const messages: Array<{ type: 'error' | 'warning'; text: string }> = [
      ...layoutResult.errors.map((text) => ({ type: 'error' as const, text })),
      ...sectionsResult.errors.map((text) => ({ type: 'error' as const, text })),
      ...layoutResult.warnings.map((text) => ({ type: 'warning' as const, text })),
      ...sectionsResult.warnings.map((text) => ({ type: 'warning' as const, text })),
    ];
    if (notify) {
      for (const message of messages) {
        const key = `${message.type}:${message.text}`;
        if (!this.notifiedMessages.has(key)) {
          this.showNotification(message.text, message.type);
        }
      }
    }
    this.notifiedMessages = new Set(messages.map((message) => `${message.type}:${message.text}`));
  }

  private scheduleSizing(sectionId: string): void {
    this.pendingSizing.add(sectionId);
    if (this.sizingTimer !== null) {
      return;
    }
    this.sizingTimer = setTimeout(() => {
      this.sizingTimer = null;
      const ids = [...this.pendingSizing];
      this.pendingSizing.clear();
      for (const id of ids) {
        this.updateSectionDynamicSize(id);
      }
    }, 50);
  }

  private updateSectionDynamicSize(sectionId: string): void {
    this.bodySections.update((sections) => sections.map((section) => {
      if (section.id !== sectionId || section.isManuallyResized) {
        return section;
      }
      const next: BodySection = {
        ...section,
        size: { ...section.size },
        style: { ...section.style },
        position: { ...section.position },
      };
      if (next.type === 'patient' && next.size.width === 45) {
        next.size.width = 100;
      }
      const estimated = this.calculateContentHeight(next);
      const newHeight = Math.max(8, Math.min(95, estimated));
      if (Math.abs(next.size.height - newHeight) > 1) {
        next.size.height = newHeight;
      }
      return next;
    }));
  }

  private calculateContentHeight(section: BodySection): number {
    const content = section.content ?? '';
    if (!content) {
      return 8;
    }
    const sectionWidth = section.size.width || 45;
    const listItems = (content.match(/<li[^>]*>.*?<\/li>/g) ?? []).length;
    const paragraphs = (content.match(/<p[^>]*>.*?<\/p>/g) ?? []).length;
    const textContent = content.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim();
    const textLines = textContent.split('\n').filter((line) => line.trim().length > 0);
    const baseCharsPerLine = Math.max(1, Math.floor((sectionWidth / 100) * 75));
    let totalLines = listItems * 1.2 + paragraphs * 0.3;
    for (const line of textLines) {
      totalLines += Math.ceil(line.length / baseCharsPerLine) || 1;
    }
    totalLines += 1.5;
    if (content.includes('<strong>') || content.includes('<b>')) {
      totalLines += 0.2;
    }
    if (content.includes('<em>') || content.includes('<i>')) {
      totalLines += 0.2;
    }
    if (listItems > 0) {
      totalLines += 0.5;
    }
    totalLines += ((section.style.padding ?? 8) * 2) / 11;
    totalLines += ((section.style.margin ?? 3) * 2) / 11;
    return Math.min(95, Math.max(8, totalLines * 2.2));
  }

  private initializeInteract(): void {
    this.clearInteractables();
    const body = this.bodyArea()?.nativeElement;
    if (!body) {
      return;
    }
    const rect = body.getBoundingClientRect();
    const gridX = rect.width * 0.05 || 8;
    const gridY = rect.height * 0.05 || 8;

    body.querySelectorAll<HTMLElement>('.body-section-element').forEach((element) => {
      const sectionId = element.dataset['sectionId'];
      if (!sectionId) {
        return;
      }
      try {
        interact(element).unset();
        interact(element)
          .draggable({
            listeners: {
              start: () => {
                element.style.zIndex = '1000';
              },
              move: (event: InteractPointerEvent) => {
                const current = this.bodySections().find((section) => section.id === sectionId);
                if (!current) {
                  return;
                }
                const bodyRect = body.getBoundingClientRect();
                const deltaX = bodyRect.width ? (event.dx / bodyRect.width) * 100 : 0;
                const deltaY = bodyRect.height ? (event.dy / bodyRect.height) * 100 : 0;
                const newX = Math.max(0, Math.min(100 - current.size.width, current.position.x + deltaX));
                const newY = Math.max(0, Math.min(100 - current.size.height, current.position.y + deltaY));
                if (this.collides(current, newX, newY, current.size.width, current.size.height)) {
                  return;
                }
                this.replaceSection(sectionId, (section) => ({
                  ...section,
                  position: { x: newX, y: newY },
                }));
              },
              end: () => {
                element.style.zIndex = '';
                this.replaceSection(sectionId, (section) => ({
                  ...section,
                  position: {
                    x: Math.round(section.position.x * 2) / 2,
                    y: Math.round(section.position.y * 2) / 2,
                  },
                }));
              },
            },
            modifiers: [
              interact.modifiers.snap({
                targets: [interact.snappers.grid({ x: gridX, y: gridY })],
                range: gridX,
                relativePoints: [{ x: 0, y: 0 }],
              }),
            ],
          })
          .resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            listeners: {
              start: () => {
                element.style.zIndex = '1000';
              },
              move: (event: InteractPointerEvent) => {
                const current = this.bodySections().find((section) => section.id === sectionId);
                if (!current || !event.deltaRect) {
                  return;
                }
                const bodyRect = body.getBoundingClientRect();
                const widthDelta = bodyRect.width
                  ? ((event.deltaRect.right + event.deltaRect.left) / bodyRect.width) * 100
                  : 0;
                const heightDelta = bodyRect.height
                  ? ((event.deltaRect.bottom + event.deltaRect.top) / bodyRect.height) * 100
                  : 0;
                let newWidth = current.size.width + widthDelta;
                let newHeight = current.size.height + heightDelta;
                let newX = current.position.x;
                let newY = current.position.y;
                if (event.deltaRect.left !== 0 && bodyRect.width) {
                  newX = current.position.x - (event.deltaRect.left / bodyRect.width) * 100;
                }
                if (event.deltaRect.top !== 0 && bodyRect.height) {
                  newY = current.position.y - (event.deltaRect.top / bodyRect.height) * 100;
                }
                newWidth = Math.max(10, Math.min(100, newWidth));
                newHeight = Math.max(5, Math.min(100, newHeight));
                newX = Math.max(0, Math.min(100 - newWidth, newX));
                newY = Math.max(0, Math.min(100 - newHeight, newY));
                if (this.collides(current, newX, newY, newWidth, newHeight)) {
                  return;
                }
                this.replaceSection(sectionId, (section) => ({
                  ...section,
                  isManuallyResized: true,
                  position: { x: newX, y: newY },
                  size: { width: newWidth, height: newHeight },
                }));
              },
              end: () => {
                element.style.zIndex = '';
                this.replaceSection(sectionId, (section) => ({
                  ...section,
                  position: {
                    x: Math.round(section.position.x * 2) / 2,
                    y: Math.round(section.position.y * 2) / 2,
                  },
                  size: {
                    width: Math.round(section.size.width * 2) / 2,
                    height: Math.round(section.size.height * 2) / 2,
                  },
                }));
              },
            },
            modifiers: [
              interact.modifiers.snapSize({
                targets: [interact.snappers.grid({ width: gridX, height: gridY })],
              }),
            ],
          });
        this.interactElements.add(element);
      } catch (error) {
        console.error('Unable to enable drag and resize for section', sectionId, error);
      }
    });
  }

  private collides(current: BodySection, x: number, y: number, width: number, height: number): boolean {
    return this.bodySections().some((section) => {
      if (section.id === current.id) {
        return false;
      }
      return !(
        x + width <= section.position.x ||
        x >= section.position.x + section.size.width ||
        y + height <= section.position.y ||
        y >= section.position.y + section.size.height
      );
    });
  }

  private clearInteractables(): void {
    for (const element of this.interactElements) {
      interact(element).unset();
    }
    this.interactElements.clear();
  }

  private applyPrintPageSize(width: number, height: number): void {
    if (!this.printStyleElement) {
      this.printStyleElement = document.createElement('style');
      this.printStyleElement.id = 'dynamic-print-page-size';
      document.head.appendChild(this.printStyleElement);
    }
    this.printStyleElement.textContent = `
      @page { margin: 0; size: ${width}in ${height}in; }
      @media print {
        html, body { width: ${width}in; height: ${height}in; margin: 0; padding: 0; }
        .total-page-container { width: ${width}in !important; height: ${height}in !important; }
      }
    `;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    document.querySelectorAll('.notification').forEach((node) => node.remove());
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    const colors: Record<typeof type, string> = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    };
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; border-radius: 0.5rem;
      color: white; font-weight: 600; z-index: 1000; max-width: 300px; word-wrap: break-word;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background: ${colors[type]};
    `;
    document.body.appendChild(notification);
    const duration = type === 'info' ? 10000 : 3000;
    const hideTimer = setTimeout(() => {
      notification.remove();
    }, duration);
    this.notificationTimers.push(hideTimer);
  }

  private loadSettingsHistory(): void {
    this.settingsHistory.set(this.settingsService.getSettingsHistory().settings);
  }

  private defaultContent(type: BodySection['type']): string {
    const content: Record<BodySection['type'], string> = {
      diagnostic: '<p><strong>Chief Complaints</strong></p><ul><li></li><li></li></ul><p><strong>Vitals</strong></p><ul><li></li><li></li></ul><p><strong>Investigations</strong></p><ul><li></li><li></li></ul>',
      prescription: 'Rx\n\n1. [Medicine Name] [Strength]\n   Take [frequency] for [duration]\n   ([Instructions - e.g., after meals])\n\n2. [Medicine Name] [Strength]\n   Take [frequency] for [duration]\n   ([Instructions])\n\n3. [Medicine Name] [Strength]\n   Take [frequency] for [duration]\n   ([Instructions])\n\nGeneral Instructions:\n• Complete the full course of medication\n• Take medicines as prescribed\n• Return if symptoms persist or worsen\n• Follow-up appointment: [Date]',
      custom: 'Additional Information:\n\n[Lab Reports Required]\n[Dietary Restrictions]\n[Activity Limitations]\n[Special Precautions]\n\n[Any other relevant medical information]',
      patient: 'P.ID: [Patient ID] | Date: [Date] | Name: [Full Name] | Age: [Age] years | Gender: [Male/Female] | Department: [Department] | Contact: [Phone Number] | Address: [Complete Address]',
    };
    return content[type];
  }

  private defaultStyle(): SectionStyle {
    return {
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left',
      fontColor: '#000000',
      padding: 10,
      margin: 5,
    };
  }

  private createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private toNumber(value: number | string | null): number | null {
    if (value === null || value === '') {
      return null;
    }
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private cleanup(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    if (this.sizingTimer !== null) {
      clearTimeout(this.sizingTimer);
      this.sizingTimer = null;
    }
    for (const timer of this.notificationTimers) {
      clearTimeout(timer);
    }
    this.notificationTimers = [];
    document.querySelectorAll('.notification').forEach((node) => node.remove());
    this.clearInteractables();
    this.printStyleElement?.remove();
    this.printStyleElement = null;
  }
}
