export function BackgroundVideo() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <video className="h-full w-full object-cover" autoPlay muted loop playsInline preload="auto">
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      {/* Light tint keeps the footage clearly visible; the bottom fade grounds text. */}
      <div className="absolute inset-0 bg-[#0A0A0A]/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
    </div>
  )
}
