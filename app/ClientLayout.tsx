"use client"

import type React from "react"
import Head from "next/head"

import { useEffect } from "react"
import { Inter } from "next/font/google"
// import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { LoadingScreen } from "./components/loading-screen"
// Remove the highlight.js import
import { FaviconHandler } from "./components/favicon-handler"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <Head>
          <link rel="icon" href="https://supersparks.s3.ca-central-1.amazonaws.com/chatbot/img/supersparks.png" />
        </Head>
        <LoadingScreen />
        <FaviconHandler />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
