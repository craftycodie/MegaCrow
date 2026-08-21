# weapon_set_pickup_priority


<AvailabilityCard reach="yes" />

## 説明

オブジェクトの武器ピックアップ優先度を設定します。

`normal` は、武器に既定のピックアップ動作を与えます。

`special` は、ほかの武器が拾える距離にあっても、この武器を拾うよう促します。

`auto` は、近づいたプレイヤーの手に武器を自動で持たせます。

<ActionParameters />

## 例

```megalo
action weapon_set_pickup_priority the_bomb special
```

HREK の `assault.txt` より。

## 対応バージョン

<ActionSupportedVersions />


## 関連項目

- [アクション構文](/ja/language/elements/trigger/action)
