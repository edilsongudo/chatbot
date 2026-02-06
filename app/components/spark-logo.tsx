"use client"

import { useState } from "react"
import { useSettings } from "@/app/context/settings-context"

interface SparkLogoProps {
  className?: string
}

export function SparkLogo({ className }: SparkLogoProps) {
  const [imageLoaded, setImageLoaded] = useState(true)
  const { settings } = useSettings()

  const logoUrl = settings?.logo_url || "https://portfolio-webapp.s3.eu-central-1.amazonaws.com/assets/museedlogo.png"

  return (
    <div className={`relative bg-zinc-800 rounded-full overflow-hidden ${className || "w-full h-full"}`}>
      <img
        src={logoUrl}
        alt={settings?.name || "Muse Logo"}
        className="w-full h-full object-cover"
        style={{
          display: imageLoaded ? "block" : "none",
          position: "relative",
          zIndex: 10, // Ensure image is above fallback
        }}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.error("Failed to load logo", e)
          setImageLoaded(false)
        }}
      />
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs font-bold">
          {settings?.name?.[0] || "S"}
        </div>
      )}
    </div>
  )
}
