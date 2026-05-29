const fs = require("fs");
const path = require("path");
const { CATEGORY_LABELS, getCategoryLabel } = require("./lib/categories");

const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "events.json");
const outputPath = path.join(rootDir, "docs", "update-status.md");
const importReportRoot = path.join(rootDir, "data", "incoming", "import-month");

const options = parseArgs(process.argv.slice(2));
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const coverage = normalizeCoverage(data.coverage);
const months = options.months.length ? options.months : defaultMonths(new Date());
const importReports = readImportReports();
const nodeCommand = "C:\\Users\\golp\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe";

const lines = [];
lines.push("# Update Status");
lines.push("");
lines.push(`- Generated at: ${new Date().toISOString()}`);
lines.push(`- Data generated at: ${data.generatedAt || "-"}`);
lines.push(`- Events: ${Array.isArray(data.events) ? data.events.length : 0}`);
lines.push(`- Imported months: ${coverage.months.length ? coverage.months.join(", ") : "-"}`);
lines.push("");

lines.push("## Target Months");
lines.push("");
months.forEach((month) => {
  const status = getMonthStatus(month);
  lines.push(`### ${month}`);
  lines.push("");
  lines.push(`- Status: ${status.label}`);
  lines.push(`- Missing: ${status.missing.length ? status.missing.map(getCategoryLabel).join(", ") : "-"}`);
  lines.push(`- Last import: ${formatLastImport(month)}`);
  lines.push("");
  lines.push("Commands:");
  lines.push("");
  lines.push("```powershell");
  lines.push(`${nodeCommand} scripts\\report-coverage.js --month ${month}`);
  if (status.status === "complete") {
    lines.push(`${nodeCommand} scripts\\import-month.js --year ${month.slice(0, 4)} --month ${Number(month.slice(5, 7))} --skip-fetch --skip-update`);
  } else if (status.status === "partial" && status.missing.length > 0) {
    lines.push(`${nodeCommand} scripts\\import-month.js --year ${month.slice(0, 4)} --month ${Number(month.slice(5, 7))} --only ${status.missing.join(",")} --allow-missing`);
  } else {
    lines.push(`${nodeCommand} scripts\\import-month.js --year ${month.slice(0, 4)} --month ${Number(month.slice(5, 7))} --allow-missing`);
  }
  lines.push("```");
  lines.push("");
});

lines.push("## Operating Rules");
lines.push("");
lines.push("- Around the 25th: fetch next month with `--allow-missing`.");
lines.push("- If a category is missing: retry only that category with `--only` after the source publishes it.");
lines.push("- Before using the app for a specific day: run `report-coverage.js --date YYYY-MM-DD`.");
lines.push("- After a successful monthly import: keep the generated backup and do not delete old backups automatically yet.");
lines.push("- If the app shows 0 events: check whether the month is not imported or only partially imported before assuming no races.");
lines.push("");

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
months.forEach((month) => {
  const status = getMonthStatus(month);
  console.log(`${month}: ${status.label}${status.missing.length ? ` / missing ${status.missing.map(getCategoryLabel).join(", ")}` : ""}`);
});

function parseArgs(args) {
  const parsed = { months: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--month") {
      parsed.months.push(args[index + 1]);
      index += 1;
    } else if (arg === "--months") {
      parsed.months.push(...String(args[index + 1] || "").split(","));
      index += 1;
    }
  }
  parsed.months = parsed.months.map((month) => month.trim()).filter(Boolean);
  const invalid = parsed.months.find((month) => !/^\d{4}-\d{2}$/.test(month));
  if (invalid) {
    console.error(`Invalid month: ${invalid}. Use YYYY-MM.`);
    process.exit(1);
  }
  return parsed;
}

function defaultMonths(date) {
  const current = toMonth(date);
  const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const next = toMonth(nextDate);
  return current === next ? [current] : [current, next];
}

function toMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeCoverage(value) {
  return {
    months: Array.isArray(value?.months) ? value.months : [],
    categories: value?.categories || {},
    missingByMonth: value?.missingByMonth || {},
  };
}

function getMonthStatus(month) {
  if (!coverage.months.includes(month)) {
    return {
      status: "not-imported",
      label: "not imported",
      missing: Object.keys(CATEGORY_LABELS),
    };
  }
  const missing = coverage.missingByMonth[month] || [];
  if (missing.length > 0) {
    return {
      status: "partial",
      label: "partially imported",
      missing,
    };
  }
  return {
    status: "complete",
    label: "complete",
    missing: [],
  };
}

function readImportReports() {
  if (!fs.existsSync(importReportRoot)) return [];
  return fs
    .readdirSync(importReportRoot)
    .filter((file) => /^\d{6}_report\.json$/.test(file))
    .map((file) => {
      try {
        const report = JSON.parse(fs.readFileSync(path.join(importReportRoot, file), "utf8"));
        return {
          ym: report.ym,
          ok: Boolean(report.ok),
          finishedAt: report.finishedAt || "",
          succeeded: report.summary?.succeeded || [],
          skipped: report.summary?.skipped || [],
          failed: report.summary?.failed || [],
        };
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)));
}

function formatLastImport(month) {
  const ym = month.replace("-", "");
  const report = importReports.find((item) => item.ym === ym);
  if (!report) return "-";
  const parts = [];
  if (report.succeeded.length) parts.push(`succeeded ${report.succeeded.map(getCategoryLabel).join(", ")}`);
  if (report.skipped.length) parts.push(`skipped ${report.skipped.map(getCategoryLabel).join(", ")}`);
  if (report.failed.length) parts.push(`failed ${report.failed.map(getCategoryLabel).join(", ")}`);
  return `${report.finishedAt || "-"} / ${parts.join(" / ") || "-"}`;
}
