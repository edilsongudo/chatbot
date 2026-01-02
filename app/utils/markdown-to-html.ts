import DOMPurify from "isomorphic-dompurify"
import { marked } from "marked"

/**
 * Converts markdown text to sanitized HTML
 * @param markdown The markdown text to convert
 * @returns Sanitized HTML string
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ""

  try {
    // Configure marked for code highlighting without highlight.js
    marked.setOptions({
      breaks: true, // Convert line breaks to <br>
      gfm: true, // Enable GitHub Flavored Markdown
      headerIds: true, // Generate IDs for headers
      mangle: false, // Don't modify header text
      smartLists: true, // Use smarter list behavior
      smartypants: true, // Use typographic quotes and dashes
      xhtml: false, // Don't use self-closing XHTML tags
      highlight: (code, lang) => {
        // Just add the language class without using highlight.js
        return `<code class="language-${lang || "plaintext"}">${code}</code>`
      },
    })

    // Convert markdown to HTML
    const rawHtml = marked.parse(markdown, {
      breaks: true,
      gfm: true,
    })

    // Configure DOMPurify to allow classes and styles
    const sanitizeOptions = {
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "p",
        "a",
        "ul",
        "ol",
        "nl",
        "li",
        "b",
        "i",
        "strong",
        "em",
        "strike",
        "code",
        "hr",
        "br",
        "div",
        "table",
        "thead",
        "caption",
        "tbody",
        "tr",
        "th",
        "td",
        "pre",
        "span",
        "img",
      ],
      ALLOWED_ATTR: ["href", "name", "target", "class", "id", "style", "src", "alt", "title", "language"],
      ALLOW_DATA_ATTR: true,
    }

    // Sanitize HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, sanitizeOptions)

    return sanitizedHtml
  } catch (error) {
    console.error("Error converting markdown to HTML:", error)
    return markdown // Return original text if conversion fails
  }
}
