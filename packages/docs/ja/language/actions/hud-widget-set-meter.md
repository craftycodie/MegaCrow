# hud_widget_set_meter


<AvailabilityCard reach="yes" />

## 説明

HUD ウィジェットのメーターパラメータを設定します。数値が 2 つ指定された場合、1 つ目が分子、2 つ目が分母となり、メーターの充填率を決めます。タイマーが指定された場合、タイマーに格納されている現在値が分子、タイマーの初期値が分母になります。

<ActionParameters />

## 例

```megalo
action hud_widget_set_meter current_wep_lvl_widget local_player.weapon_progress level_2_kills
```
HREK の `slayer_RPG.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
- [hud_widget_set_icon](/ja/language/actions/hud-widget-set-icon)
- [hud_widget_set_text](/ja/language/actions/hud-widget-set-text)
- [hud_widget_set_value](/ja/language/actions/hud-widget-set-value)
- [hud_widget_set_visibility](/ja/language/actions/hud-widget-set-visibility)
