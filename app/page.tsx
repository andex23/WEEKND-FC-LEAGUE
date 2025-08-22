import Link from "next/link"
import { RegistrationForm } from "@/components/registration-form"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-16 text-center my-[-25px]">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-2">Weeknd FC League</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-4">FIFA 25</p>
          <p className="text-base text-gray-600 max-w-2xl mx-auto mb-8">
            Compete every weekend. Choose your club. Play your fixtures. Climb the table.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Clubs Only</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Weekend Matches</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Round-Robin</span>
          </div>
        </section>

        <section className="py-8 my-[-18px]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">⚽</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Register</h3>
              <p className="text-sm text-gray-600">Choose your club and join the league</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🎮</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Play</h3>
              <p className="text-sm text-gray-600">Complete your weekend fixtures</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🏆</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Compete</h3>
              <p className="text-sm text-gray-600">Climb the table and win the league</p>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-200 my-16"></div>

        <section className="py-16 my-[-39px]">
          <RegistrationForm />
        </section>

        <div className="border-t border-gray-200 my-16"></div>

        <section className="py-16 my-[-64px]">
          <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">League Rules</h3>
            <p className="text-gray-600 mb-4">
              Official FIFA 25 settings, 6-minute halves, no disconnection tolerance. Fair play and sportsmanship
              expected from all participants.
            </p>
            <Link
              href="/rules"
              className="inline-block border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              Read full rules →
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
