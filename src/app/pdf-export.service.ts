import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Section, SectionColumn } from './section.model';

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

  constructor() { }

  async exportToPDF(
    sections: Section[],
    paperSize: string,
    customSize?: { width: number; height: number },
    filename: string = 'prescription'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const paperDimensions = paperSize === 'Custom' ? customSize : this.paperSizes[paperSize];

      if (!paperDimensions) {
        throw new Error('Invalid paper size configuration');
      }

      const orientation = paperDimensions.width > paperDimensions.height ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [paperDimensions.width, paperDimensions.height]
      });

      // Enhanced font support
      pdf.setFont('helvetica');

      // Add watermark or background if needed
      this.addWatermark(pdf, paperDimensions);

      // Process sections with improved text handling
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

      return { success: true, message: 'PDF exported successfully' };
    } catch (error) {
      console.error('Error exporting PDF:', error);
      return { success: false, message: `Error exporting PDF: ${error}` };
    }
  }

  private addWatermark(pdf: jsPDF, paperDimensions: { width: number; height: number }): void {
    // Add subtle watermark
    pdf.setTextColor(240, 240, 240);
    pdf.setFontSize(60);
    pdf.text('egHealth', paperDimensions.width / 2, paperDimensions.height / 2, {
      align: 'center',
      angle: 45
    });
    pdf.setTextColor(0, 0, 0); // Reset color
  }

  private renderSection(pdf: jsPDF, section: Section, paperDimensions: { width: number; height: number }): void {
    const x = (section.position.x / 100) * paperDimensions.width;
    const y = (section.position.y / 100) * paperDimensions.height;
    const width = (section.size.width / 100) * paperDimensions.width;
    const height = (section.size.height / 100) * paperDimensions.height;

    pdf.setFontSize(section.style.fontSize);
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
        const lines = (col.content || '').split('\n');
        let currentY = y + (section.style.padding * 0.35);
        const lineHeight = section.style.fontSize * 0.35;
        lines.forEach(line => {
          if (line.trim()) {
            pdf.text(line, colX + colWidth / 2, currentY, { align: 'center' });
          }
          currentY += lineHeight;
        });
        colX += colWidth;
      });
    } else if (section.content) {
      // Fallback: Render normal section
      const lines = (section.content || '').split('\n');
      const lineHeight = section.style.fontSize * 0.35;
      const maxWidth = width - (section.style.padding * 0.7);
      let currentY = y + (section.style.padding * 0.35);
      lines.forEach(line => {
        if (line.trim()) {
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          wrappedLines.forEach((wrappedLine: string) => {
            let textX = x + (section.style.padding * 0.35);
            currentY += lineHeight;
            if (section.style.textAlign === 'center') {
              textX = x + width / 2;
              pdf.text(wrappedLine, textX, currentY, { align: 'center' });
            } else if (section.style.textAlign === 'right') {
              textX = x + width - (section.style.padding * 0.35);
              pdf.text(wrappedLine, textX, currentY, { align: 'right' });
            } else {
              pdf.text(wrappedLine, textX, currentY);
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

