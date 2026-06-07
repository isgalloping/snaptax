export async function register() {
  const { applyEnvAliases } = await import("@/lib/server/env");
  applyEnvAliases();
}
