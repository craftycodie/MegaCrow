# hud_widget_set_value


<AvailabilityCard reach="yes" />

## Description

Updates a secondary text on a HUD widget using a [dynamic string](/language/enums/dynamic-strings). The text will be a white font as opposed to the blue font from [hud_widget_set_text](/language/actions/hud-widget-set-text). The text will only display for widgets of certain screen positions, such as the upper left. The text can display alongside the text from [hud_widget_set_text](/language/actions/hud-widget-set-text).

<ActionParameters />

## Example

```megalo
action hud_widget_set_value omni_a "404"
```
Example from HREK `omniwidget_test.txt`.
## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
- [hud_widget_set_icon](/language/actions/hud-widget-set-icon)
- [hud_widget_set_meter](/language/actions/hud-widget-set-meter)
- [hud_widget_set_text](/language/actions/hud-widget-set-text)
- [hud_widget_set_visibility](/language/actions/hud-widget-set-visibility)
