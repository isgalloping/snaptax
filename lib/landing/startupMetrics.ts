let startupLogged = false;

export function logStartupMarks(): void {
  if (process.env.NODE_ENV === "production") return;
  if (typeof performance === "undefined") return;
  if (startupLogged) return;
  startupLogged = true;

  const names = [
    "startup:shell",
    "startup:landing-paint",
    "startup:offline-home",
    "startup:home-ready",
  ] as const;

  const entries = names
    .map((name) => performance.getEntriesByName(name, "mark")[0])
    .filter((entry): entry is PerformanceMark => Boolean(entry));

  for (const entry of entries) {
    console.info(`[startup] ${entry.name} at ${entry.startTime.toFixed(0)}ms`);
  }

  const landing = performance.getEntriesByName(
    "startup:landing-paint",
    "mark",
  )[0];
  const home = performance.getEntriesByName("startup:home-ready", "mark")[0];

  if (landing) {
    console.info(
      `[startup] tap→landing paint ${landing.startTime.toFixed(0)}ms`,
    );
  }
  if (landing && home) {
    console.info(
      `[startup] landing→home ${(home.startTime - landing.startTime).toFixed(0)}ms`,
    );
  }
}
