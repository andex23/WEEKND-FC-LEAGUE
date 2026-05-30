"use client"

import { useRef, useState } from "react"
import { Camera, Loader2, Trash2, User } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

interface AvatarUploadProps {
  userId: string
  initialUrl?: string | null
  onChange?: (url: string | null) => void
  className?: string
}

export function AvatarUpload({ userId, initialUrl, onChange, className }: AvatarUploadProps) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null)
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!ALLOWED_MIME.has(file.type)) {
      toast.error("Use a JPEG, PNG, or WebP image.")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 2 MB or smaller.")
      return
    }

    setBusy("upload")
    const supabase = createClient()
    const ext = EXT_BY_MIME[file.type] || "jpg"
    // Owner-folder convention enforced by the storage RLS policy.
    const path = `${userId}/avatar-${Date.now()}.${ext}`

    try {
      const { error: upErr } = await supabase.storage
        .from("player-avatars")
        .upload(path, file, { contentType: file.type, upsert: true })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from("player-avatars").getPublicUrl(path)
      const publicUrl = pub.publicUrl

      const res = await fetch("/api/player/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Failed to save avatar")
      }

      setUrl(publicUrl)
      onChange?.(publicUrl)
      toast.success("Profile picture updated.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.")
    } finally {
      setBusy(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleRemove() {
    setBusy("remove")
    try {
      const res = await fetch("/api/player/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: null }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Failed to remove avatar")
      }
      setUrl(null)
      onChange?.(null)
      toast.success("Profile picture removed.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy !== null}
        className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#2A2A2A] bg-[#0F0F0F] text-[#5C5C5C] transition-colors hover:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Change profile picture"
      >
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-8 w-8" aria-hidden />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
          {busy === "upload" ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </span>
      </button>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy !== null}
          className="text-left text-xs font-bold uppercase tracking-wider text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-60"
        >
          {url ? "Change photo" : "Upload photo"}
        </button>
        {url && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy !== null}
            className="inline-flex items-center gap-1 text-left text-[11px] text-[#7A7A7A] transition-colors hover:text-rose-300 disabled:opacity-60"
          >
            {busy === "remove" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Remove
          </button>
        )}
        <span className="text-[10px] text-[#5C5C5C]">JPEG, PNG or WebP · 2 MB max</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
    </div>
  )
}
