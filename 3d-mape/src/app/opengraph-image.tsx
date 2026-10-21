import { ImageResponse } from "next/og";

import { BrandMark } from "@/app/brand-mark";

export const alt = "Crna Gora 3D mapa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          background: "#121612",
        }}
      >
        <BrandMark size={168} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 650,
              color: "#fffaf3",
              letterSpacing: -2,
            }}
          >
            Crna Gora
          </div>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#a8a29e",
            }}
          >
            3D mapa
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
