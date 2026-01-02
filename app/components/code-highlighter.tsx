"use client"

import { useEffect, useState } from "react"

export function CodeHighlighter() {
  const [highlightLoaded, setHighlightLoaded] = useState(false)

  useEffect(() => {
    // Only load highlight.js once
    if (highlightLoaded) return

    // Import highlight.js dynamically on the client side
    const loadHighlight = async () => {
      try {
        // Import the full highlight.js library instead of core + languages
        const hljs = await import("highlight.js")

        // Apply highlighting to all code blocks
        document.querySelectorAll("pre code").forEach((block) => {
          hljs.default.highlightElement(block as HTMLElement)
          addCopyButton(block.parentElement)
        })

        setHighlightLoaded(true)

        // Set up a mutation observer to highlight new code blocks
        const observer = new MutationObserver((mutations) => {
          let needsHighlight = false

          mutations.forEach((mutation) => {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
              needsHighlight = true
            }
          })

          if (needsHighlight) {
            document.querySelectorAll("pre code:not(.hljs)").forEach((block) => {
              hljs.default.highlightElement(block as HTMLElement)

              // Add copy button if it doesn't exist yet
              if (block.parentElement && !block.parentElement.querySelector(".code-copy-button")) {
                addCopyButton(block.parentElement)
              }
            })
          }
        })

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        })

        return () => {
          observer.disconnect()
        }
      } catch (error) {
        console.error("Failed to load highlight.js:", error)
      }
    }

    loadHighlight()
  }, [highlightLoaded])

  // Function to add copy button to code blocks
  const addCopyButton = (preElement: HTMLElement | null) => {
    if (!preElement || preElement.querySelector(".code-copy-button")) return

    // Create wrapper if it doesn't exist
    if (!preElement.classList.contains("code-block-wrapper")) {
      preElement.classList.add("code-block-wrapper")
    }

    // Create copy button
    const copyButton = document.createElement("button")
    copyButton.className = "code-copy-button"
    copyButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
    copyButton.title = "Copiar código"

    // Add click event to copy code
    copyButton.addEventListener("click", async () => {
      const codeElement = preElement.querySelector("code")
      if (codeElement) {
        try {
          await navigator.clipboard.writeText(codeElement.textContent || "")

          // Show success state
          copyButton.classList.add("copied")
          copyButton.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'

          // Reset after 2 seconds
          setTimeout(() => {
            copyButton.classList.remove("copied")
            copyButton.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
          }, 2000)
        } catch (err) {
          console.error("Failed to copy code:", err)
        }
      }
    })

    // Add button to pre element
    preElement.appendChild(copyButton)
  }

  return null
}
