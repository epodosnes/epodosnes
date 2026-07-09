// 公営競技 開催データ
// 手動更新ファイル: 更新時はこのファイルを書き換えて GitHub に push する。
// 構造:
//   KOEI_DATA.updatedAt : このファイルを最後に更新した日付 (JST)
//   KOEI_DATA.days      : "YYYY-MM-DD" をキーに、その日のカテゴリ別開催情報を持つ
//     - 日付キー自体が無い       → 全カテゴリ「未取得」表示
//     - カテゴリキーが無い       → そのカテゴリのみ「未取得」表示
//     - カテゴリキーが空配列 [] → 「開催なし」表示 (確認済みで開催が無い)
//   カテゴリ: jra (中央競馬) / nar (地方競馬) / boat (ボートレース) / auto (オートレース)
//   各開催エントリ:
//     venue : 開催場名
//     grade : グレードやシリーズ名 (一般開催は "一般")。SG/G1/G2/G3/重賞 を含むと赤色強調
//     day   : 開催日目 (例 "2日目", "最終日")。不明なら null
window.KOEI_DATA = {
  updatedAt: "2026-07-09",
  days: {
    "2026-07-08": {
      jra: [],
      nar: [
        { venue: "帯広(ばんえい)", grade: "一般", day: null },
        { venue: "門別", grade: "一般", day: null },
        { venue: "盛岡", grade: "一般", day: null },
        { venue: "川崎", grade: "ダート交流重賞", day: null },
        { venue: "笠松", grade: "一般", day: null }
      ],
      boat: [
        { venue: "桐生", grade: "一般", day: "5日目" },
        { venue: "戸田", grade: "一般", day: "2日目" },
        { venue: "多摩川", grade: "一般", day: "4日目" },
        { venue: "常滑", grade: "一般", day: "2日目" },
        { venue: "三国", grade: "マスターズリーグ", day: "2日目" },
        { venue: "びわこ", grade: "ヴィーナスシリーズ", day: "2日目" },
        { venue: "住之江", grade: "一般", day: "最終日" },
        { venue: "尼崎", grade: "一般", day: "最終日" },
        { venue: "徳山", grade: "一般", day: "5日目" },
        { venue: "若松", grade: "一般", day: "2日目" },
        { venue: "大村", grade: "一般", day: "4日目" }
      ],
      auto: [
        { venue: "浜松", grade: "普通", day: "最終日" },
        { venue: "飯塚", grade: "普通(ミッドナイト)", day: null },
        { venue: "山陽", grade: "普通(ミッドナイト)", day: null }
      ]
    },
    "2026-07-09": {
      jra: [],
      nar: [
        { venue: "帯広(ばんえい)", grade: "一般", day: null },
        { venue: "門別", grade: "一般", day: null },
        { venue: "盛岡", grade: "一般", day: null },
        { venue: "川崎", grade: "一般", day: null },
        { venue: "笠松", grade: "一般", day: null },
        { venue: "園田", grade: "一般", day: null }
      ],
      boat: [
        { venue: "桐生", grade: "一般", day: "最終日" },
        { venue: "戸田", grade: "一般", day: "3日目" },
        { venue: "多摩川", grade: "一般", day: "最終日" },
        { venue: "常滑", grade: "一般", day: "3日目" },
        { venue: "三国", grade: "マスターズリーグ", day: "3日目" },
        { venue: "びわこ", grade: "ヴィーナスシリーズ", day: "3日目" },
        { venue: "鳴門", grade: "一般", day: "初日" },
        { venue: "丸亀", grade: "一般", day: "初日" },
        { venue: "児島", grade: "一般", day: "初日" },
        { venue: "徳山", grade: "一般", day: "最終日" },
        { venue: "若松", grade: "一般", day: "3日目" },
        { venue: "大村", grade: "一般(ミッドナイト)", day: "最終日" }
      ],
      keirin: [
        { venue: "青森", grade: "F1(ナイター/ガールズ)", day: null },
        { venue: "いわき平", grade: "F2(ミッドナイト)", day: null },
        { venue: "弥彦", grade: "F2(ミッドナイト)", day: "最終日" },
        { venue: "大垣", grade: "F1", day: null },
        { venue: "広島", grade: "F2(モーニング)", day: null },
        { venue: "玉野", grade: "F2(ミッドナイト/ガールズ)", day: "最終日" },
        { venue: "久留米", grade: "F2(ナイター/ガールズ)", day: "最終日" }
      ],
      auto: [
        { venue: "川口", grade: "普通", day: "初日" },
        { venue: "飯塚", grade: "普通(ミッドナイト)", day: null },
        { venue: "山陽", grade: "普通(ミッドナイト)", day: null }
      ]
    },
    "2026-07-11": {
      jra: [
        { venue: "函館", grade: "一般", day: null },
        { venue: "福島", grade: "一般", day: null },
        { venue: "小倉", grade: "一般", day: null }
      ],
      nar: [
        { venue: "帯広(ばんえい)", grade: "一般", day: null },
        { venue: "佐賀", grade: "一般", day: null },
        { venue: "高知", grade: "一般", day: null }
      ],
      boat: [
        { venue: "戸田", grade: "一般", day: "5日目" },
        { venue: "江戸川", grade: "一般", day: "初日" },
        { venue: "平和島", grade: "一般", day: "初日" },
        { venue: "浜名湖", grade: "一般", day: "2日目" },
        { venue: "常滑", grade: "一般", day: "5日目" },
        { venue: "津", grade: "一般", day: "2日目" },
        { venue: "三国", grade: "マスターズリーグ", day: "5日目" },
        { venue: "びわこ", grade: "ヴィーナスシリーズ", day: "5日目" },
        { venue: "鳴門", grade: "一般", day: "3日目" },
        { venue: "丸亀", grade: "一般", day: "3日目" },
        { venue: "児島", grade: "一般", day: "3日目" },
        { venue: "下関", grade: "一般", day: "2日目" },
        { venue: "若松", grade: "一般", day: "5日目" },
        { venue: "福岡", grade: "一般", day: "2日目" },
        { venue: "唐津", grade: "一般", day: "2日目" }
      ],
      keirin: [
        { venue: "前橋", grade: "G3(ナイター)", day: "2日目" },
        { venue: "取手", grade: "F2(モーニング)", day: null },
        { venue: "小田原", grade: "F2(モーニング/ガールズ)", day: null },
        { venue: "伊東", grade: "F1(ナイター/ガールズ)", day: null },
        { venue: "豊橋", grade: "G3", day: null },
        { venue: "弥彦", grade: "F2(ガールズ)", day: null },
        { venue: "岐阜", grade: "F2(ガールズ)", day: null },
        { venue: "岸和田", grade: "F2(ガールズ)", day: null }
      ],
      auto: [
        { venue: "川口", grade: "普通", day: "3日目" },
        { venue: "伊勢崎", grade: "普通(ナイター)", day: "初日" },
        { venue: "飯塚", grade: "普通(ミッドナイト)", day: null }
      ]
    },
    "2026-07-12": {
      jra: [
        { venue: "函館", grade: "一般", day: null },
        { venue: "福島", grade: "七夕賞(G3)", day: null },
        { venue: "小倉", grade: "一般", day: null }
      ],
      nar: [
        { venue: "帯広(ばんえい)", grade: "重賞", day: null },
        { venue: "盛岡", grade: "重賞", day: null },
        { venue: "金沢", grade: "重賞", day: null },
        { venue: "高知", grade: "一般", day: null }
      ],
      boat: [
        { venue: "戸田", grade: "一般", day: "最終日" },
        { venue: "江戸川", grade: "一般", day: "2日目" },
        { venue: "平和島", grade: "一般", day: "2日目" },
        { venue: "多摩川", grade: "一般", day: "初日" },
        { venue: "浜名湖", grade: "一般", day: "3日目" },
        { venue: "常滑", grade: "一般", day: "最終日" },
        { venue: "津", grade: "一般", day: "3日目" },
        { venue: "三国", grade: "マスターズリーグ", day: "最終日" },
        { venue: "びわこ", grade: "ヴィーナスシリーズ", day: "最終日" },
        { venue: "鳴門", grade: "一般", day: "4日目" },
        { venue: "丸亀", grade: "一般", day: "4日目" },
        { venue: "児島", grade: "一般", day: "4日目" },
        { venue: "下関", grade: "一般", day: "3日目" },
        { venue: "若松", grade: "一般", day: "最終日" },
        { venue: "福岡", grade: "一般", day: "3日目" },
        { venue: "唐津", grade: "一般", day: "3日目" }
      ],
      keirin: [
        { venue: "前橋", grade: "G3(ナイター)", day: "3日目" },
        { venue: "取手", grade: "F2(モーニング)", day: null },
        { venue: "小田原", grade: "F2(モーニング)", day: null },
        { venue: "伊東", grade: "F1(ナイター/ガールズ)", day: null },
        { venue: "豊橋", grade: "G3", day: null },
        { venue: "弥彦", grade: "F2(ガールズ)", day: null },
        { venue: "岐阜", grade: "F2(ガールズ)", day: null },
        { venue: "岸和田", grade: "F1(ガールズ)", day: null }
      ],
      auto: [
        { venue: "川口", grade: "普通", day: "最終日" },
        { venue: "伊勢崎", grade: "普通(ナイター)", day: "2日目" },
        { venue: "飯塚", grade: "普通", day: null },
        { venue: "山陽", grade: "普通", day: null }
      ]
    }
  }
};
