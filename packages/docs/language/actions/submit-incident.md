# submit_incident


<AvailabilityCard reach="yes" />

## Description

Fires a game incident with [team or player target](/language/enums/team-or-player-target) context for cause and effect (from `incidents.txt`). This is often used to award a medal, to show a message in the kill feed, and/or to play a sound. It was also used on the 360 version of Reach to award achievements.

<ActionParameters />

## Example

```megalo
action submit_incident ball_game_start player current_player player none
```
Example from HREK `hogpotato.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
- [submit_incident_with_custom_value](/language/actions/submit-incident-with-custom-value)
