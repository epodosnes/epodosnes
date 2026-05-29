const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const backupRoot = path.join(rootDir, "backups");
const detailId = process.argv[2];

if (!fs.existsSync(backupRoot)) {
  console.log("No backups found.");
  process.exit(0);
}

const backups = fs
  .readdirSync(backupRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => readBackup(entry.name))
  .sort((a, b) => String(b.backupId).localeCompare(String(a.backupId)));

if (backups.length === 0) {
  console.log("No backups found.");
  process.exit(0);
}

if (detailId) {
  const backup = backups.find((item) => item.backupId === detailId);
  if (!backup) {
    console.error(`Backup not found: ${detailId}`);
    process.exit(1);
  }

  console.log(`Backup: ${backup.backupId}`);
  console.log(`Created at: ${backup.createdAt || "-"}`);
  console.log("Files:");
  if (!Array.isArray(backup.files) || backup.files.length === 0) {
    console.log("- None");
  } else {
    backup.files.forEach((file) => {
      console.log(`- ${file.path} (${file.bytes || 0} bytes)`);
    });
  }
  process.exit(0);
}

console.log("Backups:");
backups.forEach((backup) => {
  const files = Array.isArray(backup.files) ? backup.files.length : 0;
  const bytes = Array.isArray(backup.files) ? backup.files.reduce((sum, file) => sum + Number(file.bytes || 0), 0) : 0;
  console.log(`- ${backup.backupId} | ${backup.createdAt || "-"} | ${files} files | ${bytes} bytes`);
});

function readBackup(name) {
  const manifestPath = path.join(backupRoot, name, "backup-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return {
      backupId: name,
      createdAt: "",
      files: [],
    };
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return {
      backupId: name,
      createdAt: "",
      files: [],
    };
  }
}
