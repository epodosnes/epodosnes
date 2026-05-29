# Source Report

- Source root: data/sources
- CSV files: 15

| File | Rows | Included by merge | Duplicate IDs |
| --- | ---: | --- | --- |
| data/sources/auto-202605.csv | 66 | yes | - |
| data/sources/auto-202606.csv | 65 | yes | - |
| data/sources/boat-202605.csv | 409 | yes | - |
| data/sources/boat-202606.csv | 386 | yes | - |
| data/sources/by-category/auto.csv | 3 | no | auto-kawaguchi, auto-iizuka, auto-hamamatsu |
| data/sources/by-category/boat.csv | 4 | no | boat-suminoe, boat-heiwajima, boat-fukuoka, boat-gamagori |
| data/sources/by-category/jra.csv | 3 | no | jra-tokyo, jra-kyoto, jra-hanshin |
| data/sources/by-category/local-keiba.csv | 4 | no | local-oi, local-monbetsu, local-sonoda, sample-special-2026-05-24 |
| data/sources/jra-202605.csv | 28 | yes | - |
| data/sources/jra-202606.csv | 22 | yes | - |
| data/sources/keirin-202605.csv | 235 | yes | - |
| data/sources/keirin-202606.csv | 233 | yes | - |
| data/sources/local-keiba-202605.csv | 110 | yes | - |
| data/sources/manual-base.csv | 0 | yes | - |
| data/sources/manual.csv | 14 | no | jra-tokyo, jra-kyoto, jra-hanshin, local-oi, local-monbetsu, local-sonoda, boat-suminoe, boat-heiwajima, boat-fukuoka, boat-gamagori, auto-kawaguchi, auto-iizuka, auto-hamamatsu, sample-special-2026-05-24 |

## Notes

- Only CSV files directly under `data/sources/` are included by `scripts/merge-source-csvs.js`.
- Nested CSV files such as `data/sources/by-category/*.csv` are treated as generated/reference files.

