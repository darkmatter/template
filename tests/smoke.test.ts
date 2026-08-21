import assert from "node:assert/strict";
import { type ChildProcess, spawn } from "node:child_process";
import { resolve } from "node:path";
import { afterAll, beforeAll, test } from "vitest";

const port = 43000 + Math.floor(Math.random() * 1000);
const appDirectory =
  process.env.APP_DIRECTORY ?? resolve(process.cwd(), "apps/web");
const statusUrl = `http://127.0.0.1:${port}/api/status`;

let app: ChildProcess;

async function waitForStatus(): Promise<Response> {
  const deadline = Date.now() + 5_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(statusUrl);
      if (response.ok) return response;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("server did not become ready");
}

beforeAll(async () => {
  app = spawn("bun", [resolve(appDirectory, "src/server.ts")], {
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      APP_ENV: "test",
      DEMO_MESSAGE: "smoke-only",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  app.once("error", (error) => {
    throw error;
  });
  await waitForStatus();
});

afterAll(async () => {
  const exited = Promise.withResolvers<void>();
  app.once("exit", () => exited.resolve());
  app.kill("SIGTERM");
  await exited.promise;
});

test("the demo app serves its status API and front page", async () => {
  const status = await waitForStatus();
  assert.equal(status.status, 200);
  const payload = await status.json();
  assert.equal(payload.environment, "test");
  assert.equal(payload.demoMessageConfigured, true);

  const frontPage = await fetch(`http://127.0.0.1:${port}/`);
  assert.match(await frontPage.text(), /Ops monorepo demo/);
});
