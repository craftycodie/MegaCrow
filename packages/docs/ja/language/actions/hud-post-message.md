# hud_post_message


<AvailabilityCard reach="yes" />

## 説明

[チームまたはプレイヤー対象](/ja/language/enums/team-or-player-target) へ HUD メッセージを投稿します。サウンドオペランドは [e_megalo_sound](/ja/language/enums/sounds) トークンまたは `none` を選びます。メッセージは [動的文字列](/ja/language/enums/dynamic-strings) です。

<ActionParameters />

## 例

```megalo
action hud_post_message everyone destination_moved destination_moved
```

HREK の `headhunter.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
- [チームまたはプレイヤー対象](/ja/language/enums/team-or-player-target) — 対象オペランドの構文
- [サウンド](/ja/language/enums/sounds) — `e_megalo_sound` トークン
- [動的文字列](/ja/language/enums/dynamic-strings) — メッセージテキストと `%` プレースホルダ
