import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./ClientLayout"

const inter = Inter({ subsets: ["latin"] })

export const viewport = {
  themeColor: "#18181b",
}

export const metadata: Metadata = {
  title: "Spark Chat",
  description: "AI-powered chat assistant",
  icons: {
    icon: "https://supersparks.s3.ca-central-1.amazonaws.com/chatbot/img/supersparks.png",
    shortcut: "https://supersparks.s3.ca-central-1.amazonaws.com/chatbot/img/supersparks.png",
    apple: "https://supersparks.s3.ca-central-1.amazonaws.com/chatbot/img/supersparks.png",
  },
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}
