import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Section, SectionColumn } from '../models/section.model';
import { HtmlContentService } from './html-content.service';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  private paperSizes: { [key: string]: { width: number; height: number } } = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    Letter: { width: 215.9, height: 279.4 }, // 8.5 x 11 inches in mm
    Legal: { width: 215.9, height: 355.6 }, // 8.5 x 14 inches in mm
  };

  constructor(private htmlContentService: HtmlContentService) { }

  async exportToPDF(
    sections: Section[],
    paperSize: string,
    customSize?: { width: number; height: number },
    filename: string = 'prescription',
    useCanvas: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      const paperDimensions = paperSize === 'Custom' ? customSize : this.paperSizes[paperSize];

      if (!paperDimensions) {
        throw new Error('Invalid paper size configuration');
      }

      // Choose export method based on useCanvas parameter
      if (useCanvas) {
        const previewElement = document.querySelector('.prescription-area') as HTMLElement;
        if (previewElement) {
          return await this.exportWithCanvas(previewElement, paperDimensions, filename);
        } else {
          console.warn('Preview element not found, falling back to traditional method');
          return await this.exportWithTraditionalMethod(sections, paperDimensions, filename);
        }
      } else {
        // Use traditional jsPDF method (clean, no borders)
        return await this.exportWithTraditionalMethod(sections, paperDimensions, filename);
      }

    } catch (error) {
      console.error('Error exporting PDF:', error);
      return { success: false, message: `Error exporting PDF: ${error}` };
    }
  }

  private async exportWithTraditionalMethod(
    sections: Section[],
    paperDimensions: { width: number; height: number },
    filename: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const orientation = paperDimensions.width > paperDimensions.height ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [paperDimensions.width, paperDimensions.height]
      });

      // Enhanced font support
      pdf.setFont('helvetica');

      // Process sections with improved text handling (no borders)
      sections.forEach(section => {
        this.renderSection(pdf, section, paperDimensions);
      });

      // Add metadata
      pdf.setProperties({
        title: 'Medical Prescription',
        subject: 'Prescription Template',
        author: 'Prescription Generator',
        creator: 'Angular Prescription App'
      });

      pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);

      return { success: true, message: 'PDF exported successfully (clean method)' };
    } catch (error) {
      console.error('Error exporting PDF with traditional method:', error);
      return { success: false, message: `Error exporting PDF: ${error}` };
    }
  }

  private async exportWithCanvas(
    element: HTMLElement,
    paperDimensions: { width: number; height: number },
    filename: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Create a completely clean clone without any visual borders
      const clonedElement = this.createCleanClone(element);
      
      // Temporarily append to body for html2canvas
      document.body.appendChild(clonedElement);
      
      // Convert to canvas with high quality
      const canvas = await html2canvas(clonedElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: clonedElement.scrollWidth,
        windowHeight: clonedElement.scrollHeight,
        removeContainer: true,
        allowTaint: true
      });
      
      // Remove the cloned element
      document.body.removeChild(clonedElement);
      
      // Create PDF with proper dimensions
      const orientation = paperDimensions.width > paperDimensions.height ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [paperDimensions.width, paperDimensions.height]
      });
      
      // Calculate dimensions to fit the page
      const imgWidth = paperDimensions.width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Add metadata
      pdf.setProperties({
        title: 'Medical Prescription',
        subject: 'Prescription Template',
        author: 'Prescription Generator',
        creator: 'Angular Prescription App'
      });
      
      // Save PDF
      pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      return { success: true, message: 'PDF exported successfully using clean canvas' };
    } catch (error) {
      console.error('Error exporting PDF with canvas:', error);
      // Fallback to traditional method
      return this.exportToPDF([], paperDimensions.width > paperDimensions.height ? 'landscape' : 'portrait', paperDimensions, filename, false);
    }
  }

  private createCleanClone(element: HTMLElement): HTMLElement {
    // Create a deep clone
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Apply clean styles to remove all borders and visual indicators
    clonedElement.style.cssText = `
      background: white !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      width: ${element.offsetWidth}px !important;
      height: ${element.offsetHeight}px !important;
    `;
    
    // Remove all borders from all child elements
    const allElements = clonedElement.querySelectorAll('*');
    allElements.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.border = 'none';
      htmlEl.style.outline = 'none';
      htmlEl.style.boxShadow = 'none';
      
      // Remove selected class to prevent selection highlighting in PDF
      if (htmlEl.classList.contains('selected')) {
        htmlEl.classList.remove('selected');
      }
      
      // Remove specific problematic classes and styles
      if (htmlEl.classList.contains('total-page-container') ||
          htmlEl.classList.contains('prescription-area') ||
          htmlEl.classList.contains('content-area')) {
        htmlEl.style.background = 'white';
        htmlEl.style.border = 'none';
        htmlEl.style.borderStyle = 'none';
        htmlEl.style.borderWidth = '0px';
        htmlEl.style.borderColor = 'transparent';
      }
      
      // Remove selection highlighting from body sections
      if (htmlEl.classList.contains('body-section-element')) {
        htmlEl.style.borderColor = '';
        htmlEl.style.background = '';
        htmlEl.style.boxShadow = 'none';
        htmlEl.style.transform = '';
      }
      
      // Hide any label elements
      if (htmlEl.className && (
          htmlEl.className.includes('label') ||
          htmlEl.className.includes('total-width') ||
          htmlEl.className.includes('total-height') ||
          htmlEl.className.includes('margin-') ||
          htmlEl.className.includes('padding-')
      )) {
        htmlEl.style.display = 'none';
      }
    });
    
    return clonedElement;
  }

  private addWatermark(pdf: jsPDF, paperDimensions: { width: number; height: number }): void {
    // Add subtle watermark
    pdf.setTextColor(240, 240, 240);
    pdf.setFontSize(60);
    pdf.text('', paperDimensions.width / 2, paperDimensions.height / 2, {
      align: 'center',
      angle: 45
    });
    pdf.setTextColor(0, 0, 0); // Reset color
  }

  private renderSection(pdf: jsPDF, section: Section, paperDimensions: { width: number; height: number; }): void {
    const x = (section.position.x / 100) * paperDimensions.width;
    const y = (section.position.y / 100) * paperDimensions.height;
    const width = (section.size.width / 100) * paperDimensions.width;
    const height = (section.size.height / 100) * paperDimensions.height;

    // Set appropriate font size based on section type
    let fontSize = section.style.fontSize;
    if (section.type === 'header') {
      fontSize = Math.max(8, fontSize - 2); // Smaller font for header
    } else if (section.type === 'footer') {
      fontSize = Math.max(8, fontSize - 2); // Smaller font for footer
    } else if (section.type === 'patient') {
      fontSize = Math.max(9, fontSize - 1); // Medium font for patient info
    } else {
      fontSize = Math.max(10, fontSize); // Normal font for body sections
    }

    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', section.style.fontWeight === 'bold' ? 'bold' : 'normal');

    // Debug log
    if (section.type === 'header' || section.type === 'footer') {
      console.log('PDF Export - Section:', section.type, 'Columns:', section.columns);
    }

    if (section.columns && section.columns.length > 0) {
      // Render columns for header/footer
      let colX = x;
      section.columns.forEach(col => {
        const colWidth = (col.width / 100) * width;
        
        // Convert HTML content to text for PDF with alignment
        const { text: textContent, alignment: textAlign } = this.htmlContentService.extractTextWithAlignment(col.content || '');
        const lines = textContent.split('\n');
        
        let currentY = y + (section.style.padding * 0.35);
        const lineHeight = section.style.fontSize * 0.35;
        
        lines.forEach(line => {
          if (line.trim()) {
            // Handle basic formatting
            let displayText = line.trim();
            let isBold = false;
            
            // Check for bold formatting (wrapped in *)
            if (displayText.startsWith('*') && displayText.endsWith('*')) {
              displayText = displayText.slice(1, -1);
              isBold = true;
            }
            
            // Check for italic formatting (wrapped in _)
            if (displayText.startsWith('_') && displayText.endsWith('_')) {
              displayText = displayText.slice(1, -1);
              pdf.setFont('helvetica', 'italic');
            } else if (isBold) {
              pdf.setFont('helvetica', 'bold');
            } else {
              pdf.setFont('helvetica', 'normal');
            }
            
            // Calculate text position based on alignment
            let textX = colX;
            if (textAlign === 'center') {
              textX = colX + colWidth / 2;
            } else if (textAlign === 'right') {
              textX = colX + colWidth;
            }
            
            // Ensure textAlign is a valid PDF alignment value
            const pdfAlign = textAlign === 'justify' ? 'left' : textAlign as 'left' | 'center' | 'right';
            pdf.text(displayText, textX, currentY, { align: pdfAlign });
            currentY += lineHeight;
          }
        });
        colX += colWidth;
      });
    } else if (section.content) {
      // Render normal section with special handling for prescription
      const textContent = this.htmlContentService.extractTextFromHtml(section.content);
      const lines = textContent.split('\n');
      const lineHeight = fontSize * 0.35;
      const maxWidth = width - (section.style.padding * 0.7);
      let currentY = y + (section.style.padding * 0.35);
      
      // Special handling for prescription section removed - no automatic Rx symbol
      
      lines.forEach(line => {
        if (line.trim()) {
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          wrappedLines.forEach((wrappedLine: string) => {
            let textX = x + (section.style.padding * 0.35);
            currentY += lineHeight;
            
            // Handle basic formatting
            let displayText = wrappedLine.trim();
            let isBold = false;
            
            // Check for bold formatting (wrapped in *)
            if (displayText.startsWith('*') && displayText.endsWith('*')) {
              displayText = displayText.slice(1, -1);
              isBold = true;
            }
            
            // Check for italic formatting (wrapped in _)
            if (displayText.startsWith('_') && displayText.endsWith('_')) {
              displayText = displayText.slice(1, -1);
              pdf.setFont('helvetica', 'italic');
            } else if (isBold) {
              pdf.setFont('helvetica', 'bold');
            } else {
              pdf.setFont('helvetica', 'normal');
            }
            
            if (section.style.textAlign === 'center') {
              textX = x + width / 2;
              pdf.text(displayText, textX, currentY, { align: 'center' });
            } else if (section.style.textAlign === 'right') {
              textX = x + width - (section.style.padding * 0.35);
              pdf.text(displayText, textX, currentY, { align: 'right' });
            } else {
              pdf.text(displayText, textX, currentY);
            }
          });
        } else {
          currentY += lineHeight;
        }
      });
    }

    // Optional: Add section borders for debugging
    if (process.env['NODE_ENV'] === 'development') {
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.1);
      pdf.rect(x, y, width, height);
    }
  }
}

