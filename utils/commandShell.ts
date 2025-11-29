import { exec } from "child_process";

interface ShellOptions {
  cwd?: string;
  silent?: boolean; // 👈 novo
}

class ShellCommand {
  static run(command: string, options: ShellOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const { cwd, silent } = options;

      const execProcess = exec(
        command,
        { cwd },
        (error, stdout, stderr) => {
          if (error) {
            if (!silent) {
              console.error(`❌ Error executing command: ${command}`);
              console.error(stderr);
            }
            return reject(error);
          }

          if (!silent && stdout) {
            console.log(stdout);
          }

          resolve();
        }
      );

      // Only pipe logs if not silent
      if (!silent) {
        execProcess.stdout?.pipe(process.stdout);
        execProcess.stderr?.pipe(process.stderr);
      }
    });
  }
}

export { ShellCommand };