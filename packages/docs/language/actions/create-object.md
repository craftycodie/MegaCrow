# create_object


<AvailabilityCard reach="yes" />

## Description

Spawns an object of the given type at a reference object, with optional filter, flags, and offset.

The `never_garbage` flag prevents weapons and equipment from garbage collecting (despawning) after they are picked up and then dropped.

The `suppress_effect` flag prevents the brief blue glow and sound that happens when an object is created.

The `absolute_rotation` flag makes the object created relative to the pitch and roll rotations of the `place_at_object`, not just the relative to the yaw.

<ActionParameters />

## Example

### Version &lt;73

```megalo
action create_object "area" main.team_a main
```

From HREK `broken/dmiller_sve.txt`.

### Version 73+

```megalo
action create_object "flag" set current_team.flag at current_team.goal never_garbage offset 0 0 3
```

From HREK `ctf.txt`.


## Notes

- If an object would be created within another object or outside the game boundaries, it is repositioned to a slightly different location. If you want to circumvent this, use [object_attach](/language/actions/object-attach) and then [object_detach](/language/actions/object-detach) after this action to reposition the created object to a desired location. Using [create_tunnel](/language/actions/create-tunnel) instead of create_object can also be used to circumvent this.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
- [create_tunnel](/language/actions/create-tunnel)
