export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { applyEnvAliases } = await import("@/lib/server/env");
  applyEnvAliases();
  const { runStartupChecks } = await import("@/lib/server/startupChecks");
  runStartupChecks();
}
