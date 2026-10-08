import assert from "node:assert/strict"
import test from "node:test"
import { registerHooks } from "node:module"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import path from "node:path"
import ts from "typescript"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

const root = fileURLToPath(new URL("../", import.meta.url))
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/link") return nextResolve("next/link.js", context)
    if (
      specifier.startsWith("@/") ||
      (specifier.startsWith(".") && context.parentURL?.startsWith("file:"))
    ) {
      const target = specifier.startsWith("@/")
        ? path.join(root, specifier.slice(2))
        : fileURLToPath(new URL(specifier, context.parentURL))
      for (const suffix of [".tsx", ".ts"])
        if (existsSync(target + suffix))
          return nextResolve(pathToFileURL(target + suffix).href, context)
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && /\.tsx$/.test(url)) {
      return {
        format: "module",
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: {
            jsx: ts.JsxEmit.ReactJSX,
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
        shortCircuit: true,
      }
    }
    return nextLoad(url, context)
  },
})
const { default: PlayerHub } = await import("../app/dashboard/_components/PlayerHub.tsx")
const player = {
  id: "me",
  status: "approved",
  name: "A Player",
  psn_id: "my-tag",
  console: "PS5",
  preferredClub: "Arsenal",
}
const render = (overrides = {}) => {
  return renderToStaticMarkup(
    React.createElement(PlayerHub, {
      player,
      entries: [],
      activeTournament: null,
      fixtures: [],
      standings: [],
      messages: [],
      messagesError: null,
      ...overrides,
    }),
  )
}

test("pre-season hub has one status, player details, checklist and honest season overview", () => {
  const html = render()
  for (const text of [
    "Waiting for a tournament invitation",
    "my-tag",
    "PS5",
    "Arsenal",
    "Player checklist",
    "Date TBC",
    "Organizer updates",
  ])
    assert.ok(html.includes(text), text)
  assert.ok(!html.includes("No tournament invitations yet"))
  assert.ok(!html.includes("No matches played yet"))
  assert.ok(!html.includes("Report your result"))
  assert.ok(!html.includes("League Table"))
})

test("notifications render as escaped text and failure does not pretend there are no updates", () => {
  const html = render({
    messages: [
      {
        id: "n",
        title: "Season news",
        body: "<script>bad()</script>\nSee you soon.",
        created_at: "2026-10-08T14:00:00Z",
      },
    ],
  })
  assert.ok(html.includes("Season news"))
  assert.ok(html.includes("&lt;script&gt;bad()&lt;/script&gt;"))
  assert.ok(!html.includes("<script>bad()"))
  const failed = render({ messagesError: "Updates are temporarily unavailable." })
  assert.ok(failed.includes("Updates are temporarily unavailable."))
  assert.ok(!failed.includes("No updates yet"))
})

test("private profile content is never rendered for unapproved states", () => {
  for (const status of ["pending", "rejected", undefined]) {
    const html = render({ player: { ...player, status } })
    assert.ok(!html.includes("my-tag"))
    assert.ok(!html.includes("Player checklist"))
    assert.ok(!html.includes("Approved"))
  }
})

test("scheduled match shows an opponent and honest date fallback; pending result has no report CTA", () => {
  const activeTournament = { id: "t", name: "Season", status: "ACTIVE" }
  const fixture = {
    id: "f",
    matchday: 1,
    status: "SCHEDULED",
    homePlayer: "Me",
    awayPlayer: "Opponent",
    isHome: true,
    scheduledDate: null,
    homeScore: null,
    awayScore: null,
  }
  const html = render({ activeTournament, fixtures: [fixture] })
  assert.ok(html.includes("You vs Opponent"))
  assert.ok(html.includes("Kick-off to be confirmed"))
  assert.ok(html.includes("Report your result"))
  const pending = render({ activeTournament, fixtures: [{ ...fixture, status: "PENDING" }] })
  assert.ok(pending.includes("Awaiting result confirmation"))
  assert.ok(!pending.includes("Report your result"))
  assert.ok(!pending.includes("View match report"))
})
