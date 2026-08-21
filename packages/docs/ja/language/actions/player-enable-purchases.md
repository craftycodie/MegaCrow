# player_enable_purchases


<AvailabilityCard reach="yes" />

## 説明

カテゴリと生存／死亡状態ごとにリクジション購入を有効化または無効化します。

<DocsBlock type="note" title="リクジションシステム">

`player_enable_purchases` は、Halo: Reach のリリース前に破棄されたリクジションシステムの一部です。リクジション機能の多くは現在もゲーム内に残っていますが、リクジションメニュー自体は消滅しているため、このアクションは初期のプリリリースビルド以外では実質的に意味がありません。

</DocsBlock>

<ActionParameters />

## 例

```megalo
action player_enable_purchases current_player dead all true
```

HREK の `broken/dmiller_sve.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
