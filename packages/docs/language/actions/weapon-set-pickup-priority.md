# weapon_set_pickup_priority


<AvailabilityCard reach="yes" />

## Description

Sets weapon pickup priority for an object.

`normal` will give the weapon the default pickup behavior.

`special` will prompt the weapon to be picked up even if other weapons are close enough to be picked up.

`auto` will automatically put the weapon in the hands of a player that gets close to it.

<ActionParameters />

## Example

```megalo
action weapon_set_pickup_priority the_bomb special
```

Example from HREK `assault.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
