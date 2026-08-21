# play_sound


<AvailabilityCard reach="yes" />

## 説明

[チームまたはプレイヤー対象](/ja/language/enums/team-or-player-target) に対してサウンドを再生します。サウンドトークンは [サウンド](/ja/language/enums/sounds) に記載されています。

`immediate` フラグを指定しない場合、サウンドは他の Megalo サウンドの再生が終わるまで待ってから再生されます。

<ActionParameters />

## 例

```megalo
action play_sound everyone immediate unsc_win1
```

HREK の `3nvasion.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
- [Team or player target](/ja/language/enums/team-or-player-target) — 対象オペランドの構文
- [Sounds](/ja/language/enums/sounds) — `e_megalo_sound` トークン
