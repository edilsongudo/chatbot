"use client"

import { useEffect, useState } from "react"
import { SparkLogo } from "./spark-logo"

export function LoadingScreen() {
  const [show, setShow] = useState(true)

  // Fade out the loading screen after the app has loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, 1500) // Keep visible for at least 1.5 seconds for a smooth experience

    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-900 transition-opacity duration-500">
      <div className="relative">
        <div className="w-16 h-16 mb-8">
          <SparkLogo />
        </div>
        <div className="absolute -inset-4 rounded-full border-t-2 border-blue-500 animate-spin"></div>
        <div className="absolute -inset-8 rounded-full border-t-2 border-blue-400 opacity-50 animate-spin-slow"></div>
        <div className="absolute -inset-12 rounded-full border-t-2 border-blue-300 opacity-30 animate-spin-slower"></div>
      </div>
      <div className="mt-8 text-zinc-400 text-sm font-medium animate-pulse">Loading Spark</div>
    </div>
  )
}
