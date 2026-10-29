import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
})
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(html: string | null | undefined): SafeHtml {
    if (!html) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    let processedHtml = html;
    if (!html.includes('<') && html.includes('\n')) {
      processedHtml = html.replace(/\n/g, '<br>');
    }

    processedHtml = processedHtml
      .replace(/<li>/g, '<li style="margin: 2px 0; line-height: 1.4;">')
      .replace(/<ul>/g, '<ul style="margin: 4px 0; padding-left: 20px; list-style-type: disc; list-style-position: outside;">')
      .replace(/<ol>/g, '<ol style="margin: 4px 0; padding-left: 20px; list-style-type: decimal; list-style-position: outside;">')
      .replace(/<p>/g, '<p style="margin: 0 0 4px 0; font-size: inherit;">')
      .replace(/<strong>/g, '<strong style="font-weight: 700;">')
      .replace(/<b>/g, '<b style="font-weight: 700;">')
      .replace(/<em>/g, '<em style="font-style: italic;">')
      .replace(/<i>/g, '<i style="font-style: italic;">')
      .replace(/<u>/g, '<u style="text-decoration: underline;">')
      .replace(/^•\s+/gm, '<span style="display: inline-block; margin-right: 0.5em;">•</span>')
      .replace(/\n•\s+/g, '<br><span style="display: inline-block; margin-right: 0.5em;">•</span>');

    return this.sanitizer.bypassSecurityTrustHtml(processedHtml);
  }
}
