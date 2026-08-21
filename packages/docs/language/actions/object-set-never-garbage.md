# object_set_never_garbage


<AvailabilityCard reach="partial" />

## Description

Prevents the engine from garbage-collecting a weapon or equipment after it has been picked up and dropped. Does not work on objects spawned via [create_object](/language/actions/create-object) with the `never_garbage` flag. Does not work on objects placed via forge.

<ActionParameters />

## Example

```megalo
action object_set_never_garbage current_object 1
```

Example from HREK `broken\freezetag.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
