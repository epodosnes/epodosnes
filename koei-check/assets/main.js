// 公営競技 開催チェック 表示ロジック
// data/data.js が定義する window.KOEI_DATA を読み、選択日の開催場を
// カテゴリごとのセクションに描画する。

(function () {
  "use strict";

  var CATEGORY_ORDER = ["jra", "nar", "boat", "keirin", "auto"];
  var HIGH_GRADE_PATTERN = /SG|PG1|G1|G2|G3|JpnI|重賞/;

  var datePicker = document.getElementById("date-picker");
  var dateLabel = document.getElementById("selected-date-label");

  // 端末のローカル日付を YYYY-MM-DD で返す (toISOString は UTC になるので使わない)
  function localDateString(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function formatLabel(dateStr) {
    var parts = dateStr.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return parts[0] + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日 (" +
      weekdays[date.getDay()] + ")";
  }

  function render(dateStr) {
    dateLabel.textContent = formatLabel(dateStr);

    var dayData = (window.KOEI_DATA && window.KOEI_DATA.days &&
      window.KOEI_DATA.days[dateStr]) || null;

    CATEGORY_ORDER.forEach(function (category) {
      var section = document.querySelector(
        '.category[data-category="' + category + '"]');
      if (!section) return;
      var list = section.querySelector(".venue-list");
      list.innerHTML = "";

      // 日付キー自体が無い、またはカテゴリキーが無い → 未取得
      // カテゴリキーが空配列 → 確認済みで開催なし
      if (dayData === null || !(category in dayData)) {
        list.innerHTML = '<li class="no-data">データ未取得</li>';
        return;
      }

      var items = dayData[category];

      if (items.length === 0) {
        list.innerHTML = '<li class="no-data">開催なし</li>';
        return;
      }

      items.forEach(function (item) {
        var li = document.createElement("li");

        var name = document.createElement("span");
        name.className = "venue-name";
        name.textContent = item.venue;
        li.appendChild(name);

        if (item.grade) {
          var grade = document.createElement("span");
          grade.className = "venue-grade";
          if (HIGH_GRADE_PATTERN.test(item.grade)) {
            grade.className += " grade-high";
          }
          grade.textContent = item.grade;
          li.appendChild(grade);
        }

        if (item.day) {
          var day = document.createElement("span");
          day.className = "venue-day";
          day.textContent = item.day;
          li.appendChild(day);
        }

        list.appendChild(li);
      });
    });
  }

  function shiftDay(offset) {
    var parts = datePicker.value.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    date.setDate(date.getDate() + offset);
    datePicker.value = localDateString(date);
    render(datePicker.value);
  }

  document.getElementById("prev-day").addEventListener("click", function () {
    shiftDay(-1);
  });
  document.getElementById("next-day").addEventListener("click", function () {
    shiftDay(1);
  });
  document.getElementById("today-btn").addEventListener("click", function () {
    datePicker.value = localDateString(new Date());
    render(datePicker.value);
  });
  datePicker.addEventListener("change", function () {
    if (datePicker.value) render(datePicker.value);
  });

  var updatedAt = document.getElementById("updated-at");
  if (window.KOEI_DATA && window.KOEI_DATA.updatedAt) {
    updatedAt.textContent = "データ最終更新: " + window.KOEI_DATA.updatedAt;
  }

  // 初期表示は今日
  datePicker.value = localDateString(new Date());
  render(datePicker.value);
})();
