# object_attach


<AvailabilityCard reach="yes" />

## Description

Attaches one object to another with offset and constraint parameters.

`absolute_orientation` will cause the attached object to be offset relative to the world axis rather than relative to the object being attached to.

<ActionParameters />

## Example

```megalo
action object_attach current_object.my_flag current_object 0 0 3
```

Example from HREK `territories.txt`.

## Notes

- Attached objects will move with the nearest part of an object from which they were attached. For example, a player attached to a warthog near the steering wheel will rotate with the steering wheel's animations.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
- [object_detach](/language/actions/object-detach)
