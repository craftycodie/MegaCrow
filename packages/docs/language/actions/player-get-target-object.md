# player_get_target_object


<AvailabilityCard reach="partial" />

## Description

Reads the object that is in the player's crosshair into an out-variable. This action can return an object for a player if the Megalo code is running on their machine.

<ActionParameters />

## Example

```megalo
action player_get_target_object current_player targeted_object
```
## Notes
* Because this action only works for players on the same machine the Megalo code is running on, this can be used in a local trigger to detect if the player is the local player. This can be useful for intentionally desyncing games.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
