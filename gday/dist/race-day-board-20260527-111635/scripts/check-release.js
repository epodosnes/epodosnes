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

const latestRelease = getLatestRelease();
check("Release zip exists", Boolean(latestRelease && fs.existsSync(latestRelease.zipPath)), latestRelease ? path.basename(latestRelease.zipPath) : "none");
check("Release manifest exists", Boolean(latestRelease && fs.existsSync(latestRelease.manifestPath)), latestRelease ? path.basename(latestRelease.dirPath) : "none");
if (latestRelease && fs.existsSync(latestRelease.manifestPath)) {
  const manifest = readJson(latestRelease.manifestPath);
  const releaseFiles = Array.isArray(manifest.files) ? manifest.files.map((file) => file.path) : [];
  check("Release manifest has files", releaseFiles.length > 0, `${releaseFiles.length} files`);
  check("Release manifest excludes backups", !releaseFiles.some((file) => file.startsWith("backups/")));
  check("Release manifest excludes incoming", !releaseFiles.some((file) => file.startsWith("data/incoming/")));
}

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

function getLatestRelease() {
  const distRoot = path.join(rootDir, "dist");
  if (!fs.existsSync(distRoot)) return null;
  const names = fs
    .readdirSync(distRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^race-day-board-\d{8}-\d{6}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .reverse();
  if (names.length === 0) return null;
  const name = names[0];
  return {
    dirPath: path.join(distRoot, name),
    zipPath: path.join(distRoot, `${name}.zip`),
    manifestPath: path.join(distRoot, name, "release-manifest.json"),
  };
}
