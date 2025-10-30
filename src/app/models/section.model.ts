// Type definitions for dynamic prescription system

export type PageType = 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
export type SectionType = 'diagnostic' | 'prescription' | 'custom' | 'patient' | 'header' | 'footer';
export type FontWeight = 'normal' | 'bold' | 'italic';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface PaperSize {
    width: number;  // in inches
    height: number; // in inches
}

export interface Position {
    x: number; // percentage
    y: number; // percentage
}

export interface Size {
    width: number;  // percentage
    height: number; // percentage
}

export interface SectionStyle {
    fontSize: number;        // in pixels
    fontWeight: FontWeight;
    textAlign: TextAlign;
    fontColor: string;       // hex color
    padding: number;         // in pixels
    margin: number;          // in pixels
}

export interface SectionColumn {
    content: string;
    width: number;           // percentage
    style?: SectionStyle;
}

export interface Section {
    id: string;
    type: SectionType;
    content?: string;
    columns?: SectionColumn[];
    position: Position;
    size: Size;
    style: SectionStyle;
}

export interface BodySection extends Section {
    type: 'diagnostic' | 'prescription' | 'custom' | 'patient';
    name: string;
    content: string;
    isManuallyResized?: boolean;
}

export interface LayoutConfig {
    pageType: PageType;
    totalWidth: number;      // in inches
    totalHeight: number;     // in inches
    leftMargin: number;      // in inches
    rightMargin: number;     // in inches
    topMargin: number;       // in inches
    bottomMargin: number;    // in inches
    leftPadding: number;     // in inches
    rightPadding: number;    // in inches
    topPadding: number;      // in inches
    bottomPadding: number;   // in inches
    headerHeight: number;    // in inches
    footerHeight: number;    // in inches
    columnLayout: {
        column1: number;     // percentage
        column2: number;     // percentage
        column3: number;     // percentage
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

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface SavedSettingConfig {
    layout: LayoutConfig;
    bodySections: BodySection[];
    headerColumns: SectionColumn[];
    footerColumns: SectionColumn[];
}

export interface SavedSetting {
    id: string;
    name: string;
    description?: string;
    config: SavedSettingConfig;
    timestamp: Date;
    version: string;
}

export interface SettingsHistory {
    settings: SavedSetting[];
    maxSettings: number;
} 