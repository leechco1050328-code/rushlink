import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          color: "white",
          background:
            "linear-gradient(135deg, #08141c 0%, #17324a 38%, #6c3c2b 72%, #f08a2b 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{ fontSize: 34, letterSpacing: 8 }}>RUSHLINK</div>
            <div style={{ fontSize: 24, opacity: 0.78 }}>
              Street Fighter 6 Community
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              padding: "12px 22px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.08)",
            }}
          >
            Match / Learn / Review
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 820 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 108,
              lineHeight: 0.92,
              letterSpacing: 8,
            }}
          >
            FIND YOUR
            <br />
            NEXT SET
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.5, opacity: 0.82 }}>
            対戦募集、MR帯の練習相手探し、リプレイIDでのコーチング相談をひとつにつなぐ。
          </div>
        </div>
      </div>
    ),
    size,
  );
}
