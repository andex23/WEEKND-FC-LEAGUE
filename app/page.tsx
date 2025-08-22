import Link from "next/link"

export default function HomePage() {
  const user = null
  return (
    <div className="min-h-screen bg-white">
      <div className="container-5xl">
        <section className="section-pad section-pad-lg text-center">
          <h1 className="text-[36px] md:text-[44px] font-extrabold text-gray-900 mb-3">Weeknd FC League</h1>
          <p className="text-[16px] md:text-[20px] text-gray-600 mb-6">Compete every weekend. Report results. Climb the table.</p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Clubs Only</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Weekend Matches</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Round-Robin</span>
          </div>

          <div>
            <Link href={user ? "/dashboard" : "/auth/signup"} className="inline-block">
              <span className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-white text-sm font-semibold hover:bg-primary/90">{user ? "Go to Dashboard" : "Register"}</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
