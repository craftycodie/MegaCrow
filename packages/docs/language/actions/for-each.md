# for_each


<AvailabilityCard reach="yes" />

## Description

Iterates over players, teams, or objects and runs nested trigger logic. Triggers can't exist within triggers, so this is used instead if iteration is needed inside of a trigger.

<ActionParameters />

## Example

```megalo
trigger host_migration
	action for_each player
		action timer_set_rate current_player.ball_timer 0
		action timer_reset current_player.ball_timer
	end
end
```

Example from HREK `oddball.txt`.


## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
