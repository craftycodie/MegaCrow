# set_loadout_palette


<AvailabilityCard reach="yes" />

## Description

Assigns a loadout palette tier to a player or team.

<DocsBlock type="info" title="Loadout Camera">

By default, the `loadout_selection_time` game option is set to zero.
Using `set_loadout_palette` will set `loadout_selection_time`to 10 if:
  - You are not using the `base` element - ie. your script doesnt use `base "../file.mglo"`
  - You haven't set `loadout_selection_time` in your `game_options`.

</DocsBlock>

<ActionParameters />

## Example

```megalo
action set_loadout_palette player current_player spartan_tier1
```

Example from HREK `infection.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
