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
  title: "Muse Chat",
  description: "AI-powered chat assistant",
  icons: {
    icon: "https://portfolio-webapp.s3.eu-central-1.amazonaws.com/assets/museedlogo.png",
    shortcut: "https://portfolio-webapp.s3.eu-central-1.amazonaws.com/assets/museedlogo.png",
    apple: "https://portfolio-webapp.s3.eu-central-1.amazonaws.com/assets/museedlogo.png",
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
