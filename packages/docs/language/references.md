# References

Megalo actions and conditions take **operands** — values that identify players, teams, objects, timers, and variables at runtime. This page describes the reference model: how operands are written and what they resolve to.

## Reference types

Megalo has five typed reference kinds:

| Type | Holds | Example |
|------|-------|---------|
| Player | A player slot | `current_player`, `killer`, `none` |
| Team | A team | `current_team`, `attackers`, `defenders`, `none` |
| Object | A map object | `current_object`, `one_flag`, `none` |
| Timer | A countdown timer | `round_timer`, `current_player.game_start_vo` |
| Number | An integer value | `my_counter`, `score_to_win_round`, `0` |

Each type has a `none` sentinel meaning "no reference" or "empty."

## Context references

Built-in refs for the current evaluation context and related engine state:

| Name | Type | Availability |
|------|------|--------------|
| `current_player` | Player | Inside `player` triggers |
| `current_team` | Team | Inside `team` triggers |
| `current_object` | Object | Inside `object` / map-object-filter triggers |
| `local_player` | Player | Always |
| `local_team` | Team | Always (team that owns `local_player`) |
| `target_player` | Player | Always (HUD target player) |
| `target_object` | Object | Always (HUD target object) |
| `target_team` | Team | MegaloEvolved extension `targetTeam` (team that owns `target_player`) |

`current_*` refs are gated by trigger depth. The others are always available.

```megalo
trigger local
	condition if local_team equal_to attackers
	action hud_widget_set_visibility status_widget local_player 1
end
```

See also [Built-in variables](/language/enums/built-in-variables).

## Custom variable references

Variables declared in `variables` blocks are referenced by name. Member variables use dot notation:

```megalo
; global variable
action set sudden_death_condition set_to true

; player member variable
action set current_player.is_leader set_to 1

; team member variable
action set current_team.goal set_to current_object

; object member variable
action timer_set_rate buy_zone.phase_1_timer 1

; chained member access
action set buy_zone.allies_present set_to attackers_in_area
```

## Team designators

Teams can be referenced by their designator name:

| Designator | Role |
|-----------|------|
| `attackers` | Attacking team |
| `defenders` | Defending team |
| `third_party` | Third team |
| `fourth_party` | Fourth team |
| `fifth_party` | Fifth team |
| `sixth_party` | Sixth team |
| `seventh_party` | Seventh team |
| `eighth_party` | Eighth team |
| `none` | No team |

```megalo
action play_sound team defenders bone_cv_ph1_intro
action set_score add 1 team attackers
condition if current_player.team equal_to attackers
```

Team designators are assigned in `teams` blocks:

```megalo
teams
	team
		designator defenders
	end
	team
		designator attackers
	end
end
```

## Team or player target

Some actions take a **team or player target** — a specific player, a specific team, or everyone. Syntax is `team <team_ref>`, `player <player_ref>`, or `everyone`. See [Team or player target](/language/enums/team-or-player-target) for the full operand reference.

```megalo
action set_score add 1 team attackers
action play_sound team defenders bone_cv_ph1_intro
action hud_post_message everyone none "Round started!"
```

## Audience references

Other actions take an **audience** operand that specifies who is affected (visibility, pickup filters, and similar):

| Audience | Meaning |
|----------|---------|
| `everyone` | All players |
| `allies` | Friendly players (relative to context) |
| `enemies` | Enemy players |
| `player` | A specific player (followed by the player ref) |
| `team` | A specific team (followed by the team ref) |
| `no_one` | Nobody |

```megalo
action navpoint_set_visible current_object allies
action set_pickup_filter one_flag enemies
action boundary_set_visible capture_zone everyone
```

## Built-in timer references

The engine provides built-in timers that are not declared in `variables` blocks:

| Timer | Description |
|-------|-------------|
| `round_timer` | Elapsed time in the current round |
| `sudden_death_timer` | Sudden death countdown |
| `grace_period_timer` | Grace period after round time expires |

Custom timers are declared as `networked timer` variables and referenced by name or through member access.

## Object type references

Object types in `create_object` and `object_is_type` use quoted names from [object lists](/language/object-lists):

```megalo
action create_object "flag" at current_team.flag_spawn set current_team.flag never_garbage
action create_object "invis_cov_resupply_capsule" at current_object never_garbage
condition object_is_type current_object "area"
condition object_is_type current_object "fireteam_1_respawn_zone"
```

## Player-as-object references

A player reference can be used wherever an object reference is expected. The engine resolves the player's physical body object:

```megalo
; from simple/koth/1.txt — a player reference used as an object reference
action for_each player
	condition object_in_area current_player current_object
	action timer_set_rate current_player.time_in_hill 1
end

temporary object my_body current_player
action for_each general
	condition if my_body != none
	action set current_player.body = my_body
end
```

## String table references

String operands in actions and element fields reference symbols defined in `string_table` blocks:

```megalo
action hud_post_message player current_player none invasion_title_spartan
action player_set_objective current_player slayer_objective score_to_win_round
action navpoint_set_text current_object nav_weapon_drop
```

These are not quoted strings in the source — they are identifier references resolved through the string table at runtime. When the string contains `%` placeholders, following operands fill those slots — see [Dynamic strings](/language/enums/dynamic-strings).

## Filter references

Object filter operands identify who can interact with an object:

| Filter | Meaning |
|--------|---------|
| `all` | Everyone |
| `allies` | Friendly players/teams |
| `enemies` | Enemy players/teams |
| `no_one` | Nobody |
| `none` | No filter (disabled) |

Used in respawn, pickup, and fireteam filter actions:

```megalo
action set_respawn_filter current_object allies
action set_pickup_filter current_object no_one
action set_fireteam_respawn_filter current_object all
```

## See also

- [Variable model](/language/variable-model) — declaring custom variables
- [action](/language/elements/trigger/action) — how references appear as operands
- [condition](/language/elements/trigger/condition) — references in comparisons
- [Object lists](/language/object-lists) — symbolic names for object types and incidents
