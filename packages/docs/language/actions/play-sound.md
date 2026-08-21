# play_sound


<AvailabilityCard reach="yes" />

## Description

Plays a sound for a [team or player target](/language/enums/team-or-player-target). Sound tokens are listed in [Sounds](/language/enums/sounds).

If the `immediate` flag is not used, the sound will wait for other Megalo sounds to finish before playing.

<ActionParameters />

## Example

```megalo
action play_sound everyone immediate unsc_win1
```

Example from HREK `3nvasion.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
- [Team or player target](/language/enums/team-or-player-target) — target operand syntax
- [Sounds](/language/enums/sounds) — `e_megalo_sound` tokens
