import { spawn } from "child_process";

export type CommandResult = {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

type RunCommandOptions = {
  input?: string;
  timeoutMs: number;
};

export function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, options.timeoutMs);

    const finish = (result: CommandResult) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.stdout!.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr!.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    if (options.input !== undefined) {
      child.stdin!.write(options.input);
    }

    child.stdin!.end();

    child.on("close", (code, signal) => {
      finish({
        code,
        signal,
        stdout,
        stderr,
        timedOut,
      });
    });
  });
}

export function parseTimeAndMemory(stderr: string) {
  const timeMatch = stderr.match(/__JUDGE_TIME__:(\d+(?:\.\d+)?)/);
  const memoryMatch = stderr.match(/__JUDGE_MEM__:(\d+)/);

  return {
    executionTimeMs: timeMatch
      ? Math.max(0, Math.round(Number.parseFloat(timeMatch[1]) * 1000))
      : null,
    memoryUsedKb: memoryMatch ? Number.parseInt(memoryMatch[1], 10) : null,
  };
}
