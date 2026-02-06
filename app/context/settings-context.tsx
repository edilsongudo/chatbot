"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getSettings } from "@/app/api/chatbot"

interface Settings {
    name: string
    logo_url: string
}

interface SettingsContextType {
    settings: Settings | null
    isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings()
                if (data && data.name && data.logo_url) {
                    setSettings(data)
                }
            } catch (error) {
                console.error("Failed to load settings in context:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [])

    return (
        <SettingsContext.Provider value={{ settings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
