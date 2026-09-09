import Link from "next/link"
import { ArrowUpRight, Check } from "lucide-react"
import { PageHeading } from "@/components/league/ui"
import { pageMetadata } from "@/lib/seo"
import styles from "./page.module.css"

export const metadata = pageMetadata(
  "How We Play | Weekend FC",
  "Your guide to Weekend FC: register, accept a tournament invitation, arrange Friday–Sunday matches, report scores and climb the EA FC league table.",
  "/how-to-play",
)

const steps = [
  {
    id: "register",
    title: "Create your player.",
    text: "Register with your email, gamer tag, platform, location and preferred club. Add your download and upload speeds so the organizer can review your connection details.",
    note: "Use an email you can access and keep your password safe. Your registration starts as pending.",
    href: "/register",
    action: "Create your player",
  },
  {
    id: "approval",
    title: "Get approved. Claim your place.",
    text: "An admin reviews your registration. Once approved, you receive an email and can sign in. Tournament invitations appear in your dashboard: accept one and choose your club to join that tournament.",
    note: "An approved account is not automatically entered into every tournament. Check your dashboard for invitations; if none are available, wait for the organizer to open the next league.",
    href: "/dashboard",
    action: "Open your dashboard",
  },
  {
    id: "fixtures",
    title: "Meet your next opponent.",
    text: "Once the roster is ready, the organizer generates the fixtures. Find your opponent and matchday on the Matchdays page or in your dashboard, then coordinate your exact kick-off time in the community channel.",
    note: "League matches run Friday through Sunday. Be on time: the rulebook allows a 10-minute grace period before an admin may award a forfeit.",
    href: "/fixtures",
    action: "See matchdays",
  },
  {
    id: "kick-off",
    title: "Set up. Then play.",
    text: "Use the current EA FC edition and the club selected for your tournament. Check the organizer’s announced match settings: halves are 5 or 6 minutes. Make sure both players agree on the settings before kick-off.",
    note: "Connection trouble or a disconnect? Save evidence of the score and in-game time, and follow the disconnect rules. Ask the organizer to resolve anything unclear before submitting a result.",
    href: "/rules",
    action: "Check the match rules",
  },
  {
    id: "report",
    title: "Make the score official.",
    text: "Open Report Result from your dashboard, select the fixture and enter the home and away scores in the correct order. Upload a PNG or JPEG screenshot under 2 MB, or provide an evidence link. Add notes if the admin needs context.",
    note: "Your report stays pending until an admin approves it. Different scores from the two opponents are flagged as a conflict. Only players in the fixture can report it; finalized results cannot be overwritten by another report.",
    href: "/report",
    action: "Report a result",
  },
  {
    id: "standings",
    title: "Build your season.",
    text: "After approval, the result appears in the league table and your dashboard. A win earns 3 points, a draw 1, and a loss 0. The table tracks points, goal difference and goals scored, with the full tiebreak rules in the rulebook.",
    note: "Each opponent is part of your season. Keep your appointments, keep your evidence, and treat the other player with respect.",
    href: "/standings",
    action: "Follow the standings",
  },
]

export default function HowToPlayPage() {
  return (
    <div className="fc-site">
      <div className="fc-wrap">
        <PageHeading
          eyebrow="Weekend FC / the player guide"
          title="How we play"
          description="From your first sign-up to the final whistle."
        />
        <div className={styles.intro}>
          <p>
            A proper league starts with a simple routine: claim your place, arrange your match, play
            fair and make every result count. Here’s what happens at each step.
          </p>
          <Link href="/register" className="fc-button">
            Join the league <ArrowUpRight size={16} />
          </Link>
        </div>
        <nav className={styles.jumpLinks} aria-label="Guide sections">
          {steps.map((step, index) => (
            <a key={step.id} href={`#${step.id}`}>
              <span>0{index + 1}</span>
              {["Register", "Get approved", "Find your fixture", "Play", "Report", "Climb"][index]}
            </a>
          ))}
        </nav>
        <div className={styles.layout}>
          <div>
            {steps.map((step, index) => (
              <section
                key={step.id}
                id={step.id}
                className={styles.step}
                aria-labelledby={`${step.id}-title`}
              >
                <span className={styles.number} aria-hidden="true">
                  0{index + 1}
                </span>
                <div>
                  <h2 id={`${step.id}-title`}>{step.title}</h2>
                  <p>{step.text}</p>
                  <p className={styles.note}>{step.note}</p>
                  <Link href={step.href} className="fc-text-link">
                    {step.action} <ArrowUpRight size={15} />
                  </Link>
                </div>
              </section>
            ))}
          </div>
          <aside className={styles.aside}>
            <div className={styles.checklist}>
              <span className={styles.kicker}>BEFORE YOU JOIN</span>
              <h2>Your matchday essentials.</h2>
              <ul>
                {[
                  "Current EA FC edition",
                  "PS5, Xbox Series X/S or PC",
                  "Your gamer tag and email",
                  "Your connection speed results",
                  "Time to play Friday–Sunday",
                ].map((item) => (
                  <li key={item}>
                    <Check size={16} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p>
                Registration is reviewed by an admin. Your dashboard shows your invitations and
                fixtures when they’re ready.
              </p>
            </div>
            <div className={styles.help}>
              <h2>Something didn’t go to plan?</h2>
              <p>
                Keep a screenshot and contact the organizer through the community links in the
                rulebook. For score disputes, include the fixture, score and what happened.
              </p>
              <Link href="/rules" className="fc-text-link">
                Rulebook & community <ArrowUpRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
        <div className={styles.finish}>
          <div>
            <h2>Your next weekend starts here.</h2>
            <p>Create your player, then watch for your tournament invitation.</p>
          </div>
          <Link href="/register" className="fc-button">
            Create your player <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
