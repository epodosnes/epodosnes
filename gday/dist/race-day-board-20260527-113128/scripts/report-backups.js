const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = path.resolve(__dirname, "..");
const backupRoot = path.join(rootDir, "backups");
const outputPath = path.join(rootDir, "docs", "backup-report.md");

const backups = listBackups();
const latest = backups[0] || null;
const lines = [];

lines.push("# Backup Report");
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- Backups: ${backups.length}`);
lines.push(`- Latest: ${latest ? latest.backupId : "-"}`);
lines.push(`- Latest created at: ${latest ? latest.createdAt || "-" : "-"}`);
lines.push(`- Latest status: ${latest ? latest.status : "-"}`);
lines.push("");

lines.push("## Latest Backup Files");
lines.push("");
if (!latest) {
  lines.push("- None");
} else if (!Array.isArray(latest.files) || latest.files.length === 0) {
  lines.push("- No files in manifest");
} else {
  lines.push("| File | Backup | Current | Status |");
  lines.push("| --- | ---: | ---: | --- |");
  latest.files.forEach((file) => {
    const comparison = compareToCurrent(latest.backupId, file);
    lines.push(
      `| ${file.path} | ${comparison.backupBytes} | ${comparison.currentBytes} | ${comparison.status} |`,
    );
  });
}
lines.push("");

lines.push("## Recent Backups");
lines.push("");
if (backups.length === 0) {
  lines.push("- None");
} else {
  lines.push("| Backup ID | Created At | Files | Bytes | Status |");
  lines.push("| --- | --- | ---: | ---: | --- |");
  backups.slice(0, 20).forEach((backup) => {
    lines.push(
      `| ${backup.backupId} | ${backup.createdAt || "-"} | ${backup.fileCount} | ${backup.bytes} | ${backup.status} |`,
    );
  });
}
lines.push("");

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);

function listBackups() {
  if (!fs.existsSync(backupRoot)) return [];
  return fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readBackup(entry.name))
    .sort((a, b) => String(b.backupId).localeCompare(String(a.backupId)));
}

function readBackup(name) {
  const manifestPath = path.join(backupRoot, name, "backup-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return {
      backupId: name,
      createdAt: "",
      files: [],
      fileCount: 0,
      bytes: 0,
      status: "missing manifest",
    };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    const issues = files.filter((file) => !backupFileMatchesManifest(name, file));
    return {
      backupId: manifest.backupId || name,
      createdAt: manifest.createdAt || "",
      files,
      fileCount: files.length,
      bytes: files.reduce((sum, file) => sum + Number(file.bytes || 0), 0),
      status: issues.length === 0 ? "OK" : `${issues.length} issue(s)`,
    };
  } catch (error) {
    return {
      backupId: name,
      createdAt: "",
      files: [],
      fileCount: 0,
      bytes: 0,
      status: "invalid manifest",
    };
  }
}

function backupFileMatchesManifest(backupId, file) {
  const filePath = path.join(backupRoot, backupId, file.path);
  return fs.existsSync(filePath) && fs.statSync(filePath).size === Number(file.bytes || 0);
}

function compareToCurrent(backupId, file) {
  const backupPath = path.join(backupRoot, backupId, file.path);
  const currentPath = path.join(rootDir, file.path);
  const backupBytes = fs.existsSync(backupPath) ? fs.statSync(backupPath).size : 0;
  const currentBytes = fs.existsSync(currentPath) ? fs.statSync(currentPath).size : 0;

  if (!fs.existsSync(backupPath)) {
    return { backupBytes, currentBytes, status: "missing backup file" };
  }
  if (!fs.existsSync(currentPath)) {
    return { backupBytes, currentBytes, status: "current missing" };
  }
  if (hashFile(backupPath) === hashFile(currentPath)) {
    return { backupBytes, currentBytes, status: "same" };
  }
  return { backupBytes, currentBytes, status: "changed" };
}

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}
