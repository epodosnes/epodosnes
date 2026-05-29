const { CATEGORY_LABELS } = require("./categories");

function buildCoverage(events) {
  const categories = Object.keys(CATEGORY_LABELS);
  const monthsByCategory = Object.fromEntries(categories.map((category) => [category, []]));
  const monthSetByCategory = Object.fromEntries(categories.map((category) => [category, new Set()]));
  const allMonths = new Set();

  events.forEach((event) => {
    const months = eventMonths(event);
    months.forEach((month) => {
      allMonths.add(month);
      if (monthSetByCategory[event.category]) {
        monthSetByCategory[event.category].add(month);
      }
    });
  });

  categories.forEach((category) => {
    monthsByCategory[category] = Array.from(monthSetByCategory[category]).sort();
  });

  const months = Array.from(allMonths).sort();
  const missingByMonth = {};
  months.forEach((month) => {
    missingByMonth[month] = categories.filter((category) => !monthSetByCategory[category].has(month));
  });

  return {
    months,
    categories: monthsByCategory,
    missingByMonth,
  };
}

function eventMonths(event) {
  const months = new Set();
  if (Array.isArray(event.dates)) {
    event.dates.forEach((date) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
        months.add(String(date).slice(0, 7));
      }
    });
  }
  return Array.from(months);
}

module.exports = {
  buildCoverage,
};
