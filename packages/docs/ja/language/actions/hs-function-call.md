# hs_function_call


<AvailabilityCard reach="partial" />

## 説明

引数の名前に一致する dormant の HaloScript 関数を呼び出します（Reach MCC のみ）。コンパイルするには関数名が `strings.txt` に必要で、正しく動作させるには megalo_string_id_table タグにも必要です。

<ActionParameters />

## 例

```haloscript
;This block is Haloscript, not Megalo
(script dormant void kill_player
    (unit_kill (unit (list_get (players) 0)))
)
```

```megalo
action hs_function_call kill_player
```

## 注記
- HaloScript が常に正しく同期するとは考えにくいため、ローカルトリガーに置くことを推奨します。


## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
