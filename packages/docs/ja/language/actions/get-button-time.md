# get_button_time

<AvailabilityCard reach="partial" />

## 説明

[スクリプト可能なボタン](#scriptable-buttons) が押されていた時間をカスタム変数へミリ秒単位で読み出します（Reach MCC のみ）。

<ActionParameters />

## スクリプト可能なボタン {#scriptable-buttons}

2 つ目のオペランドは `e_scriptable_game_buttons` のメンバです。値は [@blamnetwork/blf](https://github.com/Blam-Network/blf/blob/main/blf-ts/src/blam/haloreach_mcc/v_untracked_25_08_16_1352/game/megalogamengine/megalogamengine_actions.ts) と一致します。

| ボタン | インデックス |
|--------|------:|
| `jump` | 0 |
| `grenade` | 1 |
| `switch_weapon` | 2 |
| `context_primary` | 3 |
| `melee_attack` | 4 |
| `equipment` | 5 |
| `throw_grenade` | 6 |
| `fire_primary` | 7 |
| `crouch` | 8 |
| `scope_zoom` | 9 |
| `night_vision` | 10 |
| `fire_secondary` | 11 |
| `fire_tertiary` | 12 |
| `vehicle_trick` | 13 |

注: さらに 3 つのエントリがあるように見えますが、名前が見つからないため、megalo スクリプトではおそらく使えません。

## 例

```megalo
action get_button_time current_player jump button_hold_ms
```

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
