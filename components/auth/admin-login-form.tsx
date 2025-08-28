"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AdminLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/admin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || "Invalid credentials")
        }
        router.replace(next)
        router.refresh()
      } catch (err: any) {
        setError(err.message || "Login failed")
      }
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading">Admin Login</CardTitle>
        <CardDescription>Enter your admin credentials to continue</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full h-12">{isPending ? "Signing in..." : "Sign In"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}


