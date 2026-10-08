import assert from "node:assert/strict"
import test, { after } from "node:test"
import { registerHooks } from "node:module"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import path from "node:path"
import ts from "typescript"
import { JSDOM } from "jsdom"

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://preview.example.invalid/dashboard",
  pretendToBeVisual: true,
})
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "SVGElement",
  "Element",
  "Node",
  "NodeFilter",
  "MutationObserver",
  "Event",
  "CustomEvent",
  "KeyboardEvent",
  "MouseEvent",
  "FocusEvent",
])
  globalThis[key] = key === "window" ? dom.window : dom.window[key]
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const React = await import("react")
const { act } = React
const { createRoot } = await import("react-dom/client")
const browserErrors = []
dom.window.addEventListener("error", (event) => browserErrors.push(event.message))
after(() => {
  assert.deepEqual(browserErrors, [], "no uncaught DOM interaction errors")
  dom.window.close()
})

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
    if (specifier === "next/link")
      return {
        url:
          "data:text/javascript," +
          encodeURIComponent(
            "export default function Link(props){const {prefetch,replace,scroll,...rest}=props;return globalThis.__shellReact.createElement('a',rest)}",
          ),
        shortCircuit: true,
      }
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

globalThis.__shellReact = React
const { Navbar } = await import("../components/navbar.tsx")
const { default: PlayerHub } = await import("../app/dashboard/_components/PlayerHub.tsx")
globalThis.__playerShellPath = "/dashboard"
const fixturePlayer = {
  id: "test-player",
  status: "approved",
  name: "Test Player",
  psn_id: "test-gamertag",
  console: "PS5",
  preferredClub: "Arsenal",
  available: false,
  avatar_url: null,
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 20))
const mount = async (Component, props = {}) => {
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(React.createElement(Component, props))
    await tick()
  })
  return {
    container,
    render: async (next) => {
      await act(async () => {
        root.render(React.createElement(Component, next))
        await tick()
      })
    },
    close: async () => {
      await act(async () => {
        root.unmount()
        await tick()
      })
      container.remove()
    },
  }
}
const click = async (element) => {
  assert.ok(element, "control exists")
  await act(async () => {
    element.click()
    await tick()
  })
}
const stubProfile = () => {
  globalThis.fetch = async (url) =>
    Response.json(url.endsWith("profile") ? { player: fixturePlayer } : { messages: [] })
}

test("mobile Navigation to Settings closes back to the original hamburger and traps focus", async () => {
  stubProfile()
  const app = await mount(Navbar)
  try {
    const hamburger = document.querySelector('[aria-label="Open player navigation"]')
    hamburger.focus()
    await click(hamburger)
    let dialog = document.querySelector('[role="dialog"]')
    assert.ok(dialog)
    await click(dialog.querySelector(".fc-player-links button"))
    dialog = document.querySelector('[role="dialog"]')
    assert.match(dialog.textContent, /Match availability/)
    const first = dialog.querySelector('[aria-label="Close panel"]')
    const last = dialog.querySelector('a[href="/auth/forgot-password"]')
    last.focus()
    await act(async () => {
      last.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
      )
      await tick()
    })
    assert.equal(document.activeElement, first)
    await click(first)
    assert.equal(document.activeElement, hamburger)
  } finally {
    await app.close()
  }
})

test("dashboard photo follows refreshed profile changes and removal", async () => {
  const props = {
    player: { ...fixturePlayer, avatar_url: "https://example.invalid/old.png" },
    entries: [],
    activeTournament: null,
    fixtures: [],
    standings: [],
    messages: [],
    messagesError: null,
  }
  const app = await mount(PlayerHub, props)
  try {
    assert.equal(
      app.container.querySelector(".fc-hub-photo img").getAttribute("src"),
      "https://example.invalid/old.png",
    )
    await app.render({
      ...props,
      player: { ...props.player, avatar_url: "https://example.invalid/new.png" },
    })
    assert.equal(
      app.container.querySelector(".fc-hub-photo img").getAttribute("src"),
      "https://example.invalid/new.png",
    )
    await app.render({ ...props, player: { ...props.player, avatar_url: null } })
    assert.equal(app.container.querySelector(".fc-hub-photo img"), null)
  } finally {
    await app.close()
  }
})

test("settings save reflects real availability and revocation removes private profile content", async () => {
  let player = { ...fixturePlayer }
  let denied = false
  globalThis.fetch = async (url, options) => {
    if (denied) return Response.json({ error: "Access denied" }, { status: 403 })
    if (url.endsWith("availability")) {
      player = { ...player, ...JSON.parse(options.body) }
      return Response.json({ success: true })
    }
    return Response.json(url.endsWith("profile") ? { player } : { messages: [] })
  }
  const app = await mount(Navbar)
  try {
    await click(document.querySelector('[aria-label="Player navigation"] button'))
    let dialog = document.querySelector('[role="dialog"]')
    await click(dialog.querySelector('input[type="checkbox"]'))
    assert.match(dialog.textContent, /You’re marked as available to play/)
    denied = true
    await click(dialog.querySelector('input[type="checkbox"]'))
    dialog = document.querySelector('[role="dialog"]')
    assert.ok(!dialog.textContent.includes("test-gamertag"))
    assert.match(dialog.textContent, /account access|Access denied/)
  } finally {
    await app.close()
  }
})

test("avatar menu opens settings by keyboard and Escape restores the avatar trigger", async () => {
  stubProfile()
  const app = await mount(Navbar)
  try {
    const avatar = document.querySelector('[aria-label="Open player menu"]')
    avatar.focus()
    await act(async () => {
      avatar.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      )
      await tick()
    })
    const item = [...document.querySelectorAll('[role="menuitem"]')].find((el) =>
      el.textContent.includes("Profile & settings"),
    )
    assert.ok(item)
    await click(item)
    const dialog = document.querySelector('[role="dialog"]')
    assert.ok(dialog)
    assert.ok(dialog.contains(document.activeElement))
    await act(async () => {
      dialog.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      )
      await tick()
    })
    assert.equal(document.querySelector('[role="dialog"]'), null)
    assert.equal(document.activeElement, avatar)
    assert.notEqual(document.body.style.pointerEvents, "none")
  } finally {
    await app.close()
  }
})
