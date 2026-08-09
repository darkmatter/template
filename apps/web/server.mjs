import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const appEnvironment = process.env.APP_ENV ?? "development";
const release = process.env.APP_RELEASE ?? "local";
const publicDirectory = resolve(fileURLToPath(new URL("./public", import.meta.url)));
let requestCount = 0;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(response, status, body, contentType) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": contentType
  });
  response.end(body);
}

async function serveAsset(pathname, response) {
  const assetName = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const assetPath = resolve(publicDirectory, assetName);

  if (!assetPath.startsWith(`${publicDirectory}${sep}`)) {
    send(response, 404, "Not found\n", "text/plain; charset=utf-8");
    return;
  }

  try {
    const asset = await readFile(assetPath);
    send(response, 200, asset, contentTypes[extname(assetPath)] ?? "application/octet-stream");
  } catch {
    send(response, 404, "Not found\n", "text/plain; charset=utf-8");
  }
}

const server = createServer(async (request, response) => {
  requestCount += 1;
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (url.pathname === "/api/status") {
    send(response, 200, JSON.stringify({
      environment: appEnvironment,
      release,
      requestCount,
      status: "ok",
      timestamp: new Date().toISOString()
    }), "application/json; charset=utf-8");
    return;
  }

  if (url.pathname === "/api/metrics") {
    send(response, 200, [
      "# HELP ops_demo_requests_total Requests handled by the demo application.",
      "# TYPE ops_demo_requests_total counter",
      `ops_demo_requests_total ${requestCount}`,
      ""
    ].join("\n"), "text/plain; version=0.0.4; charset=utf-8");
    return;
  }

  await serveAsset(url.pathname, response);
});

server.listen(port, host, () => {
  console.log(`ops-demo listening on http://${host}:${port} (${appEnvironment}, ${release})`);
});
