# random

<AvailabilityCard reach="yes" />

## 説明

最小値 0 から設定された最大値までの乱数整数を出力変数に書き込みます。最小値は含み、最大値は含みません（例: `action random 5 x` は 0–4 になります）。

古いローンチ前バージョンの Megalo では、設定された最小値と最大値の間でした。最小値は**含む**、最大値は**含まない**です（例: `action random 0 5 x` は 0–4 になります）。


<ActionParameters />

## 例

```megalo
action random 10 rand
```

HREK の `koth.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
