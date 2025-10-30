import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, AfterViewChecked } from '@angular/core';
import {
  Section,
  SectionColumn,
  BodySection,
  LayoutConfig,
  PageType,
  PaperSize,
  SavedSetting,
  ValidationResult,
  TextAlign,
  FontWeight,
  SectionStyle
} from '../models/section.model';
import { SettingsService } from '../services/settings.service';
import { ValidationService } from '../services/validation.service';
import { ResponsiveService, ScreenSize } from '../services/responsive.service';
import { Subscription } from 'rxjs';
import interact from 'interactjs';

// Predefined paper sizes in inches
const PAPER_SIZES: Record<PageType, PaperSize> = {
  A4: { width: 8.27, height: 11.69 },
  A5: { width: 5.83, height: 8.27 },
  Letter: { width: 8.5, height: 11 },
  Legal: { width: 8.5, height: 14 },
  Custom: { width: 8.5, height: 11 }
} as const;

@Component({
  selector: 'app-comprehensive-layout',
  templateUrl: './comprehensive-layout.component.html',
  styleUrls: ['./comprehensive-layout.component.css']
})
export class ComprehensiveLayoutComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  // Convert inches to pixels (assuming 96 DPI)
  private readonly INCH_TO_PX = 96;

  // Make PAPER_SIZES available in template
  PAPER_SIZES = PAPER_SIZES;

  // Make Math available in template
  Math = Math;
  
  // TinyMCE editors handle all text formatting

  config: LayoutConfig = {
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
    columnLayout: {
      column1: 50,
      column2: 0,
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

  // Clean start for bodySections
  bodySections: BodySection[] = [];

  selectedSection: BodySection | null = null;

  // Settings management
  showSettingsModal = false;
  showLoadSettingsModal = false;
  showPrintPreviewModal = false;
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

  // Header and Footer column content with realistic mock data (2-column layout)
  headerColumns: SectionColumn[] = [];
  footerColumns: SectionColumn[] = [];

  // Editor states removed - using simple text editing now
  
  // Responsive design
  private screenSizeSubscription?: Subscription;
  currentScreenSize?: ScreenSize;

  // Store bound keyboard handler for proper cleanup
  private boundKeyHandler = this.handleKeyboardShortcuts.bind(this);

  // Dynamic print style element
  private printStyleElement: HTMLStyleElement | null = null;

  // Body area reference for interact.js
  @ViewChild('bodyArea', { static: false }) bodyArea?: ElementRef;

  // Validation properties
  validationResults: { layout: ValidationResult; sections: ValidationResult } | null = null;

  private _lastSectionsVersion = 0;
  private _sectionsVersion = 0;

  constructor(
    private settingsService: SettingsService,
    public validationService: ValidationService,
    private responsiveService: ResponsiveService
  ) { }

  ngOnInit(): void {
    // Initialize body sections with proper deep copy of defaults
    this.bodySections = JSON.parse(JSON.stringify([]));
    this._sectionsVersion++; // Increment version after initialization

    this.updateLayout();
    this.updateColumnContent();
    this.validateAllSections();
    this.setupKeyboardShortcuts();
    this.updatePrintPageSize(); // Initialize print page size

    // Subscribe to screen size changes
    this.screenSizeSubscription = this.responsiveService.screenSize$.subscribe(
      screenSize => {
        this.currentScreenSize = screenSize;
        this.handleResponsiveLayout(screenSize);
      }
    );

    // Get initial screen size
    this.currentScreenSize = this.responsiveService.getCurrentScreenSize();

    // Debug: Log initial default sections
    console.log('Initial DEFAULT_SECTIONS:', []);
    console.log('Initial bodySections:', this.bodySections);
  }

  ngOnDestroy(): void {
    this.removeKeyboardShortcuts();
    if (this.screenSizeSubscription) {
      this.screenSizeSubscription.unsubscribe();
    }

    // Clean up dynamic print style element
    if (this.printStyleElement && this.printStyleElement.parentNode) {
      this.printStyleElement.parentNode.removeChild(this.printStyleElement);
    }
  }

  ngAfterViewInit(): void {
    // Initialize dynamic sizing for existing sections with multiple retries
    // to ensure all content is loaded
    setTimeout(() => {
      this.updateAllSectionsDynamicSize();
      this.initializeInteractJS();
    }, 100);

    setTimeout(() => {
      this.updateAllSectionsDynamicSize();
    }, 500);

    setTimeout(() => {
      this.updateAllSectionsDynamicSize();
    }, 1000);
  }

  ngAfterViewChecked(): void {
    if (this._lastSectionsVersion !== this._sectionsVersion) {
      this.initializeInteractJS();
      this._lastSectionsVersion = this._sectionsVersion;
    }
  }

  // Initialize interact.js for all body sections with full features
  private initializeInteractJS(): void {
    if (!this.bodyArea) return;

    const bodyAreaElement = this.bodyArea.nativeElement;
    const bodyAreaRect = bodyAreaElement.getBoundingClientRect();

    // Grid size for snapping (5% of body area)
    const gridX = bodyAreaRect.width * 0.05;
    const gridY = bodyAreaRect.height * 0.05;

    // Get all body section elements
    const sectionElements = bodyAreaElement.querySelectorAll('.body-section-element');

    sectionElements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement;
      const sectionId = htmlElement.getAttribute('data-section-id');
      if (!sectionId) return;

      // Remove existing interact instance if any
      interact(htmlElement).unset();

      // Initialize position tracking
      let dragStartX = 0;
      let dragStartY = 0;

      // Setup draggable with snapping and collision detection
      interact(htmlElement)
        .draggable({
          listeners: {
            start: (event) => {
              const section = this.bodySections.find(s => s.id === sectionId);
              if (section) {
                dragStartX = section.position.x;
                dragStartY = section.position.y;
              }
              htmlElement.style.zIndex = '1000';
            },
            move: (event) => {
              const section = this.bodySections.find(s => s.id === sectionId);
              if (!section) return;

              const bodyRect = bodyAreaElement.getBoundingClientRect();

              // Calculate new position in percentage
              const deltaXPercent = (event.dx / bodyRect.width) * 100;
              const deltaYPercent = (event.dy / bodyRect.height) * 100;

              let newX = section.position.x + deltaXPercent;
              let newY = section.position.y + deltaYPercent;

              // Ensure boundaries
              newX = Math.max(0, Math.min(100 - section.size.width, newX));
              newY = Math.max(0, Math.min(100 - section.size.height, newY));

              // Check collision
              const wouldCollide = this.checkCollision(section, newX, newY, section.size.width, section.size.height);

              if (!wouldCollide) {
                section.position.x = newX;
                section.position.y = newY;

                // Trigger change detection
                const index = this.bodySections.findIndex(s => s.id === sectionId);
                if (index !== -1) {
                  this.bodySections[index] = { ...section };
                  this.bodySections = [...this.bodySections];
                  this._sectionsVersion++; // Increment version after position change
                }
              }
            },
            end: (event) => {
              htmlElement.style.zIndex = '';
              const section = this.bodySections.find(s => s.id === sectionId);
              if (section) {
                // Round to nearest 0.5%
                section.position.x = Math.round(section.position.x * 2) / 2;
                section.position.y = Math.round(section.position.y * 2) / 2;

                const index = this.bodySections.findIndex(s => s.id === sectionId);
                if (index !== -1) {
                  this.bodySections[index] = { ...section };
                  this.bodySections = [...this.bodySections];
                  this._sectionsVersion++; // Increment version after position change
                }
              }
            }
          },
          modifiers: [
            interact.modifiers.snap({
              targets: [
                interact.snappers.grid({ x: gridX, y: gridY })
              ],
              range: gridX,
              relativePoints: [{ x: 0, y: 0 }]
            })
          ]
        })
        .resizable({
          edges: { left: true, right: true, bottom: true, top: true },
          listeners: {
            start: (event) => {
              htmlElement.style.zIndex = '1000';
            },
            move: (event) => {
              const section = this.bodySections.find(s => s.id === sectionId);
              if (!section) return;

              const bodyRect = bodyAreaElement.getBoundingClientRect();

              // Calculate size changes
              let newWidth = section.size.width;
              let newHeight = section.size.height;
              let newX = section.position.x;
              let newY = section.position.y;

              // Handle width changes
              if (event.deltaRect) {
                const widthDelta = ((event.deltaRect.right + event.deltaRect.left) / bodyRect.width) * 100;
                const heightDelta = ((event.deltaRect.bottom + event.deltaRect.top) / bodyRect.height) * 100;

                newWidth = section.size.width + widthDelta;
                newHeight = section.size.height + heightDelta;

                // Adjust position if resizing from left or top
                if (event.deltaRect.left !== 0) {
                  newX = section.position.x - (event.deltaRect.left / bodyRect.width) * 100;
                }
                if (event.deltaRect.top !== 0) {
                  newY = section.position.y - (event.deltaRect.top / bodyRect.height) * 100;
                }
              }

              // Apply constraints
              newWidth = Math.max(10, Math.min(100, newWidth));
              newHeight = Math.max(5, Math.min(100, newHeight));
              newX = Math.max(0, Math.min(100 - newWidth, newX));
              newY = Math.max(0, Math.min(100 - newHeight, newY));

              // Check collision
              const wouldCollide = this.checkCollision(section, newX, newY, newWidth, newHeight);

              if (!wouldCollide) {
                section.position.x = newX;
                section.position.y = newY;
                section.size.width = newWidth;
                section.size.height = newHeight;
                section.isManuallyResized = true;

                // Trigger change detection
                const index = this.bodySections.findIndex(s => s.id === sectionId);
                if (index !== -1) {
                  this.bodySections[index] = { ...section };
                  this.bodySections = [...this.bodySections];
                  this._sectionsVersion++; // Increment version after size change
                }
              }
            },
            end: (event) => {
              htmlElement.style.zIndex = '';
              const section = this.bodySections.find(s => s.id === sectionId);
              if (section) {
                // Round values
                section.position.x = Math.round(section.position.x * 2) / 2;
                section.position.y = Math.round(section.position.y * 2) / 2;
                section.size.width = Math.round(section.size.width * 2) / 2;
                section.size.height = Math.round(section.size.height * 2) / 2;

                const index = this.bodySections.findIndex(s => s.id === sectionId);
                if (index !== -1) {
                  this.bodySections[index] = { ...section };
                  this.bodySections = [...this.bodySections];
                  this._sectionsVersion++; // Increment version after size change
                }
              }
            }
          },
          modifiers: [
            interact.modifiers.snapSize({
              targets: [
                interact.snappers.grid({ width: gridX, height: gridY })
              ]
            })
          ]
        });
    });
  }


  // Check if a section would collide with other sections
  private checkCollision(currentSection: BodySection, x: number, y: number, width: number, height: number): boolean {
    // Check collision with other sections
    for (const section of this.bodySections) {
      if (section.id === currentSection.id) continue;

      // Check if rectangles overlap
      const overlap = !(
        x + width <= section.position.x ||
        x >= section.position.x + section.size.width ||
        y + height <= section.position.y ||
        y >= section.position.y + section.size.height
      );

      if (overlap) {
        return true;
      }
    }

    return false;
  }

  private handleResponsiveLayout(screenSize: ScreenSize): void {
    const config = this.responsiveService.getOptimalConfigForScreen();

    // Adjust layout based on screen size
    if (screenSize.isMobile) {
      // Mobile optimizations
      console.log('Mobile view detected');
    } else if (screenSize.isTablet) {
      // Tablet optimizations
      console.log('Tablet view detected');
    } else {
      // Desktop optimizations
      console.log('Desktop view detected');
    }
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', this.boundKeyHandler);
  }

  private removeKeyboardShortcuts(): void {
    document.removeEventListener('keydown', this.boundKeyHandler);
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
          this.openPrintPreview();
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
  getPaperDimensions(pageTypeId: string): PaperSize | null {
    if (pageTypeId === 'Custom') return null;
    if (this.isValidPageType(pageTypeId) && pageTypeId !== 'Custom') {
      return PAPER_SIZES[pageTypeId];
    }
    return null;
  }

  // Update page type and automatically adjust dimensions
  updatePageType(pageType: string): void {
    if (this.isValidPageType(pageType)) {
      this.config.pageType = pageType;

      if (pageType !== 'Custom') {
        const paperSize = PAPER_SIZES[pageType];
        this.config.totalWidth = paperSize.width;
        this.config.totalHeight = paperSize.height;
      }

      this.updateLayout();
      this.updatePrintPageSize(); // Update print @page size when page type changes
    }
  }

  // Type guard for PageType
  private isValidPageType(pageType: string): pageType is PageType {
    return ['A4', 'A5', 'Letter', 'Legal', 'Custom'].includes(pageType);
  }

  /**
   * Dynamically updates the @page CSS rule for printing
   * This ensures the printed/PDF output matches the selected page size
   */
  private updatePrintPageSize(): void {
    // Remove existing print style element if it exists
    if (this.printStyleElement && this.printStyleElement.parentNode) {
      this.printStyleElement.parentNode.removeChild(this.printStyleElement);
    }

    // Create new style element
    this.printStyleElement = document.createElement('style');
    this.printStyleElement.id = 'dynamic-print-page-size';

    // Get current page dimensions in inches
    const width = this.config.totalWidth;
    const height = this.config.totalHeight;

    // Create CSS with @page rule matching selected paper size
    const cssContent = `
      @page {
        margin: 0;
        size: ${width}in ${height}in;
      }

      @media print {
        html, body {
          width: ${width}in;
          height: ${height}in;
          margin: 0;
          padding: 0;
        }

        .total-page-container {
          width: ${width}in !important;
          height: ${height}in !important;
        }
      }
    `;

    this.printStyleElement.textContent = cssContent;

    // Append to document head
    document.head.appendChild(this.printStyleElement);

    console.log(`Print @page size updated: ${width}in × ${height}in (${this.config.pageType})`);
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

    // Update print page size when layout dimensions change
    this.updatePrintPageSize();

    // Validate layout after update
    this.validateAndNotify();
  }

  // Layout Calculation Helper Methods
  getContentAreaWidth(): number {
    return this.layout.totalWidth - this.layout.leftMargin - this.layout.rightMargin - this.layout.leftPadding - this.layout.rightPadding;
  }

  getContentAreaHeight(): number {
    return this.layout.totalHeight - this.layout.topMargin - this.layout.bottomMargin - this.layout.topPadding - this.layout.bottomPadding;
  }

  getBodyAreaHeight(): number {
    return this.getContentAreaHeight() - this.layout.headerHeight - this.layout.footerHeight;
  }

  getBodyAreaWidth(): number {
    return this.getContentAreaWidth();
  }

  // Public methods for template access
  getContentAreaWidthPx(): number {
    return this.getContentAreaWidth();
  }

  getContentAreaHeightPx(): number {
    return this.getContentAreaHeight();
  }

  getBodyAreaHeightPx(): number {
    return this.getBodyAreaHeight();
  }

  getBodyAreaWidthPx(): number {
    return this.getBodyAreaWidth();
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
    // Update header columns based on column layout (maintain mock data)
    this.headerColumns = [];
    if (this.config.columnLayout.column1 > 0) {
      this.headerColumns.push({
        content: 'Dr. Michael Rodriguez\nMBBS, MD (Internal Medicine)\nInternal Medicine Specialist\nSenior Consultant Physician\nSpringfield Medical Center\nChamber: Room 205, Level 2\nMon-Fri: 9:00 AM - 5:00 PM\nSat: 9:00 AM - 1:00 PM',
        width: this.config.columnLayout.column1,
        style: {
          fontSize: 11,
          fontWeight: 'normal' as FontWeight,
          textAlign: 'left' as TextAlign,
          fontColor: '#000000',
          padding: 8,
          margin: 3
        }
      });
    }
    if (this.config.columnLayout.column2 > 0) {
      this.headerColumns.push({
        content: '[QR Code]\nScan for\nVerification',
        width: this.config.columnLayout.column2,
        style: {
          fontSize: 11,
          fontWeight: 'normal' as FontWeight,
          textAlign: 'center' as TextAlign,
          fontColor: '#000000',
          padding: 8,
          margin: 3
        }
      });
    }
    if (this.config.columnLayout.column3 > 0) {
      this.headerColumns.push({
        content: 'Springfield Medical Center\n123 Healthcare Boulevard\nSpringfield, IL 62701\nPhone: (555) 123-CARE (2273)\nFax: (555) 123-4568\nEmail: info@springfieldmedical.com\nWebsite: www.springfieldmedical.com\n\nEmergency: (555) 911-HELP',
        width: this.config.columnLayout.column3,
        style: {
          fontSize: 11,
          fontWeight: 'normal' as FontWeight,
          textAlign: 'left' as TextAlign,
          fontColor: '#000000',
          padding: 8,
          margin: 3
        }
      });
    }

    // Update footer columns based on column layout (maintain mock data)
    this.footerColumns = [];
    if (this.config.columnLayout.column1 > 0) {
      this.footerColumns.push({
        content: 'Doctor Signature:\n\n_________________________\nDr. Michael Rodriguez, MD\nRegistration No: IL-MD-2015-4789',
        width: this.config.columnLayout.column1,
        style: {
          fontSize: 11,
          fontWeight: 'normal' as FontWeight,
          textAlign: 'left' as TextAlign,
          fontColor: '#000000',
          padding: 8,
          margin: 3
        }
      });
    }
    if (this.config.columnLayout.column2 > 0) {
      this.footerColumns.push({
        content: 'Date: January 15, 2024\n\nNext Appointment:\n_________________',
        width: this.config.columnLayout.column2,
        style: {
          fontSize: 11,
          fontWeight: 'normal' as FontWeight,
          textAlign: 'center' as TextAlign,
          fontColor: '#000000',
          padding: 8,
          margin: 3
        }
      });
    }
    if (this.config.columnLayout.column3 > 0) {
      this.footerColumns.push({
        content: 'Date: January 15, 2024\n\nNext Appointment: _________________\n\nContact for queries: (555) 123-CARE\n\n[Prescription Barcode] RX-2024-001452\nValid for 30 days from date of issue\nPresent this prescription at any licensed pharmacy',
        width: this.config.columnLayout.column3,
        style: {
          fontSize: 11,
          fontWeight: 'normal' as FontWeight,
          textAlign: 'left' as TextAlign,
          fontColor: '#000000',
          padding: 8,
          margin: 3
        }
      });
    }
  }

  // TinyMCE editor methods removed - using simple text editing now

  // Helper method to convert newlines to HTML breaks
  convertNewlinesToHtml(text: string): string {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
  }

  // Print preview methods
  openPrintPreview(): void {
    this.showPrintPreviewModal = true;
  }

  closePrintPreview(): void {
    this.showPrintPreviewModal = false;
  }

  printFromPreview(): void {
    this.closePrintPreview();
    setTimeout(() => {
      window.print();
    }, 100);
  }



  // Get default content for section types with realistic mock data
  private getDefaultContent(type: 'diagnostic' | 'prescription' | 'custom' | 'patient'): string {
    const defaultContent = {
      diagnostic: '<p><strong>Chief Complaints</strong></p><ul><li></li><li></li></ul><p><strong>Vitals</strong></p><ul><li></li><li></li></ul><p><strong>Investigations</strong></p><ul><li></li><li></li></ul>',
      prescription: 'Rx\n\n1. [Medicine Name] [Strength]\n   Take [frequency] for [duration]\n   ([Instructions - e.g., after meals])\n\n2. [Medicine Name] [Strength]\n   Take [frequency] for [duration]\n   ([Instructions])\n\n3. [Medicine Name] [Strength]\n   Take [frequency] for [duration]\n   ([Instructions])\n\nGeneral Instructions:\n• Complete the full course of medication\n• Take medicines as prescribed\n• Return if symptoms persist or worsen\n• Follow-up appointment: [Date]',
      custom: 'Additional Information:\n\n[Lab Reports Required]\n[Dietary Restrictions]\n[Activity Limitations]\n[Special Precautions]\n\n[Any other relevant medical information]',
      patient: 'P.ID: [Patient ID] | Date: [Date] | Name: [Full Name] | Age: [Age] years | Gender: [Male/Female] | Department: [Department] | Contact: [Phone Number] | Address: [Complete Address]'
    };
    return defaultContent[type];
  }

  // Get default style for sections
  private getDefaultStyle(): SectionStyle {
    return {
      fontSize: 12,
      fontWeight: 'normal' as FontWeight,
      textAlign: 'left' as TextAlign,
      fontColor: '#000000',
      padding: 10,
      margin: 5
    };
  }

  // Body Section Management
  // Note: addBodySection and selectBodySection methods are implemented below with drag & drop and dynamic sizing

  deleteBodySection(sectionId: string): void {
    this.bodySections = this.bodySections.filter(s => s.id !== sectionId);
    this._sectionsVersion++; // Increment version after deletion
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
    this._sectionsVersion++; // Increment version after duplication
  }

  // Restore default values for a specific section
  restoreSectionDefaults(sectionId: string): void {
    const section = this.bodySections.find(s => s.id === sectionId);
    if (!section) return;
    // REMOVE default lookup logic, so we skip defaultSection fallback
    // Optionally, just clear out content/position/size/style or skip entirely
    // Here we will just do nothing for now (or show a toast)
    this.showNotification('No defaults to restore for this section.', 'info');
  }

  // Get default values for a section type
  // getDefaultValuesForType(type: 'diagnostic' | 'prescription' | 'custom' | 'patient'): Partial<BodySection> {
  //   const defaultSection = this.DEFAULT_SECTIONS.find(ds => ds.type === type);
  //   if (defaultSection) {
  //     return {
  //       content: defaultSection.content,
  //       style: { ...defaultSection.style }
  //     };
  //   }
  //   return {
  //     content: this.getDefaultContent(type),
  //     style: this.getDefaultStyle()
  //   };
  // }


  private validateConfiguration(): boolean {
    // Use validation service for comprehensive validation
    const layoutValidation = this.validationService.validateLayoutConfig(this.config);
    const sectionsValidation = this.validationService.validateAllSections(this.bodySections);
    
    // Show errors if any
    if (!layoutValidation.isValid) {
      layoutValidation.errors.forEach(error => {
        this.showNotification(error, 'error');
      });
      return false;
    }
    
    if (!sectionsValidation.isValid) {
      sectionsValidation.errors.forEach(error => {
        this.showNotification(error, 'error');
      });
      return false;
    }
    
    // Show warnings
    layoutValidation.warnings.forEach(warning => {
      this.showNotification(warning, 'warning');
    });
    
    sectionsValidation.warnings.forEach(warning => {
      this.showNotification(warning, 'warning');
    });
    
    return true;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

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
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
      case 'info':
        notification.style.backgroundColor = '#3b82f6';
        break;
    }

    // Add to document
    document.body.appendChild(notification);

    // Remove after different durations based on type
    const duration = type === 'info' ? 10000 : 3000; // Info messages stay longer
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  // Add method to reset configuration to defaults
  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all settings to defaults? This will clear all current configuration.')) {
      this.config = {
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
        columnLayout: {
          column1: 50,
          column2: 0,
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
      this.bodySections = JSON.parse(JSON.stringify([]));
      this._sectionsVersion++; // Increment version after reset

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
          fontColor: '#000000',
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
          fontColor: '#000000',
          padding: 8,
          margin: 5
        }
      });
    }

    return sections;
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
      
      this.showNotification(`Setting "${this.newSettingName}" saved successfully!`, 'success');
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
        this.bodySections = configData.bodySections;
        this._sectionsVersion++; // Increment version after loading bodySections
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


  // Validate and fix section values to ensure they stay within bounds
  private validateSectionValues(section: BodySection): BodySection {
    const validated = { ...section };
    
    // Ensure position values are within bounds (0-90%)
    validated.position.x = Math.max(0, Math.min(90, validated.position.x));
    validated.position.y = Math.max(0, Math.min(90, validated.position.y));
    
    // Ensure size values are reasonable (10-100% width, 5-95% height)
    validated.size.width = Math.max(10, Math.min(100, validated.size.width));
    validated.size.height = Math.max(5, Math.min(95, validated.size.height));
    
    // Ensure section doesn't exceed 100% in either dimension
    if (validated.position.x + validated.size.width > 100) {
      validated.size.width = 100 - validated.position.x;
    }
    if (validated.position.y + validated.size.height > 100) {
      validated.size.height = 100 - validated.position.y;
    }
    
    // Ensure minimum spacing between sections (2% gap)
    const minGap = 2;
    validated.position.x = Math.max(0, Math.min(100 - validated.size.width - minGap, validated.position.x));
    validated.position.y = Math.max(0, Math.min(100 - validated.size.height - minGap, validated.position.y));
    
    // Ensure style values are within reasonable bounds
    validated.style.fontSize = Math.max(8, Math.min(24, validated.style.fontSize));
    validated.style.padding = Math.max(0, Math.min(30, validated.style.padding));
    validated.style.margin = Math.max(0, Math.min(20, validated.style.margin));
    
    // Ensure textAlign is valid
    const validAlignments: TextAlign[] = ['left', 'center', 'right', 'justify'];
    if (!validAlignments.includes(validated.style.textAlign as TextAlign)) {
      validated.style.textAlign = 'left';
    }

    // Ensure fontWeight is valid (note: 'italic' is actually font-style in CSS, but kept for backwards compatibility)
    const validWeights: FontWeight[] = ['normal', 'bold', 'italic'];
    if (!validWeights.includes(validated.style.fontWeight as FontWeight)) {
      validated.style.fontWeight = 'normal';
    }
    
    // Ensure fontColor is valid (basic hex color validation)
    if (!validated.style.fontColor || !/^#([0-9A-F]{3}){1,2}$/i.test(validated.style.fontColor)) {
      validated.style.fontColor = '#000000';
    }
    
    return validated;
  }


  // Real-time validation and notification
  private validateAndNotify(): void {
    const layoutValidation = this.validationService.validateLayoutConfig(this.config);
    const sectionsValidation = this.validationService.validateAllSections(this.bodySections);
    
    this.validationResults = {
      layout: layoutValidation,
      sections: sectionsValidation
    };
    
    // Display validation errors
    if (!layoutValidation.isValid) {
      layoutValidation.errors.forEach(error => {
        this.showNotification(error, 'error');
      });
    }
    
    if (!sectionsValidation.isValid) {
      sectionsValidation.errors.forEach(error => {
        this.showNotification(error, 'error');
      });
    }
    
    // Display warnings
    layoutValidation.warnings.forEach(warning => {
      this.showNotification(warning, 'warning');
    });
    
    sectionsValidation.warnings.forEach(warning => {
      this.showNotification(warning, 'warning');
    });
  }

  // Get section inline styles for template
  getSectionInlineStyles(section: BodySection): any {
    return {
      'padding': `${section.style.padding}px`,
      'box-sizing': 'border-box',
      'font-size': `${section.style.fontSize}px`,
      'color': section.style.fontColor,
      'text-align': section.style.textAlign,
      'font-weight': section.style.fontWeight,
      'overflow': 'hidden'
    };
  }

  // Apply validation to all sections
  private validateAllSections(): void {
    this.bodySections = this.bodySections.map(section => this.validateSectionValues(section));
  }



  // Dynamic Content Sizing Methods
  updateAllSectionsDynamicSize(): void {
    this.bodySections.forEach(section => {
      this.updateSectionDynamicSize(section);
    });
  }

  updateSectionDynamicSize(section: BodySection): void {
    // Skip dynamic sizing if the section was manually resized
    if (section.isManuallyResized) {
      console.log(`Section ${section.id} (${section.type}): Skipping dynamic sizing - manually resized`);
      return;
    }
    
    // Set appropriate default width based on section type
    if (!section.size.width || (section.size.width === 45 && section.type === 'patient')) {
      if (section.type === 'patient') {
        section.size.width = 100; // Patient info should be full width
      } else {
        section.size.width = 45; // Other sections default to 45%
      }
    }
    
    // Calculate dynamic height based on content and current width
    const estimatedHeight = this.calculateContentHeight(section.content, section.size.width);
    const newHeight = Math.max(8, Math.min(95, estimatedHeight));
    
    // Only update if height changed significantly to avoid constant updates
    if (Math.abs(section.size.height - newHeight) > 1) {
      section.size.height = newHeight;
      console.log(`Section ${section.id} (${section.type}): Content lines calculated, Height: ${newHeight}%`);
    }
    
    // Update the section in the array
    const sectionIndex = this.bodySections.findIndex(s => s.id === section.id);
    if (sectionIndex !== -1) {
      this.bodySections[sectionIndex] = section;
    }
  }

  private calculateContentHeight(content: string, sectionWidth: number = 45): number {
    if (!content) return 8;
    
    // More sophisticated content parsing for TinyMCE formatted content
    let processedContent = content;
    
    // Handle HTML lists (ul, ol) properly
    const listItems = (content.match(/<li[^>]*>.*?<\/li>/g) || []).length;
    const listBlocks = (content.match(/<[uo]l[^>]*>.*?<\/[uo]l>/g) || []).length;
    
    // Handle paragraphs
    const paragraphs = (content.match(/<p[^>]*>.*?<\/p>/g) || []).length;
    
    // Remove HTML tags for text content calculation
    const textContent = processedContent
      .replace(/<[^>]*>/g, '\n') // Replace HTML tags with newlines
      .replace(/\n+/g, '\n') // Consolidate multiple newlines
      .trim();
    
    // Count text lines
    const textLines = textContent.split('\n').filter(line => line.trim().length > 0);
    
    // Calculate characters per line based on section width and font size
    // Adjusted for 11px font (default) - approximately 6-7 chars per 1% width
    const baseCharsPerLine = Math.floor((sectionWidth / 100) * 75); // More conservative estimate
    
    let totalLines = 0;
    
    // Count list items as individual lines with proper spacing
    totalLines += listItems * 1.2; // Lists take slightly more space
    
    // Count paragraph breaks
    totalLines += paragraphs * 0.3; // Paragraph spacing
    
    // Count wrapped text lines
    textLines.forEach(line => {
      if (line.trim().length === 0) {
        totalLines += 0.3; // Empty lines
      } else {
        const wrappedLines = Math.ceil(line.length / baseCharsPerLine) || 1;
        totalLines += wrappedLines;
      }
    });
    
    // Add base padding and formatting space
    totalLines += 1.5; // Base padding
    
    // Add extra space for TinyMCE formatting
    if (content.includes('<strong>') || content.includes('<b>')) totalLines += 0.2;
    if (content.includes('<em>') || content.includes('<i>')) totalLines += 0.2;
    if (listItems > 0) totalLines += 0.5; // Extra space for list formatting
    
    // Account for section's own padding and margin in height calculation
    const sectionPadding = this.selectedSection?.style.padding || 8;
    const sectionMargin = this.selectedSection?.style.margin || 3;
    const paddingLines = (sectionPadding * 2) / 11; // Convert padding to lines (assuming 11px line height)
    const marginLines = (sectionMargin * 2) / 11; // Convert margin to lines
    
    totalLines += paddingLines + marginLines;
    
    // Convert lines to percentage height - adjusted for better accuracy
    const heightPerLine = 2.2; // Slightly reduced for better fit
    const estimatedHeight = Math.max(8, totalLines * heightPerLine);
    
    console.log(`Content analysis - Lists: ${listItems}, Paragraphs: ${paragraphs}, Text lines: ${textLines.length}, Padding: ${paddingLines}, Margin: ${marginLines}, Estimated height: ${estimatedHeight}%`);
    
    return Math.min(95, estimatedHeight);
  }

  // Override existing addBodySection to include dynamic sizing
  addBodySection(type: 'diagnostic' | 'prescription' | 'custom' | 'patient'): void {
    // Calculate position to avoid overlapping
    const existingSections = this.bodySections.length;
    const baseX = 5 + (existingSections % 2) * 50;
    const baseY = 5 + Math.floor(existingSections / 2) * 40;

    const defaultHeight = type === 'patient' ? 8 : 25; // Shorter height for patient sections
    const defaultWidth = 45; // Set default width to 45% as requested

    const newSection: BodySection = {
      id: `${type}-${Date.now()}`,
      type: type,
      name: type.charAt(0).toUpperCase() + type.slice(1) + (type === 'patient' ? ' Information' : ''),
      content: this.getDefaultContent(type),
      position: { x: baseX, y: baseY },
      size: { width: defaultWidth, height: defaultHeight },
      style: this.getDefaultStyle()
    };

    // Validate before adding (collision is now handled by interact.js)
    const validatedSection = this.validateSectionValues(newSection);

    this.bodySections.push(validatedSection);
    this._sectionsVersion++; // Increment version after addition
    this.selectedSection = validatedSection;

    // Apply dynamic sizing to the new section and reinitialize interact.js
    setTimeout(() => {
      this.updateSectionDynamicSize(validatedSection);
      this.validateAndNotify();
      this.initializeInteractJS(); // Re-initialize interact.js for all sections including the new one
    }, 100);
  }

  // Override selectBodySection to trigger dynamic sizing
  selectBodySection(section: BodySection): void {
    // Validate section values before selecting
    const validatedSection = this.validateSectionValues(section);
    const sectionIndex = this.bodySections.findIndex(s => s.id === section.id);
    if (sectionIndex !== -1) {
      this.bodySections[sectionIndex] = validatedSection;
    }
    this.selectedSection = validatedSection;
    
    // Update dynamic sizing when content changes
    this.updateSectionDynamicSize(validatedSection);
  }

  // Method to trigger dynamic sizing update when content changes
  onSectionContentChange(section: BodySection): void {
    console.log('Content changed for section:', section.id, 'Content length:', section.content.length);
    
    // Find and update the section
    const sectionIndex = this.bodySections.findIndex(s => s.id === section.id);
    if (sectionIndex !== -1) {
      this.bodySections[sectionIndex] = section;
      this._sectionsVersion++; // Increment version after content change
      // Apply dynamic sizing with a small delay to ensure content is updated
      setTimeout(() => {
        this.updateSectionDynamicSize(section);
      }, 50);
    }
  }

  // Additional method to trigger height update when content is edited in TinyMCE
  onContentEditorChange(newContent: string): void {
    if (this.selectedSection) {
      this.selectedSection.content = newContent;
      this.onSectionContentChange(this.selectedSection);
    }
  }

  // Method called when user manually changes size values in input fields
  onManualSizeChange(): void {
    if (this.selectedSection) {
      // Mark section as manually resized to prevent automatic sizing
      this.selectedSection.isManuallyResized = true;
      
      // Update the section in the array
      const sectionIndex = this.bodySections.findIndex(s => s.id === this.selectedSection!.id);
      if (sectionIndex !== -1) {
        this.bodySections[sectionIndex] = this.selectedSection;
      }
      this._sectionsVersion++; // Increment version after manual size change
      
      console.log(`Section ${this.selectedSection.id} marked as manually resized via input change`);
    }
  }

  // Method to reset a section back to automatic sizing
  resetToAutomaticSizing(sectionId: string): void {
    const section = this.bodySections.find(s => s.id === sectionId);
    if (section) {
      // Remove the manual resize flag
      section.isManuallyResized = false;
      
      // Apply dynamic sizing to recalculate size based on content
      this.updateSectionDynamicSize(section);
      
      // Update selected section reference if it's the same section
      if (this.selectedSection && this.selectedSection.id === sectionId) {
        this.selectedSection = { ...section };
      }
      
      console.log(`Section ${section.id} reset to automatic sizing`);
      this.showNotification(`Section "${section.name}" reset to automatic sizing`, 'success');
    }
  }
  
  // Text formatting methods removed - TinyMCE handles all formatting


} 