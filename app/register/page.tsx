import { RegistrationForm } from "@/components/registration-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container-5xl section-pad">
        <div className="text-center mb-8">
          <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900">Register</h1>
          <p className="text-sm text-gray-600">Join the Weeknd FC League</p>
        </div>
        <RegistrationForm />
      </div>
    </div>
  )
}
