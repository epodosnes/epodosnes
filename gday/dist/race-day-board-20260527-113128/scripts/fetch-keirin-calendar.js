const fs = require("fs");
const path = require("path");
const { toCsvLine } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const incomingRoot = path.join(rootDir, "data", "incoming", "keirin");
const year = Number(getArg("--year") || new Date().getFullYear());
const month = Number(getArg("--month") || new Date().getMonth() + 1);

if (!Number.isInteger(year) || year < 1999 || year > 2100) {
  console.error(`Invalid --year: ${year}`);
  process.exit(1);
}
if (!Number.isInteger(month) || month < 1 || month > 12) {
  console.error(`Invalid --month: ${month}`);
  process.exit(1);
}

const ym = `${year}${String(month).padStart(2, "0")}`;
const workDir = path.join(incomingRoot, ym);
const htmlPath = path.join(workDir, `${ym}_raceschedule.html`);
const outputPath = path.join(workDir, `${ym}_events.csv`);
const reportPath = path.join(workDir, `${ym}_report.md`);
const sourceUrl = `https://www.keirin.jp/pc/raceschedule?scyy=${year}&scym=${String(month).padStart(2, "0")}`;

fs.mkdirSync(workDir, { recursive: true });

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});

async function main() {
  const html = await downloadHtml();
  fs.writeFileSync(htmlPath, html, "utf8");

  const events = convertSchedule(html);
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

function convertSchedule(html) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const events = [];
  const rowPattern = /<tr class="tr_h">([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(html))) {
    const rowHtml = rowMatch[1];
    const venue = extractVenue(rowHtml);
    if (!venue) continue;

    let day = 1;
    const cells = Array.from(rowHtml.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)).slice(1);
    cells.forEach((cellMatch) => {
      const attrs = cellMatch[1];
      const cellHtml = cellMatch[2];
      const colspan = Number((attrs.match(/colspan="(\d+)"/) || [])[1] || 1);

      if (/\bbk_kaisai\b/.test(attrs)) {
        const grade = extractGrade(cellHtml);
        const kubun = extractKubun(cellHtml);
        const time = resolveTimes(kubun);
        for (let offset = 0; offset < colspan && day + offset <= daysInMonth; offset += 1) {
          const date = `${year}-${String(month).padStart(2, "0")}-${String(day + offset).padStart(2, "0")}`;
          events.push({
            id: `keirin-${date}-${venue.code}`,
            category: "keirin",
            venueName: `${venue.name}競輪場`,
            region: venueRegions[venue.name] || venue.name,
            startTime: time.startTime,
            endTime: time.endTime,
            days: "",
            dates: date,
            officialUrl: "https://www.keirin.jp/",
            night: time.night ? "true" : "false",
            memo: `KEIRIN.JP公式開催日程から取り込み。${grade || "開催"} / ${time.label}`,
            accessNote: `${venue.name}競輪場の公式発表もあわせて確認してください。`,
          });
        }
      }
      day += colspan;
    });
  }

  return events.sort((a, b) => a.dates.localeCompare(b.dates) || a.venueName.localeCompare(b.venueName, "ja"));
}

function extractVenue(rowHtml) {
  const match = rowHtml.match(/jocd=(\d+)[\s\S]*?class="txt_underline bold">([\s\S]*?)<\/a>/);
  if (!match) return null;
  return {
    code: match[1],
    name: cleanText(match[2]),
  };
}

function extractGrade(cellHtml) {
  const match = cellHtml.match(/\/grade\/ico_([^".]+)\.png/);
  return match ? match[1].toUpperCase().replace(/^F(\d)$/, "F$1") : "";
}

function extractKubun(cellHtml) {
  const match = cellHtml.match(/KaisaiIcon\/ico_kaisai_(\d+)\.png/);
  return match ? match[1] : "";
}

function resolveTimes(kubun) {
  if (kubun === "4") return { startTime: "08:30", endTime: "14:30", night: false, label: "モーニング想定" };
  if (kubun === "5") return { startTime: "15:00", endTime: "21:00", night: true, label: "ナイター想定" };
  if (kubun === "6") return { startTime: "19:00", endTime: "23:30", night: true, label: "ミッドナイト想定" };
  return { startTime: "10:30", endTime: "16:30", night: false, label: "通常開催想定" };
}

function writeReport(events) {
  const byVenue = countBy(events, (event) => event.venueName);
  const nightCount = events.filter((event) => event.night === "true").length;
  const lines = [];
  lines.push(`# Keirin Import ${ym}`);
  lines.push("");
  lines.push(`- Source URL: ${sourceUrl}`);
  lines.push(`- HTML: ${path.relative(rootDir, htmlPath).replace(/\\/g, "/")}`);
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

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const venueRegions = {
  函館: "北海道",
  青森: "青森県",
  いわき平: "福島県",
  弥彦: "新潟県",
  前橋: "群馬県",
  取手: "茨城県",
  宇都宮: "栃木県",
  大宮: "埼玉県",
  西武園: "埼玉県",
  京王閣: "東京都",
  立川: "東京都",
  松戸: "千葉県",
  千葉: "千葉県",
  川崎: "神奈川県",
  平塚: "神奈川県",
  小田原: "神奈川県",
  伊東: "静岡県",
  静岡: "静岡県",
  名古屋: "愛知県",
  岐阜: "岐阜県",
  大垣: "岐阜県",
  豊橋: "愛知県",
  富山: "富山県",
  松阪: "三重県",
  四日市: "三重県",
  福井: "福井県",
  奈良: "奈良県",
  向日町: "京都府",
  和歌山: "和歌山県",
  岸和田: "大阪府",
  玉野: "岡山県",
  広島: "広島県",
  防府: "山口県",
  高松: "香川県",
  小松島: "徳島県",
  高知: "高知県",
  松山: "愛媛県",
  小倉: "福岡県",
  久留米: "福岡県",
  武雄: "佐賀県",
  佐世保: "長崎県",
  別府: "大分県",
  熊本: "熊本県",
};
