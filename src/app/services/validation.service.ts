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

  private sectionsOverlap(section1: BodySection, section2: BodySection): boolean {
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

    return !(rect1.right < rect2.left || 
             rect2.right < rect1.left || 
             rect1.bottom < rect2.top || 
             rect2.bottom < rect1.top);
  }

  // Helper method to fix common issues
  autoFixLayout(config: LayoutConfig): LayoutConfig {
    const fixed = { ...config };

    // Ensure column widths add up to 100%
    const total = fixed.columnLayout.column1 + fixed.columnLayout.column2 + fixed.columnLayout.column3;
    if (Math.abs(total - 100) > 0.01) {
      const scale = 100 / total;
      fixed.columnLayout.column1 = Math.round(fixed.columnLayout.column1 * scale);
      fixed.columnLayout.column2 = Math.round(fixed.columnLayout.column2 * scale);
      fixed.columnLayout.column3 = 100 - fixed.columnLayout.column1 - fixed.columnLayout.column2;
    }

    // Ensure dimensions are positive
    fixed.totalWidth = Math.max(0.1, fixed.totalWidth);
    fixed.totalHeight = Math.max(0.1, fixed.totalHeight);
    fixed.headerHeight = Math.max(0, fixed.headerHeight);
    fixed.footerHeight = Math.max(0, fixed.footerHeight);

    // Ensure margins and padding don't exceed page size
    const maxHorizontalSpace = fixed.totalWidth * 0.8; // 80% max
    const maxVerticalSpace = fixed.totalHeight * 0.8; // 80% max

    const horizontalSpace = fixed.leftMargin + fixed.rightMargin + fixed.leftPadding + fixed.rightPadding;
    if (horizontalSpace > maxHorizontalSpace) {
      const scale = maxHorizontalSpace / horizontalSpace;
      fixed.leftMargin *= scale;
      fixed.rightMargin *= scale;
      fixed.leftPadding *= scale;
      fixed.rightPadding *= scale;
    }

    const verticalSpace = fixed.topMargin + fixed.bottomMargin + fixed.topPadding + fixed.bottomPadding + fixed.headerHeight + fixed.footerHeight;
    if (verticalSpace > maxVerticalSpace) {
      const scale = maxVerticalSpace / verticalSpace;
      fixed.topMargin *= scale;
      fixed.bottomMargin *= scale;
      fixed.topPadding *= scale;
      fixed.bottomPadding *= scale;
      fixed.headerHeight *= scale;
      fixed.footerHeight *= scale;
    }

    return fixed;
  }
}