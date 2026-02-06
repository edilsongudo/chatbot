"use client"

import { useEffect, useState } from "react"

export function LoadingScreen() {
  const [show, setShow] = useState(true)

  // Fade out the loading screen after the app has loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, 1200) // Slightly shorter duration for a snappier feel

    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900 transition-opacity duration-500">
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}
