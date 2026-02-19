import hljs from "highlight.js"
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
    // Configure custom renderer for links
    const renderer = new marked.Renderer()
    renderer.link = (href, title, text) => {
      const link = marked.Renderer.prototype.link.call(renderer, href, title, text)
      return link.replace("<a", '<a target="_blank" rel="noopener noreferrer"')
    }

    // Configure marked for code highlighting
    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true,
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value
        }
        return hljs.highlightAuto(code).value
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
      ALLOWED_ATTR: ["href", "name", "target", "class", "id", "style", "src", "alt", "title", "language", "rel"],
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
