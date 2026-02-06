"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play } from "lucide-react"
// We'll use standard HTML elements with Tailwind if Shadcn components aren't fully available/configured for this specific need, 
// ensuring a perfect visual match.
import { Input } from "@/app/components/ui/input"

import { API_BASE_URL } from "@/lib/config"
import Link from "next/link"

export default function Login() {
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
        <div className="min-h-screen flex items-center justify-center bg-[#212121] text-[#B2B2B2]">
            <div className="w-full max-w-[400px] bg-[#2c2c2e] p-8 rounded-xl shadow-2xl border border-zinc-800/50">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
                    <p className="text-sm text-zinc-400 text-center">
                        Enter your credentials to access your dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white ml-1">Email</label>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-[#18181b] border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg h-11 focus-visible:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white ml-1">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-[#18181b] border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg h-11 focus-visible:ring-indigo-500"
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
                        className="w-full bg-white text-black font-semibold h-11 rounded-lg mt-6 hover:bg-gray-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-zinc-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
