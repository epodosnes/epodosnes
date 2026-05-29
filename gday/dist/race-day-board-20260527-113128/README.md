# Race Day Board

急に休みが取れた日に、中央競馬・地方競馬・ボートレース・オートレースの開催状況を一目で確認するための軽量Webアプリです。

## 使い方

`index.html` をブラウザで開くと動作します。ビルド、依存パッケージのインストール、ローカルサーバー起動は不要です。

## データ更新

開催データは `data/events.csv` を編集してから、次のコマンドで `data/events.json` を生成します。

将来データ元を分けたい場合は、`data/sources/*.csv` を編集してから次のコマンドで `data/events.csv` に集約できます。

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\merge-source-csvs.js
```

現在の `data/events.csv` をカテゴリ別の確認用CSVへ分割する場合は、次のコマンドを使います。

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\split-source-csvs.js
```

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\update-data.js
```

この一括更新コマンドは、以下を順に実行します。

- `data/events.csv` を検証
- 共通ユーティリティを検証
- 現在の生成済みデータを `backups/` にコピー
- `data/events.csv` から `data/events.json` を生成
- `data/events.json` から `src/sample-data.js` を生成
- `docs/data-report.md` を生成
- `docs/calendar-report.md` を生成
- `docs/source-report.md` を生成
- `docs/venue-report.md` を生成
- `docs/dashboard.md` を生成
- 生成済みデータ全体を確認

個別に実行する場合は次のコマンドを使います。

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-events-csv.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\build-sample-data.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-events.js
```

CSVの検証だけ行う場合は次のコマンドを使います。

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\validate-events-csv.js
```

バックアップ一覧を確認する場合は次のコマンドを使います。

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\list-backups.js
```

特定バックアップの中身を確認する場合は、バックアップIDを渡します。

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\list-backups.js 20260525-193947
```

生成済みデータ全体を確認する場合は次のコマンドを使います。

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-data.js
```

生成後に `index.html` を再読み込みすると反映されます。

## 現在の実装

- 今日、明日、週末、任意日付の切り替え
- 4カテゴリの開催サマリー
- カテゴリタブによる絞り込み
- 開始時刻、カテゴリ、地域での並び替え
- 公式サイトへのリンク
- サンプルデータによる開催表示
- 曜日開催と日付指定開催の両方に対応
- 会場詳細モーダルでメモとアクセス情報を表示
- 開催カードにメモの短いプレビューを表示

現在の開催情報はサンプルデータです。実運用では公式データ、独自API、または定期更新された静的JSONへ差し替える想定です。

## 構成

```txt
index.html
data/
  sources/
    manual.csv
    by-category/
  events.csv
  events.json
backups/
scripts/
  update-data.js
  check-libs.js
  merge-source-csvs.js
  split-source-csvs.js
  check-data.js
  backup-data.js
  list-backups.js
  validate-events-csv.js
  import-events-csv.js
  build-sample-data.js
  report-events.js
  report-calendar.js
  report-sources.js
  report-venues.js
  report-dashboard.js
src/
  app.js
  sample-data.js
  styles.css
  data/
    schedules.js
README.md
```

現在の画面は `index.html` を直接開いて動作します。開催データは `src/sample-data.js` の `window.RaceDayExternalData.events` を優先して読み込みます。読み込みに失敗した場合は、`index.html` 内の最小フォールバックデータで表示を継続します。

データ形式は `docs/data-format.md` にまとめています。外部データの採用件数、除外件数、更新日時は画面上の `Demo build` 行に表示されます。更新日時が古い場合は画面に注意表示が出ます。データ内容の集計とメモ入力状況は `docs/data-report.md` に、今後30日分の開催展開は `docs/calendar-report.md` に、ソースCSVの状況は `docs/source-report.md` に、会場別の次回開催確認は `docs/venue-report.md` に、運用状況の概要は `docs/dashboard.md` に出力できます。バックアップには主要データと生成レポート、`backup-manifest.json` が含まれます。

## 今後の拡張

次の段階では `data/events.json` を、公式データや独自APIから生成する形へ差し替える想定です。画面側は共通の開催データ形式だけを見るため、データソースを変更してもUIの変更を小さくできます。
