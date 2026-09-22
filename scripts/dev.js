import { execFileSync, spawn } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8001";

const processes = [
  spawn(`${npmCmd} --prefix server run dev`, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PORT: process.env.PORT || "5000",
      ML_SERVICE_URL: mlServiceUrl,
    },
  }),
  spawn(`${npmCmd} run dev:frontend`, {
    stdio: "inherit",
    shell: true,
  }),
  spawn(`${npmCmd} run dev:ml`, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PORT: process.env.ML_PORT || "8001",
      ML_MODEL_PATH: process.env.ML_MODEL_PATH || "artifacts/tanmay_price_model.joblib",
    },
  }),
];

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      if (process.platform === "win32") {
        execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        child.kill(signal);
      }
    }
  }
}

for (const child of processes) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    if (code && code !== 0) {
      console.error(`A dev server exited with code ${code}.`);
      shutdown("SIGTERM");
      process.exit(code);
    }
    if (signal) {
      shutdown(signal);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
