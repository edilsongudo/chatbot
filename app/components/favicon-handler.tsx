"use client"

import { useEffect } from "react"

export function FaviconHandler() {
  useEffect(() => {
    // Ensure the favicon is set correctly
    const link = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement("link")
    link.type = "image/png"
    link.rel = "shortcut icon"
    link.href = "https://portfolio-webapp.s3.eu-central-1.amazonaws.com/assets/museedlogo.png"
    document.getElementsByTagName("head")[0].appendChild(link)
  }, [])

  return null
}
