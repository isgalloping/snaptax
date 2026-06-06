import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 400,
            height: 400,
            background: "#EAB308",
            borderRadius: 80,
            border: "20px solid #FFFFFF",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 120,
              height: 90,
              border: "12px solid #000000",
              borderRadius: 16,
              marginBottom: 24,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: "#000000",
                borderRadius: "50%",
                position: "absolute",
                bottom: -20,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#000000",
              letterSpacing: 4,
            }}
          >
            SNAP
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
