import { Component, ViewChild, ElementRef } from '@angular/core';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { PdfExportService } from './pdf-export.service';
import { Section, SectionColumn } from './section.model';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
// Add these new properties and methods to AppComponent
export class AppComponent {
  @ViewChild('previewContainer', { static: false }) previewContainer!: ElementRef;

  title = 'dynamic-prescription';
  history: any[] = [];
  historyIndex = -1;

  constructor(private pdfExportService: PdfExportService) { }

  paperSizes: { [key: string]: { width: number; height: number; unit: string } } = {
    A4: { width: 210, height: 297, unit: 'mm' },
    A5: { width: 148, height: 210, unit: 'mm' },
    Letter: { width: 215.9, height: 279.4, unit: 'mm' }, // 8.5 x 11 in
    Legal: { width: 215.9, height: 355.6, unit: 'mm' }, // 8.5 x 14 in
    Custom: { width: 210, height: 297, unit: 'mm' }
  };

  selectedPaperSize = 'A4';
  customSize = { width: 210, height: 297 };
  selectedSection: Section | null = null;
  activeTab = 'Position';
  tabs = ['Position', 'Size', 'Style'];

  sections: Section[] = [
    {
      id: 'header',
      type: 'header',
      columns: [
        { content: 'Dr. [Doctor Name]', width: 33 },
        { content: '[Clinic Name]', width: 34 },
        { content: '[Address]', width: 33 }
      ],
      position: { x: 0, y: 0 },
      size: { width: 100, height: 15 },
      style: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 10,
        margin: 5
      }
    },
    {
      id: 'diagnosis',
      type: 'diagnosis',
      content: 'Diagnosis:\n[Diagnosis Details]',
      position: { x: 0, y: 15 }, // below header
      size: { width: 50, height: 50 }, // left half
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        padding: 15,
        margin: 10
      }
    },
    {
      id: 'prescription',
      type: 'prescription',
      content: 'Rx:\n1. [Medicine Name] - [Dosage] - [Frequency]\n2. [Medicine Name] - [Dosage] - [Frequency]',
      position: { x: 50, y: 15 }, // right half, below header
      size: { width: 50, height: 50 },
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        padding: 15,
        margin: 10
      }
    },
    {
      id: 'footer',
      type: 'footer',
      columns: [
        { content: 'Doctor Signature:', width: 50 },
        { content: 'Date: _______________', width: 50 }
      ],
      position: { x: 0, y: 65 }, // below main area
      size: { width: 100, height: 15 },
      style: {
        fontSize: 10,
        fontWeight: 'normal',
        textAlign: 'right',
        padding: 8,
        margin: 5
      }
    }
  ];

  get currentPaperSize(): { width: number; height: number; unit: string } {
    return this.selectedPaperSize === 'Custom' ?
      { ...this.customSize, unit: 'mm' } :
      this.paperSizes[this.selectedPaperSize];
  }

  readonly headerHeightPercent = 15;
  readonly footerHeightPercent = 15;

  ngOnInit() {
    this.adjustSectionLayout();
  }

  ngOnChanges() {
    this.adjustSectionLayout();
  }

  ngAfterViewInit() {
    this.adjustSectionLayout();
  }

  onPaperSizeChange(): void {
    this.adjustSectionLayout();
  }

  adjustSectionLayout(): void {
    // Find header, footer, and middle sections
    const header = this.sections.find(s => s.type === 'header');
    const footer = this.sections.find(s => s.type === 'footer');
    const middleSections = this.sections.filter(s => s.type !== 'header' && s.type !== 'footer');

    // Set header at top
    if (header) {
      header.position.y = 0;
      header.size.height = this.headerHeightPercent;
      header.position.x = 0;
      header.size.width = 100;
    }
    // Set footer at bottom
    if (footer) {
      footer.position.y = 100 - this.footerHeightPercent;
      footer.size.height = this.footerHeightPercent;
      footer.position.x = 0;
      footer.size.width = 100;
    }
    // Middle sections fill the space between header and footer
    const middleHeight = 100 - this.headerHeightPercent - this.footerHeightPercent;
    if (middleSections.length === 2) {
      // Two columns side by side
      middleSections[0].position.x = 0;
      middleSections[0].position.y = this.headerHeightPercent;
      middleSections[0].size.width = 50;
      middleSections[0].size.height = middleHeight;
      middleSections[1].position.x = 50;
      middleSections[1].position.y = this.headerHeightPercent;
      middleSections[1].size.width = 50;
      middleSections[1].size.height = middleHeight;
    } else if (middleSections.length === 1) {
      // Single middle section
      middleSections[0].position.x = 0;
      middleSections[0].position.y = this.headerHeightPercent;
      middleSections[0].size.width = 100;
      middleSections[0].size.height = middleHeight;
    }
  }

  onCustomSizeChange(): void {
    // Update preview when custom size changes
  }

  selectSection(section: Section): void {
    this.selectedSection = section;
  }

  updateSection(): void {
    // Trigger change detection
  }

  onDragEnded(event: CdkDragEnd, section: Section): void {
    const containerRect = this.previewContainer.nativeElement.getBoundingClientRect();
    const dragPosition = event.source.getFreeDragPosition();

    // Calculate new position as percentage
    const newX = (dragPosition.x / containerRect.width) * 100;
    const newY = (dragPosition.y / containerRect.height) * 100;

    // Update section position with bounds checking
    section.position.x = Math.max(0, Math.min(95, section.position.x + newX));
    section.position.y = Math.max(0, Math.min(95, section.position.y + newY));

    // Reset drag position
    event.source.reset();
  }

  trackBySection(index: number, section: Section): string {
    return section.id;
  }

  saveTemplate(): void {
    const template = {
      paperSize: this.selectedPaperSize,
      customSize: this.customSize,
      sections: this.sections
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prescription-template.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  loadTemplate(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const template = JSON.parse(e.target.result);
        this.selectedPaperSize = template.paperSize;
        if (template.customSize) {
          this.customSize = template.customSize;
        }
        // Ensure all sections have required fields
        this.sections = template.sections.map((s: any) => {
          if (s.type === 'header' || s.type === 'footer') {
            return {
              ...s,
              columns: s.columns && s.columns.length > 0 ? s.columns : [{ content: s.content || '', width: 100 }],
              content: ''
            };
          } else {
            return {
              ...s,
              content: s.content || '',
              columns: undefined
            };
          }
        });
        this.adjustSectionLayout();
      } catch (error) {
        alert('Error loading template: Invalid file format');
      }
    };
    reader.readAsText(file);
  }

  async exportToPDF(): Promise<void> {
    try {
      const result = await this.pdfExportService.exportToPDF(
        this.sections,
        this.selectedPaperSize,
        this.selectedPaperSize === 'Custom' ? this.customSize : undefined,
        'prescription-template'
      );

      if (result.success) {
        console.log('PDF exported successfully');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  }

  // Enhanced section types
  availableSectionTypes = [
    { id: 'header', name: 'Header', icon: 'header', template: 'Dr. [Doctor Name]' },
    { id: 'patient-info', name: 'Patient Info', icon: 'user', template: 'Patient: [Patient Name]\nAge: [Age]\nGender: [Gender]\nDate: [Date]' },
    { id: 'diagnosis', name: 'Diagnosis', icon: 'clipboard', template: 'Diagnosis:\n[Diagnosis Details]' },
    { id: 'prescription', name: 'Prescription', icon: 'pill', template: 'Rx:\n1. [Medicine Name] - [Dosage] - [Frequency]\n2. [Medicine Name] - [Dosage] - [Frequency]' },
    { id: 'instructions', name: 'Instructions', icon: 'info', template: 'Instructions:\n[Special Instructions]' },
    { id: 'footer', name: 'Footer', icon: 'signature', template: 'Doctor Signature: _______________' },
    { id: 'custom', name: 'Custom Text', icon: 'text', template: '[Custom Content]' }
  ] as const;

  // Add new section
  addSection(type: string): void {
    const sectionType = this.availableSectionTypes.find(t => t.id === type);
    if (!sectionType) return;

    let newSection: Section;
    if (type === 'header' || type === 'footer') {
      // Default to 1 column for new header/footer
      newSection = {
        id: `${type}-${Date.now()}`,
        type: type,
        columns: [
          { content: sectionType.template, width: 100 }
        ],
        position: { x: 10, y: 10 + (this.sections.length * 15) },
        size: { width: 80, height: 15 },
        style: {
          fontSize: 12,
          fontWeight: 'normal',
          textAlign: 'left',
          padding: 10,
          margin: 5
        }
      };
    } else {
      newSection = {
        id: `${type}-${Date.now()}`,
        type: type,
        content: sectionType.template,
        position: { x: 10, y: 10 + (this.sections.length * 15) },
        size: { width: 80, height: 15 },
        style: {
          fontSize: 12,
          fontWeight: 'normal',
          textAlign: 'left',
          padding: 10,
          margin: 5
        }
      };
    }

    this.sections.push(newSection);
    this.selectedSection = newSection;
    this.adjustSectionLayout();
  }

  // Delete section
  deleteSection(sectionId: string): void {
    this.sections = this.sections.filter(s => s.id !== sectionId);
    if (this.selectedSection?.id === sectionId) {
      this.selectedSection = null;
    }
    this.adjustSectionLayout();
  }

  // Duplicate section
  duplicateSection(section: Section): void {
    let duplicated: Section;
    if (section.type === 'header' || section.type === 'footer') {
      duplicated = {
        ...JSON.parse(JSON.stringify(section)),
        id: `${section.type}-${Date.now()}`,
        columns: section.columns ? section.columns.map(col => ({ ...col })) : [{ content: '', width: 100 }],
        position: { x: section.position.x + 5, y: section.position.y + 5 }
      };
    } else {
      duplicated = {
        ...JSON.parse(JSON.stringify(section)),
        id: `${section.type}-${Date.now()}`,
        content: section.content || '',
        position: { x: section.position.x + 5, y: section.position.y + 5 }
      };
    }
    this.sections.push(duplicated);
  }

  saveState(): void {
    const state = JSON.stringify(this.sections);
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);
    this.historyIndex++;
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.sections = JSON.parse(this.history[this.historyIndex]);
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.sections = JSON.parse(this.history[this.historyIndex]);
    }
  }

  setHeaderFooterColumns(colCount: number): void {
    if (!this.selectedSection || !(this.selectedSection.type === 'header' || this.selectedSection.type === 'footer')) return;
    const currentCols = this.selectedSection.columns || [];
    if (colCount === currentCols.length) return;
    // Adjust columns array
    if (colCount > currentCols.length) {
      // Add new columns
      for (let i = currentCols.length; i < colCount; i++) {
        currentCols.push({ content: '', width: Math.floor(100 / colCount) });
      }
    } else {
      // Remove extra columns
      currentCols.length = colCount;
    }
    // Normalize widths
    const evenWidth = Math.floor(100 / colCount);
    for (let i = 0; i < colCount; i++) {
      currentCols[i].width = evenWidth;
    }
    // Adjust last column to fill 100%
    currentCols[colCount - 1].width = 100 - evenWidth * (colCount - 1);
    this.selectedSection.columns = [...currentCols];
  }

  normalizeColumnWidths(): void {
    if (!this.selectedSection || !this.selectedSection.columns) return;
    // Ensure total width is 100%
    let total = this.selectedSection.columns.reduce((sum, col) => sum + (col.width || 0), 0);
    if (total !== 100) {
      // Normalize all columns proportionally
      this.selectedSection.columns = this.selectedSection.columns.map(col => ({
        ...col,
        width: Math.round((col.width / total) * 100)
      }));
      // Adjust last column to fill exactly 100%
      const sumExceptLast = this.selectedSection.columns.slice(0, -1).reduce((sum, col) => sum + col.width, 0);
      this.selectedSection.columns[this.selectedSection.columns.length - 1].width = 100 - sumExceptLast;
    }
  }

  getColumnContent(i: number): string {
    return this.selectedSection?.columns?.[i]?.content ?? '';
  }
  setColumnContent(i: number, value: string) {
    if (this.selectedSection?.columns && this.selectedSection.columns[i]) {
      this.selectedSection.columns[i].content = value;
    }
  }
  getColumnWidth(i: number): number {
    return this.selectedSection?.columns?.[i]?.width ?? 0;
  }
  setColumnWidth(i: number, value: number) {
    if (this.selectedSection?.columns && this.selectedSection.columns[i]) {
      this.selectedSection.columns[i].width = value;
      this.normalizeColumnWidths();
    }
  }
}

