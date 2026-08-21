# create_object


<AvailabilityCard reach="yes" />

## 説明

指定した種類のオブジェクトを、参照オブジェクトの位置に生成します。フィルター、フラグ、オフセットは任意です。

`never_garbage` フラグは、武器や装備が拾われてから落とされたあとにガーベージコレクション（デスポーン）されるのを防ぎます。

`suppress_effect` フラグは、オブジェクト生成時に発生する短い青い光と音を抑制します。

`absolute_rotation` フラグは、生成されるオブジェクトを `place_at_object` の yaw だけでなく、pitch および roll の回転に対しても相対的に配置します。

<ActionParameters />

## 例

### バージョン &lt;73

```megalo
action create_object "area" main.team_a main
```

HREK の `broken/dmiller_sve.txt` より。

### バージョン 73+

```megalo
action create_object "flag" set current_team.flag at current_team.goal never_garbage offset 0 0 3
```

HREK の `ctf.txt` より。


## 注記

- オブジェクトが別のオブジェクトの内部やゲーム境界の外側に生成されそうな場合、少しずれた位置に再配置されます。これを回避したい場合は、このアクションのあとで [object_attach](/ja/language/actions/object-attach) してから [object_detach](/ja/language/actions/object-detach) し、生成したオブジェクトを目的の位置へ再配置してください。[create_tunnel](/ja/language/actions/create-tunnel) を create_object の代わりに使うことでも回避できます。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
- [create_tunnel](/ja/language/actions/create-tunnel)
