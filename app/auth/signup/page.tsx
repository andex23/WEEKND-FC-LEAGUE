import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SignUpForm from "@/components/auth/signup-form"

export default async function SignUpPage() {
  const supabase = await createClient()

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      redirect("/")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  )
}
