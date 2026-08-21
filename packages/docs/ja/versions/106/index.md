# 106

Xbox 360 Reach 発売当初の megalo ビルド（エンコーディングバージョン 106）です。アクションオペコードは Title Update 1 と一致しますが、カスタムバリアントレイアウトには TU1 で追加された AU1 設定が含まれません。

| | |
|---|---|
| **ゲーム** | <ReachGameIcon /> |
| **Megalo バージョン** | 106 |
| **対応 Halo バージョン** | `12065.11.08.24.1738.tu1actual` (読み取り専用)<br/>`11860.10.07.24.0147.omaha_release` |

## 前バージョンからの変更

[73](/ja/versions/73/) との比較。

### 追加されたアクション

- [`player_set_objective_allegiance`](/ja/language/actions/player-set-objective-allegiance) (opcode 57)
- [`player_set_objective_allegiance_icon`](/ja/language/actions/player-set-objective-allegiance-icon) (opcode 58)
- [`object_set_orientation`](/ja/language/actions/object-set-orientation) (opcode 91)
- [`object_face_object`](/ja/language/actions/object-face-object) (opcode 92)
- [`biped_give_weapon`](/ja/language/actions/biped-give-weapon) (opcode 93)
- [`biped_drop_weapon`](/ja/language/actions/biped-drop-weapon) (opcode 94)
- [`set_scenario_interpolator_state`](/ja/language/actions/set-scenario-interpolator-state) (opcode 95)
- [`get_random_object`](/ja/language/actions/get-random-object) (opcode 96)
- [`game_grief_record_custom_penalty`](/ja/language/actions/game-grief-record-custom-penalty) (opcode 97)
- [`boundary_set_player_color`](/ja/language/actions/boundary-set-player-color) (opcode 98)

### 削除されたアクション

- `player_set_fireteam_tier` (opcode 68)
- `give_weapon` (opcode 73)
- `set_loadout` (opcode 77)
- `player_set_vehicle_spawning` (opcode 92)

## 制限

<VersionLimits />

アクション単位のページはサイドバーの **Actions** に一覧されています。
