const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(process.cwd());
const portIndex = process.argv.indexOf("--port");
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4173;

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".csv", "text/csv; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jfif", "image/jpeg"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"]
]);

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
  const relativePath = pathname.replace(/^\/+/, "") || "index.html";
  const candidate = path.resolve(root, relativePath);
  const withinRoot = candidate === root || candidate.startsWith(root + path.sep);
  return withinRoot ? candidate : null;
}

const server = http.createServer((request, response) => {
  let filePath;
  try {
    filePath = resolveRequestPath(request.url || "/");
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }
  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    if (fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  fs.readFile(filePath, (error, body) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream"
    });
    response.end(body);
  });
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Characterization server listening on http://127.0.0.1:${port}\n`);
});

server.on("error", (error) => {
  process.stderr.write(`Characterization server error: ${error.message}\n`);
  process.exit(1);
});

let closing = false;
function close() {
  if (closing) return;
  closing = true;

  const forceCloseTimer = setTimeout(() => {
    server.closeAllConnections();
    process.exit(1);
  }, 5_000);
  forceCloseTimer.unref();

  server.close((error) => {
    clearTimeout(forceCloseTimer);
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGINT", close);
process.on("SIGTERM", close);
