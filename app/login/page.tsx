"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play } from "lucide-react"
// We'll use standard HTML elements with Tailwind if Shadcn components aren't fully available/configured for this specific need, 
// ensuring a perfect visual match.
import { Input } from "@/app/components/ui/input"

import { API_BASE_URL } from "@/lib/config"
import Link from "next/link"
import { useSettings } from "@/app/context/settings-context"

export default function Login() {
    const { settings } = useSettings()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch(`${API_BASE_URL}/users/api/auth/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            })

            if (!res.ok) {
                throw new Error("Invalid credentials")
            }

            const data = await res.json()

            // Store token and user info
            if (data.token) {
                document.cookie = `auth_token=${data.token}; path=/; max-age=86400` // 1 day
                localStorage.setItem("auth_token", data.token)
            }

            if (data.user) {
                localStorage.setItem("user_info", JSON.stringify(data.user))
            }

            // Handle success - redirect to home
            router.push("/")
        } catch (err) {
            setError("Failed to sign in. Please check your credentials.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-[400px] bg-card p-8 rounded-xl shadow-2xl border border-border/50">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg shadow-primary/20 overflow-hidden">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt={settings.name} className="w-full h-full object-cover" />
                        ) : (
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to {settings?.name || "Muse"}</h1>
                    <p className="text-sm text-muted-foreground text-center">
                        Enter your credentials to access your dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Email</label>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg h-11 focus-visible:ring-primary"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg h-11 focus-visible:ring-primary"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-400/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-semibold h-11 rounded-lg mt-6 hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
