"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  Download,
  Eye,
  EyeOff,
  Gamepad2,
  Gauge,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Sparkles,
  Upload,
  User,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { PlayerCard } from "@/components/player-card"
import { registrationSchema, type RegistrationFormData } from "@/lib/validations"
import { FIFA_CLUBS, CONSOLE_OPTIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ErrorBanner } from "@/components/ui/error-banner"

const STEPS: {
  id: string
  name: string
  title: string
  blurb: string
  fields: (keyof RegistrationFormData)[]
}[] = [
  {
    id: "player",
    name: "Player",
    title: "Who's playing?",
    blurb: "This is how you show up on the pitch and across the league.",
    fields: ["name", "username", "psnName"],
  },
  {
    id: "club",
    name: "Club",
    title: "Pick your colours",
    blurb: "Your platform and club — the identity printed on your card.",
    fields: ["console", "preferredClub", "location"],
  },
  {
    id: "connection",
    name: "Connection",
    title: "Test your connection",
    blurb: "Run a quick speed test so we can keep matches lag-free and seed fairly.",
    fields: ["downloadMbps", "uploadMbps"],
  },
  {
    id: "account",
    name: "Account",
    title: "Lock it in",
    blurb: "Secure your account, then mint your player card.",
    fields: ["email", "password", "confirmPassword"],
  },
]

function rookieRating(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return 62 + (h % 7)
}

function passwordScore(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[a-z]/.test(pw)) s++
  if (/[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  return s
}

const STRENGTH = [
  { label: "Too weak", bar: "bg-rose-500", text: "text-rose-400" },
  { label: "Weak", bar: "bg-rose-500", text: "text-rose-400" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-400" },
  { label: "Good", bar: "bg-lime-500", text: "text-lime-400" },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-400" },
]

const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-[0.16em] text-[#9E9E9E]"
const INPUT_CLASS = cn(
  "h-11 rounded-lg border-[#2A2A2A] bg-[#0F0F0F] pl-10 pr-10 text-white placeholder:text-[#5C5C5C]",
  "focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
)

function TextField({
  control,
  name,
  label,
  placeholder,
  icon: Icon,
  type = "text",
  autoComplete,
  inputMode,
}: {
  control: Control<RegistrationFormData>
  name: "name" | "username" | "psnName" | "email" | "location" | "downloadMbps" | "uploadMbps"
  label: string
  placeholder: string
  icon: LucideIcon
  type?: string
  autoComplete?: string
  inputMode?: "text" | "decimal" | "numeric" | "email"
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className={LABEL_CLASS}>{label}</FormLabel>
          <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5C5C]" />
            <FormControl>
              <Input
                {...field}
                type={type}
                inputMode={inputMode}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={cn(INPUT_CLASS, fieldState.error && "border-rose-500/70")}
              />
            </FormControl>
            {fieldState.isTouched && !fieldState.error && field.value ? (
              <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-fut-pop text-emerald-400" />
            ) : null}
          </div>
          <FormMessage className="text-xs text-rose-400" />
        </FormItem>
      )}
    />
  )
}

function PasswordField({
  control,
  name,
  label,
  placeholder,
  autoComplete,
  withStrength = false,
}: {
  control: Control<RegistrationFormData>
  name: "password" | "confirmPassword"
  label: string
  placeholder: string
  autoComplete?: string
  withStrength?: boolean
}) {
  const [show, setShow] = React.useState(false)
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const score = passwordScore(field.value || "")
        const meter = STRENGTH[score]
        return (
          <FormItem>
            <FormLabel className={LABEL_CLASS}>{label}</FormLabel>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5C5C]" />
              <FormControl>
                <Input
                  {...field}
                  type={show ? "text" : "password"}
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  className={cn(INPUT_CLASS, fieldState.error && "border-rose-500/70")}
                />
              </FormControl>
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C6C6C] transition-colors hover:text-white"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {withStrength && field.value ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn("h-1 flex-1 rounded-full transition-colors", i < score ? meter.bar : "bg-[#2A2A2A]")}
                    />
                  ))}
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", meter.text)}>{meter.label}</span>
              </div>
            ) : null}
            <FormMessage className="text-xs text-rose-400" />
          </FormItem>
        )
      }}
    />
  )
}

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300",
                i < current && "border-emerald-500 bg-emerald-500 text-black",
                i === current && "border-emerald-500 bg-emerald-500/15 text-emerald-400",
                i > current && "border-[#2A2A2A] bg-[#0F0F0F] text-[#5C5C5C]",
              )}
            >
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-[11px] font-bold uppercase tracking-[0.14em] sm:inline",
                i <= current ? "text-white" : "text-[#5C5C5C]",
              )}
            >
              {s.name}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300",
                i < current ? "bg-emerald-500" : "bg-[#2A2A2A]",
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export function RegistrationForm() {
  const router = useRouter()
  const [current, setCurrent] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [minting, setMinting] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [displayRating, setDisplayRating] = React.useState<number | null>(null)
  const [testing, setTesting] = React.useState(false)
  const [testDone, setTestDone] = React.useState(false)
  const [testError, setTestError] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const engineRef = React.useRef<{ pause?: () => void } | null>(null)

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: "onTouched",
    defaultValues: {
      username: "",
      email: "",
      name: "",
      psnName: "",
      location: "",
      console: undefined,
      preferredClub: "",
      downloadMbps: "",
      uploadMbps: "",
      password: "",
      confirmPassword: "",
    },
  })

  // Stop the speed-test engine if the user leaves before it finishes.
  React.useEffect(() => {
    return () => {
      try {
        engineRef.current?.pause?.()
      } catch {
        // ignore
      }
    }
  }, [])

  const values = form.watch()
  const isLast = current === STEPS.length - 1

  const animateRating = (to: number) => {
    const from = 38
    const dur = 1100
    const start = performance.now()
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayRating(Math.round(from + (to - from) * eased))
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  const goNext = async () => {
    const valid = await form.trigger(STEPS[current].fields)
    if (valid) setCurrent((c) => Math.min(c + 1, STEPS.length - 1))
  }

  const goBack = () => setCurrent((c) => Math.max(c - 1, 0))

  // Runs Cloudflare's in-browser speed test and fills the Mbps fields.
  const runSpeedTest = async () => {
    setTestError(null)
    setTestDone(false)
    setTesting(true)
    try {
      const mod: any = await import("@cloudflare/speedtest")
      const SpeedTest = mod.default
      const engine: any = new SpeedTest({ autoStart: false })
      engineRef.current = engine

      engine.onFinish = (results: any) => {
        const summary = results?.getSummary?.() ?? {}
        const down = (Number(summary.download) || 0) / 1e6
        const up = (Number(summary.upload) || 0) / 1e6
        if (down > 0 || up > 0) {
          form.setValue("downloadMbps", down > 0 ? down.toFixed(1) : "", {
            shouldValidate: true,
            shouldTouch: true,
          })
          form.setValue("uploadMbps", up > 0 ? up.toFixed(1) : "", {
            shouldValidate: true,
            shouldTouch: true,
          })
          setTestDone(true)
        } else {
          setTestError("The test didn't return a result — enter your speeds manually below.")
        }
        setTesting(false)
      }

      engine.onError = () => {
        setTesting(false)
        setTestError("Couldn't run the speed test — enter your speeds manually below.")
      }

      engine.play()
    } catch {
      setTesting(false)
      setTestError("Couldn't load the speed test — enter your speeds manually below.")
    }
  }

  const submit = async (data: RegistrationFormData) => {
    setIsSubmitting(true)
    setMinting(true)
    setSubmitError(null)
    animateRating(rookieRating(data.name))
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.error || "Registration failed. Please try again.")
      setDone(true)
      toast.success("Card minted — confirm your email, then wait for admin approval.")
      setTimeout(() => router.push("/auth/login"), 1900)
    } catch (error) {
      setMinting(false)
      setDisplayRating(null)
      setIsSubmitting(false)
      setSubmitError(error instanceof Error ? error.message : "Registration failed.")
    }
  }

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (isLast) void form.handleSubmit(submit)()
    else void goNext()
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
        {/* ===== WIZARD ===== */}
        <div className="order-2 rounded-2xl border border-[#1E1E1E] bg-[#111111] p-6 md:p-8 lg:order-1">
          <StepProgress current={current} />

          <div className="mt-7">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">
              Step {current + 1} of {STEPS.length}
            </div>
            <h2 className="mt-1 font-heading text-2xl text-white">{STEPS[current].title}</h2>
            <p className="mt-1 text-sm text-[#8A8A8A]">
              {done ? "Card minted. Taking you to sign in…" : STEPS[current].blurb}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={onFormSubmit} className="mt-6">
              <div key={current} className="animate-fut-slide space-y-5">
                {current === 0 && (
                  <>
                    <TextField
                      control={form.control}
                      name="name"
                      label="Display Name"
                      placeholder="e.g. Marcus"
                      icon={User}
                      autoComplete="name"
                    />
                    <TextField
                      control={form.control}
                      name="username"
                      label="Username"
                      placeholder="Letters, numbers, underscores"
                      icon={AtSign}
                      autoComplete="username"
                    />
                    <TextField
                      control={form.control}
                      name="psnName"
                      label="Gamertag / PSN ID"
                      placeholder="Your in-game tag"
                      icon={Gamepad2}
                    />
                  </>
                )}

                {current === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="console"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={LABEL_CLASS}>Platform</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            {CONSOLE_OPTIONS.map((opt) => {
                              const active = field.value === opt.value
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => field.onChange(opt.value as RegistrationFormData["console"])}
                                  className={cn(
                                    "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-all",
                                    active
                                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                                      : "border-[#2A2A2A] bg-[#0F0F0F] text-[#8A8A8A] hover:border-[#3C3C3C] hover:text-white",
                                  )}
                                >
                                  {opt.value === "PC" ? (
                                    <Monitor className="h-5 w-5" />
                                  ) : (
                                    <Gamepad2 className="h-5 w-5" />
                                  )}
                                  <span className="font-heading text-sm">{opt.value}</span>
                                  <span className="text-center text-[9px] uppercase tracking-wider text-[#6C6C6C]">
                                    {opt.label}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                          <FormMessage className="text-xs text-rose-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredClub"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={LABEL_CLASS}>Preferred Club</FormLabel>
                          <FormControl>
                            <Combobox
                              options={FIFA_CLUBS}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Search 300+ clubs…"
                              searchPlaceholder="Search clubs…"
                              emptyText="No club found."
                              className="h-11 rounded-lg"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-400" />
                        </FormItem>
                      )}
                    />

                    <TextField
                      control={form.control}
                      name="location"
                      label="Location"
                      placeholder="City, Country"
                      icon={MapPin}
                    />
                  </>
                )}

                {current === 2 && (
                  <>
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                          <Wifi className="h-4 w-4" />
                        </span>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm leading-relaxed text-[#C8C8C8]">
                            Run a quick speed test right here — it fills in your numbers
                            automatically. It takes about 30 seconds.
                          </p>
                          <Button
                            type="button"
                            onClick={runSpeedTest}
                            disabled={testing}
                            className="h-9 font-heading text-black"
                            style={{ background: "linear-gradient(90deg,#f5c54a,#10b981)" }}
                          >
                            {testing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Testing your connection…
                              </>
                            ) : (
                              <>
                                <Gauge className="h-4 w-4" /> {testDone ? "Test again" : "Test my speed"}
                              </>
                            )}
                          </Button>
                          {testDone && !testing ? (
                            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                              <Check className="h-3.5 w-3.5" /> Speed test complete — numbers filled in
                              below.
                            </p>
                          ) : null}
                          {testError ? <p className="text-xs text-rose-400">{testError}</p> : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <TextField
                        control={form.control}
                        name="downloadMbps"
                        label="Download (Mbps)"
                        placeholder="e.g. 48"
                        icon={Download}
                        inputMode="decimal"
                      />
                      <TextField
                        control={form.control}
                        name="uploadMbps"
                        label="Upload (Mbps)"
                        placeholder="e.g. 12"
                        icon={Upload}
                        inputMode="decimal"
                      />
                    </div>

                    <p className="text-xs text-[#7A7A7A]">
                      The test runs on Cloudflare&apos;s network. You can also type your speeds in
                      manually.
                    </p>
                  </>
                )}

                {current === 3 && (
                  <>
                    <TextField
                      control={form.control}
                      name="email"
                      label="Email"
                      placeholder="you@example.com"
                      icon={Mail}
                      type="email"
                      autoComplete="email"
                    />
                    <PasswordField
                      control={form.control}
                      name="password"
                      label="Password"
                      placeholder="Create a secure password"
                      autoComplete="new-password"
                      withStrength
                    />
                    <PasswordField
                      control={form.control}
                      name="confirmPassword"
                      label="Confirm Password"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                  </>
                )}
              </div>

              {submitError ? (
                <div className="mt-6">
                  <ErrorBanner title="Registration failed" message={submitError} />
                </div>
              ) : null}

              <div className="mt-7 flex items-center gap-3">
                {current > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={goBack}
                    disabled={isSubmitting}
                    className="h-11 font-heading"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                )}
                {isLast ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting || done}
                    className="h-11 flex-1 font-heading text-black"
                    style={{ background: "linear-gradient(90deg,#f5c54a,#10b981)" }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Minting…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Mint my card
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={testing}
                    className="h-11 flex-1 font-heading"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <p className="mt-4 text-center text-xs text-[#7A7A7A]">
                Already registered?{" "}
                <Link href="/auth/login" className="font-bold text-emerald-400 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </Form>
        </div>

        {/* ===== LIVE CARD ===== */}
        <div className="order-1 lg:order-2">
          <div className="flex flex-col items-center gap-4 lg:sticky lg:top-24">
            <PlayerCard
              name={values.name}
              username={values.username}
              gamertag={values.psnName}
              club={values.preferredClub}
              consoleType={values.console}
              location={values.location}
              rating={displayRating}
              tierLabel={done ? "Day One" : "Rookie"}
              minted={done}
            />
            <p className="max-w-[270px] text-center text-xs leading-relaxed text-[#7A7A7A]">
              {done
                ? "Card minted. Confirm your email, then an admin will approve you."
                : minting
                  ? "Minting your card…"
                  : "Your card builds itself as you go. The rating reveals when you mint."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
