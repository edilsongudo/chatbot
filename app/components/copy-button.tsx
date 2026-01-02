"use client"

import { useState, useEffect } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)

      return () => clearTimeout(timeout)
    }
  }, [copied])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch (error) {
      console.error("Failed to copy text:", error)
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className={cn(
        "flex items-center justify-center rounded-md p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors shadow-md",
        copied && "bg-green-600 hover:bg-green-500 text-white",
        className,
      )}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}
