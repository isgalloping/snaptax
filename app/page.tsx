import { StartupShell } from "@/components/landing/StartupShell";
import { resolveLandingVariant } from "@/lib/landing/resolveLandingVariant";

export default async function Home() {
  const landingVariant = await resolveLandingVariant();
  return <StartupShell landingVariant={landingVariant} />;
}
