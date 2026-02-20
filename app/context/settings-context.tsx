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

export type ThemeMode = "light" | "dark" | "system"

interface SettingsContextType {
    settings: Settings | null
    isLoading: boolean
    themeMode: ThemeMode
    setThemeMode: (mode: ThemeMode) => void
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
    const [themeMode, setThemeMode] = useState<ThemeMode>("system")

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme_mode") as ThemeMode | null
        if (storedTheme) {
            setThemeMode(storedTheme)
        }
    }, [])

    const updateThemeMode = (mode: ThemeMode) => {
        setThemeMode(mode)
        localStorage.setItem("theme_mode", mode)
    }

    useEffect(() => {
        const root = document.documentElement
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

        const applyTheme = () => {
            if (themeMode === "dark" || (themeMode === "system" && mediaQuery.matches)) {
                root.classList.add("dark")
            } else {
                root.classList.remove("dark")
            }
        }

        applyTheme()

        const listener = () => {
            if (themeMode === "system") applyTheme()
        }
        mediaQuery.addEventListener("change", listener)
        return () => mediaQuery.removeEventListener("change", listener)
    }, [themeMode])

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings()
                if (data && (data.name || data.logo_url || data.theme)) {
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

    const generateThemeCss = (theme?: Theme) => {
        if (!theme) return null

        const buildVars = (t: ThemeColors) => {
            let css = ""
            if (t.app_bg) css += `--background: ${hexToHSL(t.app_bg)};\n`
            if (t.text_primary) {
                css += `--foreground: ${hexToHSL(t.text_primary)};\n`
                css += `--card-foreground: ${hexToHSL(t.text_primary)};\n`
                css += `--popover-foreground: ${hexToHSL(t.text_primary)};\n`
            }
            if (t.surface_bg) {
                css += `--card: ${hexToHSL(t.surface_bg)};\n`
                css += `--popover: ${hexToHSL(t.surface_bg)};\n`
            }
            if (t.input_bg) {
                css += `--input: ${hexToHSL(t.input_bg)};\n`
            }
            if (t.chat_user_bg) {
                css += `--secondary: ${hexToHSL(t.chat_user_bg)};\n`
                css += `--muted: ${hexToHSL(t.chat_user_bg)};\n`
            } else if (t.input_bg) {
                css += `--secondary: ${hexToHSL(t.input_bg)};\n`
                css += `--muted: ${hexToHSL(t.input_bg)};\n`
            }
            if (t.border_default) css += `--border: ${hexToHSL(t.border_default)};\n`

            if (t.input_border_focus) {
                css += `--ring: ${hexToHSL(t.input_border_focus)};\n`
            } else if (t.accent) {
                css += `--ring: ${hexToHSL(t.accent)};\n`
            }

            if (t.accent) {
                css += `--primary: ${hexToHSL(t.accent)};\n`
                css += `--accent: ${hexToHSL(t.accent)};\n`
            }
            if (t.text_muted) css += `--muted-foreground: ${hexToHSL(t.text_muted)};\n`
            if (t.accent_hover) css += `--accent-hover: ${hexToHSL(t.accent_hover)};\n`
            if (t.text_placeholder) css += `--placeholder: ${hexToHSL(t.text_placeholder)};\n`
            if (t.avatar_bg) css += `--avatar-bg: ${hexToHSL(t.avatar_bg)};\n`
            if (t.avatar_text) css += `--avatar-text: ${hexToHSL(t.avatar_text)};\n`
            if (t.icon_default) css += `--icon-default: ${hexToHSL(t.icon_default)};\n`
            if (t.input_border) css += `--input-border: ${hexToHSL(t.input_border)};\n`
            if (t.input_border_hover) css += `--input-border-hover: ${hexToHSL(t.input_border_hover)};\n`

            return css
        }

        let css = ""
        if (theme.light) {
            css += `:root {\n${buildVars(theme.light)}}\n`
        }
        if (theme.dark) {
            css += `.dark {\n${buildVars(theme.dark)}}\n`
        }

        return css
    }

    return (
        <SettingsContext.Provider value={{ settings, isLoading, themeMode, setThemeMode: updateThemeMode }}>
            {settings?.theme && (
                <style dangerouslySetInnerHTML={{ __html: generateThemeCss(settings.theme) || "" }} />
            )}
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
