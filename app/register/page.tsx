import { RegistrationForm } from "@/components/registration-form"
import { PageHeading } from "@/components/league/ui"
export default function RegisterPage() {
  return (
    <div className="fc-form-page fc-register">
      <div className="fc-wrap">
        <PageHeading
          eyebrow="New player registration"
          title="Your place in the club."
          description="Create your player and get ready for the next season."
        />
        <RegistrationForm />
      </div>
    </div>
  )
}
