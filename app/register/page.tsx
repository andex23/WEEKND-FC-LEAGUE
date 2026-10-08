import { RegistrationForm } from "@/components/registration-form"
import { PageHeading } from "@/components/league/ui"
export default function RegisterPage() {
  return (
    <div className="fc-form-page fc-register">
      <div className="fc-wrap">
        <PageHeading
          eyebrow="New player registration"
          title="Your place in the club."
          description="Register your interest in the next Weekend FC league. Entry is US$5. The start date is to be confirmed, and payment will wait until the season date and format are confirmed."
        />
        <RegistrationForm />
      </div>
    </div>
  )
}
