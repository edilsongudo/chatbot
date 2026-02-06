"use client"

import { useEffect } from "react"
import { useSettings } from "@/app/context/settings-context"

export function FaviconHandler() {
  const { settings } = useSettings()

  useEffect(() => {
    if (!settings?.logo_url) return

    // Ensure the favicon is set correctly
    const link = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement("link")
    link.type = "image/png"
    link.rel = "shortcut icon"
    link.href = settings.logo_url
    document.getElementsByTagName("head")[0].appendChild(link)
  }, [settings?.logo_url])

  return null
}
