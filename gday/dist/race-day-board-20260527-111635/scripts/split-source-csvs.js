const fs = require("fs");
const path = require("path");
const { parseCsv, toCsvLine } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "events.csv");
const outputDir = path.join(rootDir, "data", "sources", "by-category");

const text = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const rows = parseCsv(text);

if (rows.length < 2) {
  console.error("data/events.csv must contain a header and data rows.");
  process.exit(1);
}

const header = rows[0];
const categoryIndex = header.indexOf("category");

if (categoryIndex < 0) {
  console.error("data/events.csv is missing category header.");
  process.exit(1);
}

const groups = new Map();
rows.slice(1).forEach((row) => {
  if (!row.some((cell) => cell.trim() !== "")) {
    return;
  }

  const category = row[categoryIndex] || "unknown";
  if (!groups.has(category)) {
    groups.set(category, []);
  }
  groups.get(category).push(row);
});

fs.mkdirSync(outputDir, { recursive: true });

Array.from(groups.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([category, groupRows]) => {
    const outputPath = path.join(outputDir, `${category}.csv`);
    const output = [header, ...groupRows].map(toCsvLine).join("\n");
    fs.writeFileSync(outputPath, `${output}\n`, "utf8");
    console.log(`Wrote ${path.relative(rootDir, outputPath)} (${groupRows.length} rows)`);
  });
