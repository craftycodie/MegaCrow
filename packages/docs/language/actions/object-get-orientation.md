# object_get_orientation


<AvailabilityCard reach="yes" />

## Description

Reads an object's orientation into an out-variable.

- 1 means the object is upright.
- 2 means the object's right side is up.
- 3 means the object's backside is up.
- 4 means the object's front side is up.
- 5 means the object's left side is up.
- 6 means the objects's bottom side is up.

<ActionParameters />

## Example

```megalo
action object_get_orientation current_object orientation
```
Example from HREK `rocket_race.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
