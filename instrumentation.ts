export async function register() {
  const { applyEnvAliases } = await import("@/lib/server/env");
  applyEnvAliases();
  const { runStartupChecks } = await import("@/lib/server/startupChecks");
  runStartupChecks();
}
