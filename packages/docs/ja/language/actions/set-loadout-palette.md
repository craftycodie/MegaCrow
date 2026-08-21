# set_loadout_palette


<AvailabilityCard reach="yes" />

## 説明

プレイヤーまたはチームにロードアウトパレットのティアを割り当てます。

<DocsBlock type="info" title="Loadout Camera">

既定では、`loadout_selection_time` ゲームオプションはゼロです。
`set_loadout_palette` を使うと、次の場合に `loadout_selection_time` が 10 に設定されます。
  - `base` 要素を使っていない — つまりスクリプトが `base "../file.mglo"` を使っていない
  - `game_options` で `loadout_selection_time` を設定していない

</DocsBlock>

<ActionParameters />

## 例

```megalo
action set_loadout_palette player current_player spartan_tier1
```

HREK の `infection.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
