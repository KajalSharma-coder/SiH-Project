import { execFileSync, spawn } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const processes = [
  spawn(`${npmCmd} --prefix server run dev`, {
    stdio: "inherit",
    shell: true,
  }),
  spawn(`${npmCmd} run dev:frontend`, {
    stdio: "inherit",
    shell: true,
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
