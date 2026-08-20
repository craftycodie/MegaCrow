# hide_object


<AvailabilityCard reach="partial" />

## Description

Hides or shows an object for players (Reach MCC only).

<ActionParameters />

## Example

```megalo
;makes all player bipeds invisible
trigger local
	action for_each player
	action hide_object current_player true
end
```


## Notes
- A hidden object does not have an active collision model, but will still have an active physics model.
- All objects attached to an object hidden this way will be invisible, although there hidden state is otherwise tracked independently.
- An object being hidden this way does not always sync. Using this action in a local trigger will make sure client players also can't see the object.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
