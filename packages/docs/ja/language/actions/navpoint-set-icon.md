# navpoint_set_icon


<AvailabilityCard reach="yes" />

## 説明

オブジェクト上に表示されるナビポイントのアイコンを設定します。

ME の名前テーブル末尾は `coop spawning`（スペース付き）です。MegaloEdit はこれをパースできません（[Megalo Headache #3](/ja/language/megalo-headaches#3-unparseable-coop-spawning-navpoint-icon)）。2 トークン形式を受け入れるには MegaCrow の [`coopSpawning`](/ja/language/compiler-settings#megacrow-extensions) 拡張を有効にしてください。

<ActionParameters />

## 例

```megalo
action navpoint_set_icon player_holding_flag flag
```

HREK の `ctf.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
