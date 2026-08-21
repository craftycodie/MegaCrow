# object_set_never_garbage


<AvailabilityCard reach="partial" />

## 説明

武器または装備が拾われてドロップされたあと、エンジンがそれらをガベージコレクションしないようにします。`never_garbage` フラグ付きの [create_object](/ja/language/actions/create-object) でスポーンしたオブジェクトには効果がありません。Forge で配置したオブジェクトにも効果がありません。

<ActionParameters />

## 例

```megalo
action object_set_never_garbage current_object 1
```

HREK の `broken\freezetag.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
