# begin


<AvailabilityCard reach="partial" />

## Description

Marks the start of a nested sub-trigger block.

<DocsBlock type="warning" title="Not a typical action">

While `begin` is technically an action, the language treats it more like an element. See the [begin element](/language/elements/begin) page for more information.

</DocsBlock>

<ActionParameters />

## Example

`begin` is written on its own line inside an action scope, not as `action begin`:

```megalo
action for_each team
	condition team_is_active current_team

	begin
		condition if current_team.players_frozen == least_frozen_players
		action set teams_tied = true
	end
	begin
		condition if current_team.players_frozen < least_frozen_players
		action set least_frozen_players = current_team.players_frozen
		action set least_frozen_players_team = current_team
	end
end
```

From Reach MCC `tu1_winter_contingency.txt` — see the [begin element](/language/elements/begin) page for a full walkthrough.

<DocsBlock type="note" title="Action syntax">

Technically, writing `action begin ... end` compiles and behaves the same as `begin ... end`, but this is probably not the intended syntax.

</DocsBlock>

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
