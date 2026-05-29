const raceDayData = window.RaceDayData || createFallbackData();
const { categories, categoryMeta, fetchScheduleForDate } = raceDayData;

const state = {
  date: toIsoDate(new Date()),
  category: "all",
  sort: "time",
};

const els = {
  todayBadge: document.querySelector("#todayBadge"),
  dateInput: document.querySelector("#dateInput"),
  prevDate: document.querySelector("#prevDate"),
  nextDate: document.querySelector("#nextDate"),
  nextWeekend: document.querySelector("#nextWeekend"),
  summaryGrid: document.querySelector("#summaryGrid"),
  categoryTabs: document.querySelector("#categoryTabs"),
  sortSelect: document.querySelector("#sortSelect"),
  listTitle: document.querySelector("#listTitle"),
  listDescription: document.querySelector("#listDescription"),
  eventList: document.querySelector("#eventList"),
  summaryTemplate: document.querySelector("#summaryTemplate"),
  eventTemplate: document.querySelector("#eventTemplate"),
};

init();

function init() {
  els.todayBadge.textContent = formatLongDate(new Date());
  els.dateInput.value = state.date;
  els.sortSelect.value = state.sort;

  renderCategoryTabs();
  bindEvents();
  render();
}

function bindEvents() {
  els.dateInput.addEventListener("change", (event) => {
    state.date = event.target.value || toIsoDate(new Date());
    render();
  });

  els.prevDate.addEventListener("click", () => shiftDate(-1));
  els.nextDate.addEventListener("click", () => shiftDate(1));

  document.querySelectorAll("[data-offset]").forEach((button) => {
    button.addEventListener("click", () => {
      const date = new Date();
      date.setDate(date.getDate() + Number(button.dataset.offset));
      setDate(date);
    });
  });

  els.nextWeekend.addEventListener("click", () => {
    setDate(getNextWeekend(new Date()));
  });

  els.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });
}

function render() {
  const events = fetchScheduleForDate(state.date);
  const filteredEvents =
    state.category === "all"
      ? events
      : events.filter((event) => event.category === state.category);

  renderSummary(events);
  renderList(sortEvents(filteredEvents, state.sort));
  updateMeta(filteredEvents.length);
  syncActiveTabs();
}

function renderSummary(events) {
  els.summaryGrid.replaceChildren();

  categories
    .filter((category) => category.id !== "all")
    .forEach((category) => {
      const count = events.filter((event) => event.category === category.id).length;
      const node = els.summaryTemplate.content.firstElementChild.cloneNode(true);
      node.style.setProperty("--accent", categoryMeta[category.id].accent);
      node.querySelector(".summary-label").textContent = category.label;
      node.querySelector(".summary-count").textContent = `${count}場`;
      node.querySelector(".summary-note").textContent = count > 0 ? "開催あり" : "開催なし";
      els.summaryGrid.append(node);
    });
}

function renderCategoryTabs() {
  els.categoryTabs.replaceChildren();

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = category.id;
    button.textContent = category.label;
    button.addEventListener("click", () => {
      state.category = category.id;
      render();
    });
    els.categoryTabs.append(button);
  });
}

function renderList(events) {
  els.eventList.replaceChildren();

  if (events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<strong>この条件の開催はありません</strong><span>日付やカテゴリを変えて確認してください。</span>";
    els.eventList.append(empty);
    return;
  }

  events.forEach((event) => {
    const meta = categoryMeta[event.category];
    const node = els.eventTemplate.content.firstElementChild.cloneNode(true);
    node.style.setProperty("--accent", meta.accent);
    node.querySelector(".category-pill").textContent = meta.label;
    node.querySelector("h3").textContent = event.venueName;
    node.querySelector(".event-title").textContent = event.title;
    node.querySelector(".event-time").textContent = `${event.startTime} - ${event.endTime}`;
    node.querySelector(".event-region").textContent = event.region;
    node.querySelector(".event-status").textContent = event.status;
    node.querySelector(".official-link").href = event.officialUrl || meta.officialUrl;
    els.eventList.append(node);
  });
}

function updateMeta(count) {
  const category = categories.find((item) => item.id === state.category);
  els.listTitle.textContent = `${category.label}の開催一覧`;
  els.listDescription.textContent = `${formatLongDate(new Date(`${state.date}T00:00:00`))} / ${count}件`;
}

function syncActiveTabs() {
  els.categoryTabs.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === state.category);
  });
}

function sortEvents(events, sort) {
  return [...events].sort((a, b) => {
    if (sort === "category") {
      return categoryMeta[a.category].label.localeCompare(categoryMeta[b.category].label, "ja");
    }

    if (sort === "region") {
      return a.region.localeCompare(b.region, "ja");
    }

    return a.startTime.localeCompare(b.startTime);
  });
}

function shiftDate(days) {
  const date = new Date(`${state.date}T00:00:00`);
  date.setDate(date.getDate() + days);
  setDate(date);
}

function setDate(date) {
  state.date = toIsoDate(date);
  els.dateInput.value = state.date;
  render();
}

function getNextWeekend(date) {
  const next = new Date(date);
  const day = next.getDay();
  const distanceToSaturday = day === 6 ? 0 : (6 - day + 7) % 7;
  next.setDate(next.getDate() + distanceToSaturday);
  return next;
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createFallbackData() {
  const fallbackCategories = [
    { id: "all", label: "すべて" },
    { id: "jra", label: "中央競馬" },
    { id: "local-keiba", label: "地方競馬" },
    { id: "boat", label: "ボートレース" },
    { id: "auto", label: "オートレース" },
  ];

  const fallbackMeta = {
    jra: { label: "中央競馬", accent: "#246bfe", officialUrl: "https://www.jra.go.jp/" },
    "local-keiba": { label: "地方競馬", accent: "#b94700", officialUrl: "https://www.keiba.go.jp/" },
    boat: { label: "ボートレース", accent: "#008b8b", officialUrl: "https://www.boatrace.jp/" },
    auto: { label: "オートレース", accent: "#7d4cc2", officialUrl: "https://autorace.jp/" },
  };

  const fallbackEvents = [
    {
      id: "sample-jra-tokyo",
      category: "jra",
      venueName: "東京競馬場",
      title: "サンプル開催",
      region: "東京都",
      startTime: "09:50",
      endTime: "16:30",
      status: "開催予定",
      officialUrl: "https://www.jra.go.jp/",
    },
    {
      id: "sample-local-oi",
      category: "local-keiba",
      venueName: "大井競馬場",
      title: "サンプル開催",
      region: "東京都",
      startTime: "14:20",
      endTime: "20:50",
      status: "開催予定",
      officialUrl: "https://www.keiba.go.jp/",
    },
    {
      id: "sample-boat-suminoe",
      category: "boat",
      venueName: "ボートレース住之江",
      title: "サンプル開催",
      region: "大阪府",
      startTime: "15:00",
      endTime: "20:45",
      status: "開催予定",
      officialUrl: "https://www.boatrace.jp/",
    },
    {
      id: "sample-auto-kawaguchi",
      category: "auto",
      venueName: "川口オートレース場",
      title: "サンプル開催",
      region: "埼玉県",
      startTime: "10:40",
      endTime: "16:50",
      status: "開催予定",
      officialUrl: "https://autorace.jp/",
    },
  ];

  return {
    categories: fallbackCategories,
    categoryMeta: fallbackMeta,
    fetchScheduleForDate(date) {
      return fallbackEvents.map((event) => ({ ...event, date }));
    },
  };
}
