import Link from "next/link"

export default function HomePage() {
  const user = null
  const disabled = true
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="container-5xl section-pad space-y-10">
        <section className="text-center">
          <h1 className="text-[36px] md:text-[44px] font-extrabold mb-3">Weekend FC League</h1>
          <p className="text-[16px] md:text-[18px] text-[#9E9E9E] mb-6">Compete every weekend. Report results. Climb the table.</p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="px-3 py-1 rounded-full text-sm border">Clubs Only</span>
            <span className="px-3 py-1 rounded-full text-sm border">Weekend Matches</span>
            <span className="px-3 py-1 rounded-full text-sm border">Round-Robin</span>
          </div>

          <div>
            <button aria-disabled={true} disabled className="inline-flex items-center rounded-md bg-[#00C853]/40 px-5 py-2.5 text-black/60 text-sm font-semibold cursor-not-allowed">
              {user ? "Go to Dashboard" : "Register"}
            </button>
          </div>
        </section>

        <section>
          <div className="text-center mb-8">
            <h2 className="text-[20px] md:text-[24px] font-bold">How it works</h2>
            <p className="text-sm text-[#9E9E9E]">Three simple steps to get started</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="border rounded-2xl p-5 text-center bg-[#141414]">
              <div className="text-2xl mb-2">⚽</div>
              <div className="font-semibold mb-1">Register</div>
              <div className="text-sm text-[#9E9E9E]">Pick your club and console</div>
            </div>
            <div className="border rounded-2xl p-5 text-center bg-[#141414]">
              <div className="text-2xl mb-2">🎮</div>
              <div className="font-semibold mb-1">Play</div>
              <div className="text-sm text-[#9E9E9E]">Weekend fixtures, round-robin format</div>
            </div>
            <div className="border rounded-2xl p-5 text-center bg-[#141414]">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-semibold mb-1">Climb</div>
              <div className="text-sm text-[#9E9E9E]">Report scores and climb the table</div>
            </div>
          </div>
          <div className="text-center mt-8">
            <span aria-disabled={true} className="text-sm font-semibold text-[#00C853]/60 cursor-not-allowed select-none">
              {user ? "Go to your dashboard" : "Create your player →"}
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
