/**
 * Enhanced HTML content service that maintains HTML tags
 * for direct rendering in PDF and previews
 */
export class HtmlParsingService {
  /**
   * Process HTML content to maintain formatting tags while cleaning up
   * unwanted elements for safe display
   */
  cleanAndPreserveHtml(html: string): string {
    if (!html) return '';
    
    // Allow a subset of safe HTML tags
    const allowedTags = ['strong', 'b', 'em', 'i', 'span', 'br', 'p', 'div', 'ul', 'ol', 'li'];
    const allowedAttrs = ['style', 'class'];
    
    // Create a temporary DOM element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Recursively process nodes
    this.processNode(tempDiv, allowedTags, allowedAttrs);
    
    return tempDiv.innerHTML;
  }
  
  private processNode(node: Node, allowedTags: string[], allowedAttrs: string[]): void {
    // Create a copy of childNodes to avoid live collection issues during removal
    const childNodes = Array.from(node.childNodes);
    
    for (const child of childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tagName = element.tagName.toLowerCase();
        
        if (allowedTags.includes(tagName)) {
          // For allowed tags, process attributes
          Array.from(element.attributes).forEach(attr => {
            if (!allowedAttrs.includes(attr.name.toLowerCase())) {
              element.removeAttribute(attr.name);
            }
          });
          
          // Recursively process children
          this.processNode(child, allowedTags, allowedAttrs);
        } else {
          // For disallowed tags, replace with text content
          const textNode = document.createTextNode(element.textContent || '');
          node.replaceChild(textNode, child);
        }
      } else if (child.nodeType === Node.TEXT_NODE) {
        // Preserve text nodes
      } else {
        // Remove other node types
        node.removeChild(child);
      }
    }
  }
}