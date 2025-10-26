import { Injectable } from '@angular/core';
import { BodySection, LayoutConfig } from '../components/comprehensive-layout.component';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  constructor() { }

  validateLayoutConfig(config: LayoutConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate page dimensions
    if (config.totalWidth <= 0 || config.totalHeight <= 0) {
      errors.push('Page dimensions must be greater than 0');
    }

    if (config.totalWidth > 20 || config.totalHeight > 20) {
      warnings.push('Page dimensions are unusually large (>20 inches)');
    }

    // Validate margins
    const totalHorizontalMargin = config.leftMargin + config.rightMargin;
    const totalVerticalMargin = config.topMargin + config.bottomMargin;

    if (totalHorizontalMargin >= config.totalWidth) {
      errors.push('Horizontal margins exceed page width');
    }

    if (totalVerticalMargin >= config.totalHeight) {
      errors.push('Vertical margins exceed page height');
    }

    // Validate padding
    const totalHorizontalPadding = config.leftPadding + config.rightPadding;
    const totalVerticalPadding = config.topPadding + config.bottomPadding;

    if (totalHorizontalMargin + totalHorizontalPadding >= config.totalWidth) {
      errors.push('Combined margins and padding exceed page width');
    }

    if (totalVerticalMargin + totalVerticalPadding >= config.totalHeight) {
      errors.push('Combined margins and padding exceed page height');
    }

    // Validate header/footer heights
    if (config.headerHeight < 0 || config.footerHeight < 0) {
      errors.push('Header and footer heights cannot be negative');
    }

    const totalVerticalSpace = config.headerHeight + config.footerHeight + totalVerticalMargin + totalVerticalPadding;
    if (totalVerticalSpace >= config.totalHeight) {
      errors.push('No space left for body content');
    }

    // Validate column layout
    const totalColumnWidth = config.columnLayout.column1 + config.columnLayout.column2 + config.columnLayout.column3;
    if (Math.abs(totalColumnWidth - 100) > 0.01) {
      warnings.push('Column widths do not add up to 100%');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateBodySection(section: BodySection): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate position
    if (section.position.x < 0 || section.position.y < 0) {
      errors.push('Section position cannot be negative');
    }

    if (section.position.x > 90 || section.position.y > 90) {
      warnings.push('Section is positioned near the edge of the page');
    }

    // Validate size
    if (section.size.width <= 0 || section.size.height <= 0) {
      errors.push('Section size must be greater than 0');
    }

    if (section.size.width < 10 || section.size.height < 5) {
      warnings.push('Section might be too small to be readable');
    }

    if (section.position.x + section.size.width > 100) {
      errors.push('Section extends beyond the right edge of the content area');
    }

    if (section.position.y + section.size.height > 100) {
      errors.push('Section extends beyond the bottom edge of the content area');
    }

    // Validate style
    if (section.style.fontSize < 8) {
      warnings.push('Font size might be too small for printing');
    }

    if (section.style.fontSize > 24) {
      warnings.push('Font size might be too large');
    }

    // Validate content
    if (!section.content || section.content.trim().length === 0) {
      warnings.push('Section has no content');
    }

    if (section.content && section.content.length > 5000) {
      warnings.push('Section content is very long and might not fit');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateAllSections(sections: BodySection[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (sections.length === 0) {
      warnings.push('No content sections added');
    }

    // Check for overlapping sections
    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        if (this.sectionsOverlap(sections[i], sections[j])) {
          warnings.push(`Sections "${sections[i].name}" and "${sections[j].name}" overlap`);
        }
      }
    }

    // Validate each section
    sections.forEach(section => {
      const result = this.validateBodySection(section);
      errors.push(...result.errors.map(e => `${section.name}: ${e}`));
      warnings.push(...result.warnings.map(w => `${section.name}: ${w}`));
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  sectionsOverlap(section1: BodySection, section2: BodySection, tolerance: number = 0): boolean {
    const rect1 = {
      left: section1.position.x - tolerance,
      right: section1.position.x + section1.size.width + tolerance,
      top: section1.position.y - tolerance,
      bottom: section1.position.y + section1.size.height + tolerance
    };

    const rect2 = {
      left: section2.position.x - tolerance,
      right: section2.position.x + section2.size.width + tolerance,
      top: section2.position.y - tolerance,
      bottom: section2.position.y + section2.size.height + tolerance
    };

    return !(rect1.right < rect2.left || 
             rect2.right < rect1.left || 
             rect1.bottom < rect2.top || 
             rect2.bottom < rect1.top);
  }

  // Resolve overlap between two sections
  resolveOverlap(section1: BodySection, section2: BodySection): { x: number; y: number } | null {
    const rect1 = {
      left: section1.position.x,
      right: section1.position.x + section1.size.width,
      top: section1.position.y,
      bottom: section1.position.y + section1.size.height
    };

    const rect2 = {
      left: section2.position.x,
      right: section2.position.x + section2.size.width,
      top: section2.position.y,
      bottom: section2.position.y + section2.size.height
    };

    // Check if sections actually overlap
    if (!this.sectionsOverlap(section1, section2)) {
      return null;
    }

    // Calculate overlap amounts
    const overlapX = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);
    const overlapY = Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);

    // Calculate possible new positions
    const positions = [
      // Move right
      { x: rect1.right + 1, y: section2.position.y },
      // Move left
      { x: rect1.left - section2.size.width - 1, y: section2.position.y },
      // Move down
      { x: section2.position.x, y: rect1.bottom + 1 },
      // Move up
      { x: section2.position.x, y: rect1.top - section2.size.height - 1 }
    ];

    // Find the best position (closest to original)
    let bestPosition = positions[0];
    let minDistance = Math.abs(positions[0].x - section2.position.x) + Math.abs(positions[0].y - section2.position.y);

    for (const pos of positions) {
      const distance = Math.abs(pos.x - section2.position.x) + Math.abs(pos.y - section2.position.y);
      if (distance < minDistance && pos.x >= 0 && pos.y >= 0 && 
          pos.x + section2.size.width <= 100 && pos.y + section2.size.height <= 100) {
        bestPosition = pos;
        minDistance = distance;
      }
    }

    return bestPosition;
  }

  // Helper method to fix common issues
  autoFixLayout(config: LayoutConfig): LayoutConfig {
    const fixed = { ...config };

    // Ensure column widths add up to 100%
    const total = fixed.columnLayout.column1 + fixed.columnLayout.column2 + fixed.columnLayout.column3;
    if (Math.abs(total - 100) > 0.01) {
      const scale = 100 / total;
      fixed.columnLayout.column1 = Math.round(fixed.columnLayout.column1 * scale * 100) / 100;
      fixed.columnLayout.column2 = Math.round(fixed.columnLayout.column2 * scale * 100) / 100;
      fixed.columnLayout.column3 = Math.round((100 - fixed.columnLayout.column1 - fixed.columnLayout.column2) * 100) / 100;
    }

    // Ensure dimensions are positive
    fixed.totalWidth = Math.max(0.1, fixed.totalWidth);
    fixed.totalHeight = Math.max(0.1, fixed.totalHeight);
    fixed.headerHeight = Math.max(0, fixed.headerHeight);
    fixed.footerHeight = Math.max(0, fixed.footerHeight);

    // Ensure margins and padding don't exceed page size - more aggressive fixing
    const maxHorizontalSpace = fixed.totalWidth * 0.8; // 80% max
    const maxVerticalSpace = fixed.totalHeight * 0.8; // 80% max

    const horizontalSpace = fixed.leftMargin + fixed.rightMargin + fixed.leftPadding + fixed.rightPadding;
    if (horizontalSpace > maxHorizontalSpace) {
      const scale = maxHorizontalSpace / horizontalSpace;
      fixed.leftMargin = Math.round(fixed.leftMargin * scale * 100) / 100;
      fixed.rightMargin = Math.round(fixed.rightMargin * scale * 100) / 100;
      fixed.leftPadding = Math.round(fixed.leftPadding * scale * 100) / 100;
      fixed.rightPadding = Math.round(fixed.rightPadding * scale * 100) / 100;
    }

    const verticalSpace = fixed.topMargin + fixed.bottomMargin + fixed.topPadding + fixed.bottomPadding + fixed.headerHeight + fixed.footerHeight;
    if (verticalSpace > maxVerticalSpace) {
      const scale = maxVerticalSpace / verticalSpace;
      fixed.topMargin = Math.round(fixed.topMargin * scale * 100) / 100;
      fixed.bottomMargin = Math.round(fixed.bottomMargin * scale * 100) / 100;
      fixed.topPadding = Math.round(fixed.topPadding * scale * 100) / 100;
      fixed.bottomPadding = Math.round(fixed.bottomPadding * scale * 100) / 100;
      fixed.headerHeight = Math.round(fixed.headerHeight * scale * 100) / 100;
      fixed.footerHeight = Math.round(fixed.footerHeight * scale * 100) / 100;
    }

    // Ensure minimum content area remains (at least 20% of page)
    const contentWidth = fixed.totalWidth - fixed.leftMargin - fixed.rightMargin - fixed.leftPadding - fixed.rightPadding;
    const contentHeight = fixed.totalHeight - fixed.topMargin - fixed.bottomMargin - fixed.topPadding - fixed.bottomPadding;
    
    if (contentWidth < fixed.totalWidth * 0.2) {
      const excess = (fixed.totalWidth * 0.2) - contentWidth;
      fixed.leftMargin = Math.max(0, fixed.leftMargin - excess / 4);
      fixed.rightMargin = Math.max(0, fixed.rightMargin - excess / 4);
      fixed.leftPadding = Math.max(0, fixed.leftPadding - excess / 4);
      fixed.rightPadding = Math.max(0, fixed.rightPadding - excess / 4);
    }

    if (contentHeight < fixed.totalHeight * 0.2) {
      const excess = (fixed.totalHeight * 0.2) - contentHeight;
      fixed.topMargin = Math.max(0, fixed.topMargin - excess / 6);
      fixed.bottomMargin = Math.max(0, fixed.bottomMargin - excess / 6);
      fixed.topPadding = Math.max(0, fixed.topPadding - excess / 6);
      fixed.bottomPadding = Math.max(0, fixed.bottomPadding - excess / 6);
      fixed.headerHeight = Math.max(0, fixed.headerHeight - excess / 6);
      fixed.footerHeight = Math.max(0, fixed.footerHeight - excess / 6);
    }

    // Validate that header + footer don't exceed 60% of page height
    const headerFooterHeight = fixed.headerHeight + fixed.footerHeight;
    if (headerFooterHeight > fixed.totalHeight * 0.6) {
      const scale = (fixed.totalHeight * 0.6) / headerFooterHeight;
      fixed.headerHeight = Math.round(fixed.headerHeight * scale * 100) / 100;
      fixed.footerHeight = Math.round(fixed.footerHeight * scale * 100) / 100;
    }

    return fixed;
  }

  // Auto-fix individual section
  autoFixSection(section: BodySection): BodySection {
    const fixed = { ...section };

    // Adjust position if it exceeds boundaries
    if (fixed.position.x < 0) fixed.position.x = 0;
    if (fixed.position.y < 0) fixed.position.y = 0;
    if (fixed.position.x > 90) fixed.position.x = 90;
    if (fixed.position.y > 90) fixed.position.y = 90;

    // Reduce size if it's too large for available space
    if (fixed.position.x + fixed.size.width > 100) {
      fixed.size.width = Math.max(10, 100 - fixed.position.x);
    }
    if (fixed.position.y + fixed.size.height > 100) {
      fixed.size.height = Math.max(5, 100 - fixed.position.y);
    }

    // Ensure minimum readable size
    fixed.size.width = Math.max(10, fixed.size.width);
    fixed.size.height = Math.max(5, fixed.size.height);

    // Ensure style values are within bounds
    fixed.style.fontSize = Math.max(8, Math.min(24, fixed.style.fontSize));
    fixed.style.padding = Math.max(0, Math.min(30, fixed.style.padding));
    fixed.style.margin = Math.max(0, Math.min(20, fixed.style.margin));

    return fixed;
  }

  // Batch validation and fixing
  validateAndFixAllSections(sections: BodySection[]): BodySection[] {
    const fixedSections = sections.map(section => this.autoFixSection(section));
    
    // Resolve overlaps
    for (let i = 0; i < fixedSections.length; i++) {
      for (let j = i + 1; j < fixedSections.length; j++) {
        const adjustment = this.resolveOverlap(fixedSections[i], fixedSections[j]);
        if (adjustment) {
          fixedSections[j].position.x = adjustment.x;
          fixedSections[j].position.y = adjustment.y;
        }
      }
    }

    return fixedSections;
  }
}