import { ipcCliComplete, ipcCliLog, ipcGetCliArgs } from "../desktop/ipc";
import { runCli } from "./runCli";
import { createTauriFilesystem } from "./tauriFilesystem";

function hookConsole(): void {
  const forward =
    (level: "log" | "error") =>
    (...args: unknown[]) => {
      const line = args
        .map((value) =>
          typeof value === "string" ? value : JSON.stringify(value)
        )
        .join(" ");
      void ipcCliLog(level, line);
    };

  console.log = forward("log");
  console.error = forward("error");
}

async function main(): Promise<void> {
  hookConsole();
  const args = await ipcGetCliArgs();
  const filesystem = createTauriFilesystem();
  const code = await runCli(args, filesystem);
  await ipcCliComplete(code);
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  try {
    await ipcCliComplete(1);
  } catch {
    // If the runtime is already tearing down, fall back to a hard exit code.
  }
});
