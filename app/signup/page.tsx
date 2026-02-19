"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import { API_BASE_URL } from "@/lib/config"
import Link from "next/link"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { useSettings } from "@/app/context/settings-context"

export default function Signup() {
    const [firstName, setFirstName] = useState("")
    const [email, setEmail] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const { settings } = useSettings()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (password !== passwordConfirm) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        try {
            const res = await fetch(`${API_BASE_URL}/users/api/auth/signup/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    first_name: firstName,
                    email,
                    phone_number: phoneNumber,
                    password,
                    password_confirm: passwordConfirm,
                }),
            })

            if (!res.ok) {
                const text = await res.text()
                try {
                    const json = JSON.parse(text)
                    // Try to extract a meaningful error message from Django/DRF response
                    const errorMsg = Object.values(json).flat().join(", ") || "Registration failed"
                    throw new Error(errorMsg)
                } catch {
                    throw new Error("Registration failed. Please check your inputs.")
                }
            }

            const data = await res.json()

            // Store token and user info (Auto-login)
            if (data.token) {
                document.cookie = `auth_token=${data.token}; path=/; max-age=86400` // 1 day
                localStorage.setItem("auth_token", data.token)
            }

            if (data.user) {
                localStorage.setItem("user_info", JSON.stringify(data.user))
            }

            // Handle success - redirect to home
            router.push("/")
        } catch (err: any) {
            setError(err.message || "Failed to sign up.")
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
                    <h1 className="text-2xl font-bold text-foreground mb-2">Join {settings?.name || "Muse"}</h1>
                    <p className="text-sm text-muted-foreground text-center">
                        Sign up to get started
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">First Name</label>
                        <Input
                            type="text"
                            placeholder="Your Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg h-11 focus-visible:ring-primary"
                            required
                        />
                    </div>

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
                        <label className="text-sm font-medium text-foreground ml-1">Phone Number</label>
                        <PhoneInput
                            placeholder="Enter phone number"
                            value={phoneNumber}
                            onChange={(value) => setPhoneNumber(value || "")}
                            defaultCountry="US"
                            className="bg-muted border-border text-foreground rounded-lg h-11 focus-visible:ring-primary"
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Confirm Password</label>
                        <Input
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
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
                        {loading ? "Creating account..." : "Sign up"}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}
