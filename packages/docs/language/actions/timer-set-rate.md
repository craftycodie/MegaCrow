# timer_set_rate


<AvailabilityCard reach="yes" />

## Description

Sets a timer's tick rate. `0` pauses, `-1` counts up, `1` counts down to zero. A more extreme value counts faster. Rates are rounded to the nearest compatible value at compile time.

The compatible rates are the following and their negative counterparts.

- 0
- 0.1
- 0.25
- 0.5
- 0.75
- 1
- 1.25
- 1.50
- 1.75
- 2
- 3
- 4
- 5
- 10

<ActionParameters />

## Example

```megalo
action timer_set_rate this_territory.capture_timer -1
```

Example from HREK `territories.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
