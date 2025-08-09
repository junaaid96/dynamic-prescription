import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(html: string): SafeHtml {
    if (!html) return this.sanitizer.bypassSecurityTrustHtml('');
    
    // Enhanced HTML processing for better TinyMCE content display
    let processedHtml = html;
    
    // Convert newlines to br tags for plain text content
    if (!html.includes('<') && html.includes('\n')) {
      processedHtml = html.replace(/\n/g, '<br>');
    }
    
    // Ensure proper list styling is preserved
    processedHtml = processedHtml
      // Fix list item spacing
      .replace(/<li>/g, '<li style="margin: 2px 0; line-height: 1.4;">')
      // Ensure ul/ol have proper margins and padding
      .replace(/<ul>/g, '<ul style="margin: 4px 0; padding-left: 20px; list-style-type: disc; list-style-position: outside;">')
      .replace(/<ol>/g, '<ol style="margin: 4px 0; padding-left: 20px; list-style-type: decimal; list-style-position: outside;">')
      // Fix paragraph spacing
      .replace(/<p>/g, '<p style="margin: 0 0 4px 0; font-size: inherit;">')
      // Ensure strong/bold formatting is preserved
      .replace(/<strong>/g, '<strong style="font-weight: 700;">')
      .replace(/<b>/g, '<b style="font-weight: 700;">')
      // Ensure italic formatting is preserved
      .replace(/<em>/g, '<em style="font-style: italic;">')
      .replace(/<i>/g, '<i style="font-style: italic;">')
      // Ensure underline formatting is preserved
      .replace(/<u>/g, '<u style="text-decoration: underline;">')
      // Handle manual bullet points (for plain text content)
      .replace(/^•\s+/gm, '<span style="display: inline-block; margin-right: 0.5em;">•</span>')
      .replace(/\n•\s+/g, '<br><span style="display: inline-block; margin-right: 0.5em;">•</span>');
    
    return this.sanitizer.bypassSecurityTrustHtml(processedHtml);
  }
}