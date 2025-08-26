export type MockRegistration = {
  id: string
  name: string
  console: string
  preferred_club?: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  location?: string
}

let memRegistrations: MockRegistration[] | null = null

export function getMemRegistrations(): MockRegistration[] | null {
  return memRegistrations
}

export function setMemRegistrations(items: MockRegistration[]) {
  memRegistrations = items
}

export function clearMemRegistrations() {
  memRegistrations = []
}

export function updateMemRegistrationStatus(id: string, status: MockRegistration["status"]) {
  if (!memRegistrations) return
  memRegistrations = memRegistrations.map((r) => (String(r.id) === String(id) ? { ...r, status } : r))
}

export function approveAllMemRegistrations() {
  if (!memRegistrations) return
  memRegistrations = memRegistrations.map((r) => ({ ...r, status: "approved" }))
}
