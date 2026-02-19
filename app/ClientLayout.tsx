"use client"

import type React from "react"
import Head from "next/head"

import { useEffect } from "react"
import { Inter, Merriweather } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { LoadingScreen } from "./components/loading-screen"
import "./highlight.css"
import { FaviconHandler } from "./components/favicon-handler"
import { SettingsProvider } from "./context/settings-context"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
})

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty("--vh", `${vh}px`)
    }

    setVH()
    window.addEventListener("resize", setVH)

    return () => {
      window.removeEventListener("resize", setVH)
    }
  }, [])

  return (
    <html lang="en">
      <body className={`${merriweather.className} ${merriweather.variable} antialiased`}>
        <SettingsProvider>
          <Head>
            <link rel="icon" href="https://portfolio-webapp.s3.eu-central-1.amazonaws.com/assets/museedlogo.png" />
          </Head>
          <LoadingScreen />
          <FaviconHandler />
          {children}
          <Toaster />
        </SettingsProvider>
      </body>
    </html>
  )
}
