const categories = [
  { id: "all", label: "すべて", shortLabel: "全" },
  { id: "jra", label: "中央競馬", shortLabel: "JRA" },
  { id: "local-keiba", label: "地方競馬", shortLabel: "地方" },
  { id: "boat", label: "ボートレース", shortLabel: "艇" },
  { id: "auto", label: "オートレース", shortLabel: "オート" },
];

const categoryMeta = {
  jra: {
    label: "中央競馬",
    accent: "#246bfe",
    officialUrl: "https://www.jra.go.jp/",
  },
  "local-keiba": {
    label: "地方競馬",
    accent: "#b94700",
    officialUrl: "https://www.keiba.go.jp/",
  },
  boat: {
    label: "ボートレース",
    accent: "#008b8b",
    officialUrl: "https://www.boatrace.jp/",
  },
  auto: {
    label: "オートレース",
    accent: "#7d4cc2",
    officialUrl: "https://autorace.jp/",
  },
};

const baseEvents = [
  {
    id: "jra-tokyo",
    category: "jra",
    venueName: "東京競馬場",
    title: "春季東京開催",
    region: "東京都",
    startTime: "09:50",
    endTime: "16:30",
    officialUrl: "https://www.jra.go.jp/facilities/race/tokyo/",
    recurring: { daysOfWeek: [0, 6] },
  },
  {
    id: "jra-kyoto",
    category: "jra",
    venueName: "京都競馬場",
    title: "春季京都開催",
    region: "京都府",
    startTime: "09:50",
    endTime: "16:30",
    officialUrl: "https://www.jra.go.jp/facilities/race/kyoto/",
    recurring: { daysOfWeek: [0, 6] },
  },
  {
    id: "local-oi",
    category: "local-keiba",
    venueName: "大井競馬場",
    title: "東京シティ競馬",
    region: "東京都",
    startTime: "14:20",
    endTime: "20:50",
    officialUrl: "https://www.tokyocitykeiba.com/",
    recurring: { daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    id: "local-monbetsu",
    category: "local-keiba",
    venueName: "門別競馬場",
    title: "ホッカイドウ競馬",
    region: "北海道",
    startTime: "14:30",
    endTime: "20:40",
    officialUrl: "https://www.hokkaidokeiba.net/",
    recurring: { daysOfWeek: [2, 3, 4] },
  },
  {
    id: "boat-suminoe",
    category: "boat",
    venueName: "ボートレース住之江",
    title: "ナイター開催",
    region: "大阪府",
    startTime: "15:00",
    endTime: "20:45",
    officialUrl: "https://www.boatrace-suminoe.jp/",
    recurring: { everyNthDay: 2 },
  },
  {
    id: "boat-heiwajima",
    category: "boat",
    venueName: "ボートレース平和島",
    title: "一般戦",
    region: "東京都",
    startTime: "10:30",
    endTime: "16:30",
    officialUrl: "https://www.heiwajima.gr.jp/",
    recurring: { everyNthDay: 3 },
  },
  {
    id: "boat-fukuoka",
    category: "boat",
    venueName: "ボートレース福岡",
    title: "一般戦",
    region: "福岡県",
    startTime: "10:20",
    endTime: "16:20",
    officialUrl: "https://www.boatrace-fukuoka.com/",
    recurring: { everyNthDay: 4 },
  },
  {
    id: "auto-kawaguchi",
    category: "auto",
    venueName: "川口オートレース場",
    title: "普通開催",
    region: "埼玉県",
    startTime: "10:40",
    endTime: "16:50",
    officialUrl: "https://www.kawaguchiauto.jp/",
    recurring: { everyNthDay: 3 },
  },
  {
    id: "auto-iizuka",
    category: "auto",
    venueName: "飯塚オートレース場",
    title: "ミッドナイト開催",
    region: "福岡県",
    startTime: "19:00",
    endTime: "23:30",
    officialUrl: "https://www.iizuka-auto.jp/",
    recurring: { everyNthDay: 5 },
  },
];

function fetchScheduleForDate(date) {
  const selected = new Date(`${date}T00:00:00`);
  const day = selected.getDay();
  const ordinal = Math.floor(selected.getTime() / 86400000);

  return baseEvents
    .filter((event) => {
      if (event.recurring.daysOfWeek) {
        return event.recurring.daysOfWeek.includes(day);
      }

      return ordinal % event.recurring.everyNthDay === 0;
    })
    .map((event) => ({
      ...event,
      date,
      status: resolveStatus(date, event.startTime, event.endTime),
    }));
}

function resolveStatus(date, startTime, endTime) {
  const now = new Date();
  const today = toIsoDate(now);

  if (date < today) return "終了";
  if (date > today) return "開催予定";

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);

  if (now < start) return "開催予定";
  if (now > end) return "終了";
  return "開催中";
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

window.RaceDayData = {
  categories,
  categoryMeta,
  fetchScheduleForDate,
};
