import { ImageResponse } from "next/og"
export const alt = "Weekend FC — online EA FC league, Friday to Sunday"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#111214",
        color: "#f5f5ef",
        padding: 70,
      }}
    >
      <div style={{ fontSize: 23, letterSpacing: 6, color: "#d7eda5" }}>
        THE ONLINE EA FC LEAGUE
      </div>
      <div style={{ fontSize: 126, fontWeight: 900, letterSpacing: -7, marginTop: 34 }}>
        WEEKEND FC
      </div>
      <div style={{ fontSize: 33, marginTop: 18 }}>Same game. Real rivalries.</div>
      <div
        style={{
          display: "flex",
          borderTop: "1px solid #42463d",
          width: "100%",
          justifyContent: "space-between",
          marginTop: 74,
          paddingTop: 26,
          color: "#d7eda5",
          fontSize: 23,
        }}
      >
        <span>FRIDAY — SUNDAY</span>
        <span>weekendfc.site</span>
      </div>
    </div>,
    size,
  )
}
