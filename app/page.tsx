import Link from "next/link"

export default function HomePage() {
  const user = null
  return (
    <div className="min-h-screen bg-white">
      <div className="container-5xl">
        <section className="section-pad section-pad-lg text-center">
          <h1 className="text-[36px] md:text-[44px] font-extrabold text-gray-900 mb-3">Weekend FC League</h1>
          <p className="text-[16px] md:text-[20px] text-gray-600 mb-6">Compete every weekend. Report results. Climb the table.</p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Clubs Only</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Weekend Matches</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Round-Robin</span>
          </div>

          <div>
            <Link href={user ? "/dashboard" : "/register"} className="inline-block">
              <span className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-white text-sm font-semibold hover:bg-primary/90">{user ? "Go to Dashboard" : "Register"}</span>
            </Link>
          </div>
        </section>

        <section className="section-pad">
          <div className="text-center mb-8">
            <h2 className="text-[20px] md:text-[24px] font-bold text-gray-900">How it works</h2>
            <p className="text-sm text-gray-600">Three simple steps to get started</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="border rounded-md p-5 text-center">
              <div className="text-2xl mb-2">⚽</div>
              <div className="font-semibold mb-1">Register</div>
              <div className="text-sm text-gray-600">Pick your club and console</div>
            </div>
            <div className="border rounded-md p-5 text-center">
              <div className="text-2xl mb-2">🎮</div>
              <div className="font-semibold mb-1">Play</div>
              <div className="text-sm text-gray-600">Weekend fixtures, round-robin format</div>
            </div>
            <div className="border rounded-md p-5 text-center">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-semibold mb-1">Climb</div>
              <div className="text-sm text-gray-600">Report scores and climb the table</div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href={user ? "/dashboard" : "/register"} className="text-sm font-semibold text-primary hover:underline">
              {user ? "Go to your dashboard" : "Create your player →"}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
