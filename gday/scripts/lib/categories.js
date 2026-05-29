const CATEGORY_LABELS = {
  jra: "\u4e2d\u592e\u7af6\u99ac",
  "local-keiba": "\u5730\u65b9\u7af6\u99ac",
  boat: "\u30dc\u30fc\u30c8\u30ec\u30fc\u30b9",
  auto: "\u30aa\u30fc\u30c8\u30ec\u30fc\u30b9",
  keirin: "\u7af6\u8f2a",
};

const ALLOWED_CATEGORIES = new Set(Object.keys(CATEGORY_LABELS));

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

module.exports = {
  ALLOWED_CATEGORIES,
  CATEGORY_LABELS,
  getCategoryLabel,
};
