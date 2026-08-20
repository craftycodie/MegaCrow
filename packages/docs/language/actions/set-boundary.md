# set_boundary


<AvailabilityCard reach="yes" />

## Description

Configures boundary shape parameters on an object.

If the shape is `sphere`, the boundary will not be visible.

<ActionParameters />

## Example

```megalo
action set_boundary current_player cylinder 6 2 4
```

Example from HREK `headhunter.txt`.

```megalo
action set_boundary the_flag sphere 10
```
Example from HREK `3nvasion.txt`.

```megalo
action set_boundary spawn_wall box 10 55 10 10
```

Example from HREK `broken\1Flag_Boneyard_Extreme.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
- [boundary_set_visible](/language/actions/boundary-set-visible) 
- [boundary_set_player_color](/language/actions/boundary-set-player-color)
