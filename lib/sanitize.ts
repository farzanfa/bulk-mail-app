// Lightweight sanitizer for client-side preview HTML
// Removes <script>, <style>, <link>, <iframe>, and inline event handlers

export function sanitizeHtml(input: string): string {
  try {
    if (typeof window !== 'undefined' && 'DOMParser' in window) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'text/html');
      // Remove dangerous elements
      const blockedTags = ['script', 'style', 'link', 'iframe', 'object', 'embed', 'meta'];
      for (const tag of blockedTags) {
        doc.querySelectorAll(tag).forEach((el) => el.remove());
      }
      // Remove event handler attributes and javascript: urls
      const treeWalker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
      let node = treeWalker.nextNode() as HTMLElement | null;
      while (node) {
        // Remove on* attributes
        for (const attr of Array.from(node.attributes)) {
          if (/^on/i.test(attr.name)) {
            node.removeAttribute(attr.name);
            continue;
          }
          if ((attr.name === 'href' || attr.name === 'src') && /^javascript:/i.test(attr.value)) {
            node.removeAttribute(attr.name);
          }
        }
        node = treeWalker.nextNode() as HTMLElement | null;
      }
      return doc.body.innerHTML;
    }
  } catch {
    // fall through to regex fallback
  }
  // Fallback: strip scripts and event handlers via regex (best-effort)
  return input
    .replace(/<\/(?:script|style|link|iframe|object|embed|meta)>/gi, '')
    .replace(/<(?:script|style|link|iframe|object|embed|meta)[^>]*>/gi, '')
    .replace(/ on[a-z]+="[^"]*"/gi, '')
    .replace(/ on[a-z]+='[^']*'/gi, '')
    .replace(/ (href|src)="javascript:[^"]*"/gi, '')
    .replace(/ (href|src)='javascript:[^']*'/gi, '');
}


