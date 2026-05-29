function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateHeading(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getDataAgeDays(value, now = new Date()) {
  if (!value) return null;
  const generatedAtDate = new Date(value);
  if (Number.isNaN(generatedAtDate.getTime())) return null;
  const diffMs = now.getTime() - generatedAtDate.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

module.exports = {
  startOfDay,
  addDays,
  toIsoDate,
  formatDateHeading,
  getDataAgeDays,
};
