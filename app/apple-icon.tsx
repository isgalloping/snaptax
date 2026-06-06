import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#EAB308",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "8px solid #FFFFFF",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: "#000000",
            letterSpacing: 2,
          }}
        >
          1099
        </div>
      </div>
    ),
    { ...size },
  );
}
