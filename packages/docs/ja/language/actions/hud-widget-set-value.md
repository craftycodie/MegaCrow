# hud_widget_set_value


<AvailabilityCard reach="yes" />

## 説明

HUD ウィジェットの二次テキストを [動的文字列](/ja/language/enums/dynamic-strings) で更新します。テキストは [hud_widget_set_text](/ja/language/actions/hud-widget-set-text) の青フォントではなく、白フォントになります。テキストは左上など、特定の画面位置のウィジェットにのみ表示されます。テキストは [hud_widget_set_text](/ja/language/actions/hud-widget-set-text) のテキストと並べて表示できます。

<ActionParameters />

## 例

```megalo
action hud_widget_set_value omni_a "404"
```
HREK の `omniwidget_test.txt` より。
## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
- [hud_widget_set_icon](/ja/language/actions/hud-widget-set-icon)
- [hud_widget_set_meter](/ja/language/actions/hud-widget-set-meter)
- [hud_widget_set_text](/ja/language/actions/hud-widget-set-text)
- [hud_widget_set_visibility](/ja/language/actions/hud-widget-set-visibility)
