# hud_widget_set_meter


<AvailabilityCard reach="yes" />

## Description

Configures meter parameters on a HUD widget. If two numbers are used, the meter, the first number will be the numerator and the second number will be the denomonator for how fill the meter is filled. If a timer is used, the current value stored in the timer will be the numerator, and the timer's intial value will be the denomonator.

<ActionParameters />

## Example

```megalo
action hud_widget_set_meter current_wep_lvl_widget local_player.weapon_progress level_2_kills
```
Example from HREK `slayer_RPG.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
- [hud_widget_set_icon](/language/actions/hud-widget-set-icon)
- [hud_widget_set_text](/language/actions/hud-widget-set-text)
- [hud_widget_set_value](/language/actions/hud-widget-set-value)
- [hud_widget_set_visibility](/language/actions/hud-widget-set-visibility)
