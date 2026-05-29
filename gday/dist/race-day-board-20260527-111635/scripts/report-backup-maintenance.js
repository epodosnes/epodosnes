const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const backupRoot = path.join(rootDir, "backups");
const outputPath = path.join(rootDir, "docs", "backup-maintenance.md");
const options = parseArgs(process.argv.slice(2));
const backups = listBackups();
const keepIds = new Set(backups.slice(0, options.keep).map((backup) => backup.backupId));
const now = new Date();

const candidates = backups.filter((backup) => {
  if (keepIds.has(backup.backupId)) return false;
  if (!options.olderThanDays) return true;
  const createdAt = new Date(backup.createdAt || backup.backupId.replace(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/, "$1-$2-$3T$4:$5:$6"));
  if (Number.isNaN(createdAt.getTime())) return false;
  return Math.floor((now.getTime() - createdAt.getTime()) / 86400000) >= options.olderThanDays;
});

const lines = [];
lines.push("# Backup Maintenance");
lines.push("");
lines.push(`- Generated at: ${now.toISOString()}`);
lines.push(`- Backups: ${backups.length}`);
lines.push(`- Keep latest: ${options.keep}`);
lines.push(`- Older than days: ${options.olderThanDays || "-"}`);
lines.push(`- Delete candidates: ${candidates.length}`);
lines.push("");
lines.push("This report is preview-only. It does not delete files.");
lines.push("");

lines.push("## Keep");
lines.push("");
if (backups.length === 0) {
  lines.push("- None");
} else {
  backups.slice(0, options.keep).forEach((backup) => {
    lines.push(`- ${backup.backupId}: ${backup.createdAt || "-"} / ${backup.files} files / ${backup.bytes} bytes`);
  });
}
lines.push("");

lines.push("## Candidates");
lines.push("");
if (candidates.length === 0) {
  lines.push("- None");
} else {
  candidates.forEach((backup) => {
    lines.push(`- ${backup.backupId}: ${backup.createdAt || "-"} / ${backup.files} files / ${backup.bytes} bytes`);
  });
}
lines.push("");

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
console.log(`Backups: ${backups.length} / keep: ${Math.min(options.keep, backups.length)} / candidates: ${candidates.length}`);

function parseArgs(args) {
  const parsed = {
    keep: 20,
    olderThanDays: 0,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--keep") {
      parsed.keep = Number(args[index + 1]);
      index += 1;
    } else if (arg === "--older-than-days") {
      parsed.olderThanDays = Number(args[index + 1]);
      index += 1;
    }
  }
  if (!Number.isInteger(parsed.keep) || parsed.keep < 1) {
    console.error("--keep must be a positive integer");
    process.exit(1);
  }
  if (!Number.isInteger(parsed.olderThanDays) || parsed.olderThanDays < 0) {
    console.error("--older-than-days must be a non-negative integer");
    process.exit(1);
  }
  return parsed;
}

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
      files: 0,
      bytes: 0,
    };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    return {
      backupId: manifest.backupId || name,
      createdAt: manifest.createdAt || "",
      files: files.length,
      bytes: files.reduce((sum, file) => sum + Number(file.bytes || 0), 0),
    };
  } catch (error) {
    return {
      backupId: name,
      createdAt: "",
      files: 0,
      bytes: 0,
    };
  }
}
