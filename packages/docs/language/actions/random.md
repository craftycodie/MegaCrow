# random

<AvailabilityCard reach="yes" />

## Description

Writes a random integer into an out-variable between a minimum of 0 and the configured maximum. The minimum is inclusive; the maximum is exclusive (for example, `action random 5 x` yields 0–4). 

Older pre-launch versions of Megalo were between the configured minimum and maximum. The minimum was **inclusive**; the maximum was **exclusive** (for example, `action random 0 5 x` yields 0–4).


<ActionParameters />

## Example

```megalo
action random 10 rand
```

Example from HREK `koth.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
