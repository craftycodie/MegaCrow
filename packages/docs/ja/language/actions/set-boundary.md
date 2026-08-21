# set_boundary


<AvailabilityCard reach="yes" />

## 説明

オブジェクトの境界形状パラメータを設定します。

形状が `sphere` の場合、境界は表示されません。

<ActionParameters />

## 例

```megalo
action set_boundary current_player cylinder 6 2 4
```

HREK の `headhunter.txt` より。

```megalo
action set_boundary the_flag sphere 10
```
HREK の `3nvasion.txt` より。

```megalo
action set_boundary spawn_wall box 10 55 10 10
```

HREK の `broken\1Flag_Boneyard_Extreme.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
- [boundary_set_visible](/ja/language/actions/boundary-set-visible)
- [boundary_set_player_color](/ja/language/actions/boundary-set-player-color)
