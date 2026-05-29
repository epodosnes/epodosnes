const fs = require("fs");
const path = require("path");
const { parseCsv, toCsvLine } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "data", "sources");
const outputPath = path.join(rootDir, "data", "events.csv");

if (!fs.existsSync(sourceDir)) {
  console.error("Source directory not found: data/sources");
  process.exit(1);
}

const sourceFiles = fs
  .readdirSync(sourceDir)
  .filter((file) => file.toLowerCase().endsWith(".csv"))
  .filter((file, index, files) => !(file === "manual.csv" && files.includes("manual-base.csv")))
  .sort();

if (sourceFiles.length === 0) {
  console.error("No source CSV files found in data/sources");
  process.exit(1);
}

let header = null;
const rows = [];
const seenIds = new Map();

sourceFiles.forEach((file) => {
  const filePath = path.join(sourceDir, file);
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const parsed = parseCsv(text);

  if (parsed.length === 0) {
    return;
  }

  const currentHeader = parsed[0].map((cell) => cell.trim());
  if (!header) {
    header = currentHeader;
  } else if (currentHeader.join(",") !== header.join(",")) {
    console.error(`Header mismatch in ${path.join("data", "sources", file)}`);
    process.exit(1);
  }

  parsed.slice(1).forEach((row) => {
    if (row.some((cell) => cell.trim() !== "")) {
      const idIndex = header.indexOf("id");
      const id = idIndex >= 0 ? String(row[idIndex] || "").trim() : "";
      if (id) {
        if (seenIds.has(id)) {
          console.error(`Duplicate id "${id}" in ${path.join("data", "sources", file)} and ${seenIds.get(id)}`);
          process.exit(1);
        }
        seenIds.set(id, path.join("data", "sources", file));
      }
      rows.push(row);
    }
  });
});

const outputRows = [header, ...rows].map(toCsvLine).join("\n");
fs.writeFileSync(outputPath, `${outputRows}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)} (${rows.length} rows from ${sourceFiles.length} source files)`);
