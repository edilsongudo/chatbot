"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getSettings } from "@/app/api/chatbot"

interface ThemeColors {
    accent: string
    app_bg: string
    input_bg: string
    avatar_bg: string
    surface_bg: string
    text_muted: string
    avatar_text: string
    accent_hover: string
    chat_user_bg: string
    icon_default: string
    input_border: string
    text_primary: string
    border_default: string
    text_placeholder: string
    input_border_focus: string
    input_border_hover: string
}

interface Theme {
    dark?: ThemeColors
    light?: ThemeColors
}

interface Settings {
    name: string
    logo_url: string
    theme?: Theme
}

interface SettingsContextType {
    settings: Settings | null
    isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

function hexToHSL(hex: string) {
    hex = hex.replace(/^#/, "")
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    const max = Math.max(r, g, b),
        min = Math.min(r, g, b)
    let h = 0,
        s = 0,
        l = (max + min) / 2

    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0)
                break
            case g:
                h = (b - r) / d + 2
                break
            case b:
                h = (r - g) / d + 4
                break
        }
        h /= 6
    }

    h = Math.round(h * 360)
    s = Math.round(s * 100)
    l = Math.round(l * 100)

    return `${h} ${s}% ${l}%`
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings()
                // Require at least name or logo_url, or theme to apply
                if (data && (data.name || data.logo_url || data.theme)) {
                    setSettings(data)

                    if (data.theme?.light) {
                        const root = document.documentElement
                        const light = data.theme.light

                        if (light.app_bg) root.style.setProperty("--background", hexToHSL(light.app_bg))
                        if (light.text_primary) {
                            root.style.setProperty("--foreground", hexToHSL(light.text_primary))
                            root.style.setProperty("--card-foreground", hexToHSL(light.text_primary))
                            root.style.setProperty("--popover-foreground", hexToHSL(light.text_primary))
                        }
                        if (light.surface_bg) {
                            root.style.setProperty("--card", hexToHSL(light.surface_bg))
                            root.style.setProperty("--popover", hexToHSL(light.surface_bg))
                        }
                        if (light.input_bg) {
                            root.style.setProperty("--input", hexToHSL(light.input_bg))
                            // Used by chat user bubbles and sidebars previously mapping from secondary
                            // We can use chat_user_bg for user bubbles or use what input_bg was mapped to
                        }
                        if (light.chat_user_bg) {
                            root.style.setProperty("--secondary", hexToHSL(light.chat_user_bg))
                            root.style.setProperty("--muted", hexToHSL(light.chat_user_bg))
                        } else if (light.input_bg) {
                            // Fallback if chat_user_bg isn't present
                            root.style.setProperty("--secondary", hexToHSL(light.input_bg))
                            root.style.setProperty("--muted", hexToHSL(light.input_bg))
                        }

                        if (light.border_default) root.style.setProperty("--border", hexToHSL(light.border_default))

                        // We can also map input_border explicitly if needed in globals (or keep using --border for inputs)
                        // Setting ring to input_border_focus is a good practice for inputs
                        if (light.input_border_focus) {
                            root.style.setProperty("--ring", hexToHSL(light.input_border_focus))
                        } else if (light.accent) {
                            root.style.setProperty("--ring", hexToHSL(light.accent))
                        }

                        if (light.accent) {
                            root.style.setProperty("--primary", hexToHSL(light.accent))
                            root.style.setProperty("--accent", hexToHSL(light.accent))
                        }
                        if (light.text_muted) root.style.setProperty("--muted-foreground", hexToHSL(light.text_muted))
                        if (light.accent_hover) root.style.setProperty("--accent-hover", hexToHSL(light.accent_hover))
                    }
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
