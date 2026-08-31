# navpoint_set_icon


<AvailabilityCard reach="yes" />

## Description

Sets the navpoint icon displayed above an object.

The ME name table ends with `coop spawning` (space). MegaloEdit cannot parse it ([Megalo Headache #3](/language/megalo-headaches#3-unparseable-coop-spawning-navpoint-icon)); enable MegaloEvolved’s [`coopSpawning`](/language/compiler-settings#megacrow-extensions) extension to accept the two-token form.

<ActionParameters />

## Example

```megalo
action navpoint_set_icon player_holding_flag flag
```

Example from HREK `ctf.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
