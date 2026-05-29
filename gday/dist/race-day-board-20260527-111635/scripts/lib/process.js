const { spawnSync } = require("child_process");

function runNodeScript(nodePath, args, options = {}) {
  const startedAt = new Date();
  const result = spawnSync(nodePath, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: "pipe",
  });
  const finishedAt = new Date();

  return {
    args,
    command: [nodePath, ...args].join(" "),
    status: Number.isInteger(result.status) ? result.status : 1,
    ok: result.status === 0,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error ? String(result.error.message || result.error) : "",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    elapsedMs: finishedAt.getTime() - startedAt.getTime(),
  };
}

function printStepResult(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
    if (!result.stdout.endsWith("\n")) process.stdout.write("\n");
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
    if (!result.stderr.endsWith("\n")) process.stderr.write("\n");
  }
  if (result.error) {
    process.stderr.write(`${result.error}\n`);
  }
}

module.exports = {
  printStepResult,
  runNodeScript,
};
