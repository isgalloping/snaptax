import { flag } from "flags/next";

export type LandingVariant = "data_stream" | "simple_using";

export const landingVariant = flag<LandingVariant>({
  key: "landing-variant",
  description: "Cold-start landing UI A/B variant",
  options: ["data_stream", "simple_using"],
  defaultValue: "simple_using",
  decide(): LandingVariant {
    return Math.random() < 0.5 ? "data_stream" : "simple_using";
  },
});
