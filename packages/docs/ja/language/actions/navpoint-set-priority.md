# navpoint_set_priority


<AvailabilityCard reach="yes" />

## 説明

ナビポイントの描画優先度（`high`、`normal`、`low`、`blink`）を設定します。

`low` はナビポイントを半透明のシェブロンにします。

`normal` はナビポイントを不透明なシェブロンにします。

`high` はナビポイントを「ピン」形状にし、画面外でも表示されます。

`blink` はナビポイントを点滅するシェブロンにし、画面外でも表示されます。

<ActionParameters />

## 例

```megalo
action navpoint_set_priority the_hill high
```

HREK の `koth.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
