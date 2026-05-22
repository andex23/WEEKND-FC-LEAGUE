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
  Camera,
  Check,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Gamepad2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Sparkles,
  Upload,
  User,
  Wifi,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { PlayerCard } from "@/components/player-card"
import { registrationSchema, type RegistrationFormData } from "@/lib/validations"
import { FIFA_CLUBS, CONSOLE_OPTIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"

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

async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("read failed"))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("decode failed"))
    image.src = dataUrl
  })

  const maxWidth = 1280
  const scale = Math.min(1, maxWidth / img.width)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas unavailable")
  ctx.fillStyle = "#0A0A0A"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL("image/jpeg", 0.82)
}

function ScreenshotField({
  value,
  fileName,
  error,
  onPick,
  onClear,
}: {
  value: string | null
  fileName: string | null
  error: string | null
  onPick: (file: File) => void
  onClear: () => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={LABEL_CLASS}>Speed test screenshot</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6C6C6C]">Optional</span>
      </div>

      {value ? (
        <div className="overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#0F0F0F]">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Speed test result" className="max-h-52 w-full object-contain" />
            <button
              type="button"
              onClick={onClear}
              aria-label="Remove screenshot"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-rose-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {fileName ? (
            <div className="truncate border-t border-[#2A2A2A] px-3 py-2 text-xs text-[#8A8A8A]">{fileName}</div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-[#2A2A2A] bg-[#0F0F0F] px-4 py-6 text-center transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/[0.04]"
        >
          <Camera className="h-5 w-5 text-[#6C6C6C]" />
          <span className="text-sm font-medium text-[#C8C8C8]">Upload a screenshot of your result</span>
          <span className="text-xs text-[#6C6C6C]">PNG or JPG, up to 10 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          e.target.value = ""
        }}
      />

      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
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
  const [screenshot, setScreenshot] = React.useState<string | null>(null)
  const [screenshotName, setScreenshotName] = React.useState<string | null>(null)
  const [screenshotError, setScreenshotError] = React.useState<string | null>(null)

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

  const handleScreenshotPick = async (file: File) => {
    setScreenshotError(null)
    if (!file.type.startsWith("image/")) {
      setScreenshotError("Please choose an image file.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setScreenshotError("That image is over 10 MB — try a smaller one.")
      return
    }
    try {
      const dataUrl = await compressImage(file)
      setScreenshot(dataUrl)
      setScreenshotName(file.name)
    } catch {
      setScreenshotError("Couldn't process that image. Try a different one.")
    }
  }

  const clearScreenshot = () => {
    setScreenshot(null)
    setScreenshotName(null)
    setScreenshotError(null)
  }

  const submit = async (data: RegistrationFormData) => {
    setIsSubmitting(true)
    setMinting(true)
    animateRating(rookieRating(data.name))
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, speedTestScreenshot: screenshot ?? undefined }),
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
      toast.error(error instanceof Error ? error.message : "Registration failed.")
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
                        <div className="space-y-2.5">
                          <p className="text-sm leading-relaxed text-[#C8C8C8]">
                            Run a quick test on Speedtest.net, then enter your numbers below. A
                            screenshot helps us verify your connection.
                          </p>
                          <a
                            href="https://www.speedtest.net/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-emerald-400"
                          >
                            Run speed test <ExternalLink className="h-3.5 w-3.5" />
                          </a>
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

                    <ScreenshotField
                      value={screenshot}
                      fileName={screenshotName}
                      error={screenshotError}
                      onPick={handleScreenshotPick}
                      onClear={clearScreenshot}
                    />
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
                  <Button type="button" onClick={goNext} className="h-11 flex-1 font-heading">
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
