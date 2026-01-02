"use client"

import { useState } from "react"

export function UserAvatar() {
  const [imageLoaded, setImageLoaded] = useState(true)

  return (
    <div className="w-full h-full overflow-hidden rounded-full bg-zinc-800">
      <img
        src="https://supersparks.s3.ca-central-1.amazonaws.com/chatbot/img/ifuT0Qu1_400x400.jpg"
        alt="User Avatar"
        className="w-full h-full object-cover"
        style={{
          display: imageLoaded ? "block" : "none",
          position: "relative",
          zIndex: 10, // Ensure image is above fallback
        }}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.error("Failed to load user avatar")
          setImageLoaded(false)
        }}
      />
    </div>
  )
}
