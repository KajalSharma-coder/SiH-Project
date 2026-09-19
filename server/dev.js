import http from "node:http";

const PORT = Number(process.env.PORT) || 5000;
const HEALTH_URL = `http://localhost:${PORT}/health`;
let shuttingDown = false;
let reuseMonitor = null;

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          resolve(res.statusCode === 200 && data.status === "ok");
        } catch {
          resolve(false);
        }
      });
    });

    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

async function startBackendServer() {
  if (shuttingDown) return;
  await import("./server.js");
}

async function reuseExistingBackend() {
  console.log(`FairTrade backend already running on port ${PORT}; reusing existing process.`);

  reuseMonitor = setInterval(async () => {
    if (shuttingDown) return;
    const healthy = await checkHealth();
    if (!healthy) {
      clearInterval(reuseMonitor);
      reuseMonitor = null;
      console.log(`Existing backend on port ${PORT} is no longer healthy; starting the backend.`);
      await startBackendServer();
    }
  }, 3000);
}

function shutdown() {
  shuttingDown = true;
  if (reuseMonitor) {
    clearInterval(reuseMonitor);
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

if (await checkHealth()) {
  await reuseExistingBackend();
} else {
  await startBackendServer();
}
