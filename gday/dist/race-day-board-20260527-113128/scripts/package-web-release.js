const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const distRoot = path.join(rootDir, "dist");
const releaseId = `race-day-board-web-${timestamp(new Date())}`;
const releaseDir = path.join(distRoot, releaseId);
const zipPath = path.join(distRoot, `${releaseId}.zip`);
const manifestPath = path.join(releaseDir, "web-release-manifest.json");

const includeFiles = [
  "index.html",
  "src/styles.css",
  "src/sample-data.js",
  "data/events.json",
  "docs/coverage-report.md",
  "docs/day-report.md",
  "docs/dashboard.md",
  "docs/release.md",
];

fs.mkdirSync(releaseDir, { recursive: true });

const manifest = {
  releaseId,
  createdAt: new Date().toISOString(),
  mode: "web-static",
  files: [],
  excluded: [
    "race-day.cmd",
    "scripts",
    "backups",
    "data/incoming",
    "data/sources",
    "dist",
  ],
};

includeFiles.forEach(copyFileIfExists);
writeManifest();
writeZip();

console.log(`Wrote ${path.relative(rootDir, releaseDir)}`);
console.log(`Wrote ${path.relative(rootDir, zipPath)}`);
console.log(`Files: ${manifest.files.length}`);

function copyFileIfExists(relativePath) {
  const sourcePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(sourcePath)) return;
  const destinationPath = path.join(releaseDir, relativePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
  manifest.files.push({
    path: relativePath.replace(/\\/g, "/"),
    bytes: fs.statSync(destinationPath).size,
  });
}

function writeManifest() {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function writeZip() {
  const command = [
    "Compress-Archive",
    "-LiteralPath",
    quotePowerShell(releaseDir),
    "-DestinationPath",
    quotePowerShell(zipPath),
    "-Force",
  ].join(" ");
  const result = spawnSync("powershell", ["-NoProfile", "-Command", command], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`ZIP creation failed: ${result.stderr || result.stdout}`);
  }
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function timestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}${second}`;
}
