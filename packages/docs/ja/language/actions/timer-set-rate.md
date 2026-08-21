# timer_set_rate


<AvailabilityCard reach="yes" />

## 説明

タイマーのティックレートを設定します。`0` は一時停止、`-1` はカウントアップ、`1` はゼロまでカウントダウンします。より極端な値ほど速く進みます。レートはコンパイル時に、最も近い対応値へ丸められます。

対応するレートは次のとおりで、それぞれの負の値も使えます。

- 0
- 0.1
- 0.25
- 0.5
- 0.75
- 1
- 1.25
- 1.50
- 1.75
- 2
- 3
- 4
- 5
- 10

<ActionParameters />

## 例

```megalo
action timer_set_rate this_territory.capture_timer -1
```

HREK の `territories.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
