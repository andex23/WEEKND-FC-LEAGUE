import { Suspense } from "react"
import { AdminLoginForm } from "@/components/auth/admin-login-form"

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  )
}


