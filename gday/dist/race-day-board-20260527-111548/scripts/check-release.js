const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const checks = [];

const requiredFiles = [
  "index.html",
  "race-day.cmd",
  "src/styles.css",
  "src/sample-data.js",
  "data/events.csv",
  "data/events.json",
  "docs/quickstart.md",
  "docs/update-operations.md",
  "docs/release.md",
  "scripts/package-release.js",
  "scripts/check-release.js",
];

requiredFiles.forEach((relativePath) => {
  check(`Required file ${relativePath}`, fs.existsSync(path.join(rootDir, relativePath)));
});

const data = readJson(path.join(rootDir, "data", "events.json"));
check("Release data has events", Array.isArray(data.events) && data.events.length > 0, `${data.events?.length || 0} events`);
check("Release data has coverage", Array.isArray(data.coverage?.months), `${data.coverage?.months?.length || 0} months`);
check("Release runner has package command", readText("scripts/run.ps1").includes('"release"'));
check("Release docs mention zip", readText("docs/release.md").includes(".zip"));
check("Release package excludes backups", readText("scripts/package-release.js").includes('"backups"'));
check("Release package excludes incoming", readText("scripts/package-release.js").includes('"data/incoming"'));

const failed = checks.filter((item) => !item.ok);
checks.forEach((item) => {
  const suffix = item.detail ? ` (${item.detail})` : "";
  console.log(`${item.ok ? "OK" : "NG"} ${item.name}${suffix}`);
});

if (failed.length > 0) {
  console.error(`\nRelease check failed: ${failed.length} issue(s)`);
  process.exit(1);
}

console.log(`\nRelease check passed: ${checks.length} checks`);

function check(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}
