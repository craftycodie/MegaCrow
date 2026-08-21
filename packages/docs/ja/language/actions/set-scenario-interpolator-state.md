# set_scenario_interpolator_state


<AvailabilityCard reach="partial" />

## 説明

シナリオインターポレーターの状態インデックスをオフまたはオンに設定します。シナリオインターポレーターのインデックスは 1 から 32 です。一部のオブジェクトはシナリオインターポレーターの状態の影響を受けます。

既定では、`invisible_cube_of_alarming_1` と `invisible_cube_of_alarming_2` オブジェクトの警報音を切り替える場合にのみ機能するようです。

<ActionParameters />

## 例

```megalo
action set_scenario_interpolator_state 2 1
```

HREK の `3nvasion.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
