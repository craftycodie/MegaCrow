# set_scenario_interpolator_state


<AvailabilityCard reach="partial" />

## Description

Sets a scenario interpolator state index to off or on. Scenario interpolators have indexes from 1 to 32. Some objects are affected by scenario interpolator states.

By default, this seemingly only works with the invisible_cube_of_alarming_1 and invisible_cube_of_alarming_2 objects to toggle their alarming sound.

<ActionParameters />

## Example

```megalo
action set_scenario_interpolator_state 2 1
```

Example from HREK `3nvasion.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
