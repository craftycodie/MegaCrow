# 73

Public Beta（Omaha Delta）megalo ビルドです。歴史的比較用のアクション表が @blamnetwork/blf にあります。

| | |
|---|---|
| **ゲーム** | <ReachGameIcon /> |
| **Megalo バージョン** | 73 |
| **対応 Halo バージョン** | `09730.10.04.09.1309.omaha_delta`<br/>`09664.10.04.06.2121.omaha_beta`<br/>`09449.10.03.25.1545.omaha_beta` |

## 前バージョンからの変更

[49](/ja/versions/49/) との比較。

### 追加されたアクション

- [`player_set_unit`](/ja/language/actions/player-set-unit) (opcode 42)
- [`object_get_health`](/ja/language/actions/object-get-health) (opcode 55)
- [`player_get_weapon`](/ja/language/actions/player-get-weapon) (opcode 84)
- [`player_get_equipment`](/ja/language/actions/player-get-equipment) (opcode 85)
- [`object_set_never_garbage`](/ja/language/actions/object-set-never-garbage) (opcode 86)
- [`player_get_target_object`](/ja/language/actions/player-get-target-object) (opcode 87)
- [`create_tunnel`](/ja/language/actions/create-tunnel) (opcode 88)
- [`debug_force_player_view_count`](/ja/language/actions/debug-force-player-view-count) (opcode 89)
- [`player_pick_up_weapon`](/ja/language/actions/player-pick-up-weapon) (opcode 90)
- [`player_set_coop_spawning`](/ja/language/actions/player-set-coop-spawning) (opcode 91)
- [`player_set_vehicle_spawning`](/ja/language/actions/player-set-vehicle-spawning) (opcode 92)

### 削除されたアクション

- `object_set_minimap_visibility` (opcode 56)
- `object_set_minimap_priority` (opcode 57)
- `object_set_minimap_icon` (opcode 58)

## 制限

<VersionLimits />

アクション単位のページはサイドバーの **Actions** に一覧されています。
