# navpoint_set_priority


<AvailabilityCard reach="yes" />

## Description

Sets navpoint draw priority (`high`, `normal`, `low`, `blink`).

`low` will make the navpoint a partially transparent chevron.

`normal` will make the navpoint an opac chevron.

`high` will make the navpoint a "pin" shape and will be visible even off screen.

`blink` will make the navpoint a chevron that blinks and will be visible even off screen.

<ActionParameters />

## Example

```megalo
action navpoint_set_priority the_hill high
```

Example from HREK `koth.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
