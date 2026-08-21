# 73

Public Beta (Omaha Delta) megalo build. Action tables are available in @blamnetwork/blf for historical comparison.

| | |
|---|---|
| **Game** | <ReachGameIcon /> |
| **Megalo Version** | 73 |
| **Supported Halo Versions** | `09730.10.04.09.1309.omaha_delta`<br/>`09664.10.04.06.2121.omaha_beta`<br/>`09449.10.03.25.1545.omaha_beta` |

## Changes from prior version

Compared to [49](/versions/49/).

### Actions added

- [`player_set_unit`](/language/actions/player-set-unit) (opcode 42)
- [`object_get_health`](/language/actions/object-get-health) (opcode 55)
- [`player_get_weapon`](/language/actions/player-get-weapon) (opcode 84)
- [`player_get_equipment`](/language/actions/player-get-equipment) (opcode 85)
- [`object_set_never_garbage`](/language/actions/object-set-never-garbage) (opcode 86)
- [`player_get_target_object`](/language/actions/player-get-target-object) (opcode 87)
- [`create_tunnel`](/language/actions/create-tunnel) (opcode 88)
- [`debug_force_player_view_count`](/language/actions/debug-force-player-view-count) (opcode 89)
- [`player_pick_up_weapon`](/language/actions/player-pick-up-weapon) (opcode 90)
- [`player_set_coop_spawning`](/language/actions/player-set-coop-spawning) (opcode 91)
- [`player_set_vehicle_spawning`](/language/actions/player-set-vehicle-spawning) (opcode 92)

### Actions removed

- `object_set_minimap_visibility` (opcode 56)
- `object_set_minimap_priority` (opcode 57)
- `object_set_minimap_icon` (opcode 58)

## Limits

<VersionLimits />

Per-action pages are listed under **Actions** in the sidebar.
