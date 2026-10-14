import { emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";
import { hashAdminPassword } from "../src/modules/admin/admin-auth.js";

function readPassword() {
  if (!stdin.isTTY || !stdin.setRawMode) {
    return new Promise((resolve, reject) => {
      let value = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (chunk) => { value += chunk; });
      stdin.on("end", () => resolve(value.trimEnd()));
      stdin.on("error", reject);
    });
  }

  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write("Admin password (min 12 characters, input hidden): ");
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("keypress", onKeypress);
    };
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Password entry cancelled."));
      } else if (key.name === "return" || key.name === "enter") {
        cleanup();
        stdout.write("\n");
        resolve(value);
      } else if (key.name === "backspace") {
        value = value.slice(0, -1);
      } else if (character && !key.ctrl && !key.meta) {
        value += character;
      }
    };
    stdin.on("keypress", onKeypress);
  });
}

try {
  const password = await readPassword();
  if (password.length < 12) throw new Error("Use an admin password with at least 12 characters.");
  console.log(await hashAdminPassword(password));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
