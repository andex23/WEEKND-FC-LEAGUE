import { redirect } from "next/navigation"

// Registration now lives at /register (a single, complete sign-up form).
export default function SignUpPage() {
  redirect("/register")
}
