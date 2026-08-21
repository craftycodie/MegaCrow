# object_attach


<AvailabilityCard reach="yes" />

## 説明

オフセットと制約パラメータを指定して、あるオブジェクトを別のオブジェクトにアタッチします。

`absolute_orientation` を指定すると、アタッチ先オブジェクトではなくワールド軸を基準にオフセットされます。

<ActionParameters />

## 例

```megalo
action object_attach current_object.my_flag current_object 0 0 3
```

HREK の `territories.txt` より。

## 注記

- アタッチされたオブジェクトは、アタッチ先オブジェクトの最も近い部分とともに動きます。たとえば、ステアリングホイール付近で warthog にアタッチされたプレイヤーは、ステアリングホイールのアニメーションとともに回転します。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目
- [アクション構文](/ja/language/elements/trigger/action)
- [object_detach](/ja/language/actions/object-detach)
