"use client"

import { useActionState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trophy, Play, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { signIn } from "@/lib/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-accent hover:bg-accent/90 text-white py-6 text-lg font-medium rounded-lg h-[60px]"
   >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  const handleDemoLogin = () => {
    startTransition(async () => {
      router.push("/dashboard")
    })
  }

  const handleAdminLogin = () => {
    startTransition(async () => {
      // Set a short-lived cookie granting ADMIN for demo/testing
      document.cookie = `wfc_demo_role=ADMIN; path=/; max-age=1800` // 30 minutes
      router.push("/admin")
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Trophy className="h-12 w-12 text-accent" />
        </div>
        <CardTitle className="text-2xl font-heading">Welcome back</CardTitle>
        <CardDescription>Sign in to your Weeknd FC League account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 gap-2">
          <Button
            onClick={handleDemoLogin}
            disabled={isPending}
            variant="outline"
            className="w-full h-12 border-accent/20 hover:bg-accent/5 bg-transparent"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading demo...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Try Demo (striker_sam)
              </>
            )}
          </Button>
          <Button onClick={handleAdminLogin} disabled={isPending} className="w-full h-12 bg-primary hover:bg-primary/90">
            <Shield className="mr-2 h-4 w-4" /> Log in as Admin (test)
          </Button>
          <p className="text-xs text-muted-foreground text-center">Admin test button grants temporary access</p>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or sign in manually</span>
          </div>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">
                Username/Nickname
              </label>
              <Input id="username" name="username" type="text" placeholder="Your username" required className="h-12" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <Input id="password" name="password" type="password" required className="h-12" />
            </div>
          </div>

        <SubmitButton />

          <div className="text-center text-muted-foreground">
            Don't have an account? <Link href="/auth/signup" className="text-accent hover:underline font-medium">Sign up</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
