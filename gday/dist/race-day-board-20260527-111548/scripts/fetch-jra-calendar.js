const fs = require("fs");
const path = require("path");
const { toCsvLine } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const incomingRoot = path.join(rootDir, "data", "incoming", "jra");
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const year = Number(getArg("--year") || new Date().getFullYear());
const month = Number(getArg("--month") || new Date().getMonth() + 1);

if (!Number.isInteger(year) || year < 2015 || year > 2100) {
  console.error(`Invalid --year: ${year}`);
  process.exit(1);
}
if (!Number.isInteger(month) || month < 1 || month > 12) {
  console.error(`Invalid --month: ${month}`);
  process.exit(1);
}

const ym = `${year}${String(month).padStart(2, "0")}`;
const monthId = monthLabels[month - 1];
const workDir = path.join(incomingRoot, ym);
const htmlPath = path.join(workDir, `${ym}_jra_calendar.html`);
const outputPath = path.join(workDir, `${ym}_events.csv`);
const reportPath = path.join(workDir, `${ym}_report.md`);
const sourceUrl = `https://japanracing.jp/en/racing/schedule/jra/${year}.html`;

fs.mkdirSync(workDir, { recursive: true });

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});

async function main() {
  const html = await downloadHtml();
  fs.writeFileSync(htmlPath, html, "utf8");

  const events = convertCalendar(html);
  const header = [
    "id",
    "category",
    "venueName",
    "region",
    "startTime",
    "endTime",
    "days",
    "dates",
    "officialUrl",
    "night",
    "memo",
    "accessNote",
  ];
  const rows = events.map((event) => header.map((key) => event[key]));
  fs.writeFileSync(outputPath, `${[header, ...rows].map(toCsvLine).join("\n")}\n`, "utf8");
  writeReport(events);

  console.log(`Wrote ${path.relative(rootDir, htmlPath)}`);
  console.log(`Wrote ${path.relative(rootDir, outputPath)} (${events.length} events)`);
  console.log(`Wrote ${path.relative(rootDir, reportPath)}`);
}

async function downloadHtml() {
  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": "RaceDayBoard/1.0",
      accept: "text/html,*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function convertCalendar(html) {
  const monthHtml = extractMonthHtml(html);
  const cellPattern = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
  const events = [];
  let match;

  while ((match = cellPattern.exec(monthHtml))) {
    const cell = match[1];
    const dayMatch = cell.match(/<span class="dayNumber">(\d{1,2})<\/span>/);
    if (!dayMatch) continue;

    const day = Number(dayMatch[1]);
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const venueCodes = unique(
      Array.from(cell.matchAll(/rf_([a-z]+)\.png/gi))
        .map((item) => item[1].toLowerCase())
        .filter((code) => venueMeta[code]),
    );
    if (venueCodes.length === 0) continue;

    const raceTitles = Array.from(cell.matchAll(/<span class="calendarRaceText">([\s\S]*?)<\/span>/gi))
      .map((item) => stripTags(item[1]).replace(/\s+/g, " ").trim())
      .filter(Boolean);

    venueCodes.forEach((code) => {
      const meta = venueMeta[code];
      events.push({
        id: `jra-${date}-${code}`,
        category: "jra",
        venueName: meta.venueName,
        region: meta.region,
        startTime: "09:50",
        endTime: "16:30",
        days: "",
        dates: date,
        officialUrl: "https://www.jra.go.jp/",
        night: "false",
        memo: `JRA公式カレンダーから取り込み。${raceTitles[0] ? `主なレース: ${raceTitles[0]}` : "開催日程"}`,
        accessNote: `${meta.venueName}の公式発表もあわせて確認してください。`,
      });
    });
  }

  return events.sort((a, b) => a.dates.localeCompare(b.dates) || a.venueName.localeCompare(b.venueName, "ja"));
}

function extractMonthHtml(html) {
  const start = html.indexOf(`<li id="${monthId}"`);
  if (start < 0) {
    throw new Error(`Month block was not found: ${monthId}`);
  }
  const nextMonthId = monthLabels[month] || "";
  const end = nextMonthId ? html.indexOf(`<li id="${nextMonthId}"`, start + 1) : html.indexOf("</ul>", start + 1);
  return html.slice(start, end > start ? end : undefined);
}

function writeReport(events) {
  const byVenue = countBy(events, (event) => event.venueName);
  const lines = [];
  lines.push(`# JRA Import ${ym}`);
  lines.push("");
  lines.push(`- Source URL: ${sourceUrl}`);
  lines.push(`- HTML: ${path.relative(rootDir, htmlPath).replace(/\\/g, "/")}`);
  lines.push(`- Output CSV: ${path.relative(rootDir, outputPath).replace(/\\/g, "/")}`);
  lines.push(`- Events: ${events.length}`);
  lines.push("");
  lines.push("## Venues");
  lines.push("");
  Object.entries(byVenue)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .forEach(([venue, count]) => {
      lines.push(`- ${venue}: ${count}`);
    });
  lines.push("");
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function unique(items) {
  return Array.from(new Set(items));
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const venueMeta = {
  tok: { venueName: "東京競馬場", region: "東京都" },
  nak: { venueName: "中山競馬場", region: "千葉県" },
  kyo: { venueName: "京都競馬場", region: "京都府" },
  han: { venueName: "阪神競馬場", region: "兵庫県" },
  chu: { venueName: "中京競馬場", region: "愛知県" },
  fuk: { venueName: "福島競馬場", region: "福島県" },
  nii: { venueName: "新潟競馬場", region: "新潟県" },
  kok: { venueName: "小倉競馬場", region: "福岡県" },
  sap: { venueName: "札幌競馬場", region: "北海道" },
  hak: { venueName: "函館競馬場", region: "北海道" },
};
