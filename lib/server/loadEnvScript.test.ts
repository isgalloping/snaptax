import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, type TestContext } from "node:test";

const loadEnvScriptUrl = new URL("../../scripts/load-env.mjs", import.meta.url).href;

function runLoadEnv(
  cwd: string,
  keys: string[],
  env: NodeJS.ProcessEnv = {},
): Record<string, string | null> {
  const probe = `
    const keys = ${JSON.stringify(keys)};
    process.stdout.write(JSON.stringify(Object.fromEntries(
      keys.map((key) => [key, process.env[key] ?? null])
    )));
  `;
  const output = execFileSync(
    process.execPath,
    ["--import", loadEnvScriptUrl, "--eval", probe],
    {
      cwd,
      env: {
        PATH: process.env.PATH,
        ...env,
      },
      encoding: "utf8",
    },
  );
  return JSON.parse(output) as Record<string, string | null>;
}

function tempProject(t: TestContext): string {
  const cwd = mkdtempSync(join(tmpdir(), "snaptax-load-env-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

describe("scripts/load-env.mjs", () => {
  it("exposes only the SnapTax Paddle client token alias", (t) => {
    const cwd = tempProject(t);
    writeFileSync(
      join(cwd, ".env.local"),
      [
        "PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN=test_client_token",
        "PADDLE_PRICE_ID=pri_legacy",
        "PADDLE_SNAPTAX_PRICE_KEY=pri_legacy_key",
        "FOUNDER_LEVEL_DEFAULT=pri_default",
      ].join("\n"),
    );

    const result = runLoadEnv(cwd, [
      "NEXT_PUBLIC_PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN",
      "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
      "NEXT_PUBLIC_PADDLE_PRICE_ID",
    ]);

    assert.deepEqual(result, {
      NEXT_PUBLIC_PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN: "test_client_token",
      NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: null,
      NEXT_PUBLIC_PADDLE_PRICE_ID: null,
    });
  });

  it("does not map legacy Paddle public aliases into the SnapTax public token", (t) => {
    const cwd = tempProject(t);
    writeFileSync(
      join(cwd, ".env.local"),
      [
        "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=legacy_public_token",
        "PADDLE_PRICE_ID=pri_legacy",
        "PADDLE_SNAPTAX_PRICE_KEY=pri_legacy_key",
      ].join("\n"),
    );

    const result = runLoadEnv(cwd, [
      "NEXT_PUBLIC_PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN",
      "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
      "NEXT_PUBLIC_PADDLE_PRICE_ID",
    ]);

    assert.deepEqual(result, {
      NEXT_PUBLIC_PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN: null,
      NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: "legacy_public_token",
      NEXT_PUBLIC_PADDLE_PRICE_ID: null,
    });
  });

  it("keeps an explicit public Paddle client token instead of overwriting it", (t) => {
    const cwd = tempProject(t);

    const result = runLoadEnv(
      cwd,
      ["NEXT_PUBLIC_PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN"],
      {
        NEXT_PUBLIC_PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN: "explicit_public_token",
        PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN: "source_token",
      },
    );

    assert.deepEqual(result, {
      NEXT_PUBLIC_PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN: "explicit_public_token",
    });
  });
});
