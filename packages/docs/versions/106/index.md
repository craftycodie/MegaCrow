# 106

Original Xbox 360 Reach launch megalo build (encoding version 106). Action opcodes match Title Update 1; the custom variant layout omits AU1 settings added in TU1.

| | |
|---|---|
| **Game** | <ReachGameIcon /> |
| **Megalo Version** | 106 |
| **Supported Halo Versions** | `12065.11.08.24.1738.tu1actual` (read only)<br/>`11860.10.07.24.0147.omaha_release` |

## Changes from prior version

Compared to [73](/versions/73/).

### Actions added

- [`player_set_objective_allegiance`](/language/actions/player-set-objective-allegiance) (opcode 57)
- [`player_set_objective_allegiance_icon`](/language/actions/player-set-objective-allegiance-icon) (opcode 58)
- [`object_set_orientation`](/language/actions/object-set-orientation) (opcode 91)
- [`object_face_object`](/language/actions/object-face-object) (opcode 92)
- [`biped_give_weapon`](/language/actions/biped-give-weapon) (opcode 93)
- [`biped_drop_weapon`](/language/actions/biped-drop-weapon) (opcode 94)
- [`set_scenario_interpolator_state`](/language/actions/set-scenario-interpolator-state) (opcode 95)
- [`get_random_object`](/language/actions/get-random-object) (opcode 96)
- [`game_grief_record_custom_penalty`](/language/actions/game-grief-record-custom-penalty) (opcode 97)
- [`boundary_set_player_color`](/language/actions/boundary-set-player-color) (opcode 98)

### Actions removed

- `player_set_fireteam_tier` (opcode 68)
- `give_weapon` (opcode 73)
- `set_loadout` (opcode 77)
- `player_set_vehicle_spawning` (opcode 92)

## Limits

<VersionLimits />

Per-action pages are listed under **Actions** in the sidebar.
