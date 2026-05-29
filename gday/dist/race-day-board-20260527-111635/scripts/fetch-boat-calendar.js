const fs = require("fs");
const path = require("path");
const { toCsvLine } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const incomingRoot = path.join(rootDir, "data", "incoming", "boat");
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
const workDir = path.join(incomingRoot, ym);
const rawDir = path.join(workDir, "daily-html");
const outputPath = path.join(workDir, `${ym}_events.csv`);
const reportPath = path.join(workDir, `${ym}_report.md`);

fs.mkdirSync(rawDir, { recursive: true });

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});

async function main() {
  const events = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const ymd = date.replace(/-/g, "");
    const html = await downloadDailyHtml(ymd);
    fs.writeFileSync(path.join(rawDir, `${ymd}.html`), html, "utf8");
    events.push(...convertDailyHtml(html, date));
  }

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

  console.log(`Wrote ${path.relative(rootDir, outputPath)} (${events.length} events)`);
  console.log(`Wrote ${path.relative(rootDir, reportPath)}`);
}

async function downloadDailyHtml(ymd) {
  const url = `https://www.boatrace.jp/owpc/pc/race/index?hd=${ymd}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "RaceDayBoard/1.0",
      accept: "text/html,*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`Download failed ${ymd}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function convertDailyHtml(html, date) {
  const blocks = Array.from(html.matchAll(/<tbody>([\s\S]*?)<\/tbody>/gi)).map((match) => match[1]);
  return blocks
    .map((block) => convertBlock(block, date))
    .filter(Boolean)
    .sort((a, b) => a.venueName.localeCompare(b.venueName, "ja"));
}

function convertBlock(block, date) {
  const venueMatch = block.match(/text_place1_(\d{2})\.png"[^>]*alt="([^"]+)"/);
  if (!venueMatch) return null;

  const jcd = venueMatch[1];
  const venueShortName = decodeHtml(venueMatch[2]);
  const meta = venueMeta[jcd] || {
    venueName: `ボートレース${venueShortName}`,
    region: venueShortName,
  };
  const title = decodeHtml(extractTitle(block));
  const period = decodeHtml(extractPeriod(block));
  const officialUrl = extractOfficialUrl(block) || "https://www.boatrace.jp/";
  const timeClass = extractTimeClass(block);
  const times = resolveTimes(timeClass);

  return {
    id: `boat-${date}-${jcd}`,
    category: "boat",
    venueName: meta.venueName,
    region: meta.region,
    startTime: times.startTime,
    endTime: times.endTime,
    days: "",
    dates: date,
    officialUrl,
    night: times.night ? "true" : "false",
    memo: `BOAT RACE公式データから取り込み。${title || "開催日程"}${period ? ` / ${period}` : ""}`,
    accessNote: `${meta.venueName}の公式発表もあわせて確認してください。`,
  };
}

function extractTitle(block) {
  const match = block.match(/<td class="is-alignL is-fBold is-p10-7" rowspan="2">([\s\S]*?)<\/td>/i);
  return stripTags(match ? match[1] : "").trim();
}

function extractPeriod(block) {
  const matches = Array.from(block.matchAll(/<td rowspan="2">([\s\S]*?)<\/td>/gi));
  const period = matches.map((match) => stripTags(match[1]).trim()).find((value) => /\d{1,2}\/\d{1,2}-\d{1,2}\/\d{1,2}/.test(value));
  return period || "";
}

function extractOfficialUrl(block) {
  const match = block.match(/MultiOpen\('([^']+)'/);
  return match ? decodeHtml(match[1]) : "";
}

function extractTimeClass(block) {
  const match = block.match(/<td rowspan="2" class="(is-[a-z]+)"><\/td>\s*<td class="is-alignL is-fBold is-p10-7"/i);
  return match ? match[1] : "";
}

function resolveTimes(timeClass) {
  if (timeClass === "is-nighter") return { startTime: "15:00", endTime: "20:50", night: true };
  if (timeClass === "is-summer") return { startTime: "12:00", endTime: "18:30", night: false };
  if (timeClass === "is-morning") return { startTime: "08:30", endTime: "14:30", night: false };
  if (timeClass === "is-midnight") return { startTime: "17:00", endTime: "23:30", night: true };
  return { startTime: "10:30", endTime: "16:30", night: false };
}

function writeReport(events) {
  const byVenue = countBy(events, (event) => event.venueName);
  const nightCount = events.filter((event) => event.night === "true").length;
  const lines = [];
  lines.push(`# Boat Import ${ym}`);
  lines.push("");
  lines.push(`- Source URL pattern: https://www.boatrace.jp/owpc/pc/race/index?hd=YYYYMMDD`);
  lines.push(`- Daily HTML: ${path.relative(rootDir, rawDir).replace(/\\/g, "/")}`);
  lines.push(`- Output CSV: ${path.relative(rootDir, outputPath).replace(/\\/g, "/")}`);
  lines.push(`- Events: ${events.length}`);
  lines.push(`- Night-like events: ${nightCount}`);
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

function stripTags(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const venueMeta = {
  "01": { venueName: "ボートレース桐生", region: "群馬県" },
  "02": { venueName: "ボートレース戸田", region: "埼玉県" },
  "03": { venueName: "ボートレース江戸川", region: "東京都" },
  "04": { venueName: "ボートレース平和島", region: "東京都" },
  "05": { venueName: "ボートレース多摩川", region: "東京都" },
  "06": { venueName: "ボートレース浜名湖", region: "静岡県" },
  "07": { venueName: "ボートレース蒲郡", region: "愛知県" },
  "08": { venueName: "ボートレース常滑", region: "愛知県" },
  "09": { venueName: "ボートレース津", region: "三重県" },
  "10": { venueName: "ボートレース三国", region: "福井県" },
  "11": { venueName: "ボートレースびわこ", region: "滋賀県" },
  "12": { venueName: "ボートレース住之江", region: "大阪府" },
  "13": { venueName: "ボートレース尼崎", region: "兵庫県" },
  "14": { venueName: "ボートレース鳴門", region: "徳島県" },
  "15": { venueName: "ボートレース丸亀", region: "香川県" },
  "16": { venueName: "ボートレース児島", region: "岡山県" },
  "17": { venueName: "ボートレース宮島", region: "広島県" },
  "18": { venueName: "ボートレース徳山", region: "山口県" },
  "19": { venueName: "ボートレース下関", region: "山口県" },
  "20": { venueName: "ボートレース若松", region: "福岡県" },
  "21": { venueName: "ボートレース芦屋", region: "福岡県" },
  "22": { venueName: "ボートレース福岡", region: "福岡県" },
  "23": { venueName: "ボートレース唐津", region: "佐賀県" },
  "24": { venueName: "ボートレース大村", region: "長崎県" },
};
