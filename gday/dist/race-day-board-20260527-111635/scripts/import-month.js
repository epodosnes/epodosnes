const fs = require("fs");
const path = require("path");
const { getCategoryLabel } = require("./lib/categories");
const { printStepResult, runNodeScript } = require("./lib/process");

const rootDir = path.resolve(__dirname, "..");
const nodePath = process.execPath;
const year = Number(getArg("--year") || new Date().getFullYear());
const month = Number(getArg("--month") || new Date().getMonth() + 1);
const fetchOnly = hasFlag("--fetch-only");
const skipFetch = hasFlag("--skip-fetch");
const skipUpdate = hasFlag("--skip-update");
const allowMissing = hasFlag("--allow-missing");
const onlyCategories = parseCategoryList(getArg("--only"));

if (!Number.isInteger(year) || year < 1999 || year > 2100) {
  console.error(`Invalid --year: ${year}`);
  process.exit(1);
}
if (!Number.isInteger(month) || month < 1 || month > 12) {
  console.error(`Invalid --month: ${month}`);
  process.exit(1);
}
if (fetchOnly && skipUpdate) {
  console.error("--fetch-only and --skip-update cannot be combined because --fetch-only already skips updates.");
  process.exit(1);
}

const ym = `${year}${String(month).padStart(2, "0")}`;
const ymLabel = `${year}-${String(month).padStart(2, "0")}`;
const reportDir = path.join(rootDir, "data", "incoming", "import-month");
const reportJsonPath = path.join(reportDir, `${ym}_report.json`);
const reportMdPath = path.join(rootDir, "docs", "import-month-report.md");
const categories = [
  {
    id: "local-keiba",
    label: "Local keiba",
    fetch: ["scripts/fetch-local-keiba.js", "--year", String(year), "--month", String(month)],
    check: ["scripts/check-local-keiba-import.js", ym],
    promote: ["scripts/promote-local-keiba-import.js", ym],
  },
  {
    id: "jra",
    label: "JRA",
    fetch: ["scripts/fetch-jra-calendar.js", "--year", String(year), "--month", String(month)],
    check: ["scripts/check-jra-import.js", ym],
    promote: ["scripts/promote-jra-import.js", ym],
  },
  {
    id: "boat",
    label: "BOAT RACE",
    fetch: ["scripts/fetch-boat-calendar.js", "--year", String(year), "--month", String(month)],
    check: ["scripts/check-boat-import.js", ym],
    promote: ["scripts/promote-boat-import.js", ym],
  },
  {
    id: "auto",
    label: "AutoRace",
    fetch: ["scripts/fetch-auto-calendar.js", "--year", String(year), "--month", String(month)],
    check: ["scripts/check-auto-import.js", ym],
    promote: ["scripts/promote-auto-import.js", ym],
  },
  {
    id: "keirin",
    label: "KEIRIN",
    fetch: ["scripts/fetch-keirin-calendar.js", "--year", String(year), "--month", String(month)],
    check: ["scripts/check-keirin-import.js", ym],
    promote: ["scripts/promote-keirin-import.js", ym],
  },
];
const selectedCategories = onlyCategories.length
  ? categories.filter((category) => onlyCategories.includes(category.id))
  : categories;

if (onlyCategories.some((category) => !categories.some((item) => item.id === category))) {
  console.error(`Invalid --only category. Use one or more of: ${categories.map((category) => category.id).join(",")}`);
  process.exit(1);
}
if (selectedCategories.length === 0) {
  console.error("No categories selected.");
  process.exit(1);
}

const report = {
  year,
  month,
  ym,
  startedAt: new Date().toISOString(),
  options: {
    allowMissing,
    fetchOnly,
    only: onlyCategories,
    skipFetch,
    skipUpdate,
  },
  categories: [],
  steps: [],
  summary: {
    succeeded: [],
    skipped: [],
    failed: [],
  },
};

console.log(`Import month: ${ymLabel}`);
console.log(`Options: ${formatOptions(report.options)}`);

try {
  runImport();
  report.finishedAt = new Date().toISOString();
  report.ok = report.summary.failed.length === 0;
  writeReports();
  printSummary();
  console.log("\nMonthly import complete.");
} catch (error) {
  report.finishedAt = new Date().toISOString();
  report.ok = false;
  report.fatalError = error && error.stack ? error.stack : String(error);
  writeReports();
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}

function runImport() {
  selectedCategories.forEach((category) => {
    const categoryReport = {
      id: category.id,
      label: category.label,
      displayLabel: getCategoryLabel(category.id),
      status: "pending",
      steps: [],
    };
    report.categories.push(categoryReport);

    let ok = true;
    if (!skipFetch) {
      ok = runStep(`Fetch ${category.label}`, category.fetch, { optional: allowMissing, categoryReport });
    } else {
      addSkippedStep(categoryReport, "Fetch", "Skipped by --skip-fetch");
    }

    if (!ok) {
      markCategory(categoryReport, "skipped", "fetch failed");
      console.log(`Skipping ${category.label}: fetch failed and --allow-missing is enabled.`);
      return;
    }

    ok = runStep(`Check ${category.label}`, category.check, { optional: allowMissing, categoryReport });
    if (!ok) {
      markCategory(categoryReport, "skipped", "check failed");
      console.log(`Skipping ${category.label}: check failed and --allow-missing is enabled.`);
      return;
    }

    if (!fetchOnly) {
      runStep(`Promote ${category.label}`, category.promote, { categoryReport });
    } else {
      addSkippedStep(categoryReport, "Promote", "Skipped by --fetch-only");
    }

    markCategory(categoryReport, "succeeded", "");
  });

  const succeededCategories = report.categories.filter((category) => category.status === "succeeded");
  if (succeededCategories.length === 0) {
    throw new Error("No categories were successfully imported.");
  }

  if (!fetchOnly) {
    runStep("Filter manual sources", ["scripts/filter-manual-sources.js", categories.map((category) => category.id).join(",")]);
    runStep("Merge source CSVs", ["scripts/merge-source-csvs.js"]);
    if (!skipUpdate) {
      runStep("Update generated app data", ["scripts/update-data.js"]);
    } else {
      addGlobalSkippedStep("Update generated app data", "Skipped by --skip-update");
    }
  }
}

function runStep(label, args, options = {}) {
  console.log(`\n== ${label} ==`);
  const step = {
    label,
    args,
    optional: Boolean(options.optional),
  };
  const result = runNodeScript(nodePath, args, { cwd: rootDir });
  Object.assign(step, result);
  report.steps.push(step);
  if (options.categoryReport) {
    options.categoryReport.steps.push(step);
  }

  if (!result.ok) {
    if (options.optional) {
      printOptionalFailure(result, label);
      return false;
    }
    printStepResult(result);
    console.error(`\nFailed: ${label}`);
    throw new Error(`Failed: ${label}`);
  }
  printStepResult(result);
  return true;
}

function printOptionalFailure(result, label) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
    if (!result.stdout.endsWith("\n")) process.stdout.write("\n");
  }
  const message = firstErrorLine(result.stderr || result.error);
  console.log(`Optional step failed: ${label}${message ? ` / ${message}` : ""}`);
}

function addSkippedStep(categoryReport, label, reason) {
  const step = {
    label,
    status: 0,
    ok: true,
    skipped: true,
    reason,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    elapsedMs: 0,
  };
  categoryReport.steps.push(step);
  report.steps.push(step);
}

function addGlobalSkippedStep(label, reason) {
  report.steps.push({
    label,
    status: 0,
    ok: true,
    skipped: true,
    reason,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    elapsedMs: 0,
  });
}

function markCategory(categoryReport, status, reason) {
  categoryReport.status = status;
  if (reason) {
    categoryReport.reason = reason;
  }
  report.summary[status].push(categoryReport.id);
}

function writeReports() {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });
  fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(reportMdPath, `${buildMarkdownReport()}\n`, "utf8");
}

function buildMarkdownReport() {
  const lines = [];
  lines.push(`# Monthly Import Report ${ymLabel}`);
  lines.push("");
  lines.push(`- Started at: ${report.startedAt}`);
  lines.push(`- Finished at: ${report.finishedAt || "-"}`);
  lines.push(`- Options: ${formatOptions(report.options)}`);
  lines.push(`- JSON report: ${path.relative(rootDir, reportJsonPath).replace(/\\/g, "/")}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Succeeded: ${formatCategoryList(report.summary.succeeded)}`);
  lines.push(`- Skipped: ${formatCategoryList(report.summary.skipped)}`);
  lines.push(`- Failed: ${formatCategoryList(report.summary.failed)}`);
  lines.push("");
  lines.push("## Categories");
  lines.push("");
  report.categories.forEach((category) => {
    lines.push(`### ${category.displayLabel}`);
    lines.push("");
    lines.push(`- Status: ${category.status}${category.reason ? ` (${category.reason})` : ""}`);
    category.steps.forEach((step) => {
      const status = formatStepStatus(step);
      lines.push(`- ${step.label}: ${status} / ${step.elapsedMs || 0}ms`);
      if (!step.ok) {
        const message = firstErrorLine(step.stderr || step.stdout || step.error);
        if (message) lines.push(`  - Message: ${message}`);
      }
    });
    lines.push("");
  });
  lines.push("## Steps");
  lines.push("");
  report.steps.forEach((step) => {
    const status = formatStepStatus(step);
    lines.push(`- ${step.label}: ${status}`);
  });
  return lines.join("\n");
}

function printSummary() {
  console.log("\n== Import Summary ==");
  console.log(`Succeeded: ${formatCategoryList(report.summary.succeeded)}`);
  console.log(`Skipped: ${formatCategoryList(report.summary.skipped)}`);
  console.log(`Failed: ${formatCategoryList(report.summary.failed)}`);
  console.log(`Report: ${path.relative(rootDir, reportMdPath)}`);
}

function formatCategoryList(ids) {
  if (!ids.length) return "-";
  return ids.map((id) => getCategoryLabel(id)).join(", ");
}

function firstErrorLine(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || "";
}

function formatStepStatus(step) {
  if (step.skipped) return "skipped";
  if (step.ok) return "OK";
  if (step.optional) return `optional failed (${step.status})`;
  return `failed (${step.status})`;
}

function formatOptions(options) {
  const parts = [];
  Object.entries(options)
    .filter(([, value]) => Boolean(value) && (!Array.isArray(value) || value.length > 0))
    .forEach(([key, value]) => {
      const name = `--${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
      parts.push(Array.isArray(value) ? `${name} ${value.join(",")}` : name);
    });
  return parts
    .join(" ") || "default";
}

function parseCategoryList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function hasFlag(name) {
  return process.argv.includes(name);
}
