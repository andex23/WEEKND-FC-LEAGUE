"use client"

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import * as Dropdown from "@radix-ui/react-dropdown-menu"
import {
  Bell,
  ChevronDown,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Settings,
  User,
  UserPlus,
  X,
  ArrowUpRight,
} from "lucide-react"
import { AvatarUpload } from "@/components/avatar-upload"
import { createClient } from "@/lib/supabase/client"
import { seasonDate, type HubPlayer, type HubMessage } from "@/lib/dashboard/player-hub"
import {
  loadPlayerShell,
  panelFocusTarget,
  savePlayerAvailability,
  type PlayerShellData,
} from "@/lib/dashboard/player-shell"

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/report", label: "Match reports", icon: ClipboardList },
  { href: "/refer", label: "Invite a friend", icon: UserPlus },
]
type Panel = "navigation" | "notifications" | "settings"

export function PlayerNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [data, setData] = useState<PlayerShellData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const request = useRef<AbortController | null>(null)
  const busy = useRef(false)
  const returnFocus = useRef<HTMLElement | null>(null)
  const avatarButton = useRef<HTMLButtonElement | null>(null)
  const openingPanel = useRef(false)
  const pendingMenuPanel = useRef<Panel | null>(null)

  const refresh = useCallback(async () => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    try {
      const result = await loadPlayerShell(fetch, controller.signal)
      if (request.current !== controller) return
      setData(result)
      setError(null)
    } catch (cause) {
      if (request.current !== controller) return
      setData(null)
      setError(cause instanceof Error ? cause.message : "Your player details are unavailable.")
    } finally {
      window.clearTimeout(timeout)
      if (request.current === controller) setLoading(false)
    }
  }, [])
  useEffect(() => {
    refresh()
    const update = () => {
      if (!document.hidden) refresh()
    }
    const timer = window.setInterval(update, 30000)
    window.addEventListener("focus", update)
    window.addEventListener("weekend-player-profile-changed", update)
    return () => {
      const previous = request.current
      request.current = null
      previous?.abort()
      window.clearInterval(timer)
      window.removeEventListener("focus", update)
      window.removeEventListener("weekend-player-profile-changed", update)
    }
  }, [refresh])
  useEffect(() => {
    setPanel(null)
    setMenuOpen(false)
  }, [pathname])
  const openPanel = (next: Panel, trigger: HTMLElement | null) => {
    returnFocus.current = panelFocusTarget(panel !== null, returnFocus.current, trigger)
    openingPanel.current = true
    setPanel(next)
  }
  const settings = (event: MouseEvent<HTMLButtonElement>) =>
    openPanel("settings", event.currentTarget)
  const photoChanged = (url: string | null) => {
    setData((previous) =>
      previous ? { ...previous, player: { ...previous.player, avatar_url: url } } : previous,
    )
    window.dispatchEvent(new Event("weekend-player-profile-changed"))
  }
  const updateAvailability = async (available: boolean) => {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    setSaveError(null)
    try {
      await savePlayerAvailability(available)
      setData((previous) =>
        previous ? { ...previous, player: { ...previous.player, available } } : previous,
      )
      window.dispatchEvent(new Event("weekend-player-profile-changed"))
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Could not save availability.")
      await refresh()
    } finally {
      busy.current = false
      setSaving(false)
    }
  }
  const logout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    setSaveError(null)
    try {
      const { error } = await createClient().auth.signOut()
      if (error) throw error
      setData(null)
      router.replace("/auth/login")
      router.refresh()
    } catch {
      setSaveError("Couldn’t sign out. Please try again.")
    } finally {
      setLoggingOut(false)
    }
  }
  const navigation = (mobile = false) => (
    <nav
      aria-label={mobile ? "Mobile player navigation" : "Player navigation"}
      className="fc-player-links"
    >
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={
            pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined
          }
          onClick={() => setPanel(null)}
        >
          <link.icon size={18} aria-hidden="true" />
          {link.label}
        </Link>
      ))}
      <button onClick={settings}>
        <Settings size={18} aria-hidden="true" />
        Settings
      </button>
    </nav>
  )
  return (
    <Dialog.Root
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) setPanel(null)
      }}
    >
      <div className="fc-player-shell">
        <aside className="fc-player-sidebar">
          <Link href="/dashboard" className="fc-player-brand">
            <img src="/logo.png" alt="" width={36} height={36} />
            <span>
              Weekend FC<small>Player space</small>
            </span>
          </Link>
          {navigation()}
          <Link className="fc-player-exit" href="/">
            League website
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </aside>
        <header className="fc-player-topbar">
          <div className="fc-player-topbar-title">
            <button
              className="fc-player-mobile-toggle"
              aria-label="Open player navigation"
              aria-haspopup="dialog"
              aria-expanded={panel === "navigation"}
              onClick={(event) => openPanel("navigation", event.currentTarget)}
            >
              <Menu size={21} />
            </button>
            <span>
              {LINKS.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
                ?.label || "Player space"}
            </span>
          </div>
          <div className="fc-player-topbar-actions">
            <button
              className="fc-player-icon-button"
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded={panel === "notifications"}
              onClick={(event) => openPanel("notifications", event.currentTarget)}
            >
              <Bell size={20} aria-hidden="true" />
              {data && data.messages.length > 0 && (
                <span
                  className="fc-player-notification-count"
                  aria-label={`${data.messages.length} recent notifications`}
                >
                  {data.messages.length}
                </span>
              )}
            </button>
            <Dropdown.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Dropdown.Trigger asChild>
                <button
                  ref={avatarButton}
                  className="fc-player-avatar-button"
                  aria-label="Open player menu"
                >
                  <span className="fc-player-avatar">
                    {data?.player.avatar_url ? (
                      <img src={data.player.avatar_url} alt="" />
                    ) : (
                      <User size={20} aria-hidden="true" />
                    )}
                  </span>
                  <span className="fc-player-menu-name">{data?.player.name || "Your account"}</span>
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content
                  className="fc-player-dropdown"
                  align="end"
                  sideOffset={12}
                  onCloseAutoFocus={(event) => {
                    if (openingPanel.current) event.preventDefault()
                    const next = pendingMenuPanel.current
                    pendingMenuPanel.current = null
                    if (next) openPanel(next, avatarButton.current)
                  }}
                >
                  <Dropdown.Label className="fc-player-dropdown-label">
                    {data?.player.name || "Player account"}
                  </Dropdown.Label>
                  <Dropdown.Item
                    onSelect={() => {
                      pendingMenuPanel.current = "settings"
                      openingPanel.current = true
                    }}
                  >
                    <Settings size={16} />
                    Profile &amp; settings
                  </Dropdown.Item>
                  <Dropdown.Item asChild>
                    <Link href="/dashboard">Your dashboard</Link>
                  </Dropdown.Item>
                  <Dropdown.Separator />
                  <Dropdown.Item disabled={loggingOut} onSelect={() => logout()}>
                    <LogOut size={16} />
                    {loggingOut ? "Signing out…" : "Sign out"}
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </div>
        </header>
        {saveError && !panel && (
          <p className="fc-player-shell-alert" role="alert">
            {saveError}
          </p>
        )}
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fc-player-panel-overlay" />
        <Dialog.Content
          className={`fc-player-panel ${panel === "navigation" ? "is-navigation" : ""}`}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            openingPanel.current = false
            returnFocus.current?.focus()
          }}
        >
          <div className="fc-player-panel-heading">
            <Dialog.Title>
              {panel === "navigation"
                ? "Player navigation"
                : panel === "notifications"
                  ? "Notifications"
                  : "Settings"}
            </Dialog.Title>
            <Dialog.Close className="fc-player-icon-button" aria-label="Close panel">
              <X size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="fc-player-panel-description">
            {panel === "navigation"
              ? "Your Weekend FC workspace."
              : panel === "notifications"
                ? "Latest messages from your league organizer."
                : "Manage your player profile and match availability."}
          </Dialog.Description>
          {panel === "navigation" ? (
            navigation(true)
          ) : loading ? (
            <p role="status">Loading your player details…</p>
          ) : error ? (
            <div role="alert">
              <p>{error}</p>
              <button className="fc-button" onClick={() => refresh()}>
                Try again
              </button>
              <Link href="/auth/login?next=/dashboard" className="fc-text-link">
                Sign in
              </Link>
            </div>
          ) : panel === "notifications" ? (
            <PlayerNotifications
              messages={data?.messages || []}
              error={data?.notificationsError || null}
              loading={false}
            />
          ) : data?.player ? (
            <PlayerSettings
              player={data.player}
              saving={saving}
              onAvailabilityChange={updateAvailability}
              onPhotoChange={photoChanged}
            />
          ) : null}
          {saveError && (
            <p className="fc-player-settings-error" role="alert">
              {saveError}
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function PlayerNotifications({
  messages,
  error,
  loading,
}: {
  messages: HubMessage[]
  error: string | null
  loading: boolean
}) {
  if (loading) return <p role="status">Loading notifications…</p>
  if (error) return <p role="status">{error}</p>
  if (!messages.length)
    return (
      <div className="fc-player-empty">
        <Bell size={26} aria-hidden="true" />
        <h3>No notifications yet</h3>
        <p>Your organizer’s messages will appear here.</p>
      </div>
    )
  return (
    <ul className="fc-player-notifications">
      {messages.map((message) => (
        <li key={message.id}>
          <time
            dateTime={Number.isNaN(Date.parse(message.created_at)) ? undefined : message.created_at}
          >
            {seasonDate(message.created_at)}
          </time>
          <h3>{message.title}</h3>
          <p>{message.body}</p>
        </li>
      ))}
    </ul>
  )
}

export function PlayerSettings({
  player,
  saving,
  onAvailabilityChange,
  onPhotoChange,
}: {
  player: HubPlayer
  saving: boolean
  onAvailabilityChange: (available: boolean) => void
  onPhotoChange: (url: string | null) => void
}) {
  return (
    <div className="fc-player-settings">
      <section>
        <h3>Profile photo</h3>
        <AvatarUpload
          key={`${player.id}:${player.avatar_url || "no-photo"}`}
          userId={player.id}
          initialUrl={player.avatar_url}
          onChange={onPhotoChange}
        />
        <p>Your photo appears on your public player profile.</p>
      </section>
      <section>
        <h3>Player details</h3>
        <dl>
          <div>
            <dt>Name</dt>
            <dd>{player.name || "Not added"}</dd>
          </div>
          <div>
            <dt>Gamertag</dt>
            <dd>{player.psn_id || "Not added"}</dd>
          </div>
          <div>
            <dt>Console</dt>
            <dd>{player.console || "Not added"}</dd>
          </div>
        </dl>
        <p>
          Contact an organizer to change these registration details. Choose your tournament club
          when accepting an invitation.
        </p>
      </section>
      <section>
        <h3>Match availability</h3>
        <label className="fc-player-availability">
          <input
            type="checkbox"
            checked={player.available === true}
            disabled={saving}
            onChange={(event) => onAvailabilityChange(event.target.checked)}
          />
          <span>Available for matches</span>
        </label>
        <p role="status">
          {saving
            ? "Saving availability…"
            : player.available === true
              ? "You’re marked as available to play."
              : player.available === false
                ? "You’re marked as unavailable to play."
                : "Your availability hasn’t been set yet."}
        </p>
        <p>This updates your availability; it doesn’t cancel a scheduled match.</p>
      </section>
      <section>
        <h3>Account</h3>
        <Link href="/auth/forgot-password" className="fc-text-link">
          Reset password
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
        <p>We’ll use the existing email reset flow to help you change your password securely.</p>
      </section>
    </div>
  )
}
