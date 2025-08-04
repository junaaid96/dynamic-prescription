import { Component, OnInit } from '@angular/core';
import { PdfExportService } from '../pdf-export.service';
import { Section, SectionColumn } from '../section.model';
import { SettingsService, SavedSetting } from '../settings.service';

export interface LayoutConfig {
  pageType: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
  totalWidth: number;
  totalHeight: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  leftPadding: number;
  rightPadding: number;
  topPadding: number;
  bottomPadding: number;
  headerHeight: number;
  footerHeight: number;
  columnLayout: {
    column1: number;
    column2: number;
    column3: number;
  };
  bodySection: {
    leftMargin: number;
    rightMargin: number;
    topMargin: number;
    bottomMargin: number;
    separatorLine: boolean;
    bottomLine: boolean;
  };
}

export interface BodySection {
  id: string;
  type: 'diagnostic' | 'prescription' | 'custom' | 'patient';
  name: string;
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

// Predefined paper sizes in inches
const PAPER_SIZES = {
  A4: { width: 8.27, height: 11.69 },
  A5: { width: 5.83, height: 8.27 },
  Letter: { width: 8.5, height: 11 },
  Legal: { width: 8.5, height: 14 },
  Custom: { width: 8.5, height: 11 }
};

@Component({
  selector: 'app-comprehensive-layout',
  templateUrl: './comprehensive-layout.component.html',
  styleUrls: ['./comprehensive-layout.component.css']
})
export class ComprehensiveLayoutComponent implements OnInit {
  // Convert inches to pixels (assuming 96 DPI)
  private readonly INCH_TO_PX = 96;

  // Make PAPER_SIZES available in template
  PAPER_SIZES = PAPER_SIZES;

  // Make Math available in template
  Math = Math;

  config: LayoutConfig = {
    pageType: 'A4',
    totalWidth: PAPER_SIZES.A4.width,
    totalHeight: PAPER_SIZES.A4.height,
    leftMargin: 0,
    rightMargin: 0,
    topMargin: 0,
    bottomMargin: 0,
    leftPadding: 0,
    rightPadding: 0,
    topPadding: 0,
    bottomPadding: 0,
    headerHeight: 1,
    footerHeight: 1,
    columnLayout: {
      column1: 40,
      column2: 10,
      column3: 50
    },
    bodySection: {
      leftMargin: 0,
      rightMargin: 0,
      topMargin: 0,
      bottomMargin: 0,
      separatorLine: false,
      bottomLine: false
    }
  };

  // Default section configurations - these values are preserved by default
  private readonly DEFAULT_SECTIONS: BodySection[] = [
    {
      id: 'patient-1',
      type: 'patient',
      name: 'Patient Information',
      content: 'Patient Information:\nName: [Patient Name]\nAge: [Age]\nGender: [Gender]\nContact: [Phone Number]\nAddress: [Address]\nEmergency Contact: [Emergency Contact]',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 20 },
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        padding: 10,
        margin: 5
      }
    },
    {
      id: 'diagnostic-1',
      type: 'diagnostic',
      name: 'Diagnosis',
      content: 'Diagnosis:\n[Enter diagnosis details here]\n\nSymptoms:\n[Enter symptoms here]\n\nNotes:\n[Additional notes]',
      position: { x: 0, y: 20 },
      size: { width: 50, height: 80 },
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        padding: 10,
        margin: 5
      }
    },
    {
      id: 'prescription-1',
      type: 'prescription',
      name: 'Prescription',
      content: 'Rx:\n1. [Medicine Name] - [Dosage] - [Frequency]\n2. [Medicine Name] - [Dosage] - [Frequency]\n3. [Medicine Name] - [Dosage] - [Frequency]\n\nInstructions:\n[Special instructions]',
      position: { x: 50, y: 20 },
      size: { width: 50, height: 80 },
      style: {
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        padding: 10,
        margin: 5
      }
    }
  ];

  // Body sections for drag and drop - initialized with default values
  bodySections: BodySection[] = [];

  selectedSection: BodySection | null = null;
  draggedSection: BodySection | null = null;

  // Settings management
  showSettingsModal = false;
  showLoadSettingsModal = false;
  settingsHistory: SavedSetting[] = [];
  newSettingName = '';
  newSettingDescription = '';
  searchQuery = '';

  // Layout dimensions for display
  layout = {
    totalWidth: this.config.totalWidth * this.INCH_TO_PX,
    totalHeight: this.config.totalHeight * this.INCH_TO_PX,
    leftMargin: this.config.leftMargin * this.INCH_TO_PX,
    rightMargin: this.config.rightMargin * this.INCH_TO_PX,
    topMargin: this.config.topMargin * this.INCH_TO_PX,
    bottomMargin: this.config.bottomMargin * this.INCH_TO_PX,
    leftPadding: this.config.leftPadding * this.INCH_TO_PX,
    rightPadding: this.config.rightPadding * this.INCH_TO_PX,
    topPadding: this.config.topPadding * this.INCH_TO_PX,
    bottomPadding: this.config.bottomPadding * this.INCH_TO_PX,
    headerHeight: this.config.headerHeight * this.INCH_TO_PX,
    footerHeight: this.config.footerHeight * this.INCH_TO_PX
  };

  // Available page types
  pageTypes = [
    { id: 'A4', name: 'A4 (8.27 × 11.69 in)', icon: 'document' },
    { id: 'A5', name: 'A5 (5.83 × 8.27 in)', icon: 'document' },
    { id: 'Letter', name: 'Letter (8.5 × 11 in)', icon: 'document' },
    { id: 'Legal', name: 'Legal (8.5 × 14 in)', icon: 'document' },
    { id: 'Custom', name: 'Custom Size', icon: 'settings' }
  ];

  // Header and Footer column content
  headerColumns = [
    { content: 'Dr. [Doctor Name]', width: 33 },
    { content: '[Clinic Name]', width: 34 },
    { content: '[Address]', width: 33 }
  ];

  footerColumns = [
    { content: 'Doctor Signature:', width: 50 },
    { content: 'Date: _______________', width: 50 }
  ];

  constructor(
    private pdfExportService: PdfExportService,
    private settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    // Initialize body sections with proper deep copy of defaults
    this.bodySections = JSON.parse(JSON.stringify(this.DEFAULT_SECTIONS));
    
    this.updateLayout();
    this.updateColumnContent();
    this.validateAllSections();
    this.setupKeyboardShortcuts();
    
    // Debug: Log initial default sections
    console.log('Initial DEFAULT_SECTIONS:', this.DEFAULT_SECTIONS);
    console.log('Initial bodySections:', this.bodySections);
  }

  ngOnDestroy(): void {
    this.removeKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  private removeKeyboardShortcuts(): void {
    document.removeEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Only handle shortcuts when not typing in input fields
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'p':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.exportToPDF();
        }
        break;
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.saveConfiguration();
        }
        break;
      case 'delete':
      case 'backspace':
        if (this.selectedSection) {
          event.preventDefault();
          this.deleteBodySection(this.selectedSection.id);
        }
        break;
      case 'escape':
        this.selectedSection = null;
        break;
    }
  }

  // Helper method to get paper dimensions safely
  getPaperDimensions(pageTypeId: string): { width: number; height: number } | null {
    if (pageTypeId === 'Custom') return null;
    return PAPER_SIZES[pageTypeId as keyof typeof PAPER_SIZES] || null;
  }

  // Update page type and automatically adjust dimensions
  updatePageType(pageType: string): void {
    if (pageType === 'A4' || pageType === 'A5' || pageType === 'Letter' || pageType === 'Legal' || pageType === 'Custom') {
      this.config.pageType = pageType;
      
      if (pageType !== 'Custom') {
        const paperSize = PAPER_SIZES[pageType as keyof typeof PAPER_SIZES];
        this.config.totalWidth = paperSize.width;
        this.config.totalHeight = paperSize.height;
      }
      
      this.updateLayout();
    }
  }

  updateLayout(): void {
    this.layout.totalWidth = this.config.totalWidth * this.INCH_TO_PX;
    this.layout.totalHeight = this.config.totalHeight * this.INCH_TO_PX;
    this.layout.leftMargin = this.config.leftMargin * this.INCH_TO_PX;
    this.layout.rightMargin = this.config.rightMargin * this.INCH_TO_PX;
    this.layout.topMargin = this.config.topMargin * this.INCH_TO_PX;
    this.layout.bottomMargin = this.config.bottomMargin * this.INCH_TO_PX;
    this.layout.leftPadding = this.config.leftPadding * this.INCH_TO_PX;
    this.layout.rightPadding = this.config.rightPadding * this.INCH_TO_PX;
    this.layout.topPadding = this.config.topPadding * this.INCH_TO_PX;
    this.layout.bottomPadding = this.config.bottomPadding * this.INCH_TO_PX;
    this.layout.headerHeight = this.config.headerHeight * this.INCH_TO_PX;
    this.layout.footerHeight = this.config.footerHeight * this.INCH_TO_PX;
  }

  updateColumnLayout(column: 'column1' | 'column2' | 'column3', value: number): void {
    this.config.columnLayout[column] = value;
    this.normalizeColumnWidths();
    this.updateColumnContent();
  }

  normalizeColumnWidths(): void {
    const total = this.config.columnLayout.column1 + this.config.columnLayout.column2 + this.config.columnLayout.column3;
    if (total !== 100) {
      this.config.columnLayout.column1 = Math.round((this.config.columnLayout.column1 / total) * 100);
      this.config.columnLayout.column2 = Math.round((this.config.columnLayout.column2 / total) * 100);
      this.config.columnLayout.column3 = 100 - this.config.columnLayout.column1 - this.config.columnLayout.column2;
    }
  }

  updateColumnContent(): void {
    // Update header columns based on column layout
    this.headerColumns = [];
    if (this.config.columnLayout.column1 > 0) {
      this.headerColumns.push({ content: 'Dr. [Doctor Name]', width: this.config.columnLayout.column1 });
    }
    if (this.config.columnLayout.column2 > 0) {
      this.headerColumns.push({ content: '[Clinic Name]', width: this.config.columnLayout.column2 });
    }
    if (this.config.columnLayout.column3 > 0) {
      this.headerColumns.push({ content: '[Address]', width: this.config.columnLayout.column3 });
    }

    // Update footer columns based on column layout
    this.footerColumns = [];
    if (this.config.columnLayout.column1 > 0) {
      this.footerColumns.push({ content: 'Doctor Signature:', width: this.config.columnLayout.column1 });
    }
    if (this.config.columnLayout.column2 > 0) {
      this.footerColumns.push({ content: 'Date: _______________', width: this.config.columnLayout.column2 });
    }
    if (this.config.columnLayout.column3 > 0) {
      this.footerColumns.push({ content: 'License: _______________', width: this.config.columnLayout.column3 });
    }
  }

  updateHeaderColumnContent(index: number, content: string): void {
    if (this.headerColumns[index]) {
      this.headerColumns[index].content = content;
    }
  }

  updateFooterColumnContent(index: number, content: string): void {
    if (this.footerColumns[index]) {
      this.footerColumns[index].content = content;
    }
  }

  // Get default content for section types
  private getDefaultContent(type: 'diagnostic' | 'prescription' | 'custom' | 'patient'): string {
    const defaultContent = {
      diagnostic: 'Diagnosis:\n[Enter diagnosis details here]\n\nSymptoms:\n[Enter symptoms here]\n\nNotes:\n[Additional notes]',
      prescription: 'Rx:\n1. [Medicine Name] - [Dosage] - [Frequency]\n2. [Medicine Name] - [Dosage] - [Frequency]\n3. [Medicine Name] - [Dosage] - [Frequency]\n\nInstructions:\n[Special instructions]',
      custom: '[Enter custom content here]\n\n[Additional information]',
      patient: 'Patient Information:\nName: [Patient Name]\nAge: [Age]\nGender: [Gender]\nContact: [Phone Number]\nAddress: [Address]\nEmergency Contact: [Emergency Contact]'
    };
    return defaultContent[type];
  }

  // Get default style for sections
  private getDefaultStyle() {
    return {
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left',
      padding: 10,
      margin: 5
    };
  }

  // Body Section Management
  addBodySection(type: 'diagnostic' | 'prescription' | 'custom' | 'patient'): void {
    // Calculate position to avoid overlapping
    const existingSections = this.bodySections.length;
    const baseX = 5 + (existingSections % 2) * 50;
    const baseY = 5 + Math.floor(existingSections / 2) * 40;

    const newSection: BodySection = {
      id: `${type}-${Date.now()}`,
      type: type,
      name: type.charAt(0).toUpperCase() + type.slice(1) + (type === 'patient' ? ' Information' : ''),
      content: this.getDefaultContent(type),
      position: { x: baseX, y: baseY },
      size: { width: 45, height: 25 },
      style: this.getDefaultStyle()
    };

    this.bodySections.push(newSection);
    this.selectedSection = newSection;
  }

  selectBodySection(section: BodySection): void {
    // Validate section values before selecting
    const validatedSection = this.validateSectionValues(section);
    const sectionIndex = this.bodySections.findIndex(s => s.id === section.id);
    if (sectionIndex !== -1) {
      this.bodySections[sectionIndex] = validatedSection;
    }
    this.selectedSection = validatedSection;
  }

  deleteBodySection(sectionId: string): void {
    this.bodySections = this.bodySections.filter(s => s.id !== sectionId);
    if (this.selectedSection?.id === sectionId) {
      this.selectedSection = null;
    }
  }

  duplicateBodySection(section: BodySection): void {
    const duplicated: BodySection = {
      ...JSON.parse(JSON.stringify(section)),
      id: `${section.type}-${Date.now()}`,
      position: { x: section.position.x + 5, y: section.position.y + 5 }
    };
    this.bodySections.push(duplicated);
  }

  // Restore default values for a specific section
  restoreSectionDefaults(sectionId: string): void {
    console.log('=== RESTORE DEFAULTS CALLED ===');
    console.log('Section ID:', sectionId);
    console.log('All body sections:', this.bodySections);
    
    const section = this.bodySections.find(s => s.id === sectionId);
    if (section) {
      console.log('Found section:', section);
      const defaultSection = this.DEFAULT_SECTIONS.find(ds => ds.type === section.type);
      if (defaultSection) {
        console.log('Found default section for type:', section.type, defaultSection);
        console.log('Before restore:', { 
          content: section.content, 
          position: section.position, 
          size: section.size, 
          style: section.style 
        });
        console.log('Default values:', { 
          content: defaultSection.content, 
          position: defaultSection.position, 
          size: defaultSection.size, 
          style: defaultSection.style 
        });
        
        // Restore all default values including position and size
        section.content = defaultSection.content;
        section.position = { ...defaultSection.position };
        section.size = { ...defaultSection.size };
        section.style = { ...defaultSection.style };
        
        console.log('After restore:', { 
          content: section.content, 
          position: section.position, 
          size: section.size, 
          style: section.style 
        });
        
        // Force Angular to detect changes by creating a new array reference
        this.bodySections = [...this.bodySections];
        
        // Update the selected section reference if it's the same section
        if (this.selectedSection && this.selectedSection.id === sectionId) {
          this.selectedSection = { ...section };
        }
        
        console.log('Final bodySections array:', this.bodySections);
        console.log('Final selectedSection:', this.selectedSection);
        
        this.showNotification(`Default values restored for ${section.name}`, 'success');
      } else {
        console.error('No default section found for type:', section.type);
        this.showNotification(`No default values found for ${section.name}`, 'error');
      }
    } else {
      console.error('Section not found with ID:', sectionId);
      this.showNotification('Section not found', 'error');
    }
  }

  // Get default values for a section type
  getDefaultValuesForType(type: 'diagnostic' | 'prescription' | 'custom' | 'patient'): Partial<BodySection> {
    const defaultSection = this.DEFAULT_SECTIONS.find(ds => ds.type === type);
    if (defaultSection) {
      return {
        content: defaultSection.content,
        style: { ...defaultSection.style }
      };
    }
    return {
      content: this.getDefaultContent(type),
      style: this.getDefaultStyle()
    };
  }

  // Drag and Drop functionality
  onDragStart(event: DragEvent, section: BodySection): void {
    this.draggedSection = section;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.draggedSection && event.target) {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      
      this.draggedSection.position.x = Math.max(0, Math.min(90, x));
      this.draggedSection.position.y = Math.max(0, Math.min(90, y));
      
      this.draggedSection = null;
    }
  }

  // Add PDF export functionality
  async exportToPDF(): Promise<void> {
    try {
      // Validate configuration before export
      if (!this.validateConfiguration()) {
        return;
      }

      const sections: Section[] = this.convertLayoutToSections();

      const result = await this.pdfExportService.exportToPDF(
        sections,
        this.config.pageType,
        undefined,
        'comprehensive-layout'
      );

      if (result.success) {
        this.showNotification('PDF exported successfully!', 'success');
        console.log('PDF exported successfully');
      } else {
        this.showNotification('Failed to export PDF: ' + result.message, 'error');
        console.error('PDF export failed:', result.message);
      }
    } catch (error) {
      this.showNotification('Failed to export PDF. Please try again.', 'error');
      console.error('Error exporting PDF:', error);
    }
  }

  private validateConfiguration(): boolean {
    // Check if page dimensions are valid
    if (this.config.totalWidth <= 0 || this.config.totalHeight <= 0) {
      this.showNotification('Invalid page dimensions. Please check width and height.', 'error');
      return false;
    }

    // Check if margins are valid
    const totalMargins = this.config.leftMargin + this.config.rightMargin;
    const totalPadding = this.config.leftPadding + this.config.rightPadding;
    
    if (totalMargins + totalPadding >= this.config.totalWidth) {
      this.showNotification('Margins and padding exceed page width. Please adjust.', 'error');
      return false;
    }

    if (this.config.topMargin + this.config.bottomMargin + this.config.topPadding + this.config.bottomPadding >= this.config.totalHeight) {
      this.showNotification('Margins and padding exceed page height. Please adjust.', 'error');
      return false;
    }

    // Check if body sections exist
    if (this.bodySections.length === 0) {
      this.showNotification('No content sections added. Please add at least one section.', 'warning');
    }

    return true;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      color: white;
      font-weight: 600;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;

    // Set background color based on type
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#10b981';
        break;
      case 'error':
        notification.style.backgroundColor = '#ef4444';
        break;
      case 'warning':
        notification.style.backgroundColor = '#f59e0b';
        break;
    }

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Add method to reset configuration to defaults
  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all settings to defaults? This will clear all current configuration.')) {
      this.config = {
        pageType: 'A4',
        totalWidth: PAPER_SIZES.A4.width,
        totalHeight: PAPER_SIZES.A4.height,
        leftMargin: 0,
        rightMargin: 0,
        topMargin: 0,
        bottomMargin: 0,
        leftPadding: 0,
        rightPadding: 0,
        topPadding: 0,
        bottomPadding: 0,
        headerHeight: 1,
        footerHeight: 1,
        columnLayout: {
          column1: 40,
          column2: 10,
          column3: 50
        },
        bodySection: {
          leftMargin: 0,
          rightMargin: 0,
          topMargin: 0,
          bottomMargin: 0,
          separatorLine: false,
          bottomLine: false
        }
      };

      // Reset body sections to default values
      this.bodySections = JSON.parse(JSON.stringify(this.DEFAULT_SECTIONS));

      this.selectedSection = null;
      this.updateLayout();
      this.updateColumnContent();
      this.validateAllSections();
      this.showNotification('Configuration reset to defaults!', 'success');
    }
  }

  private convertLayoutToSections(): Section[] {
    const sections: Section[] = [];

    // Calculate content area dimensions (after margins and padding)
    const contentWidth = 100 - ((this.config.leftMargin + this.config.rightMargin + this.config.leftPadding + this.config.rightPadding) / this.config.totalWidth) * 100;
    const contentHeight = 100 - ((this.config.topMargin + this.config.bottomMargin + this.config.topPadding + this.config.bottomPadding) / this.config.totalHeight) * 100;

    // Calculate header height percentage
    const headerHeightPercent = this.config.headerHeight > 0 ? (this.config.headerHeight / this.config.totalHeight) * 100 : 0;
    const footerHeightPercent = this.config.footerHeight > 0 ? (this.config.footerHeight / this.config.totalHeight) * 100 : 0;

    console.log('PDF Export Debug:', {
      contentWidth,
      contentHeight,
      headerHeightPercent,
      footerHeightPercent,
      bodySectionsCount: this.bodySections.length
    });

    // Add header section if configured
    if (this.config.headerHeight > 0) {
      sections.push({
        id: 'header',
        type: 'header',
        columns: this.headerColumns,
        position: { 
          x: ((this.config.leftMargin + this.config.leftPadding) / this.config.totalWidth) * 100, 
          y: ((this.config.topMargin + this.config.topPadding) / this.config.totalHeight) * 100 
        },
        size: { 
          width: contentWidth, 
          height: headerHeightPercent
        },
        style: {
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center',
          padding: 10,
          margin: 5
        }
      });
    }

    // Add body sections with proper positioning
    this.bodySections.forEach(section => {
      // Calculate the body area dimensions (content area minus header and footer)
      const bodyAreaHeight = contentHeight - headerHeightPercent - footerHeightPercent;
      
      // Position relative to the body area (after header)
      const adjustedX = ((this.config.leftMargin + this.config.leftPadding) / this.config.totalWidth) * 100 + 
                       (section.position.x / 100) * contentWidth;
      const adjustedY = ((this.config.topMargin + this.config.topPadding) / this.config.totalHeight) * 100 + 
                       headerHeightPercent + (section.position.y / 100) * bodyAreaHeight;
      
      // Size relative to content area
      const adjustedWidth = (section.size.width / 100) * contentWidth;
      const adjustedHeight = (section.size.height / 100) * bodyAreaHeight;

      console.log(`PDF Export - Section ${section.id}:`, {
        originalPosition: section.position,
        adjustedPosition: { x: adjustedX, y: adjustedY },
        originalSize: section.size,
        adjustedSize: { width: adjustedWidth, height: adjustedHeight },
        bodyAreaHeight
      });

      sections.push({
        id: section.id,
        type: section.type,
        content: section.content,
        position: { x: adjustedX, y: adjustedY },
        size: { width: adjustedWidth, height: adjustedHeight },
        style: section.style
      });
    });

    // Add footer section if configured
    if (this.config.footerHeight > 0) {
      sections.push({
        id: 'footer',
        type: 'footer',
        columns: this.footerColumns,
        position: { 
          x: ((this.config.leftMargin + this.config.leftPadding) / this.config.totalWidth) * 100, 
          y: 100 - ((this.config.bottomMargin + this.config.bottomPadding) / this.config.totalHeight) * 100 - footerHeightPercent 
        },
        size: { 
          width: contentWidth, 
          height: footerHeightPercent 
        },
        style: {
          fontSize: 10,
          fontWeight: 'normal',
          textAlign: 'right',
          padding: 8,
          margin: 5
        }
      });
    }

    return sections;
  }

  // Add save configuration method
  saveConfiguration(): void {
    const configData = {
      layout: this.config,
      bodySections: this.bodySections,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprehensive-layout-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Settings management methods
  openSaveSettingsModal(): void {
    this.newSettingName = '';
    this.newSettingDescription = '';
    this.showSettingsModal = true;
  }

  closeSaveSettingsModal(): void {
    this.showSettingsModal = false;
    this.newSettingName = '';
    this.newSettingDescription = '';
  }

  saveCurrentSetting(): void {
    if (!this.newSettingName.trim()) {
      this.showNotification('Please enter a name for your setting', 'error');
      return;
    }

    const configData = {
      layout: this.config,
      bodySections: this.bodySections,
      headerColumns: this.headerColumns,
      footerColumns: this.footerColumns
    };

    try {
      const savedSetting = this.settingsService.saveSetting(
        this.newSettingName,
        configData,
        this.newSettingDescription
      );
      
      this.showNotification(`Setting "${savedSetting.name}" saved successfully!`, 'success');
      this.closeSaveSettingsModal();
      this.loadSettingsHistory();
    } catch (error) {
      console.error('Error saving setting:', error);
      this.showNotification('Failed to save setting. Please try again.', 'error');
    }
  }

  openLoadSettingsModal(): void {
    this.loadSettingsHistory();
    this.showLoadSettingsModal = true;
  }

  closeLoadSettingsModal(): void {
    this.showLoadSettingsModal = false;
    this.searchQuery = '';
  }

  loadSettingsHistory(): void {
    const history = this.settingsService.getSettingsHistory();
    this.settingsHistory = history.settings;
  }

  loadSetting(setting: SavedSetting): void {
    try {
      const configData = setting.config;
      
      if (configData.layout) {
        this.config = { ...this.config, ...configData.layout };
        this.updateLayout();
      }
      
      if (configData.bodySections) {
        this.bodySections = this.ensureDefaultValues(configData.bodySections);
      }
      
      if (configData.headerColumns) {
        this.headerColumns = configData.headerColumns;
      }
      
      if (configData.footerColumns) {
        this.footerColumns = configData.footerColumns;
      }
      
      this.closeLoadSettingsModal();
      this.showNotification(`Setting "${setting.name}" loaded successfully!`, 'success');
    } catch (error) {
      console.error('Error loading setting:', error);
      this.showNotification('Failed to load setting. Please try again.', 'error');
    }
  }

  deleteSetting(setting: SavedSetting): void {
    if (confirm(`Are you sure you want to delete "${setting.name}"?`)) {
      try {
        const success = this.settingsService.deleteSetting(setting.id);
        if (success) {
          this.showNotification(`Setting "${setting.name}" deleted successfully!`, 'success');
          this.loadSettingsHistory();
        } else {
          this.showNotification('Failed to delete setting.', 'error');
        }
      } catch (error) {
        console.error('Error deleting setting:', error);
        this.showNotification('Failed to delete setting. Please try again.', 'error');
      }
    }
  }

  getFilteredSettings(): SavedSetting[] {
    if (!this.searchQuery.trim()) {
      return this.settingsHistory;
    }
    return this.settingsService.searchSettings(this.searchQuery);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  }

  exportAllSettings(): void {
    try {
      this.settingsService.exportSettings();
      this.showNotification('All settings exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting settings:', error);
      this.showNotification('Failed to export settings. Please try again.', 'error');
    }
  }

  importSettings(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.settingsService.importSettings(file)
      .then(() => {
        this.showNotification('Settings imported successfully!', 'success');
        this.loadSettingsHistory();
      })
      .catch((error) => {
        console.error('Error importing settings:', error);
        this.showNotification('Failed to import settings. Please check the file format.', 'error');
      });
  }

  clearAllSettings(): void {
    if (confirm('Are you sure you want to clear all saved settings? This action cannot be undone.')) {
      try {
        this.settingsService.clearAllSettings();
        this.settingsHistory = [];
        this.showNotification('All settings cleared successfully!', 'success');
      } catch (error) {
        console.error('Error clearing settings:', error);
        this.showNotification('Failed to clear settings. Please try again.', 'error');
      }
    }
  }

  // Add load configuration method
  loadConfiguration(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const configData = JSON.parse(e.target.result);
        if (configData.layout) {
          this.config = { ...this.config, ...configData.layout };
          this.updateLayout();
        }
        if (configData.bodySections) {
          // Ensure loaded sections have default values if missing
          this.bodySections = this.ensureDefaultValues(configData.bodySections);
        }
        this.showNotification('Configuration loaded successfully!', 'success');
      } catch (error) {
        console.error('Error loading configuration:', error);
        this.showNotification('Error loading configuration file. Please check the file format.', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Ensure sections have default values if missing
  private ensureDefaultValues(sections: BodySection[]): BodySection[] {
    return sections.map(section => {
      const defaultSection = this.DEFAULT_SECTIONS.find(ds => ds.type === section.type);
      if (defaultSection) {
        return {
          ...defaultSection,
          ...section,
          id: section.id || `${section.type}-${Date.now()}`,
          content: section.content || defaultSection.content,
          style: {
            ...defaultSection.style,
            ...section.style
          }
        };
      }
      return section;
    });
  }

  // Validate and fix section values to ensure they stay within bounds
  private validateSectionValues(section: BodySection): BodySection {
    const validated = { ...section };
    
    // Ensure position values are within bounds (0-90%)
    validated.position.x = Math.max(0, Math.min(90, validated.position.x));
    validated.position.y = Math.max(0, Math.min(90, validated.position.y));
    
    // Ensure size values are reasonable (10-100% width, 5-80% height)
    validated.size.width = Math.max(10, Math.min(100, validated.size.width));
    validated.size.height = Math.max(5, Math.min(80, validated.size.height));
    
    // Ensure style values are within reasonable bounds
    validated.style.fontSize = Math.max(8, Math.min(24, validated.style.fontSize));
    validated.style.padding = Math.max(0, Math.min(30, validated.style.padding));
    validated.style.margin = Math.max(0, Math.min(20, validated.style.margin));
    
    // Ensure textAlign is valid
    if (!['left', 'center', 'right'].includes(validated.style.textAlign)) {
      validated.style.textAlign = 'left';
    }
    
    return validated;
  }

  // Apply validation to all sections
  private validateAllSections(): void {
    this.bodySections = this.bodySections.map(section => this.validateSectionValues(section));
  }


} 