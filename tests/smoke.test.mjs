import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import { resolve } from "node:path";

test("the demo app serves its status API and front page", async () => {
  const port = 43000 + Math.floor(Math.random() * 1000);
  const appDirectory = process.env.APP_DIRECTORY ?? resolve(process.cwd(), "apps/web");
  const app = spawn(process.execPath, [resolve(appDirectory, "server.mjs")], {
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), APP_ENV: "test" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  await new Promise((resolveStartup, rejectStartup) => {
    const timeout = setTimeout(() => rejectStartup(new Error("server did not start")), 5_000);
    app.once("error", (error) => {
      clearTimeout(timeout);
      rejectStartup(error);
    });
    app.stdout.once("data", () => {
      clearTimeout(timeout);
      resolveStartup();
    });
  });

  try {
    const status = await fetch(`http://127.0.0.1:${port}/api/status`);
    assert.equal(status.status, 200);
    assert.equal((await status.json()).environment, "test");

    const frontPage = await fetch(`http://127.0.0.1:${port}/`);
    assert.match(await frontPage.text(), /Ops monorepo demo/);
  } finally {
    app.kill("SIGTERM");
    await new Promise((resolveExit) => app.once("exit", resolveExit));
  }
});
