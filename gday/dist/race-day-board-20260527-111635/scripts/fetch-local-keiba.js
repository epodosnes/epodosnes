const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { parseCsv, toCsvLine } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const incomingRoot = path.join(rootDir, "data", "incoming", "local-keiba");
const year = Number(getArg("--year") || new Date().getFullYear());
const month = Number(getArg("--month") || new Date().getMonth() + 1);

if (!Number.isInteger(year) || year < 1998 || year > 2100) {
  console.error(`Invalid --year: ${year}`);
  process.exit(1);
}
if (!Number.isInteger(month) || month < 1 || month > 12) {
  console.error(`Invalid --month: ${month}`);
  process.exit(1);
}

const ym = `${year}${String(month).padStart(2, "0")}`;
const workDir = path.join(incomingRoot, ym);
const extractDir = path.join(workDir, "extracted");
const zipPath = path.join(workDir, `${ym}_race.zip`);
const rawCsvPath = path.join(workDir, `${ym}_racelist_raw.csv`);
const outputPath = path.join(workDir, `${ym}_events.csv`);
const reportPath = path.join(workDir, `${ym}_report.md`);
const sourceUrl = `https://www.keiba.go.jp/KeibaWeb/DataDownload/RaceDataDownload?k_month=${month}&k_year=${year}&type=monthly`;

fs.mkdirSync(workDir, { recursive: true });
fs.mkdirSync(extractDir, { recursive: true });

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});

async function main() {
  await downloadZip();
  extractZip();

  const raceListPath = findRaceListCsv(extractDir);
  if (!raceListPath) {
    throw new Error("Race list CSV was not found in downloaded ZIP.");
  }

  const raceListText = decodeCsv(fs.readFileSync(raceListPath));
  fs.writeFileSync(rawCsvPath, raceListText, "utf8");

  const events = convertRaceList(raceListText);
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
  writeReport(events, raceListPath);

  console.log(`Downloaded ${path.relative(rootDir, zipPath)}`);
  console.log(`Wrote ${path.relative(rootDir, rawCsvPath)}`);
  console.log(`Wrote ${path.relative(rootDir, outputPath)} (${events.length} events)`);
  console.log(`Wrote ${path.relative(rootDir, reportPath)}`);
}

async function downloadZip() {
  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": "RaceDayBoard/1.0",
      accept: "application/zip,application/octet-stream,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) {
    throw new Error(`Downloaded file is too small: ${bytes.length} bytes`);
  }
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("Downloaded file is not a ZIP. The official data may not be available for this month yet.");
  }
  fs.writeFileSync(zipPath, bytes);
}

function extractZip() {
  const command = [
    "Expand-Archive",
    "-LiteralPath",
    quotePowerShell(zipPath),
    "-DestinationPath",
    quotePowerShell(extractDir),
    "-Force",
  ].join(" ");
  const result = spawnSync("powershell", ["-NoProfile", "-Command", command], {
    cwd: rootDir,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`ZIP extraction failed: ${result.stderr || result.stdout}`);
  }
}

function findRaceListCsv(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findRaceListCsv(entryPath);
      if (nested) return nested;
    } else if (/racelist\.csv$/i.test(entry.name)) {
      return entryPath;
    }
  }
  return "";
}

function decodeCsv(buffer) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const replacementCount = (utf8.match(/\uFFFD/g) || []).length;
  if (replacementCount <= 3) {
    return utf8.replace(/^\uFEFF/, "");
  }
  return new TextDecoder("shift_jis").decode(buffer).replace(/^\uFEFF/, "");
}

function convertRaceList(csvText) {
  const parsed = parseCsv(csvText).filter((row) => row.some((cell) => String(cell).trim() !== ""));
  if (parsed.length < 2) {
    throw new Error("Race list CSV has no data rows.");
  }

  const rows = parsed.slice(hasHeader(parsed[0]) ? 1 : 0);
  const groups = new Map();
  rows.forEach((row) => {
    const venue = clean(row[0]);
    const dateValue = clean(row[1]);
    const startValue = clean(row[3]);
    if (!venue || !/^\d{8}$/.test(dateValue) || !/^\d{3,4}$/.test(startValue)) {
      return;
    }

    const isoDate = `${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}`;
    const key = `${venue}:${isoDate}`;
    if (!groups.has(key)) {
      groups.set(key, {
        venue,
        date: isoDate,
        starts: [],
        raceNames: [],
      });
    }
    const group = groups.get(key);
    group.starts.push(toTime(startValue));
    const raceName = clean(row[5]);
    if (raceName) {
      group.raceNames.push(raceName);
    }
  });

  return Array.from(groups.values())
    .sort((a, b) => a.date.localeCompare(b.date) || a.venue.localeCompare(b.venue, "ja"))
    .map((group) => {
      const starts = group.starts.sort();
      const startTime = starts[0];
      const endTime = addMinutes(starts[starts.length - 1], 35);
      const title = group.raceNames[0] || "地方競馬開催";
      return {
        id: `local-keiba-${group.date}-${slugVenue(group.venue)}`,
        category: "local-keiba",
        venueName: toVenueName(group.venue),
        region: venueRegions[group.venue] || group.venue,
        startTime,
        endTime,
        days: "",
        dates: group.date,
        officialUrl: venueUrls[group.venue] || "https://www.keiba.go.jp/",
        night: isNight(startTime, endTime) ? "true" : "false",
        memo: `地方競馬公式データから取り込み。代表レース: ${title}`,
        accessNote: `${group.venue}の公式発表もあわせて確認してください。`,
      };
    });
}

function writeReport(events, raceListPath) {
  const byVenue = countBy(events, (event) => event.venueName);
  const lines = [];
  lines.push(`# Local Keiba Import ${ym}`);
  lines.push("");
  lines.push(`- Source URL: ${sourceUrl}`);
  lines.push(`- ZIP: ${path.relative(rootDir, zipPath).replace(/\\/g, "/")}`);
  lines.push(`- Race list CSV: ${path.relative(rootDir, raceListPath).replace(/\\/g, "/")}`);
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

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function hasHeader(row) {
  return row.some((cell) => String(cell).includes("競馬場") || String(cell).includes("競走年月日"));
}

function clean(value) {
  return String(value || "").trim();
}

function toTime(value) {
  const text = String(value).padStart(4, "0");
  return `${text.slice(0, 2)}:${text.slice(2, 4)}`;
}

function addMinutes(time, minutes) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isNight(startTime, endTime) {
  return startTime >= "14:00" || endTime >= "19:00";
}

function slugVenue(value) {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u3040-\u30ff\u3400-\u9fff-]/g, "");
}

function toVenueName(value) {
  if (value.endsWith("競馬場")) return value;
  return `${value}競馬場`;
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const venueRegions = {
  帯広ば: "北海道",
  門別: "北海道",
  盛岡: "岩手県",
  水沢: "岩手県",
  浦和: "埼玉県",
  船橋: "千葉県",
  大井: "東京都",
  川崎: "神奈川県",
  金沢: "石川県",
  笠松: "岐阜県",
  名古屋: "愛知県",
  園田: "兵庫県",
  姫路: "兵庫県",
  高知: "高知県",
  佐賀: "佐賀県",
};

const venueUrls = {
  帯広ば: "https://banei-keiba.or.jp/",
  門別: "https://www.hokkaidokeiba.net/",
  盛岡: "https://www.iwatekeiba.or.jp/",
  水沢: "https://www.iwatekeiba.or.jp/",
  浦和: "https://www.urawa-keiba.jp/",
  船橋: "https://www.f-keiba.com/",
  大井: "https://www.tokyocitykeiba.com/",
  川崎: "https://www.kawasaki-keiba.jp/",
  金沢: "https://www.kanazawakeiba.com/",
  笠松: "https://www.kasamatsu-keiba.com/",
  名古屋: "https://www.nagoyakeiba.com/",
  園田: "https://www.sonoda-himeji.jp/",
  姫路: "https://www.sonoda-himeji.jp/",
  高知: "https://www.keiba.or.jp/",
  佐賀: "https://www.sagakeiba.net/",
};
