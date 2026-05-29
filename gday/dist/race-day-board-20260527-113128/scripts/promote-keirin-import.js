const fs = require("fs");
const path = require("path");
const { parseCsv, toCsvLine } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const ym = process.argv[2] || currentYm();
const incomingPath = path.join(rootDir, "data", "incoming", "keirin", ym, `${ym}_events.csv`);
const outputPath = path.join(rootDir, "data", "sources", `keirin-${ym}.csv`);

if (!fs.existsSync(incomingPath)) {
  console.error(`Incoming keirin CSV not found: ${path.relative(rootDir, incomingPath)}`);
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(incomingPath, "utf8").replace(/^\uFEFF/, ""));
if (rows.length < 2) {
  console.error(`Incoming keirin CSV has no rows: ${path.relative(rootDir, incomingPath)}`);
  process.exit(1);
}

const header = rows[0];
const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));
fs.writeFileSync(outputPath, `${[header, ...dataRows].map(toCsvLine).join("\n")}\n`, "utf8");

console.log(`Wrote ${path.relative(rootDir, outputPath)} (${dataRows.length} rows)`);

function currentYm() {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}
