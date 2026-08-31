# Built-in variables

Read-only engine globals that appear in conditions and [`set`](/language/actions/set) operands without a [`variables`](/language/elements/variables) declaration. Writable overrides for the game-option entries use the same names inside [`game_options`](/language/elements/game-options) `override` lines.


<EnumVersionTable enum="built-in-variables" />

<DocsBlock type="warning" title="target_team is not available in MegaloEdit">

MegaloEdit autocomplete lists `target_team` but does not parse it ([Megalo Headache #2](/language/megalo-headaches#2-inaccessible-target_team)). Enable MegaloEvolved’s [`targetTeam`](/language/compiler-settings#megacrow-extensions) extension to use it; the wire slot works at runtime.

</DocsBlock>

## Example

```megalo
condition if score_to_win_round not_equal_to 0
condition if teams_enabled equal_to 1
condition if round_time_limit greater_than 0
condition timer_expired round_timer
condition if current_player.team equal_to attackers
action set symmetric_gametype set_to 0
action play_sound team defenders bone_cv_ph1_intro
```

```megalo
trigger object_death
	condition if object_death_damage_type greater_than 34
	condition if object_death_damage_type less_than 56
end
```

## See also

- [Variable model — Built-in variables](/language/variable-model#built-in-variables)
- [Team designators](/language/references#team-designators)
- [Game options](/language/enums/game-options)
- [game_options](/language/elements/game-options)
