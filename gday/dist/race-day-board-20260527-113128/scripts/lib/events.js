const { addDays, formatDateHeading, startOfDay, toIsoDate } = require("./date");

function isEventOnDate(event, isoDate, day) {
  const dates = Array.isArray(event.dates) ? event.dates : [];
  const days = Array.isArray(event.days) ? event.days : [];
  return dates.includes(isoDate) || days.includes(day);
}

function eventsForDate(events, date) {
  const isoDate = toIsoDate(date);
  const day = date.getDay();
  return events.filter((event) => isEventOnDate(event, isoDate, day));
}

function findNextEventDate(event, options = {}) {
  const lookupDays = options.lookupDays || 60;
  const startDate = startOfDay(options.startDate || new Date());

  for (let offset = 0; offset < lookupDays; offset += 1) {
    const date = addDays(startDate, offset);
    const isoDate = toIsoDate(date);
    if (isEventOnDate(event, isoDate, date.getDay())) {
      return {
        date,
        isoDate,
        label: formatDateHeading(date),
      };
    }
  }

  return null;
}

module.exports = {
  isEventOnDate,
  eventsForDate,
  findNextEventDate,
};
