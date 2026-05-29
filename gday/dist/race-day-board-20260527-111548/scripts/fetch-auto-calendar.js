const fs = require("fs");
const path = require("path");
const { toCsvLine } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const incomingRoot = path.join(rootDir, "data", "incoming", "auto");
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
const ymParam = `${year}-${String(month).padStart(2, "0")}`;
const workDir = path.join(incomingRoot, ym);
const jsonPath = path.join(workDir, `${ym}_calendar.json`);
const outputPath = path.join(workDir, `${ym}_events.csv`);
const reportPath = path.join(workDir, `${ym}_report.md`);
const sourceUrl = `https://autorace.jp/race_info/XML/Calendar/?date=${ymParam}`;

fs.mkdirSync(workDir, { recursive: true });

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});

async function main() {
  const data = await downloadCalendar();
  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  const events = convertCalendar(data);
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

  console.log(`Wrote ${path.relative(rootDir, jsonPath)}`);
  console.log(`Wrote ${path.relative(rootDir, outputPath)} (${events.length} events)`);
  console.log(`Wrote ${path.relative(rootDir, reportPath)}`);
}

async function downloadCalendar() {
  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": "RaceDayBoard/1.0",
      accept: "application/json,*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!data || data.result !== "Success" || !Array.isArray(data.body)) {
    throw new Error("Calendar API returned no usable body.");
  }
  return data;
}

function convertCalendar(data) {
  const events = [];
  data.body.forEach((place) => {
    const meta = venueMeta[place.placeCode] || {
      venueName: `${compactPlaceName(place.placeName)}オートレース場`,
      region: compactPlaceName(place.placeName),
      officialUrl: "https://autorace.jp/",
    };

    place.calendar.forEach((day) => {
      if (!day.date || !day.date.startsWith(ymParam)) return;
      if (!day.race || Array.isArray(day.race)) return;

      const race = day.race;
      const nighterName = race.nighterName || nighterNameByCode[race.nighterCode] || "";
      const startTime = normalizeTime(race.liveStartTime) || fallbackTime(nighterName).startTime;
      const endTime = normalizeTime(race.liveEndTime) || fallbackTime(nighterName).endTime;
      const night = isNight(nighterName, startTime, endTime);
      const period = Array.isArray(race.liveAllTime) ? race.liveAllTime.join(" / ") : "";

      events.push({
        id: `auto-${day.date}-${place.placeCode}`,
        category: "auto",
        venueName: meta.venueName,
        region: meta.region,
        startTime,
        endTime,
        days: "",
        dates: day.date,
        officialUrl: meta.officialUrl,
        night: night ? "true" : "false",
        memo: `AutoRace.JP公式データから取り込み。${race.title || race.titleShort || race.gradeName || "開催日程"}${period ? ` / ${period}` : ""}`,
        accessNote: `${meta.venueName}の公式発表もあわせて確認してください。`,
      });
    });
  });

  return events.sort((a, b) => a.dates.localeCompare(b.dates) || a.venueName.localeCompare(b.venueName, "ja"));
}

function writeReport(events) {
  const byVenue = countBy(events, (event) => event.venueName);
  const nightCount = events.filter((event) => event.night === "true").length;
  const lines = [];
  lines.push(`# Auto Import ${ym}`);
  lines.push("");
  lines.push(`- Source URL: ${sourceUrl}`);
  lines.push(`- JSON: ${path.relative(rootDir, jsonPath).replace(/\\/g, "/")}`);
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

function compactPlaceName(value) {
  return String(value || "").replace(/\s+/g, "");
}

function normalizeTime(value) {
  const text = String(value || "").trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : "";
}

function fallbackTime(nighterName) {
  if (nighterName.includes("ミッドナイト")) return { startTime: "19:00", endTime: "23:30" };
  if (nighterName.includes("ナイター")) return { startTime: "15:00", endTime: "21:00" };
  if (nighterName.includes("薄暮")) return { startTime: "14:00", endTime: "19:00" };
  if (nighterName.includes("モーニング")) return { startTime: "08:30", endTime: "14:30" };
  return { startTime: "10:30", endTime: "16:55" };
}

function isNight(nighterName, startTime, endTime) {
  return nighterName.includes("ナイター") || nighterName.includes("ミッドナイト") || endTime >= "19:00";
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const nighterNameByCode = {
  0: "デイ",
  1: "ナイター",
  2: "ミッドナイト",
  3: "薄暮",
  4: "モーニング",
};

const venueMeta = {
  2: { venueName: "川口オートレース場", region: "埼玉県", officialUrl: "https://autorace.jp/kawaguchi/" },
  3: { venueName: "伊勢崎オートレース場", region: "群馬県", officialUrl: "https://autorace.jp/isesaki/" },
  4: { venueName: "浜松オートレース場", region: "静岡県", officialUrl: "https://autorace.jp/hamamatsu/" },
  5: { venueName: "飯塚オートレース場", region: "福岡県", officialUrl: "https://autorace.jp/iizuka/" },
  6: { venueName: "山陽オートレース場", region: "山口県", officialUrl: "https://autorace.jp/sanyou/" },
  12: { venueName: "川口オートレース場", region: "埼玉県", officialUrl: "https://autorace.jp/kawaguchi/" },
};
