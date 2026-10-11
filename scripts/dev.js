import { spawn } from "node:child_process";

const root = process.cwd();
const children = [
  {
    name: "API",
    args: ["--env-file=backend/.env", "backend/server/http-server.js"],
  },
  {
    name: "Vite",
    args: ["node_modules/vite/bin/vite.js"],
  },
];

let shuttingDown = false;
const processes = children.map(({ name, args }) => {
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  child.on("error", (error) => {
    console.error(`${name} failed to start:`, error);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      if (code !== 0) console.error(`${name} stopped with ${signal || `exit code ${code}`}.`);
      shutdown(code || (signal ? 1 : 0));
    }
  });

  return child;
});

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
