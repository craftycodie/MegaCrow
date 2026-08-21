# player_adjust_money


<AvailabilityCard reach="yes" />

## 説明

[数学演算](/ja/language/enums/math-operations) を使って、プレイヤーのリクジションマネーを変更します。

<DocsBlock type="note" title="リクジションシステム">

`player_adjust_money` は、Halo: Reach のリリース前に破棄されたリクジションシステムの一部です。リクジション機能の多くは現在もゲーム内に残っていますが、リクジションメニュー自体は消滅しているため、このアクションは初期のプリリリースビルド以外では実質的に意味がありません。

</DocsBlock>

<ActionParameters />

## 例

```megalo
action player_adjust_money current_player add 5
```

HREK の `broken/1Flag_Boneyard.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
