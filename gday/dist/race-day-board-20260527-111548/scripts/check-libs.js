const { parseCsv, toCsvLine } = require("./lib/csv");
const { ALLOWED_CATEGORIES, getCategoryLabel } = require("./lib/categories");
const { addDays, getDataAgeDays, toIsoDate } = require("./lib/date");
const { eventsForDate, findNextEventDate, isEventOnDate } = require("./lib/events");
const { buildCoverage } = require("./lib/coverage");

const rows = parseCsv('id,name\n1,"Tokyo, Japan"\n');
assert(rows.length === 2, "parseCsv row count");
assert(rows[1][1] === "Tokyo, Japan", "parseCsv quoted comma");
assert(toCsvLine(["1", "Tokyo, Japan"]) === '1,"Tokyo, Japan"', "toCsvLine quoted comma");

const baseDate = new Date("2026-05-26T00:00:00");
assert(toIsoDate(baseDate) === "2026-05-26", "toIsoDate");
assert(toIsoDate(addDays(baseDate, 2)) === "2026-05-28", "addDays");
assert(getDataAgeDays("2026-05-24T00:00:00Z", new Date("2026-05-26T00:00:00Z")) === 2, "getDataAgeDays");
assert(ALLOWED_CATEGORIES.has("jra"), "ALLOWED_CATEGORIES");
assert(ALLOWED_CATEGORIES.has("keirin"), "ALLOWED_CATEGORIES keirin");
assert(getCategoryLabel("boat") === "\u30dc\u30fc\u30c8\u30ec\u30fc\u30b9", "getCategoryLabel");

const sampleEvent = { days: [2], dates: ["2026-05-29"] };
assert(isEventOnDate(sampleEvent, "2026-05-26", 2), "isEventOnDate days");
assert(isEventOnDate(sampleEvent, "2026-05-29", 5), "isEventOnDate dates");
assert(eventsForDate([sampleEvent], new Date("2026-05-26T00:00:00")).length === 1, "eventsForDate");
assert(
  findNextEventDate(sampleEvent, { startDate: new Date("2026-05-27T00:00:00"), lookupDays: 5 }).isoDate === "2026-05-29",
  "findNextEventDate",
);
const coverage = buildCoverage([{ category: "jra", dates: ["2026-05-01"] }]);
assert(coverage.months.includes("2026-05"), "buildCoverage months");
assert(coverage.missingByMonth["2026-05"].includes("boat"), "buildCoverage missing categories");

console.log("Library checks passed");

function assert(condition, message) {
  if (!condition) {
    console.error(`Library check failed: ${message}`);
    process.exit(1);
  }
}
