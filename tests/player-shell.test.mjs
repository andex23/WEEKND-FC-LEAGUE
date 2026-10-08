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
    if (specifier === "next/navigation")
      return {
        url:
          "data:text/javascript," +
          encodeURIComponent(
            "export const usePathname=()=>globalThis.__playerShellPath;export const useRouter=()=>({replace(){},refresh(){}});",
          ),
        shortCircuit: true,
      }
    if (specifier === "next/image")
      return {
        url:
          "data:text/javascript," +
          encodeURIComponent("export default function Image(){return null}"),
        shortCircuit: true,
      }
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

const { Navbar } = await import("../components/navbar.tsx")
const { SiteFooter } = await import("../components/site-footer.tsx")
const renderAt = (Component, path) => {
  globalThis.__playerShellPath = path
  return renderToStaticMarkup(React.createElement(Component))
}

test("protected player routes use dedicated player navigation and no public footer", () => {
  for (const path of ["/dashboard", "/dashboard/settings", "/report", "/refer"]) {
    const html = renderAt(Navbar, path)
    assert.ok(html.includes("Player navigation"), path)
    assert.ok(!html.includes("Main navigation"), path)
    assert.ok(!html.includes("Join the club"), path)
    assert.ok(html.includes("Open player menu"), path)
    assert.ok(html.includes("Notifications"), path)
    assert.equal(renderAt(SiteFooter, path), "", path)
  }
})

test("public pages and similarly named paths retain their public navigation and footer", () => {
  for (const path of [
    "/",
    "/rules",
    "/fixtures",
    "/auth/login",
    "/dashboard-help",
    "/reporting",
    "/referral-info",
  ]) {
    assert.ok(renderAt(Navbar, path).includes("Main navigation"), path)
    assert.ok(renderAt(SiteFooter, path).includes("Footer navigation"), path)
  }
})

test("player navigation identifies the current protected route", () => {
  const html = renderAt(Navbar, "/report")
  assert.match(
    html,
    /aria-current="page"[^>]*href="\/report"|href="\/report"[^>]*aria-current="page"/,
  )
})

const shell = await import("../components/player-navigation.tsx")

test("settings expose existing profile and availability capabilities without fabricated account controls", () => {
  assert.equal(typeof shell.PlayerSettings, "function")
  const html = renderToStaticMarkup(
    React.createElement(shell.PlayerSettings, {
      player: {
        id: "me",
        name: "Player",
        psn_id: "gamertag",
        console: "PS5",
        status: "approved",
        available: true,
      },
      saving: false,
      onAvailabilityChange() {},
      onPhotoChange() {},
    }),
  )
  for (const text of [
    "Profile photo",
    "gamertag",
    "PS5",
    "Available for matches",
    "Reset password",
  ])
    assert.ok(html.includes(text), text)
  assert.ok(html.includes('href="/auth/forgot-password"'))
  assert.ok(!html.includes('type="password"'))
  assert.ok(!html.includes("Delete account"))
})
test("notification panel renders actual escaped messages and keeps failures distinct from empty", () => {
  assert.equal(typeof shell.PlayerNotifications, "function")
  const html = renderToStaticMarkup(
    React.createElement(shell.PlayerNotifications, {
      messages: [
        {
          id: "one",
          title: "League update",
          body: "<script>bad()</script>",
          created_at: "2026-10-08T12:00:00Z",
        },
      ],
      error: null,
      loading: false,
    }),
  )
  assert.ok(html.includes("League update"))
  assert.ok(html.includes("&lt;script&gt;bad()&lt;/script&gt;"))
  const failed = renderToStaticMarkup(
    React.createElement(shell.PlayerNotifications, {
      messages: [],
      error: "Notifications unavailable",
      loading: false,
    }),
  )
  assert.ok(failed.includes("Notifications unavailable"))
  assert.ok(!failed.includes("No notifications yet"))
})
