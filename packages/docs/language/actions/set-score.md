# set_score


<AvailabilityCard reach="yes" />

## Description

Modifies a player or team score using a [math operation](/language/enums/math-operations), a numeric value or variable reference, and a [team or player target](/language/enums/team-or-player-target). A team's total score will be the sum of the score assigned to its players and to the team using this action. 

<ActionParameters />

## Example

```megalo
action set_score add kill_points player killing_player
```

Example from HREK `slayer_RPG.txt`.

```megalo
action set_score add 1 team current_team
```
Example from HREK `stockpile.txt`.

## Supported Versions

<ActionSupportedVersions />


## See also 
- [action syntax](/language/elements/trigger/action)
- [Team or player target](/language/enums/team-or-player-target) — target operand syntax
