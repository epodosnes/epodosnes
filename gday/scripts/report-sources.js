const fs = require("fs");
const path = require("path");
const { parseCsv } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const sourceRoot = path.join(rootDir, "data", "sources");
const outputPath = path.join(rootDir, "docs", "source-report.md");

const lines = [];
const files = listCsvFiles(sourceRoot);

lines.push("# Source Report");
lines.push("");
lines.push(`- Source root: data/sources`);
lines.push(`- CSV files: ${files.length}`);
lines.push("");

if (files.length === 0) {
  lines.push("- No source CSV files found.");
  lines.push("");
} else {
  lines.push("| File | Rows | Included by merge | Duplicate IDs |");
  lines.push("| --- | ---: | --- | --- |");

  const idMap = collectIds(files);
  files.forEach((file) => {
    const relativePath = path.relative(rootDir, file).replace(/\\/g, "/");
    const rows = readRows(file);
    const ids = rows.slice(1).map((row) => row[0]).filter(Boolean);
    const duplicateIds = ids.filter((id) => (idMap.get(id) || []).length > 1);
    lines.push(
      `| ${relativePath} | ${Math.max(rows.length - 1, 0)} | ${isDirectSource(file) ? "yes" : "no"} | ${
        duplicateIds.length > 0 ? Array.from(new Set(duplicateIds)).join(", ") : "-"
      } |`,
    );
  });
  lines.push("");
}

lines.push("## Notes");
lines.push("");
lines.push("- Only CSV files directly under `data/sources/` are included by `scripts/merge-source-csvs.js`.");
lines.push("- Nested CSV files such as `data/sources/by-category/*.csv` are treated as generated/reference files.");
lines.push("");

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)} (${files.length} source files)`);

function listCsvFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...listCsvFiles(entryPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
      result.push(entryPath);
    }
  });
  return result.sort((a, b) => a.localeCompare(b));
}

function isDirectSource(filePath) {
  const fileName = path.basename(filePath);
  const hasManualBase = fs.existsSync(path.join(sourceRoot, "manual-base.csv"));
  return path.dirname(filePath) === sourceRoot && !(fileName === "manual.csv" && hasManualBase);
}

function collectIds(files) {
  const ids = new Map();
  files.forEach((file) => {
    readRows(file)
      .slice(1)
      .forEach((row) => {
        const id = row[0];
        if (!id) return;
        if (!ids.has(id)) {
          ids.set(id, []);
        }
        ids.get(id).push(file);
      });
  });
  return ids;
}

function readRows(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}
