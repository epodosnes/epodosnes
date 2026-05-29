const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = path.resolve(__dirname, "..");
const backupRoot = path.join(rootDir, "backups");
const requestedId = process.argv[2];

const backupId = requestedId || getLatestBackupId();
if (!backupId) {
  console.log("No backups found.");
  process.exit(0);
}

const backupDir = path.join(backupRoot, backupId);
const manifestPath = path.join(backupDir, "backup-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error(`Backup manifest not found: ${backupId}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const files = Array.isArray(manifest.files) ? manifest.files : [];

console.log(`Backup: ${backupId}`);
console.log(`Created at: ${manifest.createdAt || "-"}`);
console.log("Comparison:");

if (files.length === 0) {
  console.log("- No files in manifest");
  process.exit(0);
}

files.forEach((file) => {
  const backupPath = path.join(backupDir, file.path);
  const currentPath = path.join(rootDir, file.path);
  const result = compareFiles(backupPath, currentPath);
  console.log(`- ${file.path}: ${result}`);
});

function getLatestBackupId() {
  if (!fs.existsSync(backupRoot)) return "";
  const names = fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();
  return names[0] || "";
}

function compareFiles(backupPath, currentPath) {
  const backupExists = fs.existsSync(backupPath);
  const currentExists = fs.existsSync(currentPath);
  if (!backupExists && !currentExists) return "both missing";
  if (!backupExists) return "backup missing";
  if (!currentExists) return "current missing";

  const backupBytes = fs.statSync(backupPath).size;
  const currentBytes = fs.statSync(currentPath).size;
  if (hashFile(backupPath) === hashFile(currentPath)) {
    return `same (${currentBytes} bytes)`;
  }
  return `changed (${backupBytes} -> ${currentBytes} bytes)`;
}

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}
