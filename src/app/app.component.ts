import { Component, ViewChild, ElementRef } from '@angular/core';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { PdfExportService } from './pdf-export.service';

interface PaperSize {
  width: number;
  height: number;
  unit: string;
}

interface Section {
  id: string;
  type: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontSize: number;
    fontWeight: string;
    textAlign: string;
    padding: number;
    margin: number;
  };
}



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
// Add these new properties and methods to AppComponent
export class AppComponent {
  @ViewChild('previewContainer', { static: false }) previewContainer!: ElementRef;

  title = 'prescription-angular';
  history: any[] = [];
  historyIndex = -1;

  constructor(private pdfExportService: PdfExportService) { }

  paperSizes: { [key: string]: PaperSize } = {
    A4: { width: 210, height: 297, unit: 'mm' },
    A5: { width: 148, height: 210, unit: 'mm' },
    Letter: { width: 8.5, height: 11, unit: 'in' },
    Legal: { width: 8.5, height: 14, unit: 'in' },
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
      content: 'Dr. [Doctor Name]\n[Clinic Name]\n[Address]',
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
      id: 'body',
      type: 'body',
      content: 'Patient Name: [Patient Name]\nDate: [Date]\n\nRx:\n[Prescription Details]',
      position: { x: 0, y: 20 },
      size: { width: 100, height: 60 },
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
      content: 'Doctor Signature: _______________\nDate: _______________',
      position: { x: 0, y: 85 },
      size: { width: 100, height: 10 },
      style: {
        fontSize: 10,
        fontWeight: 'normal',
        textAlign: 'right',
        padding: 8,
        margin: 5
      }
    }
  ];

  get currentPaperSize(): PaperSize {
    return this.selectedPaperSize === 'Custom' ?
      { ...this.customSize, unit: 'mm' } :
      this.paperSizes[this.selectedPaperSize];
  }

  onPaperSizeChange(): void {
    // Update preview when paper size changes
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
        this.sections = template.sections;
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
    { id: 'header', name: 'Header', icon: 'header', template: 'Dr. [Doctor Name]\n[Clinic Name]\n[Address]' },
    { id: 'patient-info', name: 'Patient Info', icon: 'user', template: 'Patient: [Patient Name]\nAge: [Age]\nGender: [Gender]\nDate: [Date]' },
    { id: 'diagnosis', name: 'Diagnosis', icon: 'clipboard', template: 'Diagnosis:\n[Diagnosis Details]' },
    { id: 'prescription', name: 'Prescription', icon: 'pill', template: 'Rx:\n1. [Medicine Name] - [Dosage] - [Frequency]\n2. [Medicine Name] - [Dosage] - [Frequency]' },
    { id: 'instructions', name: 'Instructions', icon: 'info', template: 'Instructions:\n[Special Instructions]' },
    { id: 'footer', name: 'Footer', icon: 'signature', template: 'Doctor Signature: _______________\nDate: _______________' },
    { id: 'custom', name: 'Custom Text', icon: 'text', template: '[Custom Content]' }
  ];

  // Add new section
  addSection(type: string): void {
    const sectionType = this.availableSectionTypes.find(t => t.id === type);
    if (!sectionType) return;

    const newSection: Section = {
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

    this.sections.push(newSection);
    this.selectedSection = newSection;
  }

  // Delete section
  deleteSection(sectionId: string): void {
    this.sections = this.sections.filter(s => s.id !== sectionId);
    if (this.selectedSection?.id === sectionId) {
      this.selectedSection = null;
    }
  }

  // Duplicate section
  duplicateSection(section: Section): void {
    const duplicated: Section = {
      ...JSON.parse(JSON.stringify(section)),
      id: `${section.type}-${Date.now()}`,
      position: { x: section.position.x + 5, y: section.position.y + 5 }
    };
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
}

