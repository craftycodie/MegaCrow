# set_score


<AvailabilityCard reach="yes" />

## 説明

[算術演算](/ja/language/enums/math-operations)、数値または変数参照、および [チームまたはプレイヤー対象](/ja/language/enums/team-or-player-target) を使って、プレイヤーまたはチームのスコアを変更します。チームの合計スコアは、このアクションでプレイヤーに割り当てたスコアとチームに割り当てたスコアの合計になります。

<ActionParameters />

## 例

```megalo
action set_score add kill_points player killing_player
```

HREK の `slayer_RPG.txt` より。

```megalo
action set_score add 1 team current_team
```
HREK の `stockpile.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
- [Team or player target](/ja/language/enums/team-or-player-target) — 対象オペランドの構文
