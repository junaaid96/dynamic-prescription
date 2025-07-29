export interface SectionColumn {
    content: string;
    width: number; // percentage
}

export interface Section {
    id: string;
    type: string;
    content?: string;
    columns?: SectionColumn[];
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