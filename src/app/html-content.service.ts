import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HtmlContentService {

  constructor() { }

  /**
   * Converts HTML content to plain text by stripping HTML tags
   */
  htmlToText(html: string): string {
    if (!html) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Get text content and normalize whitespace
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  /**
   * Converts HTML content to formatted text with basic formatting preserved
   */
  htmlToFormattedText(html: string): string {
    if (!html) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Replace common HTML elements with text equivalents
    const replacements = [
      { tag: 'br', replacement: '\n' },
      { tag: 'p', replacement: '\n' },
      { tag: 'div', replacement: '\n' },
      { tag: 'h1', replacement: '\n' },
      { tag: 'h2', replacement: '\n' },
      { tag: 'h3', replacement: '\n' },
      { tag: 'h4', replacement: '\n' },
      { tag: 'h5', replacement: '\n' },
      { tag: 'h6', replacement: '\n' },
      { tag: 'li', replacement: '\n• ' }
    ];
    
    let text = html;
    
    // Apply replacements
    replacements.forEach(({ tag, replacement }) => {
      const regex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
      text = text.replace(regex, replacement);
    });
    
    // Remove remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    text = this.decodeHtmlEntities(text);
    
    // Clean up whitespace
    text = text.replace(/\n\s*\n/g, '\n').trim();
    
    return text;
  }

  /**
   * Decodes common HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };
    
    let decoded = text;
    Object.keys(entities).forEach(entity => {
      decoded = decoded.replace(new RegExp(entity, 'g'), entities[entity]);
    });
    
    return decoded;
  }

  /**
   * Extracts text content from HTML while preserving basic formatting
   */
  extractTextFromHtml(html: string): string {
    if (!html) return '';
    
    // Create a temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Function to process text nodes
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        
        // Handle different elements
        switch (tagName) {
          case 'br':
            return '\n';
          case 'p':
          case 'div':
            return '\n' + Array.from(element.childNodes).map(processNode).join('') + '\n';
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            return '\n' + Array.from(element.childNodes).map(processNode).join('') + '\n';
          case 'li':
            return '\n• ' + Array.from(element.childNodes).map(processNode).join('');
          case 'strong':
          case 'b':
            return '*' + Array.from(element.childNodes).map(processNode).join('') + '*';
          case 'em':
          case 'i':
            return '_' + Array.from(element.childNodes).map(processNode).join('') + '_';
          case 'u':
            return '_' + Array.from(element.childNodes).map(processNode).join('') + '_';
          default:
            return Array.from(element.childNodes).map(processNode).join('');
        }
      }
      
      return '';
    };
    
    let result = Array.from(tempDiv.childNodes).map(processNode).join('');
    
    // Clean up whitespace
    result = result.replace(/\n\s*\n/g, '\n').trim();
    
    return result;
  }

  /**
   * Extracts text content from HTML while preserving alignment information
   */
  extractTextWithAlignment(html: string): { text: string; alignment: string } {
    if (!html) return { text: '', alignment: 'left' };
    
    // Check for alignment in the HTML
    let alignment = 'left'; // Default alignment
    
    if (html.includes('align="center"') || html.includes('text-align: center')) {
      alignment = 'center';
    } else if (html.includes('align="right"') || html.includes('text-align: right')) {
      alignment = 'right';
    } else if (html.includes('align="justify"') || html.includes('text-align: justify')) {
      alignment = 'justify';
    }
    
    // Extract text content
    const text = this.extractTextFromHtml(html);
    
    return { text, alignment };
  }
} 