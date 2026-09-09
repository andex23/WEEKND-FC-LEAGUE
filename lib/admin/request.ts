import { toast } from "sonner"

/** Only let the UI report success after the server accepts a mutation. */
export async function adminMutation(url: string, options: RequestInit): Promise<boolean> {
  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      throw new Error(
        result.error || result.message || "Could not save this change. Please try again.",
      )
    }
    return true
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Could not reach the server. Please try again.",
    )
    return false
  }
}
