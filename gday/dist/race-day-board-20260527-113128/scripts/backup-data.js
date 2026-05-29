const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const backupRoot = path.join(rootDir, "backups");
const timestamp = toTimestamp(new Date());
const backupDir = path.join(backupRoot, timestamp);

const files = [
  path.join("data", "events.csv"),
  path.join("data", "events.json"),
  path.join("src", "sample-data.js"),
  path.join("docs", "data-report.md"),
  path.join("docs", "calendar-report.md"),
  path.join("docs", "source-report.md"),
  path.join("docs", "venue-report.md"),
  path.join("docs", "coverage-report.md"),
  path.join("docs", "day-report.md"),
  path.join("docs", "update-status.md"),
  path.join("docs", "dashboard.md"),
  path.join("docs", "backup-report.md"),
  path.join("docs", "backup-maintenance.md"),
];

fs.mkdirSync(backupDir, { recursive: true });

let copied = 0;
const manifest = {
  createdAt: new Date().toISOString(),
  backupId: timestamp,
  files: [],
};

files.forEach((relativePath) => {
  const sourcePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  const destinationPath = path.join(backupDir, relativePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
  manifest.files.push({
    path: relativePath.replace(/\\/g, "/"),
    bytes: fs.statSync(destinationPath).size,
  });
  copied += 1;
});

fs.writeFileSync(path.join(backupDir, "backup-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, backupDir)} (${copied} files)`);

function toTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}${second}`;
}
